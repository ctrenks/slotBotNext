"use client";

export default function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async function() {
              try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful');

                // Check if push is supported
                if ('PushManager' in window) {
                  // Get existing subscription
                  let subscription = await registration.pushManager.getSubscription();

                  if (!subscription) {
                    // Get public VAPID key
                    const response = await fetch('/api/push/vapid-public-key');
                    const vapidPublicKey = await response.text();

                    // Convert VAPID key to Uint8Array
                    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                    // Subscribe to push notifications
                    subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: convertedVapidKey
                    });

                    // Send subscription to server
                    await fetch('/api/push/register', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(subscription)
                    });

                    console.log('Push notification subscription successful');
                  }
                }
              } catch (err) {
                console.error('ServiceWorker registration or push subscription failed: ', err);
              }
            });
          }

          // Convert base64 to Uint8Array for VAPID key
          function urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
              .replace(/\\-/g, '+')
              .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          }
        `,
      }}
    />
  );
}
