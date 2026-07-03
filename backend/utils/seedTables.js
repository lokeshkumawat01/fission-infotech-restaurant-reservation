// Run with: npm run seed
// Seeds a fixed set of tables so the app has data to book against immediately.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Table = require("../models/Table");

const tablesData = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 4 },
  { tableNumber: 6, capacity: 6 },
  { tableNumber: 7, capacity: 6 },
  { tableNumber: 8, capacity: 8 },
];

const seed = async () => {
  await connectDB();
  await Table.deleteMany({});
  await Table.insertMany(tablesData);
  console.log(`Seeded ${tablesData.length} tables successfully.`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
