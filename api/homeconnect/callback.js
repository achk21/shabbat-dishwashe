export default async function handler(req, res) {
  const { code, error, error_description: errorDescription } = req.query || {};

  if (error) {
    return res.status(400).send(`Home Connect authorization failed: ${errorDescription || error}`);
  }

  if (!code) {
    return res.status(200).send("Home Connect callback is ready.");
  }

  // Token exchange will be added after HOME_CONNECT_CLIENT_ID and
  // HOME_CONNECT_CLIENT_SECRET are configured securely in Vercel.
  return res.status(200).send(
    "Home Connect authorization reached the callback successfully. You can return to ChatGPT."
  );
}
