import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  Store,
  Star,
  ShoppingCart,
  Check
} from "lucide-react";

const categories = [
  { name: "Electronics", icon: "💻" },
  { name: "Fashion", icon: "👕" },
  { name: "Home & Living", icon: "🏠" },
  { name: "Accessories", icon: "🎒" },
  { name: "Beauty", icon: "✨" },
  { name: "Sports", icon: "⚽" }
];

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await API.get("/products?limit=4&sort=rating");
        if (res.data.success && res.data.products) {
          setFeaturedProducts(res.data.products);
        }
      } catch (err) {
        console.warn("Could not load featured products:", err.message);
      }
    };
    fetchFeatured();
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

      {/* Category Section */}
      <section className="container category-section">
        <div className="section-heading">
          <div>
            <span>EXPLORE OUR CURATED CATALOG</span>
            <h2>Shop by Category</h2>
          </div>
        </div>

        <div className="row g-3">
          {categories.map((category) => (
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

      {/* Featured Marketplace Products */}
      {featuredProducts.length > 0 && (
        <section className="container pb-5">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="text-primary small fw-bold text-uppercase">Top Rated by Customers</span>
              <h2 className="fw-bold mb-0">Featured Products</h2>
            </div>
            <Link to="/products" className="text-decoration-none fw-semibold d-flex align-items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
            {featuredProducts.map((product) => {
              const primaryImage =
                product.images && product.images[0]
                  ? product.images[0].startsWith("/uploads/")
                    ? `http://localhost:5000${product.images[0]}`
                    : product.images[0]
                  : "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";

              return (
                <div key={product._id} className="col">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
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
                          <Star size={13} fill="currentColor" /> {product.averageRating?.toFixed(1) || "5.0"}
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
              <h5>Secure Test Gateway</h5>
              <p>Integrated with Razorpay test mode and automated platform commission distribution.</p>
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
