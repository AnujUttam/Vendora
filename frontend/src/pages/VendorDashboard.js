import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import {
  Store,
  PlusCircle,
  Package,
  Boxes,
  Trash2,
  Upload,
  AlertTriangle,
  DollarSign,
  Settings,
  CheckCircle,
  ArrowRight,
  Save,
  Layers
} from "lucide-react";

function VendorDashboard() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(true);

  // New Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Electronics",
    brand: "",
    sku: "",
    price: "",
    stock: "",
    description: "",
    images: []
  });

  const [modalMsg, setModalMsg] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Store Settings Form state
  const [settingsData, setSettingsData] = useState({
    storeName: "",
    description: "",
    phone: "",
    address: "",
    logo: "",
    banner: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Direct Stock Update state
  const [stockInputs, setStockInputs] = useState({});
  const [updatingStockId, setUpdatingStockId] = useState(null);

  const fetchVendorData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, prodRes, ordRes, statRes] = await Promise.all([
        API.get("/vendor/profile"),
        API.get("/vendor/products"),
        API.get("/orders/vendor/orders"),
        API.get("/vendor/dashboard/stats").catch(() => ({ data: {} }))
      ]);

      if (profRes.data.success) {
        setProfile(profRes.data.vendor);
        setSettingsData({
          storeName: profRes.data.vendor.storeName || "",
          description: profRes.data.vendor.description || "",
          phone: profRes.data.vendor.phone || "",
          address: profRes.data.vendor.address || "",
          logo: profRes.data.vendor.logo || "",
          banner: profRes.data.vendor.banner || "",
          accountHolder: profRes.data.vendor.bankDetails?.accountHolder || "",
          accountNumber: profRes.data.vendor.bankDetails?.accountNumber || "",
          ifscCode: profRes.data.vendor.bankDetails?.ifscCode || "",
          bankName: profRes.data.vendor.bankDetails?.bankName || ""
        });
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.products || []);
        const initialStocks = {};
        (prodRes.data.products || []).forEach((p) => {
          initialStocks[p._id] = p.stock;
        });
        setStockInputs(initialStocks);
      }
      if (ordRes.data.success) setOrders(ordRes.data.orders || []);
      if (statRes.data.success) setStats(statRes.data.stats);
    } catch (err) {
      console.error("Failed to load vendor data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  // Image upload handler (uploads to /api/upload -> S3 / Local)
  const handleImageUpload = async (e, targetField = "product") => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setModalMsg("");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success && res.data.url) {
        if (targetField === "product") {
          setNewProduct((prev) => ({
            ...prev,
            images: [...prev.images, res.data.url]
          }));
          setModalMsg(`Image uploaded successfully (${res.data.provider.toUpperCase()})`);
        } else if (targetField === "logo") {
          setSettingsData((prev) => ({ ...prev, logo: res.data.url }));
        } else if (targetField === "banner") {
          setSettingsData((prev) => ({ ...prev, banner: res.data.url }));
        }
      }
    } catch (err) {
      setModalMsg("Image upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);
    setModalMsg("");

    try {
      const payload = {
        name: newProduct.name,
        category: newProduct.category,
        brand: newProduct.brand || profile?.storeName,
        sku: newProduct.sku,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        description: newProduct.description,
        images: newProduct.images.length > 0 ? newProduct.images : [
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"
        ]
      };

      const res = await API.post("/vendor/products", payload);
      if (res.data.success) {
        setShowAddModal(false);
        setNewProduct({
          name: "",
          category: "Electronics",
          brand: "",
          sku: "",
          price: "",
          stock: "",
          description: "",
          images: []
        });
        fetchVendorData();
      }
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Failed to list product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Remove this product listing from the marketplace?")) return;
    try {
      await API.delete(`/vendor/products/${productId}`);
      fetchVendorData();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleStockUpdate = async (productId) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined || newStock < 0) return;

    setUpdatingStockId(productId);
    try {
      const res = await API.put(`/vendor/products/${productId}/stock`, {
        stock: Number(newStock)
      });
      if (res.data.success) {
        fetchVendorData();
      }
    } catch (err) {
      alert("Failed to update stock: " + err.message);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await API.put(`/orders/${orderId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by merchant.`
      });
      if (res.data.success) {
        fetchVendorData();
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const res = await API.put("/vendor/profile", {
        storeName: settingsData.storeName,
        description: settingsData.description,
        phone: settingsData.phone,
        address: settingsData.address,
        logo: settingsData.logo,
        banner: settingsData.banner,
        bankDetails: {
          accountHolder: settingsData.accountHolder,
          accountNumber: settingsData.accountNumber,
          ifscCode: settingsData.ifscCode,
          bankName: settingsData.bankName
        }
      });
      if (res.data.success) {
        setSettingsMsg("Store settings and bank details updated successfully!");
        fetchVendorData();
      }
    } catch (err) {
      setSettingsMsg("Failed to update settings: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingSettings(false);
    }
  };

  // Compute calculated metrics
  const totalRevenue = stats?.totalRevenue || orders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
  const netEarnings = stats?.netEarnings || orders.reduce((acc, o) => acc + (o.vendorPayout || 0), 0);
  const totalCommission = stats?.totalCommission || Math.max(0, totalRevenue - netEarnings);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "75vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading vendor dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      {/* Top Banner & Store Header */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <img
              src={profile?.logo || "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=400"}
              alt=""
              className="rounded-circle border border-2 border-primary object-fit-cover shadow-xs"
              style={{ width: "65px", height: "65px" }}
            />
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3 className="fw-bold mb-0">{profile?.storeName || "My Vendor Store"}</h3>
                <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1">
                  Approved Seller
                </span>
              </div>
              <p className="text-muted small mb-0 mt-1">
                Platform Commission: <strong>{profile?.commissionRate || 10}%</strong> | Warehouse: {profile?.address}
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {profile?._id && (
              <Link
                to={`/store/${profile._id}`}
                className="btn btn-outline-dark btn-sm rounded-pill d-flex align-items-center gap-1"
                target="_blank"
              >
                <Store size={15} /> View Live Storefront <ArrowRight size={14} />
              </Link>
            )}
            <button
              className="btn btn-primary btn-sm rounded-pill px-3 text-white d-flex align-items-center gap-1"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle size={15} /> Add Product
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Net Vendor Earnings</span>
            <h3 className="fw-bold text-success mb-0 mt-1">₹{netEarnings.toLocaleString("en-IN")}</h3>
            <span className="text-muted" style={{ fontSize: "11px" }}>After platform commission</span>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Total Revenue (GMV)</span>
            <h3 className="fw-bold text-dark mb-0 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</h3>
            <span className="text-muted" style={{ fontSize: "11px" }}>Across {orders.length} order items</span>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Active Products</span>
            <h3 className="fw-bold text-primary mb-0 mt-1">{products.length}</h3>
            <span className="text-muted" style={{ fontSize: "11px" }}>Live in marketplace catalog</span>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Low Stock Alerts</span>
            <h3 className={`fw-bold mb-0 mt-1 ${lowStockCount > 0 ? "text-warning" : "text-muted"}`}>
              {lowStockCount}
            </h3>
            <span className="text-muted" style={{ fontSize: "11px" }}>Units remaining &le; 5</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <ul className="nav nav-pills bg-white p-1 rounded-pill shadow-xs border">
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Boxes size={16} className="me-1 inline" /> Products ({products.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              <Layers size={16} className="me-1 inline" /> Inventory
              {lowStockCount > 0 && <span className="badge bg-warning text-dark ms-1">{lowStockCount}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Package size={16} className="me-1 inline" /> Orders ({orders.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "earnings" ? "active" : ""}`}
              onClick={() => setActiveTab("earnings")}
            >
              <DollarSign size={16} className="me-1 inline" /> Earnings & Payouts
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={16} className="me-1 inline" /> Store Settings
            </button>
          </li>
        </ul>
      </div>

      {/* TAB 1: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          {products.length === 0 ? (
            <div className="p-5 text-center">
              <Boxes size={48} className="text-muted mx-auto mb-3" />
              <h5>No Products Listed Yet</h5>
              <p className="text-muted small">Add your first product to start selling on Vendora.</p>
              <button
                className="btn btn-primary rounded-pill px-4 text-white"
                onClick={() => setShowAddModal(true)}
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th className="ps-4">Product</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th className="pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const imgUrl = p.images && p.images[0]
                      ? p.images[0].startsWith("/uploads/")
                        ? `http://localhost:5000${p.images[0]}`
                        : p.images[0]
                      : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100";

                    return (
                      <tr key={p._id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={imgUrl}
                              alt=""
                              className="rounded-3 object-fit-cover"
                              style={{ width: "50px", height: "50px" }}
                            />
                            <div>
                              <strong className="d-block text-truncate" style={{ maxWidth: "240px" }}>
                                {p.name}
                              </strong>
                              <span className="text-muted small">{p.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                        <td><span className="text-muted small font-monospace">{p.sku || "N/A"}</span></td>
                        <td className="fw-bold">₹{p.price.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`badge ${p.stock > 5 ? "bg-success-subtle text-success" : p.stock > 0 ? "bg-warning text-dark" : "bg-danger"}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>⭐ {p.averageRating?.toFixed(1) || "5.0"} ({p.totalReviews || 0})</td>
                        <td>
                          <span className={`badge rounded-pill ${p.isActive ? "bg-success" : "bg-secondary"}`}>
                            {p.isActive ? "Live" : "Hidden"}
                          </span>
                        </td>
                        <td className="pe-4 text-end">
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => handleDeleteProduct(p._id)}
                            title="Remove"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {activeTab === "inventory" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-1">Inventory Control & Stock Adjustments</h5>
              <p className="text-muted small mb-0">Update live inventory counts to prevent overselling on the platform</p>
            </div>
            {lowStockCount > 0 && (
              <span className="badge bg-warning text-dark d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
                <AlertTriangle size={15} /> {lowStockCount} Products Need Restocking
              </span>
            )}
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th className="ps-4">Product Name</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Inventory Status</th>
                  <th style={{ width: "240px" }}>Adjust Stock</th>
                  <th className="pe-4 text-end">Save</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isUpdating = updatingStockId === p._id;
                  const currentVal = stockInputs[p._id] !== undefined ? stockInputs[p._id] : p.stock;
                  const isLow = p.stock <= 5;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p._id}>
                      <td className="ps-4 py-3">
                        <strong>{p.name}</strong>
                        <div className="text-muted small">{p.category} | ₹{p.price}</div>
                      </td>
                      <td><span className="text-muted small font-monospace">{p.sku || "N/A"}</span></td>
                      <td>
                        <span className="fw-bold fs-6">{p.stock} units</span>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge bg-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge bg-warning text-dark">Low Stock (&le; 5)</span>
                        ) : (
                          <span className="badge bg-success-subtle text-success">Healthy Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="input-group input-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() =>
                              setStockInputs({ ...stockInputs, [p._id]: Math.max(0, Number(currentVal) - 1) })
                            }
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="form-control text-center"
                            min="0"
                            value={currentVal}
                            onChange={(e) =>
                              setStockInputs({ ...stockInputs, [p._id]: Math.max(0, parseInt(e.target.value) || 0) })
                            }
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() =>
                              setStockInputs({ ...stockInputs, [p._id]: Number(currentVal) + 1 })
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-primary btn-sm rounded-pill px-3 text-white"
                          onClick={() => handleStockUpdate(p._id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Saving..." : "Update"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          {orders.length === 0 ? (
            <div className="p-5 text-center">
              <Package size={48} className="text-muted mx-auto mb-3" />
              <h5>No Customer Orders Yet</h5>
              <p className="text-muted small">Orders placed containing your items will appear here for fulfillment.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th className="ps-4">Order / Date</th>
                    <th>Customer</th>
                    <th>Items Sold</th>
                    <th>My Net Payout</th>
                    <th>Payment</th>
                    <th>Fulfillment Status</th>
                    <th className="pe-4 text-end">Advance Lifecycle</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td className="ps-4 py-3">
                        <strong className="text-primary">{o.vendorOrderNumber || o.orderNumber}</strong>
                        <div className="text-muted small">{new Date(o.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <strong>{o.customer?.name || "Shopper"}</strong>
                        <div className="text-muted small">{o.shippingAddress?.city}, {o.shippingAddress?.state}</div>
                      </td>
                      <td>
                        {o.items?.map((it, i) => (
                          <div key={i} className="small">
                            {it.name} &times; <strong>{it.quantity}</strong>
                          </div>
                        ))}
                      </td>
                      <td className="fw-bold text-success">
                        ₹{o.vendorPayout ? o.vendorPayout.toLocaleString("en-IN") : o.subtotal?.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${o.paymentStatus === "paid" ? "bg-success" : "bg-warning text-dark"}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark text-uppercase border">
                          {o.status || o.orderStatus}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          {(o.status === "placed" || o.orderStatus === "placed") && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleUpdateOrderStatus(o.parentOrderId || o._id, "packed")}
                            >
                              Mark Packed
                            </button>
                          )}
                          {(o.status === "packed" || o.orderStatus === "packed") && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleUpdateOrderStatus(o.parentOrderId || o._id, "shipped")}
                            >
                              Mark Shipped
                            </button>
                          )}
                          {(o.status === "shipped" || o.orderStatus === "shipped") && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleUpdateOrderStatus(o.parentOrderId || o._id, "delivered")}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {(o.status === "delivered" || o.orderStatus === "delivered") && (
                            <span className="badge bg-success-subtle text-success p-2 rounded-pill">
                              <CheckCircle size={14} className="inline me-1" /> Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EARNINGS & COMMISSIONS */}
      {activeTab === "earnings" && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold mb-1">Financial Settlement & Commission Ledger</h5>
              <p className="text-muted small mb-0">Platform commission calculations and payout history</p>
            </div>
            <span className="badge bg-primary px-3 py-2 rounded-pill">
              Platform Fee: {profile?.commissionRate || 10}%
            </span>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="p-3 bg-light rounded-4">
                <span className="text-muted small">Gross Product Sales</span>
                <h4 className="fw-bold mt-1">₹{totalRevenue.toLocaleString("en-IN")}</h4>
                <span className="text-muted small">Total items purchased by customers</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-light rounded-4">
                <span className="text-muted small">Vendora Platform Commission</span>
                <h4 className="fw-bold text-danger mt-1">-₹{totalCommission.toLocaleString("en-IN")}</h4>
                <span className="text-muted small">Deducted automatically at checkout</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-success-subtle text-success rounded-4">
                <span className="small fw-semibold">Net Vendor Payout Due</span>
                <h4 className="fw-bold mt-1">₹{netEarnings.toLocaleString("en-IN")}</h4>
                <span className="small">Settled to bank on rolling 7-day schedule</span>
              </div>
            </div>
          </div>

          <h6 className="fw-bold mb-3">Order Settlement Breakdown</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>Commission Rate</th>
                  <th>Commission Deducted</th>
                  <th>Net Vendor Payout</th>
                  <th>Settlement Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const subtotal = o.subtotal || o.items?.reduce((acc, it) => acc + it.price * it.quantity, 0) || 0;
                  const payout = o.vendorPayout || Math.round(subtotal * 0.9 * 100) / 100;
                  const commission = Math.round((subtotal - payout) * 100) / 100;

                  return (
                    <tr key={o._id}>
                      <td className="font-monospace small">{o.vendorOrderNumber || o.orderNumber}</td>
                      <td>{o.customer?.name || "Customer"}</td>
                      <td>₹{subtotal.toLocaleString("en-IN")}</td>
                      <td>{profile?.commissionRate || 10}%</td>
                      <td className="text-danger">-₹{commission.toLocaleString("en-IN")}</td>
                      <td className="fw-bold text-success">₹{payout.toLocaleString("en-IN")}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {o.paymentStatus === "paid" ? "Ready for Payout" : "Pending Payment"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS */}
      {activeTab === "settings" && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold mb-1">Store Profile & Settlement Settings</h5>
              <p className="text-muted small mb-0">Manage your merchant storefront details, branding, and bank account</p>
            </div>
            {profile?._id && (
              <Link to={`/store/${profile._id}`} className="btn btn-outline-dark btn-sm rounded-pill" target="_blank">
                Preview Storefront →
              </Link>
            )}
          </div>

          {settingsMsg && (
            <div className={`alert ${settingsMsg.startsWith("Failed") ? "alert-danger" : "alert-success"} py-2 small mb-4`}>
              {settingsMsg}
            </div>
          )}

          <form onSubmit={handleSaveSettings}>
            <div className="row g-4">
              <div className="col-lg-6">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Store size={18} className="text-primary" /> Storefront Branding
                </h6>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Store / Business Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settingsData.storeName}
                    onChange={(e) => setSettingsData({ ...settingsData, storeName: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Store Bio & Description</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={settingsData.description}
                    onChange={(e) => setSettingsData({ ...settingsData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Store Logo URL</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={settingsData.logo}
                      onChange={(e) => setSettingsData({ ...settingsData, logo: e.target.value })}
                    />
                    <label className="btn btn-outline-secondary">
                      <Upload size={14} className="me-1" /> Upload
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "logo")}
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Store Banner Image URL</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={settingsData.banner}
                      onChange={(e) => setSettingsData({ ...settingsData, banner: e.target.value })}
                    />
                    <label className="btn btn-outline-secondary">
                      <Upload size={14} className="me-1" /> Upload
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "banner")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <DollarSign size={18} className="text-primary" /> Bank & Fulfillment Details
                </h6>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Support Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settingsData.phone}
                    onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Warehouse / Dispatch Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settingsData.address}
                    onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Account Holder</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Account holder name"
                      value={settingsData.accountHolder}
                      onChange={(e) => setSettingsData({ ...settingsData, accountHolder: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Bank Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. HDFC Bank"
                      value={settingsData.bankName}
                      onChange={(e) => setSettingsData({ ...settingsData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Bank account number"
                      value={settingsData.accountNumber}
                      onChange={(e) => setSettingsData({ ...settingsData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. HDFC0001234"
                      value={settingsData.ifscCode}
                      onChange={(e) => setSettingsData({ ...settingsData, ifscCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top text-end">
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-5 text-white fw-bold d-inline-flex align-items-center gap-2"
                disabled={savingSettings || uploadingImage}
              >
                <Save size={16} /> {savingSettings ? "Saving Settings..." : "Save Store Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white border-0 py-3">
                <h5 className="modal-title fw-bold">List New Product on Marketplace</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                />
              </div>

              <form onSubmit={handleCreateProduct}>
                <div className="modal-body p-4">
                  {modalMsg && (
                    <div className="alert alert-info py-2 small">{modalMsg}</div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label small fw-semibold">Product Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">SKU (Stock Keeping Unit)</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. SNY-WH-001"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Home & Living">Home & Living</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Sports">Sports</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Brand / Manufacturer</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={profile?.storeName || "Brand name"}
                        value={newProduct.brand}
                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Price (INR ₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="1999"
                        required
                        min="1"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Initial Stock Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="50"
                        required
                        min="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Product Description</label>
                      <textarea
                        rows={3}
                        className="form-control"
                        placeholder="Key features, specifications, box contents..."
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>

                    {/* S3 / Local Image Upload */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                        <Upload size={14} /> Upload Product Images (AWS S3 / Storage Pipeline)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "product")}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="small text-primary mt-1">Uploading image buffer to cloud storage...</div>
                      )}

                      {newProduct.images.length > 0 && (
                        <div className="d-flex gap-2 mt-2">
                          {newProduct.images.map((img, i) => (
                            <img
                              key={i}
                              src={img.startsWith("/uploads/") ? `http://localhost:5000${img}` : img}
                              alt=""
                              className="rounded-3 border object-fit-cover"
                              style={{ width: "60px", height: "60px" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 p-3 bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 text-white fw-bold"
                    disabled={submittingProduct || uploadingImage}
                  >
                    {submittingProduct ? "Listing Product..." : "Publish Product Listing"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorDashboard;
