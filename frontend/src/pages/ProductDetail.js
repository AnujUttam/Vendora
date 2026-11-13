import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
  Star,
  ShoppingCart,
  Check,
  Store,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Send
} from "lucide-react";

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const fetchProductAndReviews = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, revRes] = await Promise.all([
        API.get(`/products/${id}`),
        API.get(`/reviews/product/${id}`)
      ]);

      if (prodRes.data.success) {
        setProduct(prodRes.data.product);
      }
      if (revRes.data.success) {
        setReviews(revRes.data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load product details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductAndReviews();
  }, [fetchProductAndReviews]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err.message || "Please login to add to cart");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to post a review");
      return;
    }
    setSubmittingReview(true);
    setReviewMsg("");
    try {
      const res = await API.post("/reviews", {
        productId: id,
        rating,
        title: reviewTitle,
        comment: reviewComment
      });

      if (res.data.success) {
        setReviewMsg("Review posted successfully! Thank you for your feedback.");
        setReviewTitle("");
        setReviewComment("");
        fetchProductAndReviews();
      }
    } catch (err) {
      setReviewMsg(err.response?.data?.message || "Failed to post review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h4>Product Not Found</h4>
        <Link to="/products" className="btn btn-primary mt-3 text-white">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.startsWith("/uploads/") ? `http://localhost:5000${img}` : img)
    : ["https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800"];

  return (
    <div className="container py-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/products" className="text-decoration-none">Products</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{product.category}</li>
        </ol>
      </nav>

      {/* Main Details */}
      <div className="row g-5">
        {/* Gallery */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3 bg-light" style={{ height: "420px" }}>
            <img
              src={images[selectedImage] || images[0]}
              alt={product.name}
              className="w-100 h-100 object-fit-contain p-2"
            />
          </div>

          {images.length > 1 && (
            <div className="d-flex gap-2 overflow-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`btn p-1 rounded-3 border ${selectedImage === idx ? "border-primary" : "border-light"}`}
                  onClick={() => setSelectedImage(idx)}
                  style={{ width: "80px", height: "80px" }}
                >
                  <img src={img} alt="" className="w-100 h-100 object-fit-cover rounded-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Purchase */}
        <div className="col-lg-6">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-1">
              {product.category}
            </span>
            <span className="text-muted small">Brand: <strong>{product.brand}</strong></span>
          </div>

          <h2 className="fw-bold mb-3">{product.name}</h2>

          {/* Rating badge */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="d-flex align-items-center text-warning">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  fill={star <= Math.round(product.averageRating || 5) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <span className="fw-bold text-dark">{product.averageRating ? product.averageRating.toFixed(1) : "5.0"}</span>
            <span className="text-muted small">({reviews.length} customer reviews)</span>
          </div>

          <div className="mb-4">
            <h2 className="text-primary fw-bold mb-1">₹{product.price.toLocaleString("en-IN")}</h2>
            <div className="small text-muted">Inclusive of all marketplace taxes</div>
          </div>

          <p className="text-secondary mb-4 leading-relaxed">{product.description}</p>

          {/* Stock & Quantity */}
          <div className="card p-3 rounded-4 bg-light border-0 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="small text-muted">Availability:</span>
              <span className={`badge ${product.stock > 0 ? "bg-success" : "bg-danger"}`}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : "Sold Out"}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="d-flex align-items-center gap-3">
                <div className="input-group" style={{ width: "130px" }}>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm text-center fw-bold bg-white"
                    value={quantity}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  >
                    +
                  </button>
                </div>

                <button
                  className={`btn flex-grow-1 py-2 fw-semibold rounded-pill d-flex align-items-center justify-content-center gap-2 ${
                    added ? "btn-success text-white" : "btn-primary text-white"
                  }`}
                  onClick={handleAddToCart}
                >
                  {added ? (
                    <>
                      <Check size={18} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Vendor Badge */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary-subtle text-primary p-3">
                <Store size={24} />
              </div>
              <div>
                <div className="small text-muted">Sold & Fulfilled by:</div>
                <h6 className="fw-bold mb-0">
                  {product.vendorId?.storeName || "Vendora Verified Merchant"}
                </h6>
                <div className="small text-muted">
                  {product.vendorId?.description || "Top rated independent seller"}
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="row g-2 text-muted small">
            <div className="col-4 d-flex align-items-center gap-1">
              <Truck size={16} className="text-primary" /> Free Express Delivery
            </div>
            <div className="col-4 d-flex align-items-center gap-1">
              <ShieldCheck size={16} className="text-primary" /> Verified Authentic
            </div>
            <div className="col-4 d-flex align-items-center gap-1">
              <RotateCcw size={16} className="text-primary" /> 7-Day Easy Return
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="mt-5 pt-4 border-top">
        <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
          <MessageSquare size={22} className="text-primary" /> Verified Customer Reviews ({reviews.length})
        </h4>

        <div className="row g-4">
          {/* Reviews list */}
          <div className="col-lg-7">
            {reviews.length === 0 ? (
              <div className="card p-4 rounded-4 bg-light border-0 text-center">
                <p className="text-muted mb-0">No reviews yet for this product. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <div key={rev._id} className="card p-3 rounded-4 border-0 shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="d-block">{rev.userName}</strong>
                        {rev.verifiedPurchase && (
                          <span className="badge bg-success-subtle text-success small" style={{ fontSize: "10px" }}>
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center text-warning small">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.title && <h6 className="fw-bold mb-1">{rev.title}</h6>}
                    <p className="text-muted small mb-1">{rev.comment}</p>
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write Review Form */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
              <h5 className="fw-bold mb-2">Write a Review</h5>
              <p className="text-muted small mb-3">Share your experience with the community</p>

              {reviewMsg && (
                <div className="alert alert-info py-2 small">{reviewMsg}</div>
              )}

              <form onSubmit={handleReviewSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Your Rating</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        className="btn btn-sm p-0 border-0 text-warning"
                        onClick={() => setRating(num)}
                      >
                        <Star
                          size={24}
                          fill={num <= rating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                    <span className="ms-2 fw-bold text-dark">{rating} / 5</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Headline / Title</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white"
                    placeholder="e.g. Excellent sound quality!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Detailed Review</label>
                  <textarea
                    rows={4}
                    className="form-control form-control-sm bg-white"
                    placeholder="What did you like or dislike? How was the build quality?"
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-dark w-100 btn-sm py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  ) : (
                    <>
                      <Send size={15} /> Submit Verified Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
