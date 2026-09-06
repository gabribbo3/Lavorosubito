self.addEventListener('push', function (event) {
  let data = {
    title: 'LavoroSubito',
    body: 'Hai una nuova richiesta di intervento.',
    url: '/'
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json()
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'lavorosubito-job',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'LavoroSubito',
      options
    )
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url =
    event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
