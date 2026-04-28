# Contract: Observability Surface

**Audience**: Adopter 應用層 + Prometheus / log collector / alerting
**Surface owner**: `src/app.ts` + `src/http-metrics.ts` + `src/logger.ts` + `src/metrics.ts`
**Related FR / SC**: FR-006, FR-020(部分), SC-004, SC-009, SC-010

## 對外介面

### `GET /health`

- **回應**:`200 OK` 或 `503 Service Unavailable`(degraded);body 為 JSON:
  ```json
  {"status": "ok|degraded", "db": true|false, "redis": true|false}
  ```
- **語意**:檢查 db (`SELECT 1`) 與 redis (`PING`);任一 false → degraded。
- **被誰用**:Docker `HEALTHCHECK`(Dockerfile 與 docker-compose service);Kubernetes liveness/readiness probe;adopter 自家 alerting。

### `GET /metrics`

- **Content-Type**:`register.contentType`(prom-client 標準 `text/plain; version=0.0.4`)。
- **Body**:Prometheus exposition format,內容含:
  - **Default runtime metrics**(永遠暴露,即使 HTTP middleware opt-out):`process_*`、`nodejs_*`(prom-client `register` 預設)。
  - **HTTP 業務指標**(預設啟用,可 opt-out):
    - `http_requests_total` — counter,labels:`method`、`route`、`status_code`
    - `http_request_duration_seconds` — histogram,labels 同上,使用 prom-client 預設 buckets
- **Scrape 自身行為**:`/metrics` 的 scrape request **不**會被計入(避免污染指標)。

### Structured logs(stdout)

- **Logger**:`pino`(canonical channel)。
- **格式**:單行 JSON,含 `level`、`time`、`msg` + 業務 context 欄位。
- **Banned**:應用碼**不可**用 `console.log` / `console.warn` / `console.error` 等(SC-009 = 0 hits);診斷輸出須走 `pino`。
- **發送目標**:容器 stdout;由 docker-compose / Kubernetes 的 log driver 收集到 adopter 自選的 collector。

## 配置

| Env Var | 值 | 預設行為 |
|---|---|---|
| `HTTP_METRICS_ENABLED` | 任意值 | 啟用(fail-open)— `app_requests_total` / `_duration_seconds` 暴露 |
| `HTTP_METRICS_ENABLED` | `'false'`(case-insensitive,trim 後) | 停用 — middleware 不掛、`/metrics` 仍含 default runtime 指標 |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error`(pino 預設) | docker-compose 預設 `debug` |

`HTTP_METRICS_ENABLED` 讀取於 module load 時(`src/app.ts:17`),改值需重啟。

## 不變量(must)

1. **新加 HTTP route 自動繼承指標**:當 middleware 啟用,任何在 `app.use(...)` mount path 下的 route 都會被記入(FR-006、SC-004)。
2. **Cardinality 防護**:`route` label 必為 router 模板路徑(如 `/users/:id`),**不**為實際值(`/users/42`)。實作見 `src/http-metrics.ts` 的 routePath 擷取邏輯。
3. **未匹配 route 標準化**:完全沒匹配到任何 route 時 label = 字面 `not_found`;routePath API 失效時 label = 字面 `unknown`(會於啟動 `logger.warn` 一次)。
4. **Matched 404 與 unmatched 404 分流**:`app.get('/items/:id', c => c.json({...}, 404))` 此情境 label = `route="/items/:id"` + `status_code="404"`(matched);只有沒任何 route 匹配的請求才用 `not_found`。
5. **`/health` 與 `/` 對 opt-out 完全 byte-equivalent**:設 `HTTP_METRICS_ENABLED=false` 後,該兩個 endpoint 的 response body / headers 不應有任何增刪。
6. **健康端點 503 不阻塞 metrics 暴露**:即使 `/health` 回 503,`/metrics` 仍須能正確 200 並 expose 指標 — observability 不能因 application 自身 degrade 而失效。

## 失敗模式

| 場景 | 期望行為 |
|---|---|
| 啟動時 routePath probe 失敗 | `/metrics` 仍可 serve;受影響 route 的 label = `unknown`;啟動時 `logger.warn` 一次,不重複洗版 |
| `/metrics` scrape 失敗 | Prometheus / VictoriaMetrics 自身機制處理(retry / alerting);template 不負責 |
| Pino logger fail-open 不可能(寫 stdout 失敗 = 容器層級問題) | 由 orchestrator healthcheck 接手 |

## 對 derivative 的 advisory

替換 web framework 後(C4),adopter 須:
- 仍維持 `/health`、`/metrics` 兩個 endpoint(advisory,但若保留 observability 規範就必須維持)。
- 新加 route 仍須繼承 metrics(advisory)。
- log channel 仍為單一(無 `console.log` 散文)— advisory。

> 「降為 advisory」意指 baseline 不再強制這些規範,但若 derivative 主張遵守
> 觀測規範,實作必須與本契約等價。

## 實作對照(implementation mapping)

對應 contract 內每條不變量到 `src/` 實際實作位置(行號為當前 commit `4df82c0` 對應檔案的範圍;若 src/ 變動須同步更新此映射或重跑 T017):

| Contract 不變量 | 實作位置 | 簡述 |
|---|---|---|
| 1. 新加 HTTP route 自動繼承指標 | `src/http-metrics.ts:123-208` | `httpMetrics()` factory + 回傳 closure;只要在 `app.use(mountPattern, ...)` 之下,counter / histogram 於 finally 區塊統一記錄(`204-205`) |
| 2. Cardinality 防護(`route` = 模板路徑) | `src/http-metrics.ts:175-197` | `rawRoutePath = c.req.routePath` 直接當 label;`else` 分支(`196`)寫入模板路徑而非實際 URL |
| 3. 未匹配 → `not_found`;routePath API 失效 → `unknown` | `src/http-metrics.ts:53-93`(啟動 probe)+ `177-185`(per-request fallback) | `probeRoutePathSupport()` 開機跑一次合成請求;每次請求 finally 內若 `routePath` 空再 fallback 並 `logger.warn` 一次 |
| 4. Matched 404 vs unmatched 404 分流 | `src/http-metrics.ts:186-197` | `rawRoutePath === mountPattern && status === 404` → `not_found`;其餘 404(包含 `app.get('/items/:id', ..., 404)`)走 `else` 分支保留模板路徑 |
| 5. `/health` `/` byte-equivalent on opt-out | `src/app.ts:17-20` | `HTTP_METRICS_ENABLED` 於 module load 時 `.trim().toLowerCase() === 'false'` 直接 short-circuit,middleware 完全不掛 → response 不增 header 也不增 body |
| 6. `/metrics` 在 `/health` 503 時仍可 serve | `src/app.ts:46-49` | `/metrics` handler 只 `await register.metrics()`,不依賴 `pool.query` / `redis.ping`;`/health`(`24-44`)degrade 不影響 `/metrics` |

> **Synthesis 注意**:本 mapping 為 commit `4df82c0` 凍結值。對 `src/http-metrics.ts` 的任何重構都應重審此表;若有不變量改動,須先升級本 contract(走 spec amendment),否則 mapping 必失準。
