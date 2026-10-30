
import React from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones
} from "lucide-react";

const categories = [
  { name: "Electronics", icon: "💻" },
  { name: "Fashion", icon: "👕" },
  { name: "Home & Living", icon: "🏠" },
  { name: "Beauty", icon: "✨" },
  { name: "Sports", icon: "⚽" },
  { name: "Accessories", icon: "🎒" }
];

function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <span className="hero-tag">
                YOUR MARKETPLACE, REIMAGINED
              </span>

              <h1>
                Discover More.
                <br />
                Shop <span>Smarter.</span>
              </h1>

              <p>
                Explore thousands of products from
                trusted sellers, all in one place.
              </p>

              <a href="/products" className="hero-btn">
                Explore Products
                <ArrowRight size={19} />
              </a>
            </div>

            <div className="col-lg-6 hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900"
                alt="Shopping collection"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container category-section">
        <div className="section-heading">
          <div>
            <span>EXPLORE OUR COLLECTION</span>
            <h2>Shop by Category</h2>
          </div>
        </div>

        <div className="row g-3">
          {categories.map((category) => (
            <div className="col-6 col-md-4 col-lg-2"
              key={category.name}>
              <div className="category-card">
                <span>{category.icon}</span>
                <h6>{category.name}</h6>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <Truck />
              <h5>Reliable Delivery</h5>
              <p>Track your orders from checkout to doorstep.</p>
            </div>

            <div className="col-md-4">
              <ShieldCheck />
              <h5>Secure Shopping</h5>
              <p>Shop confidently with secure checkout.</p>
            </div>

            <div className="col-md-4">
              <Headphones />
              <h5>Customer Support</h5>
              <p>We're here to help whenever you need us.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
