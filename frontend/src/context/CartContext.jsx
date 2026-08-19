import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppContext } from './AppContext';

export const CartContext = createContext();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CartProvider = ({ children }) => {
  const { products, productsHydrated } = useContext(AppContext);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('farmfresh_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('farmfresh_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!productsHydrated) return;

    const validProductIds = new Set(products.map((product) => product.id));
    setCartItems((prevItems) => {
      const currentItems = prevItems.filter(
        (item) => UUID_PATTERN.test(item.id) && validProductIds.has(item.id)
      );
      return currentItems.length === prevItems.length ? prevItems : currentItems;
    });
  }, [products, productsHydrated]);

  const addToCart = (product, quantity = 1) => {
    if (
      !productsHydrated ||
      !UUID_PATTERN.test(product.id) ||
      !products.some((catalogProduct) => catalogProduct.id === product.id)
    ) {
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Limit to available stock
        const newQty = Math.min(product.quantity, existingItem.cartQuantity + quantity);
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: newQty } : item
        );
      } else {
        const newQty = Math.min(product.quantity, quantity);
        return [...prevItems, { ...product, cartQuantity: newQty }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId) {
          const maxQty = item.quantity; // product quantity in stock
          return { ...item, cartQuantity: Math.min(maxQty, quantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );

  const cartCount = cartItems.reduce(
    (count, item) => count + item.cartQuantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
