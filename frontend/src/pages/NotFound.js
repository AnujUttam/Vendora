
import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container page-container text-center">
      <h1>404</h1>
      <h3>Page Not Found</h3>
      <Link to="/" className="btn btn-dark mt-3">
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
