import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="vendora-footer mt-auto">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-5">
            <h3 className="vendora-logo text-white">Vendora<span>.</span></h3>
            <p className="mt-2">
              Next-generation multi-vendor e-commerce marketplace powered by React, Node.js, MongoDB, Elasticsearch, Redis, and Razorpay.
            </p>
          </div>

          <div className="col-md-3">
            <h6>Marketplace</h6>
            <p><Link to="/products" className="text-light text-decoration-none opacity-75">All Products</Link></p>
            <p><Link to="/vendor/onboarding" className="text-light text-decoration-none opacity-75">Become a Seller</Link></p>
            <p><Link to="/login" className="text-light text-decoration-none opacity-75">Seller & Admin Login</Link></p>
          </div>

          <div className="col-md-4">
            <h6>Documentation & Tech Stack</h6>
            <p className="text-light opacity-75 mb-1">Architecture: Micro-monolith with Redis caching</p>
            <p className="text-light opacity-75 mb-1">Search: Dual-Engine Elasticsearch + MongoDB</p>
            <p className="text-light opacity-75 mb-1">Payments: Razorpay Split Payments & Commission</p>
            <p className="text-light opacity-75">Storage: AWS S3 & Multi-part Uploads</p>
          </div>
        </div>

        <hr className="opacity-25" />
        <div className="d-flex flex-wrap justify-content-between align-items-center small text-light opacity-75">
          <span>© 2026 Vendora Marketplace. All rights reserved.</span>
          <span>Engineered with React 19 & Express 5</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
