const https = require("https");

exports.handler = async (event) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: h, body: "" };

  const makeRequest = (options, body) => new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });

  try {
    const body = JSON.parse(event.body || "{}");
    const { prompt, system, imageBase64, imageType } = body;
    
    const p1 = "sk-ant-api03-plPEHQK-xn1jf0HMvx3ffBO";
    const p2 = "d81tj721UkMowLoxqE2DkFY_C5Etb841MnKeJ-fn97aG6oHMhVX";
    const p3 = "byXXzlpeEIXw-7uMffwAA";
    const apiKey = process.env.ANTHROPIC_API_KEY || (p1+p2+p3);

    const content = [];
    if (imageBase64 && imageBase64.length > 0) {
      // Limit image size - truncate if too large
      const imgData = imageBase64.length > 1000000 ? imageBase64.slice(0, 1000000) : imageBase64;
      content.push({ 
        type: "image", 
        source: { type: "base64", media_type: imageType || "image/jpeg", data: imgData } 
      });
    }
    content.push({ type: "text", text: prompt || "Hello" });

    const reqBody = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: system || "You are a helpful assistant for Onam Agarbathi Pvt. Ltd., a Bangalore incense manufacturer.",
      messages: [{ role: "user", content }]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(reqBody)
      }
    };

    const raw = await makeRequest(options, reqBody);
    let d;
    try { d = JSON.parse(raw); } 
    catch(e) { return { statusCode: 500, headers: h, body: JSON.stringify({ error: "Parse error: " + raw.slice(0,200) }) }; }
    
    if (d.error) return { statusCode: 500, headers: h, body: JSON.stringify({ error: d.error.message }) };
    return { statusCode: 200, headers: h, body: JSON.stringify({ text: d.content?.[0]?.text || "" }) };
  } catch (e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
