$httpClient.get({ url: $argument, timeout: 4 }, function (error, response, data) {
  if (error || response.status !== 200) {
    console.warn("Update failed:", error || response.status);
    $done();
  }
  if (!$persistentStore.write(data, "latest")) {
    console.warn("Could not save latest response");
    $done();
  }
  console.log("Updated latest response");
  $done();
});
