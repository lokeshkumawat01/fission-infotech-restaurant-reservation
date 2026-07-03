import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🍽️ Restaurant Reservations</Link>
      </div>
      <div className="navbar-links">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        {user ? (
          <>
            <span className="navbar-user">
              {user.name} <span className={`badge badge-${user.role}`}>{user.role}</span>
            </span>
            {user.role === "admin" ? (
              <Link to="/admin">Admin Dashboard</Link>
            ) : (
              <Link to="/dashboard">My Reservations</Link>
            )}
            <button className="btn-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;