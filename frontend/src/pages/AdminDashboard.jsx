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

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState(null);
  const [availability, setAvailability] = useState(null);

  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [availDate, setAvailDate] = useState(todayStr());

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" });
  const [activeTab, setActiveTab] = useState("reservations");

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  const fetchReservations = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/reservations", {
        params: {
          ...(dateFilter ? { date: dateFilter } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
          page: pageNum,
          limit: 8,
        },
      });
      setReservations(data.reservations);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const { data } = await api.get("/tables");
      setTables(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tables");
    }
  };

  const fetchAvailability = async (date) => {
    try {
      const { data } = await api.get("/admin/availability", { params: { date } });
      setAvailability(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load availability");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReservations(1);
    fetchTables();
    fetchAvailability(availDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReservations(1);
  };

  const handleClearFilter = () => {
    setDateFilter("");
    setSearchTerm("");
    fetchReservations(1);
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    try {
      await api.delete(`/admin/reservations/${id}`);
      fetchReservations(page);
      fetchStats();
      fetchAvailability(availDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/admin/reservations/${id}`, { status });
      fetchReservations(page);
      fetchStats();
      fetchAvailability(availDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update");
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tables", {
        tableNumber: Number(newTable.tableNumber),
        capacity: Number(newTable.capacity),
      });
      setNewTable({ tableNumber: "", capacity: "" });
      fetchTables();
      fetchAvailability(availDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add table");
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm("Delete this table?")) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
      fetchAvailability(availDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete table");
    }
  };

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalReservations}</div>
            <div className="stat-label">Total Reservations</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeReservations}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.cancelledReservations}</div>
            <div className="stat-label">Cancelled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.todayReservations}</div>
            <div className="stat-label">Today's Bookings</div>
          </div>
          <div className="stat-card occupancy">
            <div className="stat-value">{stats.occupancyPercent}%</div>
            <div className="stat-label">Today's Occupancy</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === "reservations" ? "tab active" : "tab"}
          onClick={() => setActiveTab("reservations")}
        >
          Reservations
        </button>
        <button
          className={activeTab === "availability" ? "tab active" : "tab"}
          onClick={() => setActiveTab("availability")}
        >
          Availability Calendar
        </button>
        <button
          className={activeTab === "tables" ? "tab active" : "tab"}
          onClick={() => setActiveTab("tables")}
        >
          Manage Tables
        </button>
      </div>

      {activeTab === "reservations" && (
        <div className="card">
          <h2>All Reservations {total > 0 && `(${total})`}</h2>
          <form className="filter-row" onSubmit={handleFilter}>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search by customer name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
            <button type="button" className="btn-secondary" onClick={handleClearFilter}>
              Clear
            </button>
          </form>

          {loading ? (
            <p>Loading...</p>
          ) : reservations.length === 0 ? (
            <p className="empty-state">No reservations found.</p>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Table</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r._id}>
                      <td>
                        {r.user?.name}
                        <br />
                        <small>{r.user?.email}</small>
                      </td>
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
                        {r.status === "active" ? (
                          <button className="btn-danger" onClick={() => handleCancel(r._id)}>
                            Cancel
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={() => handleStatusChange(r._id, "active")}
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => fetchReservations(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page >= pages}
                  onClick={() => fetchReservations(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "availability" && (
        <div className="card">
          <h2>Table Availability</h2>
          <div className="filter-row">
            <input
              type="date"
              value={availDate}
              onChange={(e) => {
                setAvailDate(e.target.value);
                fetchAvailability(e.target.value);
              }}
            />
          </div>

          {!availability ? (
            <p>Loading...</p>
          ) : availability.tables.length === 0 ? (
            <p className="empty-state">No active tables. Add tables in "Manage Tables".</p>
          ) : (
            <div className="availability-grid-wrapper">
              <table className="availability-grid">
                <thead>
                  <tr>
                    <th>Table</th>
                    {availability.timeSlots.map((slot) => (
                      <th key={slot}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availability.tables.map((t) => (
                    <tr key={t.tableId}>
                      <td>
                        #{t.tableNumber}
                        <br />
                        <small>seats {t.capacity}</small>
                      </td>
                      {t.slots.map((s) => (
                        <td
                          key={s.timeSlot}
                          className={s.status === "booked" ? "slot-booked" : "slot-free"}
                          title={
                            s.status === "booked"
                              ? `Booked by ${s.customerName} (${s.guests} guests)`
                              : "Free"
                          }
                        >
                          {s.status === "booked" ? (
                            <>
                              Booked
                              <small>{s.customerName}</small>
                            </>
                          ) : (
                            "Free"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "tables" && (
        <div className="card">
          <h2>Manage Tables</h2>
          <form className="form-row" onSubmit={handleAddTable}>
            <label>
              Table Number
              <input
                type="number"
                min={1}
                value={newTable.tableNumber}
                onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                required
              />
            </label>
            <label>
              Capacity
              <input
                type="number"
                min={1}
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                required
              />
            </label>
            <button type="submit">Add Table</button>
          </form>

          <table className="table">
            <thead>
              <tr>
                <th>Table #</th>
                <th>Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t._id}>
                  <td>{t.tableNumber}</td>
                  <td>{t.capacity}</td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDeleteTable(t._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;