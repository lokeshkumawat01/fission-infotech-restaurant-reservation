const express = require("express");
const router = express.Router();
const {
  getAllReservations,
  updateReservation,
  cancelReservationByAdmin,
  getStats,
  getAvailability,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/reservations", getAllReservations);
router.put("/reservations/:id", updateReservation);
router.delete("/reservations/:id", cancelReservationByAdmin);
router.get("/stats", getStats);
router.get("/availability", getAvailability);

module.exports = router;