const Table = require("../models/Table");
const asyncHandler = require("../utils/asyncHandler");

// @route  GET /api/tables
// @access Private (any authenticated user — needed by customer booking form)
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
  res.json(tables);
});

// @route  POST /api/tables
// @access Private (admin)
const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, capacity } = req.body;

  if (!tableNumber || !capacity) {
    res.status(400);
    throw new Error("tableNumber and capacity are required");
  }

  const existing = await Table.findOne({ tableNumber });
  if (existing) {
    res.status(400);
    throw new Error(`Table number ${tableNumber} already exists`);
  }

  const table = await Table.create({ tableNumber, capacity });
  res.status(201).json(table);
});

// @route  PUT /api/tables/:id
// @access Private (admin)
const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }

  const { capacity, isActive } = req.body;
  if (capacity) table.capacity = capacity;
  if (typeof isActive === "boolean") table.isActive = isActive;

  await table.save();
  res.json(table);
});

// @route  DELETE /api/tables/:id
// @access Private (admin)
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) {
    res.status(404);
    throw new Error("Table not found");
  }
  await table.deleteOne();
  res.json({ message: "Table deleted successfully" });
});

module.exports = { getTables, createTable, updateTable, deleteTable };
