import React from "react";
import { Link } from "react-router-dom";
import {
  Store,
  ShieldCheck,
  Zap
} from "lucide-react";

function About() {
  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-5">
        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
          ABOUT VENDORA
        </span>
        <h1 className="fw-bold mb-3 display-5">
          One Marketplace. Multiple Sellers. Endless Possibilities.
        </h1>
        <p className="text-muted lead fs-6">
          Vendora empowers independent creators, manufacturers, and merchants to sell directly to discerning shoppers with enterprise-grade split fulfillment, Redis in-memory speed, and transparent platform governance.
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="rounded-circle bg-primary-subtle text-primary p-3 d-inline-flex mx-auto mb-3">
              <Store size={32} />
            </div>
            <h5 className="fw-bold mb-2">Empowering Independent Sellers</h5>
            <p className="text-muted small mb-0">
              Vendora democratizes online retail by providing vetted merchants with automated catalog management, S3 media uploads, and instant order routing.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="rounded-circle bg-success-subtle text-success p-3 d-inline-flex mx-auto mb-3">
              <Zap size={32} />
            </div>
            <h5 className="fw-bold mb-2">High-Performance Architecture</h5>
            <p className="text-muted small mb-0">
              Engineered with sub-millisecond Redis cart caching, Elasticsearch full-text fuzzy discovery, and decoupled MERN micro-services.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center">
            <div className="rounded-circle bg-warning-subtle text-warning p-3 d-inline-flex mx-auto mb-3">
              <ShieldCheck size={32} />
            </div>
            <h5 className="fw-bold mb-2">Transparent Governance</h5>
            <p className="text-muted small mb-0">
              Multi-vendor split payments, verified purchaser review badges, dynamic PDF tax invoices, and real-time commission analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Tripartite Ecosystem */}
      <div className="card border-0 bg-dark text-white rounded-4 p-5 mb-5 shadow-sm">
        <div className="row align-items-center g-4">
          <div className="col-lg-6">
            <h3 className="fw-bold mb-3">The Vendora Tripartite Ecosystem</h3>
            <p className="text-white-50 small mb-4">
              Vendora seamlessly orchestrates interactions among three distinct marketplace personas:
            </p>
            <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
              <li className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill mt-1">1</span>
                <div>
                  <strong>Shoppers & Customers:</strong> Enjoy faceted product discovery, secure Razorpay checkout, live order tracking, and verified reviews.
                </div>
              </li>
              <li className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill mt-1">2</span>
                <div>
                  <strong>Independent Vendors:</strong> Operate custom branded storefronts, track inventory with low-stock alerts, advance fulfillment states, and view net earnings.
                </div>
              </li>
              <li className="d-flex align-items-start gap-2">
                <span className="badge bg-primary rounded-pill mt-1">3</span>
                <div>
                  <strong>Platform Administrators:</strong> Oversee vendor approvals, monitor marketplace GMV and revenue commissions, publish promo codes, and moderate listings.
                </div>
              </li>
            </ul>
            <div className="d-flex gap-3">
              <Link to="/products" className="btn btn-primary rounded-pill px-4 text-white">
                Start Shopping
              </Link>
              <Link to="/vendor/onboarding" className="btn btn-outline-light rounded-pill px-4">
                Become a Seller
              </Link>
            </div>
          </div>
          <div className="col-lg-6">
            <img
              src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800"
              alt="Marketplace team"
              className="w-100 rounded-4 shadow-sm object-fit-cover"
              style={{ maxHeight: "360px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
