import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Store,
  Star,
  ShoppingCart,
  Check,
  Tag,
  Heart,
  BadgePercent
} from "lucide-react";

const CATEGORIES = [
  { name: "Electronics", icon: "💻", slug: "electronics" },
  { name: "Fashion", icon: "👕", slug: "fashion" },
  { name: "Home & Living", icon: "🏠", slug: "home-living" },
  { name: "Accessories", icon: "🎒", slug: "accessories" },
  { name: "Beauty", icon: "✨", slug: "beauty" },
  { name: "Sports", icon: "⚽", slug: "sports" }
];

const FEATURED_MERCHANTS = [
  {
    name: "TechHub Electronics",
    category: "Computing & Audio",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=400",
    banner: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800",
    description: "Premier distributor of modern audio, computing accessories, and smart devices."
  },
  {
    name: "Urban Vogue Lifestyle",
    category: "Fashion & Leather Goods",
    rating: 4.8,
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    banner: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
    description: "Contemporary apparel, designer leather goods, and sustainable everyday fashion."
  },
  {
    name: "Nordic Living & Decor",
    category: "Home & Lighting",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
    banner: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    description: "Minimalist Scandinavian home furniture, ceramic tableware, and ambient lighting."
  }
];

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featRes, newRes] = await Promise.all([
          API.get("/products?limit=4&sort=rating"),
          API.get("/products?limit=4&sort=newest")
        ]);

        if (featRes.data.success && featRes.data.products) {
          setFeaturedProducts(featRes.data.products);
        }
        if (newRes.data.success && newRes.data.products) {
          setNewArrivals(newRes.data.products);
        }
      } catch (err) {
        console.warn("Could not load homepage products:", err.message);
      }
    };
    fetchHomeData();
  }, []);

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

  const copyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <span className="hero-tag">
                MULTI-VENDOR MARKETPLACE REIMAGINED
              </span>

              <h1>
                Discover More.
                <br />
                Shop <span>Smarter.</span>
              </h1>

              <p>
                Explore thousands of verified products from independent trusted merchants, with automated split payments, Redis-powered carts, and Elasticsearch discovery.
              </p>

              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link to="/products" className="hero-btn">
                  Explore Marketplace <ArrowRight size={19} />
                </Link>
                <Link to="/vendor/onboarding" className="btn btn-outline-dark rounded-3 px-4 py-3 fw-semibold mt-3">
                  <Store size={18} className="me-1 inline" /> Sell on Vendora
                </Link>
              </div>
            </div>

            <div className="col-lg-6 hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900"
                alt="Shopping collection"
                className="hero-image shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Promo Code Banner */}
      <section className="container my-4">
        <div className="card border-0 bg-primary-subtle text-primary rounded-4 p-4 shadow-xs">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white p-3 rounded-circle shadow-xs">
                <BadgePercent size={24} />
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-dark">Exclusive Marketplace Discount Codes</h5>
                <p className="text-muted small mb-0">Apply promo codes at checkout for instant savings across all vendors.</p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {[
                { code: "WELCOME50", label: "50% OFF up to ₹500" },
                { code: "VENDORA10", label: "10% OFF up to ₹1,000" },
                { code: "FESTIVE20", label: "20% OFF up to ₹2,000" }
              ].map((c) => (
                <button
                  key={c.code}
                  className="btn btn-outline-primary btn-sm rounded-pill fw-semibold d-flex align-items-center gap-1 bg-white"
                  onClick={() => copyCoupon(c.code)}
                  title="Click to copy promo code"
                >
                  <Tag size={13} />
                  <span>{c.code}</span>
                  <span className="text-muted" style={{ fontSize: "11px" }}>({c.label})</span>
                  {copiedCode === c.code && <span className="badge bg-success ms-1">Copied!</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="container category-section">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="text-primary small fw-bold text-uppercase">EXPLORE OUR CURATED CATALOG</span>
            <h2 className="fw-bold mb-0">Shop by Category</h2>
          </div>
          <Link to="/categories" className="text-decoration-none fw-semibold d-flex align-items-center gap-1">
            All Categories <ArrowRight size={16} />
          </Link>
        </div>

        <div className="row g-3">
          {CATEGORIES.map((category) => (
            <div className="col-6 col-md-4 col-lg-2" key={category.name}>
              <Link
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="text-decoration-none text-dark"
              >
                <div className="category-card h-100">
                  <span>{category.icon}</span>
                  <h6>{category.name}</h6>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trending / Featured Marketplace Products */}
      {featuredProducts.length > 0 && (
        <section className="container pb-5">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="text-primary small fw-bold text-uppercase">Top Rated by Shoppers</span>
              <h2 className="fw-bold mb-0">Trending Products</h2>
            </div>
            <Link to="/products" className="text-decoration-none fw-semibold d-flex align-items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
            {featuredProducts.map((product) => {
              const inWishlist = isInWishlist(product._id);
              const primaryImage =
                product.images && product.images[0]
                  ? product.images[0].startsWith("/uploads/")
                    ? `http://localhost:5000${product.images[0]}`
                    : product.images[0]
                  : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";

              return (
                <div key={product._id} className="col">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                    <button
                      className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-xs bg-white"
                      style={{ zIndex: 2, width: "32px", height: "32px", padding: 0 }}
                      onClick={() => handleWishlistToggle(product)}
                      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={15}
                        className={inWishlist ? "text-danger" : "text-muted"}
                        style={{ fill: inWishlist ? "#dc3545" : "none" }}
                      />
                    </button>

                    <div style={{ height: "200px" }} className="bg-light">
                      <Link to={`/products/${product._id}`}>
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </Link>
                    </div>

                    <div className="card-body p-3 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center small text-muted mb-1">
                        <span>{product.brand}</span>
                        <span className="d-flex align-items-center text-warning">
                          <Star size={13} fill="currentColor" /> {product.averageRating?.toFixed(1) || "4.8"}
                        </span>
                      </div>

                      <h6 className="fw-bold mb-2 text-truncate">
                        <Link to={`/products/${product._id}`} className="text-dark text-decoration-none">
                          {product.name}
                        </Link>
                      </h6>

                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                        <h5 className="fw-bold text-dark mb-0">₹{product.price.toLocaleString("en-IN")}</h5>
                        <button
                          className={`btn btn-sm rounded-pill px-3 ${
                            addedId === product._id ? "btn-success text-white" : "btn-primary text-white"
                          }`}
                          onClick={() => handleAddToCart(product)}
                        >
                          {addedId === product._id ? (
                            <><Check size={14} /> Added</>
                          ) : (
                            <><ShoppingCart size={14} /> Add</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently Added Products */}
      {newArrivals.length > 0 && (
        <section className="container pb-5">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="text-primary small fw-bold text-uppercase">Fresh in Catalog</span>
              <h2 className="fw-bold mb-0">Recently Added Products</h2>
            </div>
            <Link to="/products?sort=newest" className="text-decoration-none fw-semibold d-flex align-items-center gap-1">
              Explore New <ArrowRight size={16} />
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
            {newArrivals.map((product) => {
              const inWishlist = isInWishlist(product._id);
              const primaryImage =
                product.images && product.images[0]
                  ? product.images[0].startsWith("/uploads/")
                    ? `http://localhost:5000${product.images[0]}`
                    : product.images[0]
                  : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";

              return (
                <div key={product._id} className="col">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                    <button
                      className="btn btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-xs bg-white"
                      style={{ zIndex: 2, width: "32px", height: "32px", padding: 0 }}
                      onClick={() => handleWishlistToggle(product)}
                      title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={15}
                        className={inWishlist ? "text-danger" : "text-muted"}
                        style={{ fill: inWishlist ? "#dc3545" : "none" }}
                      />
                    </button>

                    <div style={{ height: "200px" }} className="bg-light">
                      <Link to={`/products/${product._id}`}>
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </Link>
                    </div>

                    <div className="card-body p-3 d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center small text-muted mb-1">
                        <span>{product.brand}</span>
                        <span className="badge bg-light text-secondary small">New</span>
                      </div>

                      <h6 className="fw-bold mb-2 text-truncate">
                        <Link to={`/products/${product._id}`} className="text-dark text-decoration-none">
                          {product.name}
                        </Link>
                      </h6>

                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                        <h5 className="fw-bold text-dark mb-0">₹{product.price.toLocaleString("en-IN")}</h5>
                        <button
                          className={`btn btn-sm rounded-pill px-3 ${
                            addedId === product._id ? "btn-success text-white" : "btn-primary text-white"
                          }`}
                          onClick={() => handleAddToCart(product)}
                        >
                          {addedId === product._id ? (
                            <><Check size={14} /> Added</>
                          ) : (
                            <><ShoppingCart size={14} /> Add</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Verified Merchants Showcase */}
      <section className="container pb-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="text-primary small fw-bold text-uppercase">Direct from Independent Sellers</span>
            <h2 className="fw-bold mb-0">Featured Merchant Stores</h2>
          </div>
          <Link to="/vendor/onboarding" className="text-decoration-none fw-semibold d-flex align-items-center gap-1">
            Sell with Us <ArrowRight size={16} />
          </Link>
        </div>

        <div className="row g-4">
          {FEATURED_MERCHANTS.map((m, idx) => (
            <div className="col-md-4" key={idx}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div style={{ height: "130px", overflow: "hidden", position: "relative" }}>
                  <img src={m.banner} alt={m.name} className="w-100 h-100 object-fit-cover" />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  />
                </div>

                <div className="card-body p-4 position-relative pt-0">
                  <div className="d-flex align-items-center gap-3 mb-3" style={{ marginTop: "-30px" }}>
                    <img
                      src={m.logo}
                      alt={m.name}
                      className="rounded-circle border border-3 border-white shadow-sm object-fit-cover"
                      style={{ width: "60px", height: "60px" }}
                    />
                    <div className="pt-4">
                      <h6 className="fw-bold mb-0 text-dark">{m.name}</h6>
                      <span className="badge bg-success-subtle text-success small">
                        <ShieldCheck size={12} className="inline me-1" /> Verified Merchant
                      </span>
                    </div>
                  </div>

                  <p className="text-muted small mb-3">{m.description}</p>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="small text-muted">{m.category}</span>
                    <Link to="/products" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                      View Catalog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Guarantees */}
      <section className="features-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <Truck />
              <h5>Reliable Multi-Vendor Delivery</h5>
              <p>Track your orders seamlessly across independent merchants from checkout to doorstep.</p>
            </div>

            <div className="col-md-4">
              <ShieldCheck />
              <h5>Secure Razorpay Payments</h5>
              <p>Integrated with Razorpay test mode and automated multi-vendor commission distribution.</p>
            </div>

            <div className="col-md-4">
              <Headphones />
              <h5>Verified Quality Standards</h5>
              <p>All merchant applications undergo strict administrative review before publishing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Onboarding Callout Banner */}
      <section className="py-5 bg-dark text-white">
        <div className="container text-center py-4">
          <div className="rounded-circle bg-primary-subtle text-primary p-3 d-inline-block mb-3">
            <Store size={36} />
          </div>
          <h2 className="fw-bold">Ready to Grow Your Business with Vendora?</h2>
          <p className="text-light opacity-75 max-w-lg mx-auto mb-4">
            Join hundreds of vetted merchants. Upload inventory to S3, manage fulfillment lifecycles, and receive instant payouts with zero setup fees.
          </p>
          <Link to="/vendor/onboarding" className="btn btn-primary rounded-pill px-5 py-3 fw-bold text-white shadow-sm">
            Apply for Merchant Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
