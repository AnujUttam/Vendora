import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  Users,
  Store,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Tag,
  TrendingUp,
  BarChart3,
  Plus
} from "lucide-react";

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);

  // Approve / Reject state
  const [actionMsg, setActionMsg] = useState("");
  const [commissionInputs, setCommissionInputs] = useState({});

  // Coupon form
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountPercent: 15,
    maxDiscount: 1000,
    minOrderValue: 499,
    expiryDays: 60
  });

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [anaRes, appRes, ordRes, cpnRes] = await Promise.all([
        API.get("/admin/analytics"),
        API.get("/admin/applications"),
        API.get("/admin/orders"),
        API.get("/coupons")
      ]);

      if (anaRes.data.success) setAnalytics(anaRes.data.analytics);
      if (appRes.data.success) setApplications(appRes.data.applications || []);
      if (ordRes.data.success) setOrders(ordRes.data.orders || []);
      if (cpnRes.data.success) setCoupons(cpnRes.data.coupons || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleApproveVendor = async (appId) => {
    try {
      const commissionRate = commissionInputs[appId] || 10;
      const res = await API.put(`/admin/applications/${appId}/approve`, {
        commissionRate: Number(commissionRate)
      });
      if (res.data.success) {
        setActionMsg("Vendor approved successfully!");
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to approve vendor: " + err.message);
    }
  };

  const handleRejectVendor = async (appId) => {
    const reason = window.prompt("Reason for rejection:", "Does not meet marketplace quality guidelines");
    if (!reason) return;

    try {
      const res = await API.put(`/admin/applications/${appId}/reject`, { reason });
      if (res.data.success) {
        setActionMsg("Vendor application rejected.");
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to reject vendor: " + err.message);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const expiryDate = new Date(Date.now() + newCoupon.expiryDays * 24 * 3600 * 1000);
      const res = await API.post("/coupons", {
        code: newCoupon.code,
        discountPercent: Number(newCoupon.discountPercent),
        maxDiscount: Number(newCoupon.maxDiscount),
        minOrderValue: Number(newCoupon.minOrderValue),
        expiryDate
      });
      if (res.data.success) {
        setNewCoupon({
          code: "",
          discountPercent: 15,
          maxDiscount: 1000,
          minOrderValue: 499,
          expiryDays: 60
        });
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to create coupon: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this promotional coupon?")) return;
    try {
      await API.delete(`/coupons/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="container py-5" style={{ minHeight: "85vh" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fw-bold mb-0">Platform Administration</h2>
            <span className="badge bg-danger text-uppercase px-2 py-1">Super Admin</span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Real-time multi-vendor marketplace governance, commissions, and revenue analytics
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 py-2 small" role="alert">
          {actionMsg}
          <button type="button" className="btn-close" onClick={() => setActionMsg("")} />
        </div>
      )}

      {/* Analytics KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Total Platform GMV</span>
              <div className="rounded-circle bg-primary-subtle text-primary p-2">
                <DollarSign size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-0">₹{(summary.totalGMV || 0).toLocaleString("en-IN")}</h3>
            <span className="text-muted small">Gross merchandise value</span>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Platform Commissions</span>
              <div className="rounded-circle bg-success-subtle text-success p-2">
                <TrendingUp size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-success mb-0">₹{(summary.totalPlatformCommission || 0).toLocaleString("en-IN")}</h3>
            <span className="text-muted small">Net platform revenue</span>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Vendor Payouts</span>
              <div className="rounded-circle bg-info-subtle text-info p-2">
                <Store size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-primary mb-0">₹{(summary.totalVendorPayout || 0).toLocaleString("en-IN")}</h3>
            <span className="text-muted small">Disbursed to merchants</span>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Merchants & Users</span>
              <div className="rounded-circle bg-warning-subtle text-warning p-2">
                <Users size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-0">
              {summary.approvedVendors || 0} <span className="fs-6 fw-normal text-muted">/ {summary.totalUsers || 0}</span>
            </h3>
            <span className="text-muted small">Active vendors / Total accounts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills gap-2 mb-4">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 size={16} className="me-1 inline" /> Analytics & Orders
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 position-relative ${activeTab === "applications" ? "active" : ""}`}
            onClick={() => setActiveTab("applications")}
          >
            <Store size={16} className="me-1 inline" /> Vendor Applications
            {pendingApps.length > 0 && (
              <span className="badge rounded-pill bg-danger ms-2">
                {pendingApps.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 ${activeTab === "coupons" ? "active" : ""}`}
            onClick={() => setActiveTab("coupons")}
          >
            <Tag size={16} className="me-1 inline" /> Promotional Coupons ({coupons.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: ANALYTICS & ORDERS */}
      {activeTab === "analytics" && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Package size={20} className="text-primary" /> Marketplace Orders ({orders.length})
              </h5>

              <div className="table-responsive">
                <table className="table align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Platform Fee</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((ord) => (
                      <tr key={ord._id}>
                        <td><strong>{ord.orderNumber}</strong></td>
                        <td>{ord.customer?.name || "Customer"}</td>
                        <td className="fw-bold">₹{ord.totalAmount?.toLocaleString("en-IN")}</td>
                        <td className="text-success fw-bold">₹{ord.platformCommissionTotal?.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge rounded-pill text-uppercase px-2 py-1 ${
                              ord.orderStatus === "delivered"
                                ? "bg-success"
                                : ord.orderStatus === "shipped"
                                ? "bg-info text-dark"
                                : ord.orderStatus === "packed"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="text-muted">{new Date(ord.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-light mb-4">
              <h6 className="fw-bold mb-3">Order Status Breakdown</h6>
              <div className="d-flex flex-column gap-2 small">
                {Object.entries(analytics?.orderStatusCounts || {}).map(([status, count]) => (
                  <div key={status} className="d-flex justify-content-between align-items-center p-2 bg-white rounded-3 border">
                    <span className="text-uppercase fw-semibold">{status}</span>
                    <span className="badge bg-dark rounded-pill">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
              <h6 className="fw-bold mb-3">Top Product Categories</h6>
              <div className="d-flex flex-column gap-2 small">
                {analytics?.categoryStats?.map((cat) => (
                  <div key={cat._id} className="d-flex justify-content-between align-items-center p-2 bg-white rounded-3 border">
                    <span>{cat._id}</span>
                    <span className="badge bg-primary rounded-pill">{cat.count} listings</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR APPLICATIONS */}
      {activeTab === "applications" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-5 text-center">
              <h5>No Vendor Applications Found</h5>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th className="ps-4">Store Name & Owner</th>
                    <th>Description</th>
                    <th>Phone & Address</th>
                    <th>Commission %</th>
                    <th>Status</th>
                    <th className="pe-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="ps-4 py-3">
                        <strong className="d-block">{app.storeName}</strong>
                        <span className="text-muted small">
                          Owner: {app.userId?.name} ({app.userId?.email})
                        </span>
                      </td>
                      <td style={{ maxWidth: "250px" }} className="small text-muted">
                        {app.description}
                      </td>
                      <td className="small">
                        <div>{app.phone}</div>
                        <div className="text-muted">{app.address}</div>
                      </td>
                      <td>
                        {app.status === "pending" ? (
                          <div className="input-group input-group-sm" style={{ width: "90px" }}>
                            <input
                              type="number"
                              className="form-control"
                              defaultValue={app.commissionRate || 10}
                              onChange={(e) =>
                                setCommissionInputs({
                                  ...commissionInputs,
                                  [app._id]: e.target.value
                                })
                              }
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        ) : (
                          <span className="fw-bold">{app.commissionRate}%</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill text-uppercase px-2 py-1 ${
                            app.status === "approved"
                              ? "bg-success"
                              : app.status === "pending"
                              ? "bg-warning text-dark"
                              : "bg-danger"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        {app.status === "pending" ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-success d-flex align-items-center gap-1"
                              onClick={() => handleApproveVendor(app._id)}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-outline-danger d-flex align-items-center gap-1"
                              onClick={() => handleRejectVendor(app._id)}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === "coupons" && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-light py-3 px-4 border-0">
                <h6 className="fw-bold mb-0">Active Marketplace Coupons</h6>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Promo Code</th>
                      <th>Discount</th>
                      <th>Max Cap</th>
                      <th>Min Order</th>
                      <th>Expiry</th>
                      <th className="pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((cpn) => (
                      <tr key={cpn._id}>
                        <td className="ps-4 py-3">
                          <strong className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                            {cpn.code}
                          </strong>
                        </td>
                        <td className="fw-bold text-success">{cpn.discountPercent}% OFF</td>
                        <td>₹{cpn.maxDiscount}</td>
                        <td>₹{cpn.minOrderValue}</td>
                        <td className="text-muted">{new Date(cpn.expiryDate).toLocaleDateString()}</td>
                        <td className="pe-4 text-end">
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => handleDeleteCoupon(cpn._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Plus size={18} className="text-primary" /> Create New Coupon
              </h5>

              <form onSubmit={handleCreateCoupon}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Coupon Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-uppercase bg-white"
                    placeholder="e.g. FLASH30"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Discount (%)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white"
                      required
                      min="1"
                      max="100"
                      value={newCoupon.discountPercent}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Max Discount (₹)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white"
                      value={newCoupon.maxDiscount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Min Order Value (₹)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white"
                      value={newCoupon.minOrderValue}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Validity (Days)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm bg-white"
                      value={newCoupon.expiryDays}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDays: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-sm py-2 rounded-pill fw-bold text-white shadow-sm"
                >
                  Publish Coupon
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
