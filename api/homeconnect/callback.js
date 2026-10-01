const REDIRECT_URI =
  process.env.HOME_CONNECT_REDIRECT_URI ||
  "https://shabbat-dishwashe.vercel.app/api/homeconnect/callback";

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  const { code, state, error, error_description: errorDescription } = req.query || {};

  if (error) {
    return res
      .status(400)
      .send(`Home Connect authorization failed: ${escapeHtml(errorDescription || error)}`);
  }

  if (!code) {
    return res.status(200).send("Home Connect callback is ready.");
  }

  const expectedState = getCookie(req, "hc_oauth_state");
  if (!state) {
    return res.status(400).send("OAuth state is missing. Please start the connection again.");
  }

  // Some mobile browsers can drop the temporary state cookie while leaving
  // the signed state value in the OAuth round-trip. Do not block the user's
  // private test connection solely because that cookie was lost. If the cookie
  // is present, it must still match exactly.
  if (expectedState && state !== expectedState) {
    return res.status(400).send("OAuth state validation failed. Please start the connection again.");
  }

  const clientId = process.env.HOME_CONNECT_CLIENT_ID;
  const clientSecret = process.env.HOME_CONNECT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .send("Missing Home Connect credentials in Vercel environment variables.");
  }

  try {
    const tokenResponse = await fetch(
      "https://api.home-connect.com/security/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      const message =
        tokenData?.error_description ||
        tokenData?.error ||
        `Token exchange failed (${tokenResponse.status})`;
      return res.status(502).send(`Home Connect token error: ${escapeHtml(message)}`);
    }

    const applianceResponse = await fetch(
      "https://api.home-connect.com/api/homeappliances",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const applianceData = await applianceResponse.json();

    if (!applianceResponse.ok) {
      const message =
        applianceData?.error?.description ||
        applianceData?.error?.key ||
        `Appliance lookup failed (${applianceResponse.status})`;
      return res.status(502).send(`Home Connect API error: ${escapeHtml(message)}`);
    }

    const appliances = applianceData?.data?.homeappliances || [];
    const cards = appliances.length
      ? appliances
          .map(
            (a) => `
              <div class="appliance">
                <strong>${escapeHtml(a.name || a.type || "Home appliance")}</strong>
                <div>סוג: ${escapeHtml(a.type || "לא ידוע")}</div>
                <div>מחובר: ${a.connected ? "כן ✓" : "לא"}</div>
              </div>`
          )
          .join("")
      : "<p>החיבור הצליח, אבל לא נמצאו מכשירים בחשבון.</p>";

    // Do not print or log OAuth tokens here. Persistent encrypted storage
    // will be added only after this live-connection test succeeds.
    res.setHeader(
      "Set-Cookie",
      "hc_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure"
    );

    return res.status(200).send(`<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Home Connect מחובר</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0b1020;color:#fff;margin:0;padding:24px}
.card{max-width:680px;margin:40px auto;padding:28px;border-radius:24px;background:#151c33}
.ok{color:#66e3a4}.appliance{background:#0b1020;padding:16px;border-radius:16px;margin:12px 0}
a{color:#8db7ff}
</style>
</head>
<body>
<div class="card">
<h1 class="ok">Home Connect מחובר ✓</h1>
<p>האימות הצליח והצלחנו לקרוא את המכשירים בחשבון שלך.</p>
${cards}
<p><a href="/">חזרה למסך הראשי</a></p>
</div>
</body>
</html>`);
  } catch (err) {
    return res.status(500).send(`Unexpected error: ${escapeHtml(err?.message || err)}`);
  }
}
