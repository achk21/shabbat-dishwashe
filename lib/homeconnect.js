import { getJson, setJson } from "./redis.js";
const TOKEN_KEY = "homeconnect:oauth";
const TOKEN_URL = "https://api.home-connect.com/security/oauth/token";
export const API = "https://api.home-connect.com/api";
export async function saveTokens(data) {
  const old = await getJson(TOKEN_KEY).catch(()=>null);
  await setJson(TOKEN_KEY, {
    access_token:data.access_token,
    refresh_token:data.refresh_token || old?.refresh_token,
    expires_at:Date.now() + Math.max(60, Number(data.expires_in || 3600)-60)*1000
  });
}
export async function accessToken() {
  let t=await getJson(TOKEN_KEY);
  if (!t) throw new Error("Home Connect is not linked yet.");
  if (t.access_token && Date.now() < (t.expires_at||0)) return t.access_token;
  if (!t.refresh_token) throw new Error("No Home Connect refresh token stored.");
  const r=await fetch(TOKEN_URL,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({
    grant_type:"refresh_token",refresh_token:t.refresh_token,
    client_id:process.env.HOME_CONNECT_CLIENT_ID,client_secret:process.env.HOME_CONNECT_CLIENT_SECRET
  })});
  const d=await r.json();
  if(!r.ok||!d.access_token) throw new Error(d.error_description||d.error||`Refresh failed (${r.status})`);
  await saveTokens(d); return d.access_token;
}
export async function hc(path) {
  const r=await fetch(API+path,{headers:{Authorization:`Bearer ${await accessToken()}`}});
  const d=await r.json();
  if(!r.ok) throw new Error(d?.error?.description||d?.error?.key||`Home Connect API error (${r.status})`);
  return d;
}
