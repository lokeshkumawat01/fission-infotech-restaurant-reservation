const mongoose = require("mongoose");
const { TIME_SLOTS } = require("../utils/constants");

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    date: { type: String, required: true }, // format: YYYY-MM-DD
    timeSlot: { type: String, required: true, enum: TIME_SLOTS },
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Speeds up availability lookups for a given table/date/slot
reservationSchema.index({ table: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
