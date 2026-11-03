// Only handle page navigation. Account requests, barn records and edits always use the live server.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== scope.origin ||
      !url.pathname.startsWith(scope.pathname) || url.pathname.startsWith(scope.pathname + "api/")) return;
  event.respondWith(fetch(request).catch(() => new Response(
    '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CareHub is offline</title><main style="font:18px system-ui;max-width:30rem;margin:12vh auto;padding:1rem"><h1>CareHub is offline</h1><p>Connect to Wi-Fi or mobile data to open the shared barn and save changes.</p><a href="/carehub/">Try again</a></main></html>',
    {status:503, headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}}
  )));
});
