import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="page-container">
    <h1>404</h1>
    <p>Page not found.</p>
    <Link to="/">Go home</Link>
  </div>
);

export default NotFound;
