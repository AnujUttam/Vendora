import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get("/wishlist");
      if (res.data.success && res.data.wishlist) {
        setWishlist(res.data.wishlist);
      }
    } catch (err) {
      console.warn("Could not load wishlist:", err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to manage your wishlist");
    }
    const productId = product._id || product;
    const res = await API.post(`/wishlist/toggle/${productId}`);
    if (res.data.success) {
      if (res.data.action === "added") {
        setWishlist((prev) => [...prev, product]);
      } else {
        setWishlist((prev) => prev.filter((p) => (p._id || p) !== productId));
      }
      return res.data;
    }
  };

  const removeFromWishlist = async (productId) => {
    const res = await API.delete(`/wishlist/${productId}`);
    if (res.data.success) {
      setWishlist((prev) => prev.filter((p) => p._id !== productId));
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => (p._id || p) === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        loading,
        fetchWishlist,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
