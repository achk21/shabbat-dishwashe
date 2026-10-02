function env(...names) {
  for (const name of names) if (process.env[name]) return process.env[name];
  return null;
}

const url = () => env("STORAGE_REST_API_URL", "STORAGE_KV_REST_API_URL", "KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
const token = () => env("STORAGE_REST_API_TOKEN", "STORAGE_KV_REST_API_TOKEN", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");

export function storageReady() { return Boolean(url() && token()); }

export async function redis(command) {
  if (!storageReady()) throw new Error("Upstash environment variables are missing.");
  const r = await fetch(url(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json();
  if (!r.ok || data.error) throw new Error(data.error || `Storage error (${r.status})`);
  return data.result;
}
export async function setJson(key, value) { return redis(["SET", key, JSON.stringify(value)]); }
export async function getJson(key) {
  const value = await redis(["GET", key]);
  return value ? JSON.parse(value) : null;
}
