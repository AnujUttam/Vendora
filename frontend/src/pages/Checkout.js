import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  CreditCard,
  MapPin,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

function Checkout() {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "Karnataka",
    postalCode: user?.address?.postalCode || "",
    phone: user?.phone || "+91 99000 11223"
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [razorpayData, setRazorpayData] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleInitiateCheckout = async (e) => {
    e.preventDefault();
    setError("");

    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      setError("Please complete all shipping address fields");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/orders/checkout", {
        shippingAddress,
        paymentMethod
      });

      if (res.data.success) {
        setCreatedOrder(res.data.order);
        setRazorpayData(res.data.paymentGatewayData);
        setShowPaymentModal(true);
        // Refresh cart in context
        fetchCart();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to process checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!createdOrder) return;
    setVerifyingPayment(true);
    try {
      const res = await API.post("/orders/verify-payment", {
        orderId: createdOrder._id,
        razorpayOrderId: razorpayData?.orderId || `order_${Date.now()}`,
        razorpayPaymentId: `pay_test_${Date.now()}`,
        razorpaySignature: "test_signature"
      });

      if (res.data.success) {
        setShowPaymentModal(false);
        navigate(`/my-orders?success=1&orderId=${createdOrder._id}`);
      }
    } catch (err) {
      alert("Payment verification failed: " + (err.response?.data?.message || err.message));
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    if (!createdOrder) {
      return (
        <div className="container py-5 text-center">
          <h4>Your cart is empty</h4>
          <button className="btn btn-primary mt-3 text-white" onClick={() => navigate("/products")}>
            Browse Marketplace
          </button>
        </div>
      );
    }
  }

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <h2 className="fw-bold mb-1">Checkout & Payment</h2>
      <p className="text-muted small mb-4">Secure multi-vendor checkout with automated commission splits</p>

      {error && <div className="alert alert-danger py-2 small mb-4">{error}</div>}

      <div className="row g-4">
        {/* Shipping Form */}
        <div className="col-lg-7">
          <form onSubmit={handleInitiateCheckout}>
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <MapPin size={20} className="text-primary" /> 1. Shipping Address
              </h5>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">Recipient Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    required
                    value={shippingAddress.fullName}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Street Address / Landmark</label>
                  <input
                    type="text"
                    name="street"
                    className="form-control"
                    placeholder="Flat 4B, Greenwood Heights, MG Road"
                    required
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">City</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    required
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold">State</label>
                  <input
                    type="text"
                    name="state"
                    className="form-control"
                    required
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="form-control"
                    required
                    value={shippingAddress.postalCode}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Contact Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    required
                    value={shippingAddress.phone}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <CreditCard size={20} className="text-primary" /> 2. Payment Gateway (Test Mode)
              </h5>

              <div className="d-grid gap-2">
                <label className="card p-3 rounded-3 border-2 border-primary bg-light cursor-pointer">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                      />
                      <div>
                        <strong>Razorpay / Cards / UPI / Netbanking</strong>
                        <div className="text-muted small">
                          Test sandbox with real-time vendor commission split calculation
                        </div>
                      </div>
                    </div>
                    <span className="badge bg-primary text-white">Recommended</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <>
                  Pay ₹{cart.totalAmount?.toLocaleString("en-IN")} via Razorpay <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary & Commission Transparency */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-light mb-4">
            <h5 className="fw-bold mb-3">Order Items ({cart.items.length})</h5>

            <div className="d-flex flex-column gap-3 mb-3">
              {cart.items.map((item) => (
                <div key={item.product || item._id} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-white text-dark border">x{item.quantity}</span>
                    <span className="small text-truncate" style={{ maxWidth: "200px" }}>{item.name}</span>
                  </div>
                  <span className="fw-semibold small">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            <hr />

            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Items Total</span>
              <span>₹{cart.subtotal?.toLocaleString("en-IN")}</span>
            </div>

            {cart.discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-success">
                <span>Coupon ({cart.coupon?.code})</span>
                <span>- ₹{cart.discountAmount?.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Delivery Fee</span>
              <span className="text-success fw-bold">FREE</span>
            </div>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">Total Payable</span>
              <h4 className="fw-bold text-primary mb-0">₹{cart.totalAmount?.toLocaleString("en-IN")}</h4>
            </div>

            {/* Split Commission Transparency Info Box */}
            <div className="card border border-primary-subtle bg-white p-3 rounded-3 small">
              <div className="d-flex align-items-center gap-1 text-primary fw-bold mb-1">
                <Sparkles size={14} /> Multi-Vendor Split Engine
              </div>
              <p className="text-muted mb-0" style={{ fontSize: "11px" }}>
                Vendora automatically computes vendor payouts and routes payments to independent merchants while deducting platform fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      {showPaymentModal && createdOrder && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="bg-primary text-white p-4 text-center">
                <h5 className="modal-title fw-bold">Razorpay Test Gateway</h5>
                <p className="mb-0 small opacity-75">Order: {createdOrder.orderNumber}</p>
              </div>

              <div className="modal-body p-4 text-center">
                <div className="display-6 fw-bold text-dark mb-1">
                  ₹{createdOrder.totalAmount?.toLocaleString("en-IN")}
                </div>
                <p className="text-muted small mb-4">Simulating Razorpay Test Sandbox Checkout</p>

                <div className="card p-3 rounded-3 bg-light border-0 text-start small mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Customer:</span>
                    <strong>{shippingAddress.fullName}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Payment Mode:</span>
                    <span className="badge bg-success-subtle text-success">Test Mode (Simulated)</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Platform Commission:</span>
                    <span>₹{createdOrder.platformCommissionTotal?.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-success w-100 py-3 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                  onClick={handleSimulatePaymentSuccess}
                  disabled={verifyingPayment}
                >
                  {verifyingPayment ? (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  ) : (
                    <>
                      <CheckCircle size={18} /> Simulate Successful Payment (₹{createdOrder.totalAmount})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
