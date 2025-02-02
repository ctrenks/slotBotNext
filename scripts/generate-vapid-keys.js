const webpush = require("web-push");

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log("VAPID Keys generated:");
console.log("==================");
console.log("Public Key:");
console.log(vapidKeys.publicKey);
console.log("\nPrivate Key:");
console.log(vapidKeys.privateKey);
console.log("\nAdd these to your .env.local file:");
console.log("==================");
console.log(`VAPID_SUBJECT="https://www.beatonlineslots.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
