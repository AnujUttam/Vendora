import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  ShoppingCart,
  Heart,
  Check,
  PackageCheck
} from "lucide-react";

function VendorStore() {
  const { vendorId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/vendor/store/${vendorId}`);
        if (res.data.success) {
          setStore(res.data.store);
          setProducts(res.data.products || []);
        }
      } catch (err) {
        console.error("Failed to load store:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [vendorId]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1800);
    } catch (err) {
      alert(err.message || "Please log in to add items to your cart");
    }
  };

  const handleWishlistToggle = async (product) => {
    try {
      await toggleWishlist(product);
    } catch (err) {
      alert(err.message || "Please log in to manage your wishlist");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "70vh" }}>
        <h4>Vendor Store Not Found</h4>
        <p className="text-muted small">This merchant store may be unapproved or inactive.</p>
        <Link to="/products" className="btn btn-primary rounded-pill px-4 text-white">
          Explore Other Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Store Banner */}
      <div
        className="w-100 position-relative"
        style={{
          height: "260px",
          backgroundImage: `url(${store.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)" }}
        />
        <div className="container position-relative h-100 d-flex align-items-end pb-4 text-white">
          <div className="d-flex align-items-center gap-3">
            <img
              src={store.logo || "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=400"}
              alt={store.storeName}
              className="rounded-circle border border-3 border-white shadow-sm object-fit-cover"
              style={{ width: "90px", height: "90px" }}
            />
            <div>
              <div className="d-flex align-items-center gap-2">
                <h2 className="fw-bold mb-0 text-white">{store.storeName}</h2>
                <span className="badge bg-success d-flex align-items-center gap-1 rounded-pill">
                  <ShieldCheck size={13} /> Verified Merchant
                </span>
              </div>
              <p className="text-white-50 small mb-0 mt-1">
                {store.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Store Metadata bar */}
      <div className="bg-white border-bottom py-3 shadow-xs">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex flex-wrap align-items-center gap-4 text-muted small">
            {store.address && (
              <div className="d-flex align-items-center gap-1">
                <MapPin size={15} className="text-primary" />
                <span>{store.address}</span>
              </div>
            )}
            {store.phone && (
              <div className="d-flex align-items-center gap-1">
                <Phone size={15} className="text-primary" />
                <span>{store.phone}</span>
              </div>
            )}
            <div className="d-flex align-items-center gap-1">
              <PackageCheck size={15} className="text-primary" />
              <span>{products.length} Active Listings</span>
            </div>
          </div>

          <Link to="/products" className="btn btn-outline-dark btn-sm rounded-pill">
            ← Marketplace Catalog
          </Link>
        </div>
      </div>

      {/* Products from this vendor */}
      <div className="container py-5" style={{ minHeight: "60vh" }}>
        <h4 className="fw-bold mb-4">Products from {store.storeName}</h4>

        {products.length === 0 ? (
          <div className="card p-5 border-0 shadow-sm rounded-4 text-center my-4">
            <Store size={48} className="text-muted mx-auto mb-2" />
            <h5 className="fw-bold">No products available currently</h5>
            <p className="text-muted small">Check back soon as this merchant restocks their catalog.</p>
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product) => {
              const inWishlist = isInWishlist(product._id);
              const isAdded = addedId === product._id;
              return (
                <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={product._id}>
                  <div className="product-card h-100 d-flex flex-column justify-content-between position-relative">
                    <button
                      className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        zIndex: 2,
                        width: "32px",
                        height: "32px",
                        padding: 0
                      }}
                      onClick={() => handleWishlistToggle(product)}
                      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={16}
                        className={inWishlist ? "text-danger fill-danger" : "text-muted"}
                        style={{ fill: inWishlist ? "#dc3545" : "none" }}
                      />
                    </button>

                    <Link to={`/products/${product._id}`} className="text-decoration-none text-dark">
                      <div className="product-card-img-wrapper">
                        <img
                          src={product.images && product.images[0] ? product.images[0] : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                          alt={product.name}
                          className="product-card-img"
                        />
                      </div>
                      <div className="product-card-body">
                        <span className="product-card-brand">{product.brand || store.storeName}</span>
                        <h3 className="product-card-title text-truncate-2">{product.name}</h3>
                        <div className="product-card-rating">
                          <Star size={14} className="star-filled" />
                          <span>{product.averageRating || 4.5}</span>
                          <span className="text-muted">({product.totalReviews || 12})</span>
                        </div>
                        <div className="product-card-price">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </Link>

                    <div className="p-3 pt-0">
                      <button
                        className={`btn w-100 rounded-pill btn-sm d-flex align-items-center justify-content-center gap-1 ${
                          isAdded ? "btn-success text-white" : "btn-primary text-white"
                        }`}
                        onClick={() => handleAddToCart(product)}
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorStore;
