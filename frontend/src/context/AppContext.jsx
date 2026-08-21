import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// UUID v4 pattern — used to detect stale prod-* IDs in localStorage
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (id) => UUID_RE.test(id);

// ---------------------------------------------------------------------------
// Fallback mock products (display-only, never sent to checkout)
// These are shown only when the backend is unreachable.
// ---------------------------------------------------------------------------
const initialProducts = [
  {
    id: 'prod-1',
    name: 'Organic Heirloom Tomatoes',
    description: 'Juicy, vine-ripened multi-color heirloom tomatoes. Grown using 100% organic practices. Perfect for salads, sauces, or caprese.',
    price: 4.99,
    unit: 'lb',
    quantity: 45,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.8,
    reviewsCount: 12
  },
  {
    id: 'prod-2',
    name: 'Fresh Honeycrisp Apples',
    description: 'Crisp, sweet, and slightly tart Honeycrisp apples freshly picked from our orchard. Excellent for snacking and baking.',
    price: 3.49,
    unit: 'lb',
    quantity: 120,
    category: 'Fruits',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-2',
    farmerName: 'Sunny Ridge Orchards',
    rating: 4.9,
    reviewsCount: 24
  },
  {
    id: 'prod-3',
    name: 'Raw Wildflower Honey',
    description: '100% pure, unfiltered wildflower honey. Harvested from our happy bees. Natural sweetener full of antioxidants.',
    price: 9.99,
    unit: 'jar (16oz)',
    quantity: 30,
    category: 'Honey & Preserves',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.7,
    reviewsCount: 8
  },
  {
    id: 'prod-4',
    name: 'Farm-Fresh Free-Range Brown Eggs',
    description: 'One dozen large brown eggs from free-range chickens. Fed with organic, non-GMO grains. Rich orange yolks.',
    price: 5.99,
    unit: 'dozen',
    quantity: 18,
    category: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-3',
    farmerName: 'Oakwood Pastures',
    rating: 5.0,
    reviewsCount: 19
  },
  {
    id: 'prod-5',
    name: 'Fresh Goat Milk Cheese (Chevre)',
    description: 'Creamy, tangy, and soft goat milk cheese. Infused with fresh garden herbs. Made in small batches.',
    price: 7.50,
    unit: 'pack (6oz)',
    quantity: 25,
    category: 'Dairy & Eggs',
    image: 'https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-3',
    farmerName: 'Oakwood Pastures',
    rating: 4.6,
    reviewsCount: 6
  },
  {
    id: 'prod-6',
    name: 'Sweet Sugar Snap Peas',
    description: 'Crisp and sweet sugar snap peas. Eat them raw, in stir-fries, or steamed. Children love them!',
    price: 3.99,
    unit: 'lb',
    quantity: 40,
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1589135799797-df004122cc77?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.5,
    reviewsCount: 4
  }
];

const initialOrders = [
  {
    id: 'ord-101',
    customerId: 'cust-1',
    customerName: 'Sarah Jenkins',
    deliveryAddress: '128 Birch Ln, Seattle, WA 98101',
    date: '2026-08-12T14:32:00Z',
    items: [
      { productId: 'prod-1', name: 'Organic Heirloom Tomatoes', price: 4.99, quantity: 2, unit: 'lb' },
      { productId: 'prod-4', name: 'Farm-Fresh Free-Range Brown Eggs', price: 5.99, quantity: 1, unit: 'dozen' }
    ],
    totalAmount: 15.97,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'x402 Protocol'
  },
  {
    id: 'ord-102',
    customerId: 'cust-1',
    customerName: 'Sarah Jenkins',
    deliveryAddress: '128 Birch Ln, Seattle, WA 98101',
    date: '2026-08-14T09:15:00Z',
    items: [
      { productId: 'prod-2', name: 'Fresh Honeycrisp Apples', price: 3.49, quantity: 5, unit: 'lb' }
    ],
    totalAmount: 17.45,
    status: 'In Transit',
    paymentStatus: 'Paid',
    paymentMethod: 'x402 Protocol'
  },
  {
    id: 'ord-103',
    customerId: 'cust-2',
    customerName: 'Alex Riverstone',
    deliveryAddress: '405 Pine St, Portland, OR 97201',
    date: '2026-08-15T08:00:00Z',
    items: [
      { productId: 'prod-3', name: 'Raw Wildflower Honey', price: 9.99, quantity: 2, unit: 'jar (16oz)' },
      { productId: 'prod-5', name: 'Fresh Goat Milk Cheese (Chevre)', price: 7.50, quantity: 1, unit: 'pack (6oz)' }
    ],
    totalAmount: 27.48,
    status: 'Pending',
    paymentStatus: 'Paid',
    paymentMethod: 'x402 Protocol'
  }
];

