
import React from "react";

function Footer() {
  return (
    <footer className="vendora-footer">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-5">
            <h3>Vendora<span>.</span></h3>
            <p>
              One Marketplace. Multiple Sellers.
              Endless Choices.
            </p>
          </div>

          <div className="col-md-3">
            <h6>Explore</h6>
            <p>All Products</p>
            <p>Categories</p>
            <p>Become a Seller</p>
          </div>

          <div className="col-md-4">
            <h6>Support</h6>
            <p>Contact Us</p>
            <p>Privacy Policy</p>
            <p>Terms & Conditions</p>
          </div>
        </div>

        <hr />
        <p className="text-center mb-0">
          © 2026 Vendora. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
