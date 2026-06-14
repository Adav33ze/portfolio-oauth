const express = require("express");
const fetch = require("node-fetch");
const app = express();

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const ORIGIN = process.env.ORIGIN || "https://adav33ze.com";
const PORT = process.env.PORT || 3000;

// Route 1: Start OAuth flow — redirect to GitHub
app.get("/auth", (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "repo,user",
    redirect_uri: `${req.protocol}://${req.get("host")}/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Route 2: GitHub callback — exchange code for token
app.get("/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return sendMessage(res, "error", { error: "Missing code" });
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
        redirect_uri: `${req.protocol}://${req.get("host")}/callback`,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      return sendMessage(res, "error", { error: data.error || "No token received" });
    }

    return sendMessage(res, "success", {
      token: data.access_token,
      provider: "github",
    });
  } catch (err) {
    return sendMessage(res, "error", { error: "Server error: " + err.message });
  }
});

function sendMessage(res, status, content) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  res.send(`<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  function send() {
    window.opener.postMessage(
      ${JSON.stringify(message)},
      ${JSON.stringify(ORIGIN)}
    );
    window.close();
  }
  if (window.opener) {
    send();
  } else {
    document.write('<p>Auth complete. You may close this window.</p>');
  }
})();
</script>
<p>Authenticating...</p>
</body>
</html>`);
}

app.listen(PORT, () => {
  console.log(`OAuth server running on port ${PORT}`);
});
