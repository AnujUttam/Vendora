import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Heart } from "lucide-react";

function Footer() {
  return (
    <footer className="vendora-footer mt-auto bg-dark text-white pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-4">
            <h3 className="vendora-logo text-white mb-2">Vendora<span>.</span></h3>
            <p className="text-white-50 small mb-3">
              One Marketplace. Multiple Sellers. Endless Possibilities. Powered by cloud-native MERN stack, Redis cart caching, Elasticsearch, and Razorpay split settlements.
            </p>
            <div className="d-flex align-items-center gap-2 text-white-50 small">
              <ShieldCheck size={16} className="text-success" />
              <span>100% Verified Independent Merchants</span>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="fw-bold text-uppercase small tracking-wider mb-3">Marketplace</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/products" className="text-white-50 text-decoration-none hover-white">All Products</Link></li>
              <li><Link to="/categories" className="text-white-50 text-decoration-none hover-white">Browse Categories</Link></li>
              <li><Link to="/wishlist" className="text-white-50 text-decoration-none hover-white">My Wishlist</Link></li>
              <li><Link to="/cart" className="text-white-50 text-decoration-none hover-white">Shopping Cart</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="fw-bold text-uppercase small tracking-wider mb-3">Company</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/about" className="text-white-50 text-decoration-none hover-white">About Vendora</Link></li>
              <li><Link to="/contact" className="text-white-50 text-decoration-none hover-white">Contact & Support</Link></li>
              <li><Link to="/vendor/onboarding" className="text-white-50 text-decoration-none hover-white">Sell on Vendora</Link></li>
              <li><Link to="/login" className="text-white-50 text-decoration-none hover-white">Account Login</Link></li>
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold text-uppercase small tracking-wider mb-3">Enterprise Stack</h6>
            <div className="d-flex flex-column gap-1 text-white-50 small">
              <div><strong>Core Engine:</strong> React 19, Node.js 24, Express 5, MongoDB</div>
              <div><strong>Fast Discovery:</strong> Elasticsearch fuzzy query engine</div>
              <div><strong>Sub-ms Caching:</strong> Redis (ioredis) cart caching</div>
              <div><strong>Split Payments:</strong> Razorpay multi-vendor commissions</div>
              <div><strong>Media Pipeline:</strong> AWS S3 Multipart Storage</div>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary opacity-25" />
        <div className="d-flex flex-wrap justify-content-between align-items-center small text-white-50">
          <span>© 2026 Vendora Marketplace Technologies. All rights reserved.</span>
          <span className="d-flex align-items-center gap-1">
            Engineered with <Heart size={14} className="text-danger fill-danger" style={{ fill: "#dc3545" }} /> for Global Multi-Vendor Commerce
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
