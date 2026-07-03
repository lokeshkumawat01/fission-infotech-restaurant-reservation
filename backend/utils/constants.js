// Fixed time slots offered by the restaurant.
// Kept centralized so both booking and validation logic use the same source of truth.
const TIME_SLOTS = [
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
  "21:00-22:00",
];

module.exports = { TIME_SLOTS };
