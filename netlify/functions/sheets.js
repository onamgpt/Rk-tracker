const https = require("https");

exports.handler = async (event) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:h,body:""};

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWwuTJCzA5viwHOaZpHrlJOzZtmxS-8pfyEDh2zpF6a2xGihE6jt8iRv-J9A3jZq_32g/exec";

  function makeGet(url) {
    return new Promise(function(resolve, reject) {
      https.get(url, {headers:{"User-Agent":"Mozilla/5.0"}}, function(res) {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return makeGet(res.headers.location).then(resolve).catch(reject);
        }
        var data = "";
        res.on("data", function(chunk){data += chunk;});
        res.on("end", function(){resolve(data);});
      }).on("error", reject);
    });
  }

  try {
    var body = JSON.parse(event.body || "{}");
    var action = body.action || "getAll";
    var url = SCRIPT_URL + "?action=" + action;
    
    if (action === "save" && body.entry) {
      url += "&entry=" + encodeURIComponent(JSON.stringify(body.entry));
    } else if (action === "delete" && body.id) {
      url += "&id=" + encodeURIComponent(body.id);
    } else if (action === "getDropdowns") {
      url += "";
    }

    var raw = await makeGet(url);
    try {
      var parsed = JSON.parse(raw);
      return {statusCode:200,headers:h,body:JSON.stringify(parsed)};
    } catch(e) {
      return {statusCode:200,headers:h,body:raw||"{}"};
    }
  } catch(e) {
    return {statusCode:500,headers:h,body:JSON.stringify({error:e.message})};
  }
};
