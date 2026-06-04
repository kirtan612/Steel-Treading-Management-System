require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Customer = require("./models/Customer");
const Inventory = require("./models/Inventory");
const Order = require("./models/Order");
const Invoice = require("./models/Invoice");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🟢 MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      name: "Admin User",
      email: "admin@steeltrack.com",
      password: "admin123",
      role: "admin"
    },
    {
      name: "Sales Manager",
      email: "sales@steeltrack.com", 
      password: "sales123",
      role: "sales"
    },
    {
      name: "Viewer User",
      email: "viewer@steeltrack.com",
      password: "viewer123", 
      role: "viewer"
    }
  ];

  for (const userData of users) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }
  }
};

const seedInventory = async () => {
  const inventoryItems = [
    {
      name: '2" ERW Pipe IS 1239',
      pipeType: "ERW",
      grade: "FE410",
      outerDiameter: 60.3,
      wallThickness: 2.9,
      lengthPerPiece: 6,
      weightPerMeter: 5.1,
      unit: "Kg",
      stockQty: 500,
      reorderLevel: 100,
      purchasePrice: 52,
      sellingPrice: 58,
      hsnCode: "73063020",
      location: "Warehouse A",
      description: "2 inch ERW pipe as per IS 1239 standard"
    },
    {
      name: '4" Seamless Pipe ASTM A106',
      pipeType: "Seamless",
      grade: "A106 Gr.B",
      outerDiameter: 114.3,
      wallThickness: 6.02,
      lengthPerPiece: 6,
      weightPerMeter: 20.2,
      unit: "Kg",
      stockQty: 250,
      reorderLevel: 50,
      purchasePrice: 85,
      sellingPrice: 95,
      hsnCode: "73041100",
      location: "Warehouse B"
    },
    {
      name: '100x100x6 MS Hollow Section',
      pipeType: "Hollow Section",
      grade: "IS 4923",
      outerDiameter: 100,
      wallThickness: 6,
      lengthPerPiece: 6,
      weightPerMeter: 22.5,
      unit: "Kg",
      stockQty: 150,
      reorderLevel: 30,
      purchasePrice: 48,
      sellingPrice: 54,
      hsnCode: "73066100"
    },
    {
      name: '1" GI Pipe IS 1239',
      pipeType: "GI Pipe",
      grade: "FE410",
      outerDiameter: 33.7,
      wallThickness: 3.2,
      lengthPerPiece: 6,
      weightPerMeter: 2.9,
      unit: "Kg",
      stockQty: 800,
      reorderLevel: 200,
      purchasePrice: 68,
      sellingPrice: 76,
      hsnCode: "73063090"
    },
    {
      name: '3" MS Pipe IS 3589',
      pipeType: "MS Pipe",
      grade: "FE410",
      outerDiameter: 88.9,
      wallThickness: 5.49,
      lengthPerPiece: 6,
      weightPerMeter: 14.2,
      unit: "Kg",
      stockQty: 0,
      reorderLevel: 25,
      purchasePrice: 55,
      sellingPrice: 62,
      hsnCode: "73063010"
    }
  ];

  for (const item of inventoryItems) {
    const existing = await Inventory.findOne({ name: item.name });
    if (!existing) {
      const inventoryItem = new Inventory(item);
      await inventoryItem.save();
      console.log(`✅ Created inventory: ${item.name}`);
    }
  }
};

const seedCustomers = async () => {
  const customers = [
    {
      name: "Rajesh Kumar",
      company: "Kumar Engineering Works",
      phone: "9876543210",
      email: "rajesh@kumarengineering.com",
      customerType: "Wholesale",
      billingAddress: {
        street: "Plot 15, Industrial Area",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380015"
      },
      sameAsBilling: true,
      gstNumber: "24ABCDE1234F1Z5",
      creditLimit: 500000,
      paymentTerms: "30 days"
    },
    {
      name: "Priya Shah",
      company: "Shah Construction",
      phone: "9123456789",
      email: "priya@shahconstruction.com", 
      customerType: "Contractor",
      billingAddress: {
        street: "Shop 23, Commercial Complex",
        city: "Surat",
        state: "Gujarat", 
        pincode: "395007"
      },
      sameAsBilling: true,
      gstNumber: "24FGHIJ5678K1Z9",
      creditLimit: 300000,
      paymentTerms: "15 days"
    },
    {
      name: "Mumbai Steel Industries",
      phone: "9988776655",
      customerType: "Industrial",
      billingAddress: {
        street: "Unit 45, MIDC Andheri",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400053"
      },
      sameAsBilling: true,
      gstNumber: "27KLMNO9012P1Z3",
      creditLimit: 1000000,
      paymentTerms: "45 days"
    },
    {
      name: "Amit Patel",
      phone: "9556677889",
      customerType: "Retail",
      billingAddress: {
        street: "12, Sardar Nagar",
        city: "Vadodara",
        state: "Gujarat",
        pincode: "390015"
      },
      sameAsBilling: true,
      creditLimit: 50000,
      paymentTerms: "Immediate"
    }
  ];

  for (const customerData of customers) {
    const existing = await Customer.findOne({ phone: customerData.phone });
    if (!existing) {
      const customer = new Customer(customerData);
      await customer.save();
      console.log(`✅ Created customer: ${customerData.name}`);
    }
  }
};

const clearDatabase = async () => {
  console.log("🗑️  Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
    Invoice.deleteMany({})
  ]);
  console.log("✅ Database cleared");
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log("🌱 Starting database seeding...");
    
    await clearDatabase();
    await seedUsers();
    await seedInventory();
    await seedCustomers();
    
    console.log("🎉 Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };