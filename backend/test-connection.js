require("dotenv").config();
const { sequelize } = require("./config/database");

console.log("Testing PostgreSQL Connection...");
console.log("Database Host:", process.env.DB_HOST || "localhost");
console.log("Database Name:", process.env.DB_NAME || "steeltrack_erp");

sequelize.authenticate()
  .then(() => {
    console.log("✅ PostgreSQL Connected Successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Connection Error:", error.message);
    console.error("\nTroubleshooting tips:");
    console.error("1. Verify your PostgreSQL service is running");
    console.error("2. Check the DB_USER and DB_PASSWORD in .env");
    console.error("3. Verify the database exists");
    process.exit(1);
  });
