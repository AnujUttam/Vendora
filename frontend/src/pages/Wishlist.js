import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Star
} from "lucide-react";

function Wishlist() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [movingId, setMovingId] = useState(null);

  const handleMoveToCart = async (product) => {
    try {
      setMovingId(product._id);
      await addToCart(product._id, 1);
      await removeFromWishlist(product._id);
    } catch (err) {
      alert(err.message || "Could not move to cart");
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "75vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "75vh" }}>
        <div className="card border-0 shadow-sm rounded-4 p-5 max-w-md mx-auto my-5">
          <div className="rounded-circle bg-light p-4 d-inline-block mx-auto mb-3">
            <Heart size={48} className="text-muted" />
          </div>
          <h4 className="fw-bold mb-2">Your Wishlist is Empty</h4>
          <p className="text-muted small mb-4">
            Save items that catch your eye while browsing the marketplace. You can review and purchase them anytime!
          </p>
          <div>
            <Link to="/products" className="btn btn-primary rounded-pill px-4 text-white">
              Explore Marketplace <ArrowRight size={16} />
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
          <h2 className="fw-bold mb-1">My Wishlist</h2>
          <p className="text-muted small mb-0">
            {wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved for later purchase
          </p>
        </div>
        <Link to="/products" className="btn btn-outline-dark btn-sm rounded-pill">
          Continue Browsing
        </Link>
      </div>

      <div className="row g-4">
        {wishlist.map((product) => {
          const isMoving = movingId === product._id;
          return (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={product._id}>
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column justify-content-between">
                <div>
                  <div style={{ height: "180px", overflow: "hidden", position: "relative" }}>
                    <Link to={`/products/${product._id}`}>
                      <img
                        src={
                          product.images && product.images[0]
                            ? product.images[0]
                            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                        }
                        alt={product.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </Link>
                    <button
                      className="btn btn-sm btn-light rounded-circle position-absolute top-0 end-0 m-2 shadow-xs text-danger"
                      onClick={() => removeFromWishlist(product._id)}
                      title="Remove from wishlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="p-3">
                    <span className="badge bg-light text-muted small text-uppercase mb-1">
                      {product.brand || product.category}
                    </span>
                    <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                      <h6 className="fw-bold text-truncate-2 mb-2" style={{ minHeight: "2.5rem" }}>
                        {product.name}
                      </h6>
                    </Link>

                    <div className="d-flex align-items-center gap-1 text-warning small mb-2">
                      <Star size={13} fill="currentColor" />
                      <span className="text-dark fw-semibold">{product.averageRating || 4.8}</span>
                    </div>

                    <div className="fw-bold text-dark fs-5">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <button
                    className="btn btn-primary w-100 rounded-pill btn-sm text-white d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleMoveToCart(product)}
                    disabled={isMoving || product.stock === 0}
                  >
                    {isMoving ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : product.stock === 0 ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingCart size={15} /> Move to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Wishlist;
