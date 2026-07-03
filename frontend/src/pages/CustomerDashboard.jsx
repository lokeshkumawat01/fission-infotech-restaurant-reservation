import { useEffect, useState } from "react";
import api from "../api/axios";

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

const todayStr = () => new Date().toISOString().split("T")[0];

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: todayStr(),
    timeSlot: TIME_SLOTS[0],
    guests: 2,
  });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reservations/my");
      setReservations(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await api.post("/reservations", {
        date: form.date,
        timeSlot: form.timeSlot,
        guests: Number(form.guests),
      });
      setSuccess("Reservation confirmed!");
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    setError("");
    try {
      await api.delete(`/reservations/${id}`);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  return (
    <div className="page-container">
      <h1>My Reservations</h1>

      <div className="card">
        <h2>New Reservation</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form className="reservation-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Date
              <input
                type="date"
                name="date"
                min={todayStr()}
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Time Slot
              <select name="timeSlot" value={form.timeSlot} onChange={handleChange}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Guests
              <input
                type="number"
                name="guests"
                min={1}
                max={20}
                value={form.guests}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? "Booking..." : "Book Table"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Upcoming & Past Reservations</h2>
        {loading ? (
          <p>Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="empty-state">No reservations yet. Book your first table above!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Guests</th>
                <th>Table</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{r.timeSlot}</td>
                  <td>{r.guests}</td>
                  <td>
                    #{r.table?.tableNumber} (seats {r.table?.capacity})
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === "active" && (
                      <button className="btn-danger" onClick={() => handleCancel(r._id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
