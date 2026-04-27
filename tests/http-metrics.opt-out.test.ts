import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { register } from 'prom-client';

/**
 * US2: HTTP_METRICS_ENABLED=false disables the httpMetrics middleware
 * at module-load time.
 *
 * These tests live in a separate file (rather than appending to
 * http-metrics.test.ts) so the module registry and prom-client singleton
 * register are isolated from the US1 static-import path. Vitest runs each
 * test file in its own worker by default, which avoids duplicate-registration
 * errors when re-importing `src/app.ts` with `vi.resetModules()`.
 *
 * Note: `prom-client`'s default `register` is a module-level singleton that
 * `vi.resetModules()` alone does NOT reset — the prom-client module instance
 * is the same object across resets inside a worker. We therefore clear the
 * register in `beforeEach` so each re-import of `src/metrics.ts` can safely
 * call `collectDefaultMetrics()` again without duplicate-registration errors.
 *
 * FR-007 (opt-out), FR-008 (non-regression), SC-003, SC-006.
 */
describe('HTTP middleware metrics opt-out (US2)', () => {
  beforeEach(() => {
    register.clear();
    vi.resetModules();
    vi.stubEnv('HTTP_METRICS_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('disabled flag → /metrics has no http_* lines, still has default metrics', async () => {
    const { app } = await import('../src/app.ts');

    // Generate request traffic that would normally produce http_* samples.
    await app.request('/');
    await app.request('/');

    const res = await app.request('/metrics');
    expect(res.status).toBe(200);
    const body = await res.text();

    // FR-007: no http_* samples when disabled.
    expect(body).not.toMatch(/^http_requests_total/m);
    expect(body).not.toMatch(/^http_request_duration_seconds/m);

    // FR-004 / SC-006: 001 default metrics still present.
    expect(body).toMatch(/process_cpu_seconds_total/);
    expect(body).toMatch(/process_resident_memory_bytes/);
    expect(body).toMatch(/nodejs_heap_size_total_bytes/);
  });

  it('FR-008 non-regression: GET / returns same JSON shape as 001 baseline', async () => {
    const { app } = await import('../src/app.ts');

    const res = await app.request('/');
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    // Hono's c.json() default content-type.
    expect(ct).toMatch(/application\/json/i);
    expect(await res.json()).toEqual({ message: 'hello from hono' });
  });

  it('FR-008 non-regression: GET /health returns 001 baseline shape', async () => {
    const { app } = await import('../src/app.ts');

    const res = await app.request('/health');
    // /health may return 200 (healthy) or 503 (degraded) depending on db/redis.
    expect([200, 503]).toContain(res.status);

    const body = (await res.json()) as {
      status: string;
      db: boolean;
      redis: boolean;
    };
    expect(typeof body.status).toBe('string');
    expect(['ok', 'degraded']).toContain(body.status);
    expect(typeof body.db).toBe('boolean');
    expect(typeof body.redis).toBe('boolean');
  });
});

describe('HTTP middleware metrics opt-out — whitespace tolerance (M-2)', () => {
  beforeEach(() => {
    register.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Review-20260425-wsl.md M-2: a copy-pasted `.env` line like
  // `HTTP_METRICS_ENABLED=  false  ` leaves whitespace around the value
  // depending on how the adopter's env loader trims. The gate parser must
  // treat `"  false  "` as equivalent to `"false"` for FR-007 to behave
  // predictably; otherwise the middleware stays enabled contrary to intent.
  it('HTTP_METRICS_ENABLED="  false  " (with whitespace) still disables middleware', async () => {
    vi.stubEnv('HTTP_METRICS_ENABLED', '  false  ');
    const { app } = await import('../src/app.ts');

    await app.request('/');
    const res = await app.request('/metrics');
    const body = await res.text();

    expect(body).not.toMatch(/^http_requests_total/m);
    expect(body).not.toMatch(/^http_request_duration_seconds/m);
  });

  it('HTTP_METRICS_ENABLED="FALSE\\n" (trailing newline, mixed case) still disables', async () => {
    vi.stubEnv('HTTP_METRICS_ENABLED', 'FALSE\n');
    const { app } = await import('../src/app.ts');

    await app.request('/');
    const res = await app.request('/metrics');
    const body = await res.text();

    expect(body).not.toMatch(/^http_requests_total/m);
  });
});
