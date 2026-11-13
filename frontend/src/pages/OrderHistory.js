import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import {
  Package,
  Download,
  CheckCircle,
  Truck,
  Box
} from "lucide-react";

const LIFECYCLE_STEPS = ["placed", "packed", "shipped", "delivered"];

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const showSuccessBanner = Boolean(searchParams.get("success"));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await API.get("/orders/my-orders");
        if (res.data.success) {
          setOrders(res.data.orders || []);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await API.get(`/orders/${orderId}/invoice`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to download invoice: " + err.message);
    }
  };

  const getStepIndex = (status) => {
    const idx = LIFECYCLE_STEPS.indexOf(status?.toLowerCase());
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Orders & Purchases</h2>
          <p className="text-muted small mb-0">Track real-time fulfillment and download tax invoices</p>
        </div>
        <Link to="/products" className="btn btn-outline-dark btn-sm rounded-pill">
          Continue Shopping
        </Link>
      </div>

      {showSuccessBanner && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-4 p-3 mb-4 shadow-sm">
          <CheckCircle size={22} className="text-success" />
          <div>
            <strong>Payment Successful!</strong> Your order has been placed and forwarded to merchants.
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading orders...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center my-4">
          <Package size={48} className="text-muted mx-auto mb-3" />
          <h4 className="fw-bold">No Orders Placed Yet</h4>
          <p className="text-muted small mb-4">When you purchase items from our vendors, they will appear here.</p>
          <div>
            <Link to="/products" className="btn btn-primary rounded-pill px-4 text-white">
              Explore Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.orderStatus);

            return (
              <div key={order._id} className="card border-0 shadow-sm rounded-4 overflow-hidden">
                {/* Header bar */}
                <div className="card-header bg-light py-3 px-4 border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div>
                      <span className="text-muted small d-block">Order Placed</span>
                      <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span className="text-muted small d-block">Order ID</span>
                      <strong className="text-primary">{order.orderNumber}</strong>
                    </div>
                    <div>
                      <span className="text-muted small d-block">Total Amount</span>
                      <strong>₹{order.totalAmount?.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge rounded-pill px-3 py-2 text-uppercase ${
                        order.paymentStatus === "paid" ? "bg-success" : "bg-warning text-dark"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {order.paymentStatus}
                    </span>

                    <button
                      className="btn btn-sm btn-outline-dark rounded-pill d-flex align-items-center gap-1"
                      onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                    >
                      <Download size={14} /> PDF Invoice
                    </button>
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* Fulfillment Lifecycle Progress Bar */}
                  <div className="mb-4 p-3 bg-light rounded-4">
                    <div className="small fw-bold text-muted mb-3 text-uppercase">
                      Order Lifecycle Status: <span className="text-primary">{order.orderStatus}</span>
                    </div>

                    <div className="position-relative m-3">
                      <div
                        className="progress"
                        role="progressbar"
                        style={{ height: "4px" }}
                        aria-valuenow={(currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <div
                          className="progress-bar bg-success"
                          style={{
                            width: `${(currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100}%`
                          }}
                        />
                      </div>

                      <div className="position-absolute top-0 start-0 translate-middle">
                        <span className={`badge rounded-circle p-2 ${currentStepIdx >= 0 ? "bg-success" : "bg-secondary"}`}>
                          <CheckCircle size={14} />
                        </span>
                        <div className="small fw-semibold mt-1 text-center" style={{ width: "60px", marginLeft: "-18px" }}>
                          Placed
                        </div>
                      </div>

                      <div className="position-absolute top-0 start-33 translate-middle" style={{ left: "33%" }}>
                        <span className={`badge rounded-circle p-2 ${currentStepIdx >= 1 ? "bg-success" : "bg-secondary"}`}>
                          <Box size={14} />
                        </span>
                        <div className="small fw-semibold mt-1 text-center" style={{ width: "60px", marginLeft: "-18px" }}>
                          Packed
                        </div>
                      </div>

                      <div className="position-absolute top-0 start-66 translate-middle" style={{ left: "66%" }}>
                        <span className={`badge rounded-circle p-2 ${currentStepIdx >= 2 ? "bg-success" : "bg-secondary"}`}>
                          <Truck size={14} />
                        </span>
                        <div className="small fw-semibold mt-1 text-center" style={{ width: "60px", marginLeft: "-18px" }}>
                          Shipped
                        </div>
                      </div>

                      <div className="position-absolute top-0 start-100 translate-middle">
                        <span className={`badge rounded-circle p-2 ${currentStepIdx >= 3 ? "bg-success" : "bg-secondary"}`}>
                          <CheckCircle size={14} />
                        </span>
                        <div className="small fw-semibold mt-1 text-center" style={{ width: "60px", marginLeft: "-25px" }}>
                          Delivered
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="d-flex flex-column gap-3 mt-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between border-bottom pb-3">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={
                              item.image
                                ? item.image.startsWith("/uploads/")
                                  ? `http://localhost:5000${item.image}`
                                  : item.image
                                : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100"
                            }
                            alt={item.name}
                            className="rounded-3 object-fit-cover"
                            style={{ width: "55px", height: "55px" }}
                          />
                          <div>
                            <h6 className="fw-bold mb-1">{item.name}</h6>
                            <span className="text-muted small">
                              Vendor: {item.vendorId?.storeName || "Marketplace Merchant"}
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="fw-bold">₹{item.price?.toLocaleString("en-IN")}</div>
                          <div className="text-muted small">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Info */}
                  <div className="mt-3 text-muted small d-flex flex-wrap justify-content-between">
                    <div>
                      Delivering to: <strong>{order.shippingAddress?.fullName}</strong>, {order.shippingAddress?.street}, {order.shippingAddress?.city}
                    </div>
                    <div>
                      Payment Method: <span className="text-uppercase fw-semibold">{order.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