const initialReviews = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    customerName: 'Sarah Jenkins',
    rating: 5,
    comment: 'These are the best tomatoes I have had in years! Absolutely full of flavor and fresh.',
    date: '2026-08-13T10:00:00Z'
  },
  {
    id: 'rev-2',
    productId: 'prod-4',
    customerName: 'Sarah Jenkins',
    rating: 5,
    comment: 'Rich, orange yolks. You can tell these chickens are raised well!',
    date: '2026-08-13T10:15:00Z'
  },
  {
    id: 'rev-3',
    productId: 'prod-2',
    customerName: 'David Lee',
    rating: 4,
    comment: 'Very sweet and crispy. Shipping was fast too. Will order again.',
    date: '2026-08-11T16:45:00Z'
  }
];

// ---------------------------------------------------------------------------
// Helper: clear cart items that have stale prod-* IDs so they can't reach
// checkout. Called once on startup and after product load.
// ---------------------------------------------------------------------------
function evictStaleProdIdsFromCart() {
  try {
    const raw = localStorage.getItem('farmfresh_cart');
    if (!raw) return;
    const items = JSON.parse(raw);
    const clean = items.filter((item) => isUUID(item.id));
    if (clean.length !== items.length) {
      localStorage.setItem('farmfresh_cart', JSON.stringify(clean));
    }
  } catch {
    // corrupted — ignore
  }
}

