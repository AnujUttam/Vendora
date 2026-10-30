
import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  Search,
  UserRound
} from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg vendora-navbar">
      <div className="container">
        <Link className="navbar-brand vendora-logo" to="/">
          Vendora<span>.</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse"
          id="mainNavbar"
        >
          <form className="search-box mx-auto">
            <Search size={19} />
            <input
              type="search"
              placeholder="Search for products, brands..."
            />
          </form>

          <div className="navbar-actions">
            <Link to="/products">
              <Store size={19} />
              <span>Explore</span>
            </Link>

            <Link to="/login">
              <UserRound size={19} />
              <span>Account</span>
            </Link>

            <Link to="/cart">
              <ShoppingCart size={19} />
              <span>Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
