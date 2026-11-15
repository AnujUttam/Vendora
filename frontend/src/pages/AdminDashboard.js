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
  Plus,
  Layers,
  Trash2,
  Grid,
  Percent,
  RefreshCw
} from "lucide-react";

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [commissionLedger, setCommissionLedger] = useState([]);
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);

  // Search & filter states
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

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

  // Category form
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: "",
    icon: "Package"
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

      // Fetch additional tabs if requested
      if (activeTab === "users") {
        const uRes = await API.get("/admin/users");
        if (uRes.data.success) setUsers(uRes.data.users || []);
      } else if (activeTab === "products") {
        const pRes = await API.get("/admin/products");
        if (pRes.data.success) setProducts(pRes.data.products || []);
      } else if (activeTab === "categories") {
        const cRes = await API.get("/categories?includeInactive=true");
        if (cRes.data.success) setCategories(cRes.data.categories || []);
      } else if (activeTab === "commissions") {
        const comRes = await API.get("/admin/commissions");
        if (comRes.data.success) setCommissionLedger(comRes.data.ledger || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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

  const handleToggleVendorSuspension = async (vendorId) => {
    try {
      const res = await API.put(`/admin/vendors/${vendorId}/toggle-status`);
      if (res.data.success) {
        setActionMsg(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to toggle vendor: " + err.message);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/toggle-status`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to toggle user status: " + err.message);
    }
  };

  const handleToggleProduct = async (productId) => {
    try {
      const res = await API.put(`/admin/products/${productId}/toggle-status`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to toggle product status: " + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Permanently remove this product from marketplace catalog?")) return;
    try {
      const res = await API.delete(`/admin/products/${productId}`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to remove product: " + err.message);
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
      const res = await API.delete(`/coupons/${id}`);
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to delete coupon: " + err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/categories", newCategory);
      if (res.data.success) {
        setNewCategory({ name: "", description: "", image: "", icon: "Package" });
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to create category: " + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await API.delete(`/categories/${id}`);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const summary = analytics?.summary || {};
  const pendingApps = applications.filter((app) => app.status === "pending");

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.orderStatus === orderStatusFilter;
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "75vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading platform governance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      {/* Admin Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill fw-semibold mb-1">
            SUPER ADMIN GOVERNANCE
          </span>
          <h2 className="fw-bold mb-0">Marketplace Control Center</h2>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-dark btn-sm rounded-pill d-flex align-items-center gap-1" onClick={fetchAdminData}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 py-2 small" role="alert">
          {actionMsg}
          <button type="button" className="btn-close" onClick={() => setActionMsg("")} />
        </div>
      )}

      {/* Analytics KPI Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Platform Gross Volume (GMV)</span>
              <div className="rounded-circle bg-primary-subtle text-primary p-2">
                <TrendingUp size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-0">₹{(summary.totalGMV || 0).toLocaleString("en-IN")}</h3>
            <span className="text-muted small">Total customer transactions</span>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Platform Commission Earned</span>
              <div className="rounded-circle bg-success-subtle text-success p-2">
                <DollarSign size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-success mb-0">₹{(summary.totalPlatformCommission || 0).toLocaleString("en-IN")}</h3>
            <span className="text-muted small">Direct platform net revenue</span>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Net Vendor Payouts</span>
              <div className="rounded-circle bg-info-subtle text-info p-2">
                <Package size={18} />
              </div>
            </div>
            <h3 className="fw-bold text-info mb-0">₹{(summary.totalVendorPayout || 0).toLocaleString("en-IN")}</h3>
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
      <div className="mb-4 overflow-auto">
        <ul className="nav nav-pills gap-2 flex-nowrap">
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
              <Store size={16} className="me-1 inline" /> Vendors ({applications.length})
              {pendingApps.length > 0 && (
                <span className="badge rounded-pill bg-danger ms-2">{pendingApps.length}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <Users size={16} className="me-1 inline" /> Users & Shoppers
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Package size={16} className="me-1 inline" /> Product Moderation
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <Grid size={16} className="me-1 inline" /> Categories
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "commissions" ? "active" : ""}`}
              onClick={() => setActiveTab("commissions")}
            >
              <Percent size={16} className="me-1 inline" /> Commission Ledger
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "coupons" ? "active" : ""}`}
              onClick={() => setActiveTab("coupons")}
            >
              <Tag size={16} className="me-1 inline" /> Promo Coupons ({coupons.length})
            </button>
          </li>
        </ul>
      </div>

      {/* TAB 1: ANALYTICS & ORDERS */}
      {activeTab === "analytics" && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <Package size={20} className="text-primary" /> Marketplace Orders ({orders.length})
                </h5>
                <select
                  className="form-select form-select-sm w-auto"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

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
                    {filteredOrders.slice(0, 10).map((ord) => (
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
                                : ord.orderStatus === "cancelled"
                                ? "bg-danger"
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
            {/* Category Breakdown */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Layers size={18} className="text-primary" /> Products by Category
              </h5>
              <div className="d-flex flex-column gap-3">
                {analytics?.categoryStats?.map((c) => (
                  <div key={c._id}>
                    <div className="d-flex justify-content-between small fw-semibold mb-1">
                      <span>{c._id || "Uncategorized"}</span>
                      <span>{c.count} listings</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div
                        className="progress-bar bg-primary"
                        style={{
                          width: `${Math.min(100, (c.count / (summary.totalProducts || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Order Status Pipeline</h5>
              <div className="d-flex flex-column gap-2 small">
                {Object.entries(analytics?.orderStatusCounts || {}).map(([st, cnt]) => (
                  <div key={st} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                    <span className="text-capitalize">{st}</span>
                    <span className="badge bg-light text-dark fw-bold">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR APPLICATIONS & SUSPENSIONS */}
      {activeTab === "applications" && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h5 className="fw-bold mb-3">Vendor Applications & Governance</h5>
          <div className="table-responsive">
            <table className="table align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Store Details</th>
                  <th>Applicant</th>
                  <th>Warehouse Address</th>
                  <th>Current Status</th>
                  <th>Commission Rate</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <strong>{app.storeName}</strong>
                      <div className="text-muted text-truncate" style={{ maxWidth: "200px" }}>
                        {app.description}
                      </div>
                    </td>
                    <td>
                      <div>{app.userId?.name || "Merchant"}</div>
                      <div className="text-muted">{app.userId?.email}</div>
                    </td>
                    <td>{app.address}</td>
                    <td>
                      <span
                        className={`badge rounded-pill text-uppercase px-2 py-1 ${
                          app.status === "approved"
                            ? "bg-success"
                            : app.status === "rejected"
                            ? "bg-danger"
                            : app.status === "suspended"
                            ? "bg-dark text-white"
                            : "bg-warning text-dark"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>
                      {app.status === "pending" ? (
                        <div className="input-group input-group-sm" style={{ width: "110px" }}>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="10"
                            min="0"
                            max="100"
                            value={commissionInputs[app._id] || 10}
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
                        <span>{app.commissionRate || 10}%</span>
                      )}
                    </td>
                    <td className="text-end">
                      {app.status === "pending" ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success text-white d-flex align-items-center gap-1"
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
                        <button
                          className={`btn btn-sm rounded-pill ${
                            app.status === "suspended" ? "btn-outline-success" : "btn-outline-danger"
                          }`}
                          onClick={() => handleToggleVendorSuspension(app._id)}
                        >
                          {app.status === "suspended" ? "Reactivate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & CUSTOMERS */}
      {activeTab === "users" && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">Platform User Accounts</h5>
            <div className="search-box" style={{ width: "280px" }}>
              <input
                type="text"
                placeholder="Search user name or email..."
                className="form-control form-control-sm"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Account State</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div className="text-muted">{u.email}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary text-uppercase">{u.role}</span>
                    </td>
                    <td>{u.phone || "—"}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "bg-success-subtle text-success" : "bg-danger"}`}>
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm rounded-pill ${u.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => handleToggleUser(u._id)}
                        disabled={u.role === "admin"}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUCT MODERATION */}
      {activeTab === "products" && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">Marketplace Product Catalog Moderation</h5>
            <div className="search-box" style={{ width: "280px" }}>
              <input
                type="text"
                placeholder="Search products..."
                className="form-control form-control-sm"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="text-muted font-monospace">{p.sku || "N/A"}</div>
                    </td>
                    <td>{p.vendorId?.storeName || "Vendor"}</td>
                    <td><span className="badge bg-light text-dark">{p.category}</span></td>
                    <td className="fw-bold">₹{p.price?.toLocaleString("en-IN")}</td>
                    <td>{p.stock} units</td>
                    <td>
                      <span className={`badge ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                        {p.isActive ? "Live" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className={`btn ${p.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                          onClick={() => handleToggleProduct(p._id)}
                        >
                          {p.isActive ? "Hide" : "Publish"}
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteProduct(p._id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Add New Category</h5>
              <form onSubmit={handleCreateCategory}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Footwear & Shoes"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Category overview..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Cover Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://..."
                    value={newCategory.image}
                    onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary rounded-pill px-4 text-white w-100">
                  <Plus size={15} /> Save Category
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Existing Categories ({categories.length})</h5>
              <div className="d-flex flex-column gap-2">
                {categories.map((c) => (
                  <div key={c._id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-light">
                    <div>
                      <strong>{c.name}</strong>
                      <div className="text-muted small">{c.description}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-pill">{c.productCount || 0} listings</span>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCategory(c._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COMMISSION LEDGER */}
      {activeTab === "commissions" && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <h5 className="fw-bold mb-3">Vendor Commission & Settlement Summary</h5>
          <div className="table-responsive">
            <table className="table align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Vendor Store</th>
                  <th>Commission Rate</th>
                  <th>Paid Orders</th>
                  <th>Gross Product Sales</th>
                  <th>Platform Fee Earned</th>
                  <th>Net Vendor Disbursed</th>
                </tr>
              </thead>
              <tbody>
                {commissionLedger.map((row) => (
                  <tr key={row.vendorId}>
                    <td><strong>{row.storeName}</strong></td>
                    <td>{row.commissionRate}%</td>
                    <td>{row.ordersCount}</td>
                    <td className="fw-bold">₹{row.grossSales?.toLocaleString("en-IN")}</td>
                    <td className="text-success fw-bold">₹{row.platformCommission?.toLocaleString("en-IN")}</td>
                    <td className="fw-bold text-primary">₹{row.netVendorPayout?.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: COUPONS */}
      {activeTab === "coupons" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Create Promotional Coupon</h5>
              <form onSubmit={handleCreateCoupon}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Coupon Code</label>
                  <input
                    type="text"
                    className="form-control text-uppercase font-monospace"
                    placeholder="SUMMER25"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Discount %</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="100"
                      required
                      value={newCoupon.discountPercent}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Max Discount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      required
                      value={newCoupon.maxDiscount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    required
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary rounded-pill px-4 text-white w-100">
                  <Plus size={15} /> Publish Coupon Code
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-3">Active Promotional Codes</h5>
              <div className="d-flex flex-column gap-3">
                {coupons.map((c) => (
                  <div key={c._id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-light">
                    <div>
                      <strong className="text-primary font-monospace fs-6">{c.code}</strong>
                      <div className="text-muted small">
                        {c.discountPercent}% off (capped at ₹{c.maxDiscount}) | Min Order: ₹{c.minOrderValue}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCoupon(c._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