export const AppProvider = ({ children }) => {
  // -------------------------------------------------------------------------
  // Auth state
  // -------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState({
    id: 'user-1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: 'customer'
  });

  // -------------------------------------------------------------------------
  // Product state — start with mock fallback, replace ASAP from backend API
  // -------------------------------------------------------------------------
  const [products, setProducts] = useState(initialProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);

  // Load products from backend API. Falls back to mock if unreachable.
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      const apiProducts = (data.products || []).map((p) => ({
        id: p.id,
        farmerId: p.farmerId || p.farmer_id || '',
        farmerName: p.farmerName || p.farmer_name || 'Local Farmer',
        name: p.name,
        description: p.description || '',
        price: Number(p.price ?? 0),
        unit: p.unit || 'lb',
        category: p.category || 'Vegetables',
        quantity: Number(p.quantity ?? 0),
        image: p.image || p.image_url || '',
        rating: Number(p.rating ?? 5.0),
        reviewsCount: Number(p.reviewsCount ?? p.reviews_count ?? 0)
      }));
      if (apiProducts.length > 0) {
        setProducts(apiProducts);
        // Evict any stale cart items now that we have real UUIDs
        evictStaleProdIdsFromCart();
      }
    } catch (err) {
      console.warn('[AppContext] Could not load products from backend:', err.message);
      setProductError('Could not connect to backend. Showing preview catalog.');
      // Keep mock products as fallback — they are display-only
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load products on mount and on Supabase session ready
  useEffect(() => {
    // Evict stale prod-* IDs from cart immediately on startup
    evictStaleProdIdsFromCart();
    loadProducts();
  }, [loadProducts]);

  // -------------------------------------------------------------------------
  // Supabase auth hydration (user profile)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadUserProfile = async (user) => {
      if (!user) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && profile && isMounted) {
        setCurrentUser({
          id: profile.id,
          name: profile.full_name || user.email || 'FarmFresh User',
          email: user.email || '',
          role: profile.role || 'customer'
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        loadUserProfile(session.user);
      } else if (!session && isMounted) {
        setCurrentUser({ id: 'user-1', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'customer' });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('farmfresh_orders');
      return saved ? JSON.parse(saved) : initialOrders;
    } catch { return initialOrders; }
  });

  useEffect(() => {
    localStorage.setItem('farmfresh_orders', JSON.stringify(orders));
  }, [orders]);

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('farmfresh_reviews');
      return saved ? JSON.parse(saved) : initialReviews;
    } catch { return initialReviews; }
  });

  useEffect(() => {
    localStorage.setItem('farmfresh_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // -------------------------------------------------------------------------
  // normalizeOrder (closure over currentUser is fine — re-created each render)
  // -------------------------------------------------------------------------
  const normalizeOrder = (order, fallbackCustomerName = 'Customer') => ({
    id: order.id,
    date: order.created_at || order.date || new Date().toISOString(),
    customerId: order.customer_id || order.customerId || currentUser?.id,
    customerName: order.customer_name || order.customerName || fallbackCustomerName,
    deliveryAddress: order.delivery_address || order.deliveryAddress || '',
    status: order.status || 'Pending',
    paymentStatus: order.payment_status || order.paymentStatus || 'Paid',
    paymentMethod: order.payment_method || order.paymentMethod || 'x402 Protocol',
    totalAmount: Number(order.total_amount ?? order.totalAmount ?? 0),
    items: (order.items || []).map((item) => ({
      productId: item.product_id || item.productId,
      name: item.name || 'Product',
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      unit: item.unit || ''
    }))
  });

  // -------------------------------------------------------------------------
  // Product actions — all go through the backend API so IDs are real UUIDs
  // -------------------------------------------------------------------------
  const addProduct = async (productData) => {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity, 10),
        unit: productData.unit || 'lb',
        category: productData.category,
        imageUrl: productData.image || '',
        // If the current user is a real UUID farmer, use their ID
        farmerId: isUUID(currentUser?.id) ? currentUser.id : undefined
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    // Backend returns the product with a real UUID — add it to local state
    setProducts((prev) => [data.product, ...prev]);
    return data.product;
  };

  const updateProduct = async (id, updatedData) => {
    // If the ID is a real UUID, persist to backend; otherwise update locally only
    if (isUUID(id)) {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedData.name,
          description: updatedData.description,
          price: parseFloat(updatedData.price),
          quantity: parseInt(updatedData.quantity, 10),
          unit: updatedData.unit,
          category: updatedData.category,
          imageUrl: updatedData.image || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
      return data.product;
    }
    // Fallback for legacy mock IDs (display only)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updatedData, price: parseFloat(updatedData.price), quantity: parseInt(updatedData.quantity, 10) }
          : p
      )
    );
  };

  const deleteProduct = async (id) => {
    if (isUUID(id)) {
      const res = await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // -------------------------------------------------------------------------
  // Order actions
  // -------------------------------------------------------------------------
  const addOrder = async (orderData, { paymentFetch } = {}) => {
    const isDemoId = ['user-1', 'cust-1', 'farm-1', 'admin-1'].includes(currentUser?.id);
    if (!currentUser?.id || isDemoId) {
      throw new Error('Please log in to place an order.');
    }

    // Validate all product IDs are real UUIDs before sending
    const items = orderData.items || [];
    const invalidItems = items.filter((item) => !isUUID(item.productId));
    if (invalidItems.length > 0) {
      throw new Error(
        `Cart contains products not loaded from the database (${invalidItems.map((i) => i.productId).join(', ')}). Please clear your cart and add products again from the shop.`
      );
    }

    const payload = {
      customerId: currentUser?.id,
      ordersName: orderData.ordersName || `Order by ${currentUser?.name || 'Customer'}`,
      deliveryAddress: orderData.deliveryAddress || '',
      contactPlace: orderData.contactPlace || '',
      paymentMethod: orderData.paymentMethod || 'x402 Protocol (Algorand)',
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity ?? 1)
      }))
    };

    const doFetch = paymentFetch || fetch;

    const response = await doFetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || 'Unable to place order');
    }

    const createdOrder = normalizeOrder(result.order, currentUser?.name || 'Customer');
    setOrders((prev) => [createdOrder, ...prev]);

    // Deduct quantities from local product state
    items.forEach((item) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === item.productId
            ? { ...p, quantity: Math.max(0, p.quantity - Number(item.quantity ?? 1)) }
            : p
        )
      );
    });

    return createdOrder;
  };

  const updateOrderStatus = async (id, status) => {
    const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error || 'Unable to update order status');
    const updatedOrder = normalizeOrder(result.order, currentUser?.name || 'Customer');
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o)));
    return updatedOrder;
  };

  // -------------------------------------------------------------------------
  // Review actions
  // -------------------------------------------------------------------------
  const addReview = (reviewData) => {
    const newReview = {
      id: `rev-${Date.now()}`,
      customerName: currentUser.name,
      date: new Date().toISOString(),
      ...reviewData
    };
    setReviews((prev) => [newReview, ...prev]);
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === reviewData.productId) {
          const productReviews = [newReview, ...reviews.filter((r) => r.productId === p.id)];
          const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
          return {
            ...p,
            rating: parseFloat((totalRating / productReviews.length).toFixed(1)),
            reviewsCount: productReviews.length
          };
        }
        return p;
      })
    );
  };

  const deleteReview = (id) => {
    const reviewToDelete = reviews.find((r) => r.id === id);
    if (!reviewToDelete) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === reviewToDelete.productId) {
          const productReviews = reviews.filter((r) => r.productId === p.id && r.id !== id);
          const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
          return {
            ...p,
            rating: productReviews.length > 0 ? parseFloat((totalRating / productReviews.length).toFixed(1)) : 5.0,
            reviewsCount: productReviews.length
          };
        }
        return p;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        products,
        loadingProducts,
        productError,
        loadProducts,
        orders,
        reviews,
        currentUser,
        setCurrentUser,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        addReview,
        deleteReview
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
