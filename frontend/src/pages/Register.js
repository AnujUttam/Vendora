import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Store, Phone, UserPlus } from "lucide-react";

function Register() {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    street: "",
    city: "",
    postalCode: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: "India"
        }
      };

      await register(payload);
      if (role === "vendor") {
        navigate("/vendor/onboarding");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ minHeight: "75vh" }}>
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold">Join Vendora</h3>
              <p className="text-muted small">Choose your account type to get started</p>

              {/* Role Toggle */}
              <div className="btn-group w-100 mt-2" role="group">
                <button
                  type="button"
                  className={`btn py-2 ${role === "customer" ? "btn-primary text-white" : "btn-outline-secondary"}`}
                  onClick={() => setRole("customer")}
                >
                  <User size={16} className="me-1" /> Customer (Shopper)
                </button>
                <button
                  type="button"
                  className={`btn py-2 ${role === "vendor" ? "btn-primary text-white" : "btn-outline-secondary"}`}
                  onClick={() => setRole("vendor")}
                >
                  <Store size={16} className="me-1" /> Merchant (Vendor)
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">
                  {role === "vendor" ? "Contact Person / Owner Name" : "Full Name"}
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <User size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    className="form-control bg-light border-start-0"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={16} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control bg-light border-start-0"
                    placeholder="name@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Password (min 8 chars)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={16} className="text-muted" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    className="form-control bg-light border-start-0"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Phone size={16} className="text-muted" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control bg-light border-start-0"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row g-2 mb-4">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Address Details</label>
                  <input
                    type="text"
                    name="street"
                    className="form-control bg-light"
                    placeholder="Street Address / Suite"
                    value={formData.street}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-7">
                  <input
                    type="text"
                    name="city"
                    className="form-control bg-light"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="text"
                    name="postalCode"
                    className="form-control bg-light"
                    placeholder="Pincode"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>
                    <UserPlus size={18} /> Register as {role === "vendor" ? "Vendor" : "Customer"}
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                Already have an account?{" "}
                <Link to="/login" className="fw-semibold text-decoration-none">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
