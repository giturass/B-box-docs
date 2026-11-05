let body;
try {
  body = JSON.parse($response.body);
} catch (error) {
  console.warn("Response is not JSON:", String(error));
  $done();
}
if (body === null || typeof body !== "object" || Array.isArray(body)) {
  $done();
}
body.debug = true;
body.source = "B-box";
$done({ body: JSON.stringify(body) });
