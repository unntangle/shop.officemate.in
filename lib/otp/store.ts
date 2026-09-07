/**
 * Where OTP codes and rate-limit counters live.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO IMPLEMENTATIONS, CHOSEN BY ENVIRONMENT.
 *
 * MEMORY — a Map in the Node process. Correct on localhost, where there is
 *   exactly one process and it lives as long as `npm run dev`.
 *
 * UPSTASH — Redis over HTTP. Used automatically when the two env vars are
 *   set, and REQUIRED IN PRODUCTION.
 *
 * ⚠ THE MEMORY STORE IS NOT SAFE ON VERCEL, and the failure is quiet rather
 * than loud. Serverless functions do not share memory: the request that
 * issues a code and the request that verifies it can land on different
 * instances, so the code is simply absent on lookup. The customer sees "that
 * code doesn't match" for a code they read correctly, and it works
 * intermittently — whenever both requests happen to hit the same warm
 * instance — which is the hardest possible version of this bug to diagnose.
 *
 * So `assertProductionStore()` below refuses to start rather than let that
 * ship. Upstash's free tier covers this use comfortably; it needs no client
 * library because the REST API is plain fetch.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface OtpStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Increment a counter, setting the TTL only on first write. */
  increment(key: string, ttlSeconds: number): Promise<number>;
}

/* ------------------------------------------------------------------ memory */

interface Entry {
  value: string;
  expiresAt: number;
}

const memory = new Map<string, Entry>();

const memoryStore: OtpStore = {
  async get(key) {
    const hit = memory.get(key);
    if (!hit) return null;
    /* Checked on read rather than swept on a timer. A timer would keep the
       process awake and there is no volume here worth reclaiming eagerly. */
    if (hit.expiresAt < Date.now()) {
      memory.delete(key);
      return null;
    }
    return hit.value;
  },

  async set(key, value, ttlSeconds) {
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async delete(key) {
    memory.delete(key);
  },

  async increment(key, ttlSeconds) {
    const current = await memoryStore.get(key);
    const next = (current ? Number(current) : 0) + 1;
    /* The TTL is preserved on an existing key so a rate-limit window cannot
       be extended indefinitely by continuing to hit it — otherwise an
       attacker's own requests would keep pushing their expiry out. */
    const existing = memory.get(key);
    memory.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt ?? Date.now() + ttlSeconds * 1000,
    });
    return next;
  },
};

/* ----------------------------------------------------------------- upstash */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(UPSTASH_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash returned ${res.status}`);
  const body = (await res.json()) as { result: unknown };
  return body.result;
}

const upstashStore: OtpStore = {
  async get(key) {
    return ((await upstash(["GET", key])) as string | null) ?? null;
  },

  async set(key, value, ttlSeconds) {
    await upstash(["SET", key, value, "EX", ttlSeconds]);
  },

  async delete(key) {
    await upstash(["DEL", key]);
  },

  async increment(key, ttlSeconds) {
    const next = (await upstash(["INCR", key])) as number;
    /* NX so the window is set once, on first increment. Without it every hit
       would refresh the expiry and the limit would never actually trigger. */
    if (next === 1) await upstash(["EXPIRE", key, ttlSeconds, "NX"]);
    return next;
  },
};

/* ------------------------------------------------------------------ export */

export const usingMemoryStore = !(UPSTASH_URL && UPSTASH_TOKEN);

export const otpStore: OtpStore = usingMemoryStore
  ? memoryStore
  : upstashStore;

/**
 * Refuse to run a memory store in production.
 *
 * Called from the request route. Throwing at startup would be tidier, but
 * this has to fail where someone will see it — and a build that succeeds
 * locally and then silently misbehaves on Vercel is exactly the outcome the
 * note at the top describes.
 */
export function assertProductionStore() {
  if (process.env.NODE_ENV === "production" && usingMemoryStore) {
    throw new Error(
      "OTP store is in-memory but NODE_ENV is production. Serverless " +
        "instances do not share memory, so codes would verify only " +
        "intermittently. Set UPSTASH_REDIS_REST_URL and " +
        "UPSTASH_REDIS_REST_TOKEN."
    );
  }
}
