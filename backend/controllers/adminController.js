const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { TIME_SLOTS } = require("../utils/constants");

// @route  GET /api/admin/reservations
// @query  ?date=YYYY-MM-DD&status=active&search=name-or-email&page=1&limit=10
// @access Private (admin)
const getAllReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.date) {
    filter.date = req.query.date;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Search by customer name/email: resolve matching user ids first,
  // then filter reservations by those ids (populate() alone can't filter).
  if (req.query.search) {
    const regex = new RegExp(req.query.search.trim(), "i");
    const matchingUsers = await User.find({
      $or: [{ name: regex }, { email: regex }],
    }).select("_id");
    filter.user = { $in: matchingUsers.map((u) => u._id) };
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter)
      .populate("user", "name email")
      .populate("table", "tableNumber capacity")
      .sort({ date: -1, timeSlot: 1 })
      .skip(skip)
      .limit(limit),
    Reservation.countDocuments(filter),
  ]);

  res.json({
    reservations,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

// @route  GET /api/admin/stats
// Quick dashboard numbers: total/active/cancelled reservations, today's
// bookings, and today's occupancy % (booked slots / total possible slots).
// @access Private (admin)
const getStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [totalReservations, activeReservations, cancelledReservations, todayReservations, activeTablesCount] =
    await Promise.all([
      Reservation.countDocuments({}),
      Reservation.countDocuments({ status: "active" }),
      Reservation.countDocuments({ status: "cancelled" }),
      Reservation.countDocuments({ date: today, status: "active" }),
      Table.countDocuments({ isActive: true }),
    ]);

  const totalSlotsToday = activeTablesCount * TIME_SLOTS.length;
  const occupancyPercent =
    totalSlotsToday > 0 ? Math.round((todayReservations / totalSlotsToday) * 100) : 0;

  res.json({
    totalReservations,
    activeReservations,
    cancelledReservations,
    todayReservations,
    occupancyPercent,
    date: today,
  });
});

// @route  GET /api/admin/availability
// @query  ?date=YYYY-MM-DD (defaults to today)
// Returns every active table with the booking status of each fixed time slot
// on that date, so the admin can see the full picture at a glance.
// @access Private (admin)
const getAvailability = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];

  const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });
  const reservations = await Reservation.find({ date, status: "active" })
    .populate("user", "name email")
    .populate("table", "tableNumber");

  // Map: "tableId-timeSlot" -> reservation
  const bookingMap = {};
  reservations.forEach((r) => {
    bookingMap[`${r.table._id}-${r.timeSlot}`] = r;
  });

  const grid = tables.map((table) => ({
    tableId: table._id,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    slots: TIME_SLOTS.map((slot) => {
      const booking = bookingMap[`${table._id}-${slot}`];
      return {
        timeSlot: slot,
        status: booking ? "booked" : "free",
        reservationId: booking?._id || null,
        customerName: booking?.user?.name || null,
        guests: booking?.guests || null,
      };
    }),
  }));

  res.json({ date, timeSlots: TIME_SLOTS, tables: grid });
});

// @route  PUT /api/admin/reservations/:id
// Allows admin to update date/timeSlot/guests/status of any reservation.
// @access Private (admin)
const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  const { date, timeSlot, guests, status } = req.body;

  if (timeSlot && !TIME_SLOTS.includes(timeSlot)) {
    res.status(400);
    throw new Error(`timeSlot must be one of: ${TIME_SLOTS.join(", ")}`);
  }
  if (status && !["active", "cancelled"].includes(status)) {
    res.status(400);
    throw new Error("status must be 'active' or 'cancelled'");
  }

  if (date) reservation.date = date;
  if (timeSlot) reservation.timeSlot = timeSlot;
  if (guests) reservation.guests = Number(guests);
  if (status) reservation.status = status;

  await reservation.save();
  const populated = await reservation.populate([
    { path: "user", select: "name email" },
    { path: "table", select: "tableNumber capacity" },
  ]);

  res.json(populated);
});

// @route  DELETE /api/admin/reservations/:id
// Admin cancel (soft cancel, same as status update) — kept separate for clarity.
// @access Private (admin)
const cancelReservationByAdmin = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  reservation.status = "cancelled";
  await reservation.save();

  res.json({ message: "Reservation cancelled by admin", reservation });
});

module.exports = {
  getAllReservations,
  updateReservation,
  cancelReservationByAdmin,
  getStats,
  getAvailability,
};