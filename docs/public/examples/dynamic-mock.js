$done({
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, method: $request.method, source: "B-box script" })
  }
});
