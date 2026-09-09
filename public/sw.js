self.addEventListener(
  'push',
  event => {

    let data = {};

    try {

      data =
        event.data
          ? event.data.json()
          : {};

    } catch {
    }

    const title =
      data.title
      || 'LavoroSubito';

    const options = {

      body:
        data.body
        || 'Hai un nuovo aggiornamento.',

      data: {
        url:
          data.url
          || '/'
      }

    };

    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options
        )
    );

  }
);

self.addEventListener(
  'notificationclick',
  event => {

    event.notification
      .close();

    event.waitUntil(

      clients
        .matchAll(
          {
            type:
              'window',

            includeUncontrolled:
              true
          }
        )
        .then(
          windowClients => {

            for (
              const client
              of windowClients
            ) {

              if (
                'focus'
                in client
              ) {

                if (
                  'navigate'
                  in client
                ) {

                  client.navigate(
                    event.notification
                      .data
                      ?.url
                    || '/'
                  );

                }

                return client.focus();

              }

            }

            if (
              clients.openWindow
            ) {

              return clients
                .openWindow(
                  event.notification
                    .data
                    ?.url
                  || '/'
                );

            }

          }
        )

    );

  }
);
