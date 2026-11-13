import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  Store,
  PlusCircle,
  Package,
  Boxes,
  Trash2,
  Upload
} from "lucide-react";

function VendorDashboard() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(true);

  // New Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Electronics",
    brand: "",
    price: "",
    stock: "",
    description: "",
    images: []
  });

  const [modalMsg, setModalMsg] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const fetchVendorData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, prodRes, ordRes] = await Promise.all([
        API.get("/vendor/profile"),
        API.get("/vendor/products"),
        API.get("/orders/vendor/orders")
      ]);

      if (profRes.data.success) setProfile(profRes.data.vendor);
      if (prodRes.data.success) setProducts(prodRes.data.products || []);
      if (ordRes.data.success) setOrders(ordRes.data.orders || []);
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
  const handleImageUpload = async (e) => {
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
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, res.data.url]
        }));
        setModalMsg(`Image uploaded successfully (${res.data.provider.toUpperCase()})`);
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
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        description: newProduct.description,
        images: newProduct.images.length > 0 ? newProduct.images : [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"
        ]
      };

      const res = await API.post("/vendor/products", payload);
      if (res.data.success) {
        setShowAddModal(false);
        setNewProduct({
          name: "",
          category: "Electronics",
          brand: "",
          price: "",
          stock: "",
          description: "",
          images: []
        });
        fetchVendorData();
      }
    } catch (err) {
      setModalMsg(err.response?.data?.message || "Failed to create product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to remove this product listing?")) return;
    try {
      await API.delete(`/vendor/products/${productId}`);
      fetchVendorData();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by vendor.`
      });
      fetchVendorData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Calculate total earnings
  const totalVendorEarnings = orders.reduce((acc, ord) => acc + (ord.myEarnings || 0), 0);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading vendor dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      {/* Store Header */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-dark text-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-primary p-3 text-white">
              <Store size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h3 className="fw-bold mb-0">{profile?.storeName || "My Store"}</h3>
                <span className="badge bg-success small">Approved Merchant</span>
              </div>
              <p className="text-light opacity-75 small mb-0 mt-1">
                {profile?.description || "Marketplace Vendor"}
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-4">
            <div className="text-end">
              <div className="small text-light opacity-75">Platform Commission</div>
              <div className="fs-5 fw-bold text-warning">{profile?.commissionRate || 10}%</div>
            </div>
            <div className="text-end">
              <div className="small text-light opacity-75">Net Earnings</div>
              <div className="fs-4 fw-bold text-success">₹{totalVendorEarnings.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Boxes size={16} className="me-1 inline" /> My Products ({products.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-4 ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Package size={16} className="me-1 inline" /> Orders & Fulfillment ({orders.length})
            </button>
          </li>
        </ul>

        {activeTab === "products" && (
          <button
            className="btn btn-primary rounded-pill px-4 text-white d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "products" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
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
                        <td className="fw-bold">₹{p.price.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`badge ${p.stock > 0 ? "bg-success-subtle text-success" : "bg-danger"}`}>
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

      {/* TAB 2: ORDERS & FULFILLMENT */}
      {activeTab === "orders" && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-5 text-center">
              <Package size={48} className="text-muted mx-auto mb-3" />
              <h5>No Orders Received Yet</h5>
              <p className="text-muted small">Incoming orders for your store will appear here for fulfillment.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th className="ps-4">Order ID & Date</th>
                    <th>Customer</th>
                    <th>Items Ordered</th>
                    <th>Your Payout (Net)</th>
                    <th>Fulfillment Status</th>
                    <th className="pe-4 text-end">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="ps-4 py-3">
                        <strong className="text-primary d-block">{order.orderNumber}</strong>
                        <span className="text-muted small">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <strong>{order.customer?.name || "Customer"}</strong>
                        <div className="text-muted small">{order.shippingAddress?.city}</div>
                      </td>
                      <td>
                        {order.items?.map((it, i) => (
                          <div key={i} className="small">
                            {it.name} <span className="text-muted">x{it.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="fw-bold text-success fs-6">
                        ₹{order.myEarnings?.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill text-uppercase px-3 py-2 ${
                            order.orderStatus === "delivered"
                              ? "bg-success"
                              : order.orderStatus === "shipped"
                              ? "bg-info text-dark"
                              : order.orderStatus === "packed"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          {order.orderStatus === "placed" && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleUpdateOrderStatus(order._id, "packed")}
                            >
                              Pack Items
                            </button>
                          )}
                          {order.orderStatus === "packed" && (
                            <button
                              className="btn btn-info text-dark"
                              onClick={() => handleUpdateOrderStatus(order._id, "shipped")}
                            >
                              Dispatch / Ship
                            </button>
                          )}
                          {order.orderStatus === "shipped" && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleUpdateOrderStatus(order._id, "delivered")}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.orderStatus === "delivered" && (
                            <span className="badge bg-light text-success border">Completed</span>
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
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Product Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Wireless Ergonomic Vertical Mouse"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
                        <Upload size={14} /> Upload Product Images (AWS S3 / Storage)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageUpload}
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
