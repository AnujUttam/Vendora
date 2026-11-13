import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle,
  XCircle,
  ShieldCheck
} from "lucide-react";

function Cart() {
  const { cart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, loading } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [applying, setApplying] = useState(false);

  const navigate = useNavigate();

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;

    setApplying(true);
    setCouponMsg("");
    try {
      const msg = await applyCoupon(code.trim());
      setIsError(false);
      setCouponMsg(msg || "Coupon applied successfully!");
      setCouponInput("");
    } catch (err) {
      setIsError(true);
      setCouponMsg(err.response?.data?.message || err.message || "Invalid coupon code");
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      setCouponMsg("");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <div className="card border-0 shadow-sm rounded-4 p-5 max-w-md mx-auto my-5">
          <div className="rounded-circle bg-light p-4 d-inline-block mx-auto mb-3">
            <ShoppingBag size={48} className="text-muted" />
          </div>
          <h4 className="fw-bold mb-2">Your Shopping Cart is Empty</h4>
          <p className="text-muted small mb-4">
            Explore our curated collection of verified products from top merchants.
          </p>
          <div>
            <Link to="/products" className="btn btn-primary rounded-pill px-4 text-white">
              Start Shopping Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Your Shopping Cart</h2>
          <p className="text-muted small mb-0">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"} currently reserved in your session
          </p>
        </div>
        <button
          className="btn btn-outline-danger btn-sm rounded-pill d-flex align-items-center gap-1"
          onClick={clearCart}
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="row g-4">
        {/* Items List */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th scope="col" className="ps-4">Product</th>
                    <th scope="col">Price</th>
                    <th scope="col" className="text-center">Quantity</th>
                    <th scope="col" className="text-end">Subtotal</th>
                    <th scope="col" className="text-center pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => {
                    const imgUrl = item.image
                      ? item.image.startsWith("/uploads/")
                        ? `http://localhost:5000${item.image}`
                        : item.image
                      : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200";

                    return (
                      <tr key={item.product || item._id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={imgUrl}
                              alt={item.name}
                              className="rounded-3 object-fit-cover"
                              style={{ width: "65px", height: "65px" }}
                            />
                            <div>
                              <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: "260px" }}>
                                {item.name}
                              </h6>
                              <span className="badge bg-light text-muted small border">
                                Vendor ID: {item.vendorId?.slice(-6) || "Store"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="fw-semibold">₹{item.price.toLocaleString("en-IN")}</td>
                        <td className="text-center">
                          <div className="input-group input-group-sm mx-auto" style={{ width: "105px" }}>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => updateQuantity(item.product, item.quantity - 1)}
                            >
                              -
                            </button>
                            <span className="form-control text-center bg-white fw-bold">
                              {item.quantity}
                            </span>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => updateQuantity(item.product, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-end fw-bold text-dark">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </td>
                        <td className="text-center pe-4">
                          <button
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => removeItem(item.product)}
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-muted small d-flex align-items-center gap-2">
            <ShieldCheck size={16} className="text-success" />
            <span>Redis Cache & MongoDB dual persistence active for zero cart loss.</span>
          </div>
        </div>

        {/* Summary & Coupons */}
        <div className="col-lg-4">
          {/* Coupon Box */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
              <Tag size={16} className="text-primary" /> Promotional Coupons
            </h6>

            {cart.coupon && cart.coupon.code ? (
              <div className="alert alert-success d-flex justify-content-between align-items-center py-2 px-3 rounded-3 small mb-2">
                <div>
                  <CheckCircle size={15} className="me-1 inline" />
                  <strong>{cart.coupon.code}</strong> applied ({cart.coupon.discountPercent}% OFF)
                </div>
                <button
                  className="btn btn-sm btn-link text-danger p-0"
                  onClick={handleRemoveCoupon}
                  title="Remove"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm text-uppercase bg-white"
                    placeholder="Enter Coupon Code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button
                    className="btn btn-dark btn-sm px-3"
                    onClick={() => handleApplyCoupon()}
                    disabled={applying || !couponInput.trim()}
                  >
                    {applying ? "Applying..." : "Apply"}
                  </button>
                </div>

                {couponMsg && (
                  <div className={`alert ${isError ? "alert-danger" : "alert-success"} py-1 px-2 small mb-2`}>
                    {couponMsg}
                  </div>
                )}

                {/* Quick 1-Click Coupons */}
                <div className="mt-2">
                  <div className="small text-muted mb-1">Available promo codes:</div>
                  <div className="d-flex flex-wrap gap-1">
                    <button
                      className="badge bg-white text-primary border border-primary-subtle p-2 text-decoration-none"
                      onClick={() => handleApplyCoupon("WELCOME50")}
                    >
                      WELCOME50 (50% OFF)
                    </button>
                    <button
                      className="badge bg-white text-primary border border-primary-subtle p-2 text-decoration-none"
                      onClick={() => handleApplyCoupon("VENDORA10")}
                    >
                      VENDORA10 (10% OFF)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Order Summary</h5>

            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Items Subtotal</span>
              <span className="fw-semibold text-dark">₹{cart.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {cart.discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-success">
                <span>Coupon Savings</span>
                <span className="fw-bold">- ₹{cart.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="d-flex justify-content-between mb-3 small text-muted">
              <span>Estimated Shipping</span>
              <span className="text-success fw-bold">FREE</span>
            </div>

            <hr />

            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold">Total Amount</span>
              <h4 className="fw-bold text-primary mb-0">₹{cart.totalAmount.toLocaleString("en-IN")}</h4>
            </div>

            <button
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow-sm"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
