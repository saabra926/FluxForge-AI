/* global self, clients */
self.addEventListener("push", (event) => {
  let data = { title: "Notification", body: "", url: "/", tag: "default" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    data.body = event.data?.text() ?? "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag,
      data: { url: data.url ?? "/" },
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  const full = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const c of windowClients) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          void c.focus();
          return c;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(full);
      }
      return undefined;
    }),
  );
});
