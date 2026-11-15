import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import {
  ArrowRight,
  Package,
  Laptop,
  Shirt,
  Home,
  Watch,
  Sparkles,
  Activity
} from "lucide-react";

const ICON_MAP = {
  Laptop: Laptop,
  Shirt: Shirt,
  Home: Home,
  Watch: Watch,
  Sparkles: Sparkles,
  Activity: Activity,
  Package: Package
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await API.get("/categories");
        if (res.data.success && res.data.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.warn("Using default categories:", err.message);
        setCategories([
          { name: "Electronics", slug: "electronics", description: "Audio, compute, accessories and smart devices", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", productCount: 12, icon: "Laptop" },
          { name: "Fashion", slug: "fashion", description: "Designer apparel, casual wear, shoes, and luxury bags", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", productCount: 8, icon: "Shirt" },
          { name: "Home & Living", slug: "home-living", description: "Modern furniture, ambient lighting, and artisan decor", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800", productCount: 6, icon: "Home" },
          { name: "Accessories", slug: "accessories", description: "Premium backpacks, sunglasses, wallets, and daily tech gear", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", productCount: 5, icon: "Watch" },
          { name: "Beauty", slug: "beauty", description: "Organic skincare, luxury fragrances, and wellness products", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800", productCount: 4, icon: "Sparkles" },
          { name: "Sports", slug: "sports", description: "Athleisure, workout equipment, gym essentials, and footwear", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800", productCount: 7, icon: "Activity" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="text-center mb-5 max-w-lg mx-auto">
        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2">
          CURATED DIRECTORY
        </span>
        <h2 className="fw-bold mb-2">Explore Product Categories</h2>
        <p className="text-muted small">
          Discover handpicked collections across multiple domains offered by independent verified merchants
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="row g-4">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Package;
            return (
              <div className="col-md-6 col-lg-4" key={cat._id || cat.slug}>
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative group hover-lift transition-all">
                  <div style={{ height: "200px", overflow: "hidden", position: "relative" }}>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-100 h-100 object-fit-cover"
                      style={{ transition: "transform 0.4s ease" }}
                    />
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)"
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 p-3 text-white">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="bg-white text-dark p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                          <IconComponent size={18} />
                        </div>
                        <h4 className="fw-bold mb-0">{cat.name}</h4>
                      </div>
                      <span className="badge bg-light text-dark rounded-pill small">
                        {cat.productCount} {cat.productCount === 1 ? "Listing" : "Listings"}
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <p className="text-muted small mb-3">
                      {cat.description || "Discover verified vendor items in this curated category."}
                    </p>

                    <div>
                      <Link
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        className="btn btn-outline-primary btn-sm rounded-pill w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                      >
                        Browse {cat.name} <ArrowRight size={15} />
                      </Link>
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

export default Categories;
