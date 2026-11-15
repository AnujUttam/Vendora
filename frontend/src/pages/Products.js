import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  Search,
  SlidersHorizontal,
  Star,
  ShoppingCart,
  Check,
  RefreshCw,
  Store,
  Heart
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Accessories",
  "Beauty",
  "Sports"
];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [addedId, setAddedId] = useState(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleWishlistToggle = async (product) => {
    try {
      await toggleWishlist(product);
    } catch (err) {
      alert(err.message || "Please log in to manage your wishlist");
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category && category !== "All") params.category = category;
      if (sort) params.sort = sort;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await API.get("/products", { params });
      if (res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Fetch products failed:", err);
      setError("Unable to load marketplace products. Please check back shortly.");
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    if (cat === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      setAddedId(product._id);
      setTimeout(() => setAddedId(null), 1800);
    } catch (err) {
      alert(err.message || "Please log in to add items to your cart");
    }
  };

  return (
    <div className="container py-4" style={{ minHeight: "80vh" }}>
      {/* Search & Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Marketplace Catalog</h2>
          <p className="text-muted small mb-0">
            Browse verified products sold by independent vetted merchants
          </p>
        </div>

        {/* Sort & Quick Filter */}
        <div className="d-flex align-items-center gap-2">
          <SlidersHorizontal size={18} className="text-muted" />
          <select
            className="form-select form-select-sm"
            style={{ width: "190px" }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-light">
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="d-flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm rounded-pill px-3 ${
                  category === cat
                    ? "btn-dark text-white fw-semibold"
                    : "btn-outline-secondary bg-white"
                }`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
            <input
              type="number"
              className="form-control form-control-sm bg-white"
              style={{ width: "95px" }}
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-muted">-</span>
            <input
              type="number"
              className="form-control form-control-sm bg-white"
              style={{ width: "95px" }}
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={fetchProducts}
              title="Filter"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-warning py-3 rounded-3 d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-dark" onClick={fetchProducts}>
            <RefreshCw size={14} className="me-1" /> Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading products...</span>
          </div>
          <p className="text-muted mt-2 small">Searching marketplace inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm rounded-4">
          <div className="py-4">
            <Search size={44} className="text-muted mb-3" />
            <h5 className="fw-bold">No Products Found</h5>
            <p className="text-muted small">
              Try adjusting your category, search keywords, or price filter.
            </p>
            <button
              className="btn btn-outline-dark btn-sm rounded-pill px-4"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setMinPrice("");
                setMaxPrice("");
                setSearchParams({});
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        /* Products Grid */
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {products.map((product) => {
            const primaryImage =
              product.images && product.images[0]
                ? product.images[0].startsWith("/uploads/")
                  ? `http://localhost:5000${product.images[0]}`
                  : product.images[0]
                : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";

            return (
              <div key={product._id} className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden product-card transition">
                  <div className="position-relative bg-light" style={{ height: "230px" }}>
                    <Link to={`/products/${product._id}`}>
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-100 h-100 object-fit-cover"
                        loading="lazy"
                      />
                    </Link>
                    <span
                      className="badge bg-white text-dark shadow-sm position-absolute top-0 start-0 m-2 rounded-pill px-2 py-1 small"
                      style={{ fontSize: "11px" }}
                    >
                      {product.category}
                    </span>
                    <button
                      className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-xs bg-white"
                      style={{ zIndex: 2, width: "32px", height: "32px", padding: 0 }}
                      onClick={() => handleWishlistToggle(product)}
                      title={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={15}
                        className={isInWishlist(product._id) ? "text-danger" : "text-muted"}
                        style={{ fill: isInWishlist(product._id) ? "#dc3545" : "none" }}
                      />
                    </button>
                  </div>

                  <div className="card-body p-3 d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted small text-truncate" style={{ maxWidth: "150px" }}>
                        <Store size={12} className="me-1 text-primary" />
                        {product.vendorId?.storeName || product.brand || "Verified Vendor"}
                      </span>
                      <div className="d-flex align-items-center text-warning small">
                        <Star size={13} fill="currentColor" />
                        <span className="ms-1 fw-semibold text-dark">
                          {product.averageRating ? product.averageRating.toFixed(1) : "New"}
                        </span>
                      </div>
                    </div>

                    <h6 className="card-title fw-bold mb-2 text-truncate-2">
                      <Link
                        to={`/products/${product._id}`}
                        className="text-dark text-decoration-none"
                      >
                        {product.name}
                      </Link>
                    </h6>

                    <p className="card-text text-muted small text-truncate-2 mb-3 flex-grow-1">
                      {product.description}
                    </p>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
                      <div>
                        <div className="text-muted small" style={{ fontSize: "11px" }}>Price</div>
                        <h5 className="fw-bold text-dark mb-0">₹{product.price.toLocaleString("en-IN")}</h5>
                      </div>

                      <button
                        className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1 ${
                          addedId === product._id
                            ? "btn-success text-white"
                            : "btn-primary text-white"
                        }`}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        {addedId === product._id ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : product.stock <= 0 ? (
                          "Out of Stock"
                        ) : (
                          <>
                            <ShoppingCart size={14} /> Add
                          </>
                        )}
                      </button>
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

export default Products;
