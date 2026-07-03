const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true }, // allows admin to disable a table
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
