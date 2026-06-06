const https = require("https");

exports.handler = async (event) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: h, body: "" };

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWwuTJCzA5viwHOaZpHrlJOzZtmxS-8pfyEDh2zpF6a2xGihE6jt8iRv-J9A3jZq_32g/exec";

  const makeGet = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return makeGet(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

  try {
    const body = JSON.parse(event.body || "{}");
    const action = body.action || event.queryStringParameters?.action || "getAll";
    const url = `${SCRIPT_URL}?action=${action}${action === "save" ? "&entry=" + encodeURIComponent(JSON.stringify(body.entry)) : ""}`;
    const raw = await makeGet(url);
    try {
      const d = JSON.parse(raw);
      return { statusCode: 200, headers: h, body: JSON.stringify(d) };
    } catch(e) {
      return { statusCode: 200, headers: h, body: raw };
    }
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
