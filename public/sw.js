self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const message = event.data?.text() || "Check My Pantry for items expiring soon.";

  event.waitUntil(self.registration.showNotification("FridgeMatch", {
    body: message,
    icon: "/pwa/icon-192.png",
    tag: "pantry-expiry",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const pantryUrl = new URL("/pantry", self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const pantry = windows.find((client) => client.url === pantryUrl);

    if (pantry) {
      await pantry.focus();
    } else {
      await self.clients.openWindow(pantryUrl);
    }
  })());
});