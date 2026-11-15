import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import {
  Package,
  Download,
  CheckCircle,
  Truck,
  Box,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const LIFECYCLE_STEPS = ["placed", "packed", "shipped", "delivered"];

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [searchParams] = useSearchParams();
  const showSuccessBanner = Boolean(searchParams.get("success"));

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

  useEffect(() => {
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

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt("Reason for cancelling order:", "Found an alternative / Changed mind");
    if (!reason) return;

    setCancellingId(orderId);
    try {
      const res = await API.put(`/orders/${orderId}/cancel`, { reason });
      if (res.data.success) {
        alert("Order cancelled successfully. Any reserved inventory has been restored.");
        fetchOrders();
      }
    } catch (err) {
      alert("Failed to cancel order: " + (err.response?.data?.message || err.message));
    } finally {
      setCancellingId(null);
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
          <p className="text-muted small mb-0">Track real-time multi-vendor fulfillment, cancellation, and invoices</p>
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
            const isCancelled = order.orderStatus === "cancelled";
            const canCancel = order.orderStatus === "placed";
            const isExpanded = expandedOrder === order._id;

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
                        isCancelled
                          ? "bg-danger"
                          : order.paymentStatus === "paid"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {isCancelled ? "Cancelled" : order.paymentStatus}
                    </span>

                    <button
                      className="btn btn-sm btn-outline-dark rounded-pill d-flex align-items-center gap-1"
                      onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                    >
                      <Download size={14} /> PDF Invoice
                    </button>

                    {canCancel && (
                      <button
                        className="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center gap-1"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                      >
                        <XCircle size={14} /> {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* Fulfillment Lifecycle Progress Bar */}
                  {!isCancelled ? (
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
                  ) : (
                    <div className="alert alert-danger py-2 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <XCircle size={16} /> This order was cancelled.
                    </div>
                  )}

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
                            {item.status && (
                              <span className="badge bg-light text-secondary ms-2 small">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-end">
                          <div className="fw-bold">₹{item.price?.toLocaleString("en-IN")}</div>
                          <div className="text-muted small">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Payment summary */}
                  <div className="mt-3 text-muted small d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                      Delivering to: <strong>{order.shippingAddress?.fullName}</strong>, {order.shippingAddress?.street}, {order.shippingAddress?.city}
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div>
                        Payment Method: <span className="text-uppercase fw-semibold">{order.paymentMethod}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center gap-1"
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                      >
                        {isExpanded ? <>Hide Tracking History <ChevronUp size={14} /></> : <>Tracking Timeline <ChevronDown size={14} /></>}
                      </button>
                    </div>
                  </div>

                  {/* Tracking Timeline Accordion */}
                  {isExpanded && order.trackingHistory && order.trackingHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-top bg-light p-3 rounded-3">
                      <h6 className="fw-bold small mb-2 d-flex align-items-center gap-1">
                        <Clock size={14} /> Order Event Log
                      </h6>
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                        {order.trackingHistory.map((step, sIdx) => (
                          <li key={sIdx} className="d-flex justify-content-between align-items-center border-bottom pb-1">
                            <div>
                              <span className="badge bg-secondary-subtle text-dark text-uppercase me-2" style={{ fontSize: "10px" }}>
                                {step.status}
                              </span>
                              <span>{step.note}</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: "11px" }}>
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
