// Run this script with: node scripts/generate-vapid-keys.js
const webpush = require("web-push")

const vapidKeys = webpush.generateVAPIDKeys()

console.log("\n=======================================")
console.log("\nVAPID Keys Generated Successfully!\n")
console.log("Add these to your Vercel environment variables:\n")
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=")
console.log(vapidKeys.publicKey)
console.log("\nVAPID_PRIVATE_KEY=")
console.log(vapidKeys.privateKey)
console.log("\nVAPID_SUBJECT=")
console.log("mailto:your-email@geracooks.com")
console.log("\n=======================================\n")
