import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, LogIn, Sparkles } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "vendor") navigate("/vendor");
      else navigate(from);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to log in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword("Vendora@123");
    setError("");
    setSubmitting(true);
    try {
      const user = await login(demoEmail, "Vendora@123");
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "vendor") navigate("/vendor");
      else navigate(from);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" style={{ minHeight: "75vh" }}>
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold">Welcome Back</h3>
              <p className="text-muted small">Sign in to your Vendora marketplace account</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={16} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    className="form-control bg-light border-start-0"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Lock size={16} className="text-muted" />
                  </span>
                  <input
                    type="password"
                    className="form-control bg-light border-start-0"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Logins */}
            <div className="mt-4 pt-3 border-top">
              <div className="d-flex align-items-center gap-1 text-muted small fw-semibold mb-2">
                <Sparkles size={14} className="text-warning" /> 1-Click Demo Evaluation Logins:
              </div>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoLogin("admin@vendora.com", "admin")}
                >
                  <span>🛡️ <strong>Admin</strong> (admin@vendora.com)</span>
                  <span className="badge bg-dark">Admin</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoLogin("techhub@vendora.com", "vendor")}
                >
                  <span>🏪 <strong>Vendor</strong> (techhub@vendora.com)</span>
                  <span className="badge bg-primary">Vendor</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success text-start d-flex justify-content-between align-items-center"
                  onClick={() => handleDemoLogin("customer@vendora.com", "customer")}
                >
                  <span>🛍️ <strong>Customer</strong> (customer@vendora.com)</span>
                  <span className="badge bg-success">Shopper</span>
                </button>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                Don't have an account?{" "}
                <Link to="/register" className="fw-semibold text-decoration-none">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
