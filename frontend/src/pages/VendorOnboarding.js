import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Store, Clock, CheckCircle, ArrowRight } from "lucide-react";

function VendorOnboarding() {
  const { user, refreshUser } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    phone: user?.phone || "",
    address: user?.address?.street || ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const res = await API.get("/vendor/application-status");
        if (res.data.success) {
          setApplication(res.data.application);
        }
      } catch (err) {
        // No application yet
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await API.post("/vendor/apply", formData);
      if (res.data.success) {
        setApplication(res.data.vendor);
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  // Already approved
  if (user?.role === "vendor" && user?.isApproved) {
    return (
      <div className="container py-5 text-center">
        <div className="card p-5 border-0 shadow-sm rounded-4 max-w-md mx-auto">
          <CheckCircle size={48} className="text-success mx-auto mb-3" />
          <h4 className="fw-bold">You are an Approved Vendor!</h4>
          <p className="text-muted small mb-4">Your store is live and ready for product listings.</p>
          <div>
            <button className="btn btn-primary rounded-pill px-4 text-white" onClick={() => navigate("/vendor")}>
              Go to Vendor Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending
  if (application && application.status === "pending") {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <div className="card p-5 border-0 shadow-sm rounded-4 max-w-md mx-auto my-5">
          <Clock size={48} className="text-warning mx-auto mb-3" />
          <h4 className="fw-bold">Application Under Review</h4>
          <p className="text-muted small mb-3">
            Thank you for applying to sell on Vendora! Your store application for{" "}
            <strong>"{application.storeName}"</strong> has been received and is currently being evaluated by our marketplace compliance team.
          </p>
          <div className="alert alert-light border small text-muted">
            Status: <span className="badge bg-warning text-dark text-uppercase">{application.status}</span>
          </div>
          <p className="text-muted small">
            Tip: Log in as <strong>admin@vendora.com</strong> in another window to approve this application instantly!
          </p>
        </div>
      </div>
    );
  }

  // Application form
  return (
    <div className="container py-5" style={{ minHeight: "75vh" }}>
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-primary-subtle text-primary p-3 d-inline-block mb-2">
                <Store size={32} />
              </div>
              <h3 className="fw-bold">Vendor Onboarding</h3>
              <p className="text-muted small">
                Launch your digital storefront on Vendora and reach thousands of customers
              </p>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Store / Brand Name</label>
                <input
                  type="text"
                  name="storeName"
                  className="form-control"
                  placeholder="e.g. Nexus Electronics, Urban Elegance"
                  required
                  value={formData.storeName}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Store Description & Catalog Overview</label>
                <textarea
                  rows={3}
                  name="description"
                  className="form-control"
                  placeholder="Describe the products you offer and your brand values..."
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Business Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold">Registered Warehouse / Business Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="Full physical address or warehouse address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <>Submit Merchant Application <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorOnboarding;
