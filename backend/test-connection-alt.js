require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing MongoDB Connection with timeout...");

const options = {
  serverSelectionTimeoutMS: 30000, // 30 second timeout
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, options)
  .then((conn) => {
    console.log("✅ MongoDB Connected Successfully!");
    console.log("Host:", conn.connection.host);
    console.log("Database:", conn.connection.name);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Full Error:", error);
    process.exit(1);
  });
