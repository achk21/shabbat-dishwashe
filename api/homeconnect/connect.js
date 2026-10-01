import crypto from "crypto";

const REDIRECT_URI =
  process.env.HOME_CONNECT_REDIRECT_URI ||
  "https://shabbat-dishwashe.vercel.app/api/homeconnect/callback";

export default async function handler(req, res) {
  const clientId = process.env.HOME_CONNECT_CLIENT_ID;

  if (!clientId) {
    return res.status(500).send("Missing HOME_CONNECT_CLIENT_ID in Vercel.");
  }

  const state = crypto.randomBytes(24).toString("hex");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `hc_oauth_state=${state}; Path=/; HttpOnly; SameSite=None; Max-Age=600; Secure`
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: "IdentifyAppliance Dishwasher",
    state,
  });

  return res.redirect(
    302,
    `https://api.home-connect.com/security/oauth/authorize?${params.toString()}`
  );
}
