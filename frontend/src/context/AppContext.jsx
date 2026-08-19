import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { productService } from '../services/productService';

export const AppContext = createContext();

// Seed data
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

const normalizeSupabaseProduct = (product) => ({
  id: product.id,
  farmerId: product.farmer_id || product.farmerId || 'farm-1',
  farmerName: product.farmer_name || product.farmerName || 'Local Farmer',
  name: product.name,
  description: product.description || '',
  price: Number(product.price ?? 0),
  unit: product.unit || 'lb',
  category: product.category || 'Vegetables',
  quantity: Number(product.quantity ?? 0),
  image: product.image_url || product.image || '',
  rating: Number(product.rating ?? 5.0),
  reviewsCount: Number(product.reviews_count ?? 0)
});

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('farmfresh_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });
  const [productsHydrated, setProductsHydrated] = useState(false);

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

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('farmfresh_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('farmfresh_reviews');
    return saved ? JSON.parse(saved) : initialReviews;
  });

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    const hydrateSupabaseContext = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profileError && profile && isMounted) {
            setCurrentUser({
              id: profile.id,
              name: profile.full_name || session.user.email || 'FarmFresh User',
              email: session.user.email || '',
              role: profile.role || 'customer'
            });
          }
        }

        const { data: supabaseProducts, error: productsError } = await supabase
          .from('products')
          .select('id, farmer_id, name, description, price, unit, category, quantity, image_url');

        if (productsError) {
          console.error('Failed to load Supabase products:', productsError.message);
          return;
        }

        if (isMounted) {
          const mappedProducts = (supabaseProducts || []).map(normalizeSupabaseProduct);
          setProducts(mappedProducts);
          localStorage.setItem('farmfresh_products', JSON.stringify(mappedProducts));
          setProductsHydrated(true);
        }
      } catch (error) {
        console.error('Supabase hydration failed:', error);
      }
    };

    hydrateSupabaseContext();
    return () => { isMounted = false; };
  }, []);

  // Current user role switcher (for previewing the app features)
  const [currentUser, setCurrentUser] = useState({
    id: 'user-1',
    name: 'Sarah Jenkins',
    email: 'sarah@example.com',
    role: 'customer' // 'customer', 'farmer', or 'admin'
  });

  // Persist state in localStorage
  useEffect(() => {
    localStorage.setItem('farmfresh_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('farmfresh_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('farmfresh_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Product actions
  const addProduct = async (productData) => {
    const createdProduct = await productService.createProduct({
      ...productData,
      farmerId: currentUser?.id
    });
    const normalizedProduct = normalizeSupabaseProduct(createdProduct);

    setProducts((prev) => [normalizedProduct, ...prev]);
    return normalizedProduct;
  };

  const updateProduct = (id, updatedData) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedData, price: parseFloat(updatedData.price), quantity: parseInt(updatedData.quantity) } : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Order actions
  const addOrder = async (orderData, { paymentFetch } = {}) => {
    const isDemoId = ['user-1', 'cust-1', 'farm-1', 'admin-1'].includes(currentUser?.id);

    if (!currentUser?.id || isDemoId) {
      throw new Error('Please log in to place an order.');
    }

    const payload = {
      customerId: currentUser?.id,
      ordersName: orderData.ordersName || `Order by ${currentUser?.name || 'Customer'}`,
      deliveryAddress: orderData.deliveryAddress || '',
      contactPlace: orderData.contactPlace || '',
      paymentMethod: orderData.paymentMethod || 'x402 Protocol (Algorand)',
      items: (orderData.items || []).map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity ?? 1)
      }))
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const doFetch = paymentFetch || fetch;

    try {
      const response = await doFetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to place order');
      }

      const createdOrder = normalizeOrder(result.order, currentUser?.name || 'Customer');

      setOrders((prev) => [createdOrder, ...prev]);
      localStorage.setItem('farmfresh_orders', JSON.stringify([createdOrder, ...orders]));

      // Deduct quantities from products
      (orderData.items || []).forEach((item) => {
        setProducts((prevProducts) =>
          prevProducts.map((p) => {
            if (p.id === item.productId) {
              return { ...p, quantity: Math.max(0, p.quantity - Number(item.quantity ?? 1)) };
            }
            return p;
          })
        );
      });

      return createdOrder;
    } catch (error) {
      console.error('Add order failed:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Unable to update order status');
      }

      const updatedOrder = normalizeOrder(result.order, currentUser?.name || 'Customer');
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o))
      );
      localStorage.setItem('farmfresh_orders', JSON.stringify(orders.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o))));

      return updatedOrder;
    } catch (error) {
      console.error('Update order status failed:', error);
      throw error;
    }
  };

  // Review actions
  const addReview = (reviewData) => {
    const newReview = {
      id: `rev-${Date.now()}`,
      customerName: currentUser.name,
      date: new Date().toISOString(),
      ...reviewData
    };
    setReviews((prev) => [newReview, ...prev]);

    // Recalculate average rating and reviewsCount for the product
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === reviewData.productId) {
          const productReviews = [newReview, ...reviews.filter((r) => r.productId === p.id)];
          const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
          const newAvgRating = parseFloat((totalRating / productReviews.length).toFixed(1));
          return {
            ...p,
            rating: newAvgRating,
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
          const newAvgRating = productReviews.length > 0 ? parseFloat((totalRating / productReviews.length).toFixed(1)) : 5.0;
          return {
            ...p,
            rating: newAvgRating,
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
        productsHydrated,
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
