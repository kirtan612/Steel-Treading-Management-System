require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing MongoDB Connection...");
console.log("Connection string format:", process.env.MONGODB_URI ? "✓ Found" : "✗ Missing");

if (process.env.MONGODB_URI) {
  // Hide password for security
  const masked = process.env.MONGODB_URI.replace(/:[^:@]+@/, ":****@");
  console.log("Masked URI:", masked);
}

mongoose.connect(process.env.MONGODB_URI)
  .then((conn) => {
    console.log("✅ MongoDB Connected Successfully!");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Connection Error:", error.message);
    console.error("\nTroubleshooting tips:");
    console.error("1. Verify your MongoDB Atlas connection string");
    console.error("2. Check Network Access allows your IP (0.0.0.0/0)");
    console.error("3. Verify database user exists and password is correct");
    console.error("4. If password has special characters, URL encode them");
    process.exit(1);
  });
