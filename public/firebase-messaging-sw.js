// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBLD8js1XKCBQv-8oyHuIHHI_ChcJQsxKM",
  authDomain: "fittribe-tracker.firebaseapp.com",
  projectId: "fittribe-tracker",
  storageBucket: "fittribe-tracker.firebasestorage.app",
  messagingSenderId: "1020887087658",
  appId: "1:1020887087658:web:27d9da58d73c5d09346153",
  measurementId: "G-R0995L4XDG"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Parse data-only payload
  const { title, body, icon, data } = payload.data || {};

  const notificationTitle = title || 'FitTribe Notification';
  const notificationOptions = {
    body: body,
    icon: icon || '/assets/panda_male.webp',
    data: data || {} // payload.data contains the custom data fields
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);

  event.notification.close();

  // Define the target URL (root of the app)
  const urlToOpen = new URL('/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Check if there is already a window/tab open with the target URL
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      // Check if the URL matches roughly (ignoring query params if possible, or exact match)
      // Since we use the root, checking if it starts with origin is safer, or exact match for SPA
      if (windowClient.url.startsWith(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      // Focus if available
      return matchingClient.focus().then((client) => {
        // Post message to the client
        return client.postMessage({
          type: 'NOTIFICATION_CLICK',
          payload: {
            title: event.notification.title,
            body: event.notification.body,
            data: event.notification.data
          }
        });
      });
    } else {
      // If no window is open, open a new one with query params to pass data
      const newUrl = new URL('/', self.location.origin);
      newUrl.searchParams.append('notification_click', 'true');
      newUrl.searchParams.append('title', event.notification.title);
      newUrl.searchParams.append('body', event.notification.body);

      return clients.openWindow(newUrl.href);
    }
  });

  event.waitUntil(promiseChain);
});
