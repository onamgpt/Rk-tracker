const https = require("https");

exports.handler = async (event) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return {statusCode:200, headers:h, body:""};

  function fetchUrl(url) {
    return new Promise(function(resolve, reject) {
      https.get(url, {headers:{"User-Agent":"Mozilla/5.0"}}, function(res) {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        var data = "";
        res.on("data", function(c){ data += c; });
        res.on("end", function(){ resolve(data); });
      }).on("error", reject);
    });
  }

  try {
    var p = event.queryStringParameters || {};
    var action = p.action || "quote";
    var symbol = encodeURIComponent(p.symbol || "");
    var url;

    if (action === "quote") {
      url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol + "?interval=1d&range=5d";
    } else if (action === "history") {
      var range = p.range || "2y";
      url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol + "?interval=1d&range=" + range;
    } else {
      return {statusCode:400, headers:h, body:JSON.stringify({error:"bad action"})};
    }

    var raw = await fetchUrl(url);
    return {statusCode:200, headers:h, body:raw};
  } catch(e) {
    return {statusCode:500, headers:h, body:JSON.stringify({error:e.message})};
  }
};
