const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const asyncHandler = require("../utils/asyncHandler");
const { TIME_SLOTS } = require("../utils/constants");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateBookingInput = (date, timeSlot, guests) => {
  if (!date || !timeSlot || !guests) {
    return "date, timeSlot and guests are required";
  }
  if (!DATE_REGEX.test(date)) {
    return "date must be in YYYY-MM-DD format";
  }
  if (!TIME_SLOTS.includes(timeSlot)) {
    return `timeSlot must be one of: ${TIME_SLOTS.join(", ")}`;
  }
  if (typeof guests !== "number" || guests < 1) {
    return "guests must be a positive number";
  }
  // Prevent booking a date in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(date + "T00:00:00");
  if (bookingDate < today) {
    return "Cannot book a reservation for a past date";
  }
  return null;
};

// Core availability logic:
// 1. Find all active tables with capacity >= guests, sorted smallest-first
//    (so we don't waste a big table on a small party).
// 2. For each candidate table, check if it already has an ACTIVE reservation
//    for the same date + timeSlot.
// 3. Return the first table with no conflict. If none found -> fully booked.
const findAvailableTable = async (date, timeSlot, guests) => {
  const candidateTables = await Table.find({
    isActive: true,
    capacity: { $gte: guests },
  }).sort({ capacity: 1 });

  if (candidateTables.length === 0) return null;

  const candidateIds = candidateTables.map((t) => t._id);

  const conflictingReservations = await Reservation.find({
    table: { $in: candidateIds },
    date,
    timeSlot,
    status: "active",
  }).select("table");

  const bookedTableIds = new Set(
    conflictingReservations.map((r) => r.table.toString())
  );

  const availableTable = candidateTables.find(
    (t) => !bookedTableIds.has(t._id.toString())
  );

  return availableTable || null;
};

// @route  POST /api/reservations
// @access Private (customer)
const createReservation = asyncHandler(async (req, res) => {
  const { date, timeSlot, guests } = req.body;
  const guestsNum = Number(guests);

  const validationError = validateBookingInput(date, timeSlot, guestsNum);
  if (validationError) {
    res.status(400);
    throw new Error(validationError);
  }

  const table = await findAvailableTable(date, timeSlot, guestsNum);

  if (!table) {
    res.status(409); // Conflict
    throw new Error(
      "No table available for the selected date, time slot and party size. Please try a different slot."
    );
  }

  // Second check right before insert to shrink the race-condition window
  // between availability check and creation (best-effort for this scope).
  const doubleCheck = await Reservation.findOne({
    table: table._id,
    date,
    timeSlot,
    status: "active",
  });
  if (doubleCheck) {
    res.status(409);
    throw new Error("This slot was just booked by someone else. Please try again.");
  }

  const reservation = await Reservation.create({
    user: req.user._id,
    table: table._id,
    date,
    timeSlot,
    guests: guestsNum,
    status: "active",
  });

  const populated = await reservation.populate("table", "tableNumber capacity");
  res.status(201).json(populated);
});

// @route  GET /api/reservations/my
// @access Private (customer)
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate("table", "tableNumber capacity")
    .sort({ date: -1, timeSlot: 1 });

  res.json(reservations);
});

// @route  DELETE /api/reservations/:id
// @access Private (customer - own reservation only)
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  if (reservation.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only cancel your own reservations");
  }

  if (reservation.status === "cancelled") {
    res.status(400);
    throw new Error("Reservation is already cancelled");
  }

  reservation.status = "cancelled";
  await reservation.save();

  res.json({ message: "Reservation cancelled successfully", reservation });
});

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  findAvailableTable, // exported for reuse/testing
  validateBookingInput,
};
