import webpush from "web-push";

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("VAPID Keys generated:");
console.log("Public Key:", vapidKeys.publicKey);
console.log("Private Key:", vapidKeys.privateKey);
console.log("\nAdd these to your .env.local file:");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(
  `VAPID_SUBJECT=mailto:your-email@example.com  # Replace with your email`
);
