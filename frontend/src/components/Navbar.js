import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  Search,
  UserRound,
  LogOut,
  ShieldAlert,
  Package,
  Layers,
  Heart,
  Grid
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/products");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg vendora-navbar sticky-top">
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

        <div className="collapse navbar-collapse" id="mainNavbar">
          <form className="search-box mx-auto" onSubmit={handleSearchSubmit}>
            <Search size={19} className="text-muted" />
            <input
              type="search"
              placeholder="Search products, brands, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="navbar-actions">
            <Link to="/products" className="nav-action-link">
              <Store size={18} />
              <span>Catalog</span>
            </Link>

            <Link to="/categories" className="nav-action-link">
              <Grid size={18} />
              <span>Categories</span>
            </Link>

            <Link to="/wishlist" className="nav-action-link position-relative">
              <Heart size={18} />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="nav-action-link position-relative">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="badge rounded-pill bg-primary position-absolute top-0 start-100 translate-middle text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <UserRound size={16} />
                  <span>{user.name.split(" ")[0]}</span>
                  <span className="badge bg-secondary ms-1 text-uppercase" style={{ fontSize: "10px" }}>
                    {user.role}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li className="dropdown-header">
                    <strong>{user.name}</strong>
                    <div className="text-muted small">{user.email}</div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>

                  {user.role === "admin" && (
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2 text-primary" to="/admin">
                        <ShieldAlert size={16} /> Admin Portal
                      </Link>
                    </li>
                  )}

                  {user.role === "vendor" && (
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2 text-primary" to="/vendor">
                        <Layers size={16} /> Vendor Dashboard
                      </Link>
                    </li>
                  )}

                  {user.role === "customer" && (
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2" to="/vendor/onboarding">
                        <Store size={16} /> Become a Seller
                      </Link>
                    </li>
                  )}

                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/profile">
                      <UserRound size={16} /> My Profile & Addresses
                    </Link>
                  </li>

                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/my-orders">
                      <Package size={16} /> My Orders
                    </Link>
                  </li>

                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/wishlist">
                      <Heart size={16} /> My Wishlist
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-dark btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm text-white">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
