require("dotenv").config();
const { sequelize, connectDB } = require("./config/database");
const User = require("./models/User");
const Customer = require("./models/Customer");
const Inventory = require("./models/Inventory");

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log("🗑️  Clearing existing data...");
    // Truncate tables and restart identity columns
    await sequelize.query('TRUNCATE TABLE "invoices", "orders", "customers", "inventory", "users" RESTART IDENTITY CASCADE;');
    console.log("✅ Database cleared");

    // Create users
    const users = [
      {
        name: "Admin User",
        email: "admin@steeltrack.com",
        password: "Admin123",
        role: "admin"
      },
      {
        name: "Sales User",
        email: "sales@steeltrack.com",
        password: "Sales123",
        role: "sales"
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${userData.email}`);
    }

    const adminUser = createdUsers.find(u => u.role === "admin");

    // Create inventory items
    const inventoryItems = [
      {
        name: '2" ERW Pipe IS 1239',
        pipeType: "ERW",
        grade: "FE410",
        outerDiameter: 60.3,
        wallThickness: 2.9,
        stockQty: 500,
        reorderLevel: 100,
        purchasePrice: 52,
        sellingPrice: 58,
        createdBy: adminUser.id
      },
      {
        name: '3" ERW Pipe IS 1239',
        pipeType: "ERW",
        grade: "FE410",
        outerDiameter: 88.9,
        wallThickness: 3.2,
        stockQty: 25,  // Low stock
        reorderLevel: 50,
        purchasePrice: 75,
        sellingPrice: 82,
        createdBy: adminUser.id
      },
      {
        name: '1" GI Pipe IS 1239',
        pipeType: "GI Pipe",
        grade: "FE410",
        outerDiameter: 33.7,
        wallThickness: 3.2,
        stockQty: 800,
        reorderLevel: 200,
        purchasePrice: 68,
        sellingPrice: 76,
        createdBy: adminUser.id
      },
      {
        name: '4" Seamless ASTM A53',
        pipeType: "Seamless",
        grade: "A53 Gr.B",
        outerDiameter: 114.3,
        wallThickness: 6.02,
        stockQty: 15,  // Low stock
        reorderLevel: 25,
        purchasePrice: 85,
        sellingPrice: 95,
        createdBy: adminUser.id
      },
      {
        name: '50x50 Hollow Section',
        pipeType: "Hollow Section",
        grade: "IS 4923",
        outerDiameter: 50,
        wallThickness: 3,
        stockQty: 0,  // Out of stock
        reorderLevel: 100,
        purchasePrice: 35,
        sellingPrice: 42,
        createdBy: adminUser.id
      },
      {
        name: '4" ERW IS 3589',
        pipeType: "ERW",
        grade: "FE410",
        outerDiameter: 114.3,
        wallThickness: 5.4,
        stockQty: 300,
        reorderLevel: 50,
        purchasePrice: 78,
        sellingPrice: 85,
        createdBy: adminUser.id
      },
      {
        name: '1/2" GI Pipe IS 1239',
        pipeType: "GI Pipe",
        grade: "FE410",
        outerDiameter: 21.3,
        wallThickness: 2.8,
        stockQty: 1200,
        reorderLevel: 300,
        purchasePrice: 45,
        sellingPrice: 52,
        createdBy: adminUser.id
      },
      {
        name: '25x25 Hollow Section',
        pipeType: "Hollow Section",
        grade: "IS 4923",
        outerDiameter: 25,
        wallThickness: 2,
        stockQty: 500,
        reorderLevel: 150,
        purchasePrice: 25,
        sellingPrice: 30,
        createdBy: adminUser.id
      }
    ];

    for (const item of inventoryItems) {
      await Inventory.create(item);
      console.log(`✅ Created inventory: ${item.name}`);
    }

    // Create customers (with flattened address columns)
    const customers = [
      {
        name: "Rajesh Patel",
        company: "Patel Steel Works",
        phone: "9876543210",
        customerType: "Wholesale",
        billingStreet: "Plot 15, Industrial Estate",
        billingCity: "Ahmedabad",
        billingState: "Gujarat",
        billingPincode: "380015",
        gstNumber: "24ABCDE1234F1Z5",
        createdBy: adminUser.id
      },
      {
        name: "Mumbai Industries",
        phone: "9123456789",
        customerType: "Industrial",
        billingStreet: "Unit 23, GIDC",
        billingCity: "Surat",
        billingState: "Gujarat",
        billingPincode: "395003",
        gstNumber: "24FGHIJ5678K1Z9",
        createdBy: adminUser.id
      },
      {
        name: "Vadodara Construction",
        phone: "9988776655",
        customerType: "Contractor",
        billingStreet: "Near Railway Station",
        billingCity: "Vadodara",
        billingState: "Gujarat",
        billingPincode: "390001",
        gstNumber: "24KLMNO9012P1Z3",
        createdBy: adminUser.id
      },
      {
        name: "Rajkot Traders",
        phone: "9556677889",
        customerType: "Retail",
        billingStreet: "Main Market Road",
        billingCity: "Rajkot",
        billingState: "Gujarat",
        billingPincode: "360001",
        createdBy: adminUser.id
      },
      {
        name: "Gandhinagar Pipes",
        phone: "9445566778",
        customerType: "Wholesale",
        billingStreet: "Sector 12",
        billingCity: "Gandhinagar",
        billingState: "Gujarat",
        billingPincode: "382012",
        gstNumber: "24PQRST3456U1Z7",
        createdBy: adminUser.id
      }
    ];

    for (const customerData of customers) {
      await Customer.create(customerData);
      console.log(`✅ Created customer: ${customerData.name}`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("Admin: admin@steeltrack.com / Admin123");
    console.log("Sales: sales@steeltrack.com / Sales123");
    
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Database connection closed");
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };