const express = require("express");
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require("../controllers/reservationController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("customer"), createReservation);
router.get("/my", protect, authorize("customer"), getMyReservations);
router.delete("/:id", protect, authorize("customer"), cancelMyReservation);

module.exports = router;
