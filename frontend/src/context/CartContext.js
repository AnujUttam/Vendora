import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    discountAmount: 0,
    totalAmount: 0,
    coupon: null
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, coupon: null });
      return;
    }
    try {
      setLoading(true);
      const res = await API.get("/cart");
      if (res.data.success && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (err) {
      console.warn("Unable to fetch cart:", err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to add items to your cart");
    }
    const res = await API.post("/cart/add", { productId, quantity });
    if (res.data.success && res.data.cart) {
      setCart(res.data.cart);
      return res.data;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    const res = await API.put("/cart/item", { productId, quantity });
    if (res.data.success && res.data.cart) {
      setCart(res.data.cart);
    }
  };

  const removeItem = async (productId) => {
    const res = await API.delete(`/cart/item/${productId}`);
    if (res.data.success && res.data.cart) {
      setCart(res.data.cart);
    }
  };

  const clearCart = async () => {
    await API.delete("/cart/clear");
    setCart({ items: [], subtotal: 0, discountAmount: 0, totalAmount: 0, coupon: null });
  };

  const applyCoupon = async (code) => {
    const res = await API.post("/cart/apply-coupon", { code });
    if (res.data.success && res.data.cart) {
      setCart(res.data.cart);
      return res.data.message;
    }
  };

  const removeCoupon = async () => {
    const res = await API.delete("/cart/remove-coupon");
    if (res.data.success && res.data.cart) {
      setCart(res.data.cart);
    }
  };

  const cartCount = cart.items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
