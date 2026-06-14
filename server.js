const express = require("express");
const fetch = require("node-fetch");
const app = express();

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const ORIGIN = process.env.ORIGIN || "https://adav33ze.com";
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("OAuth server is running.");
});

// Route 1: Start OAuth flow
app.get("/auth", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "repo,user",
    redirect_uri: "https://portfolio-oauth-1.onrender.com/callback",
    state: "decap-cms",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Route 2: GitHub sends code here
app.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${ORIGIN}/admin/#error=missing_code`);
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: "https://portfolio-oauth-1.onrender.com/callback",
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return res.redirect(`${ORIGIN}/admin/#error=${data.error || "no_token"}`);
    }

    // Redirect back to admin with token
    const token = data.access_token;
    return res.redirect(`${ORIGIN}/admin/#token=${token}&provider=github`);

  } catch (err) {
    return res.redirect(`${ORIGIN}/admin/#error=server_error`);
  }
});

app.listen(PORT, () => {
  console.log(`OAuth server running on port ${PORT}`);
  console.log(`Routes: GET /auth, GET /callback`);
  console.log(`ORIGIN: ${ORIGIN}`);
  console.log(`CLIENT_ID set: ${!!CLIENT_ID}`);
  console.log(`CLIENT_SECRET set: ${!!CLIENT_SECRET}`);
});
