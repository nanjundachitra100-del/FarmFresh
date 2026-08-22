import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AppContext = createContext();

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

// UUID v4 pattern
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUUID = (id) =>
  typeof id === 'string' && UUID_RE.test(id);

// ---------------------------------------------------------------------------
// Fallback mock products
// ---------------------------------------------------------------------------

const initialProducts = [
  {
    id: 'prod-1',
    name: 'Organic Heirloom Tomatoes',
    description:
      'Juicy, vine-ripened multi-color heirloom tomatoes. Grown using 100% organic practices. Perfect for salads, sauces, or caprese.',
    price: 4.99,
    unit: 'lb',
    quantity: 45,
    category: 'Vegetables',
    image:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.8,
    reviewsCount: 12
  },
  {
    id: 'prod-2',
    name: 'Fresh Honeycrisp Apples',
    description:
      'Crisp, sweet, and slightly tart Honeycrisp apples freshly picked from our orchard. Excellent for snacking and baking.',
    price: 3.49,
    unit: 'lb',
    quantity: 120,
    category: 'Fruits',
    image:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-2',
    farmerName: 'Sunny Ridge Orchards',
    rating: 4.9,
    reviewsCount: 24
  },
  {
    id: 'prod-3',
    name: 'Raw Wildflower Honey',
    description:
      '100% pure, unfiltered wildflower honey. Harvested from our happy bees. Natural sweetener full of antioxidants.',
    price: 9.99,
    unit: 'jar (16oz)',
    quantity: 30,
    category: 'Honey & Preserves',
    image:
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.7,
    reviewsCount: 8
  },
  {
    id: 'prod-4',
    name: 'Farm-Fresh Free-Range Brown Eggs',
    description:
      'One dozen large brown eggs from free-range chickens. Fed with organic, non-GMO grains. Rich orange yolks.',
    price: 5.99,
    unit: 'dozen',
    quantity: 18,
    category: 'Dairy & Eggs',
    image:
      'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-3',
    farmerName: 'Oakwood Pastures',
    rating: 5.0,
    reviewsCount: 19
  },
  {
    id: 'prod-5',
    name: 'Fresh Goat Milk Cheese (Chevre)',
    description:
      'Creamy, tangy, and soft goat milk cheese. Infused with fresh garden herbs. Made in small batches.',
    price: 7.5,
    unit: 'pack (6oz)',
    quantity: 25,
    category: 'Dairy & Eggs',
    image:
      'https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-3',
    farmerName: 'Oakwood Pastures',
    rating: 4.6,
    reviewsCount: 6
  },
  {
    id: 'prod-6',
    name: 'Sweet Sugar Snap Peas',
    description:
      'Crisp and sweet sugar snap peas. Eat them raw, in stir-fries, or steamed. Children love them!',
    price: 3.99,
    unit: 'lb',
    quantity: 40,
    category: 'Vegetables',
    image:
      'https://images.unsplash.com/photo-1589135799797-df004122cc77?auto=format&fit=crop&q=80&w=600',
    farmerId: 'farm-1',
    farmerName: 'Green Valley Organic Farms',
    rating: 4.5,
    reviewsCount: 4
  }
];

// ---------------------------------------------------------------------------
// Initial orders
// ---------------------------------------------------------------------------

const initialOrders = [
  {
    id: 'ord-101',
    customerId: 'cust-1',
    customerName: 'Sarah Jenkins',
    deliveryAddress: '128 Birch Ln, Seattle, WA 98101',
    date: '2026-08-12T14:32:00Z',
    items: [
      {
        productId: 'prod-1',
        name: 'Organic Heirloom Tomatoes',
        price: 4.99,
        quantity: 2,
        unit: 'lb'
      },
      {
        productId: 'prod-4',
        name: 'Farm-Fresh Free-Range Brown Eggs',
        price: 5.99,
        quantity: 1,
        unit: 'dozen'
      }
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
      {
        productId: 'prod-2',
        name: 'Fresh Honeycrisp Apples',
        price: 3.49,
        quantity: 5,
        unit: 'lb'
      }
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
      {
        productId: 'prod-3',
        name: 'Raw Wildflower Honey',
        price: 9.99,
        quantity: 2,
        unit: 'jar (16oz)'
      },
      {
        productId: 'prod-5',
        name: 'Fresh Goat Milk Cheese (Chevre)',
        price: 7.5,
        quantity: 1,
        unit: 'pack (6oz)'
      }
    ],
    totalAmount: 27.48,
    status: 'Pending',
    paymentStatus: 'Paid',
    paymentMethod: 'x402 Protocol'
  }
];

// ---------------------------------------------------------------------------
// Initial reviews
// ---------------------------------------------------------------------------

const initialReviews = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    customerName: 'Sarah Jenkins',
    rating: 5,
    comment:
      'These are the best tomatoes I have had in years! Absolutely full of flavor and fresh.',
    date: '2026-08-13T10:00:00Z'
  },
  {
    id: 'rev-2',
    productId: 'prod-4',
    customerName: 'Sarah Jenkins',
    rating: 5,
    comment:
      'Rich, orange yolks. You can tell these chickens are raised well!',
    date: '2026-08-13T10:15:00Z'
  },
  {
    id: 'rev-3',
    productId: 'prod-2',
    customerName: 'David Lee',
    rating: 4,
    comment:
      'Very sweet and crispy. Shipping was fast too. Will order again.',
    date: '2026-08-11T16:45:00Z'
  }
];

// ---------------------------------------------------------------------------
// App Provider
// ---------------------------------------------------------------------------

export const AppProvider = ({ children }) => {
  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------

  const [products, setProducts] = useState(() => {
    try {
      const saved =
        localStorage.getItem('farmfresh_products');

      return saved
        ? JSON.parse(saved)
        : initialProducts;
    } catch (error) {
      console.error(
        'Failed to load products from localStorage:',
        error
      );

      return initialProducts;
    }
  });

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [productError, setProductError] =
    useState(null);

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------

  const [orders, setOrders] = useState(() => {
    try {
      const saved =
        localStorage.getItem('farmfresh_orders');

      return saved
        ? JSON.parse(saved)
        : initialOrders;
    } catch (error) {
      console.error(
        'Failed to load orders from localStorage:',
        error
      );

      return initialOrders;
    }
  });

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------

  const [reviews, setReviews] = useState(() => {
    try {
      const saved =
        localStorage.getItem('farmfresh_reviews');

      return saved
        ? JSON.parse(saved)
        : initialReviews;
    } catch (error) {
      console.error(
        'Failed to load reviews from localStorage:',
        error
      );

      return initialReviews;
    }
  });

  // -------------------------------------------------------------------------
  // Current user
  // -------------------------------------------------------------------------

  const [currentUser, setCurrentUser] =
    useState(null);

  // -------------------------------------------------------------------------
  // Load products
  // -------------------------------------------------------------------------

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductError(null);

      const res = await fetch(
        `${API_URL}/api/products`
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load products (${res.status})`
        );
      }

      const data = await res.json();

      const backendProducts =
        data.products || data || [];

      if (
        Array.isArray(backendProducts) &&
        backendProducts.length > 0
      ) {
        setProducts(backendProducts);
      }
    } catch (error) {
      console.error(
        'Failed to load products:',
        error
      );

      setProductError(error.message);

      setProducts((prev) =>
        prev && prev.length > 0
          ? prev
          : initialProducts
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // -------------------------------------------------------------------------
  // Load products on startup
  // -------------------------------------------------------------------------

  useEffect(() => {
    loadProducts();
  }, []);

  // -------------------------------------------------------------------------
  // Persist products
  // -------------------------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        'farmfresh_products',
        JSON.stringify(products)
      );
    } catch (error) {
      console.error(
        'Failed to save products:',
        error
      );
    }
  }, [products]);

  // -------------------------------------------------------------------------
  // Persist orders
  // -------------------------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        'farmfresh_orders',
        JSON.stringify(orders)
      );
    } catch (error) {
      console.error(
        'Failed to save orders:',
        error
      );
    }
  }, [orders]);

  // -------------------------------------------------------------------------
  // Persist reviews
  // -------------------------------------------------------------------------

  useEffect(() => {
    try {
      localStorage.setItem(
        'farmfresh_reviews',
        JSON.stringify(reviews)
      );
    } catch (error) {
      console.error(
        'Failed to save reviews:',
        error
      );
    }
  }, [reviews]);

  // -------------------------------------------------------------------------
  // Supabase authentication / profile
  // -------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async (user) => {
      if (!user) {
        return;
      }

      try {
        const {
          data: profile,
          error
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error(
            'Failed to load user profile:',
            error
          );

          return;
        }

        if (!profile) {
          console.error(
            'No profile found for authenticated user:',
            user.id
          );

          if (isMounted) {
            setCurrentUser({
              id: user.id,
              name:
                user.email ||
                'FarmFresh User',
              email: user.email || '',
              role: 'customer'
            });
          }

          return;
        }

        if (isMounted) {
          setCurrentUser({
            id: profile.id,
            name:
              profile.full_name ||
              user.email ||
              'FarmFresh User',
            email: user.email || '',
            role:
              profile.role ||
              'customer'
          });

          console.log(
            'Supabase current user loaded:',
            {
              id: profile.id,
              email: user.email,
              role:
                profile.role ||
                'customer'
            }
          );
        }
      } catch (error) {
        console.error(
          'Failed to load user profile:',
          error
        );
      }
    };

    // Get current authenticated session
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session }
        }) => {
          if (
            session?.user &&
            isMounted
          ) {
            loadUserProfile(
              session.user
            );
          } else if (isMounted) {
            setCurrentUser(null);
          }
        }
      )
      .catch((error) => {
        console.error(
          'Failed to get Supabase session:',
          error
        );
      });

    // Listen for login/logout changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (
          session?.user &&
          isMounted
        ) {
          loadUserProfile(
            session.user
          );
        } else if (
          !session &&
          isMounted
        ) {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Normalize order
  // -------------------------------------------------------------------------

  const normalizeOrder = (
    order,
    fallbackCustomerName = 'Customer'
  ) => ({
    id: order.id,

    date:
      order.created_at ||
      order.date ||
      new Date().toISOString(),

    customerId:
      order.customer_id ||
      order.customerId ||
      currentUser?.id,

    customerName:
      order.customer_name ||
      order.customerName ||
      fallbackCustomerName,

    deliveryAddress:
      order.delivery_address ||
      order.deliveryAddress ||
      '',

    status:
      order.status ||
      'Pending',

    paymentStatus:
      order.payment_status ||
      order.paymentStatus ||
      'Paid',

    paymentMethod:
      order.payment_method ||
      order.paymentMethod ||
      'x402 Protocol',

    totalAmount: Number(
      order.total_amount ??
        order.totalAmount ??
        0
    ),

    items: (order.items || []).map(
      (item) => ({
        productId:
          item.product_id ||
          item.productId,

        name:
          item.name ||
          'Product',

        price: Number(
          item.price ?? 0
        ),

        quantity: Number(
          item.quantity ?? 1
        ),

        unit:
          item.unit || ''
      })
    )
  });

  // -------------------------------------------------------------------------
  // Add product
  // -------------------------------------------------------------------------

  const addProduct = async (
    productData
  ) => {
    const res = await fetch(
      `${API_URL}/api/products`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json'
        },
        body: JSON.stringify({
          name: productData.name,
          description:
            productData.description,

          price: parseFloat(
            productData.price
          ),

          quantity: parseInt(
            productData.quantity,
            10
          ),

          unit:
            productData.unit ||
            'lb',

          category:
            productData.category,

          imageUrl:
            productData.image ||
            '',

          farmerId:
            isUUID(currentUser?.id)
              ? currentUser.id
              : undefined
        })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
          'Failed to create product'
      );
    }

    const newProduct =
      data.product || data;

    setProducts((prev) => [
      newProduct,
      ...prev
    ]);

    return newProduct;
  };

  // -------------------------------------------------------------------------
  // Update product
  // -------------------------------------------------------------------------

  const updateProduct = async (
    id,
    updatedData
  ) => {
    if (isUUID(id)) {
      const res = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            name:
              updatedData.name,

            description:
              updatedData.description,

            price: parseFloat(
              updatedData.price
            ),

            quantity: parseInt(
              updatedData.quantity,
              10
            ),

            unit:
              updatedData.unit,

            category:
              updatedData.category,

            imageUrl:
              updatedData.image || ''
          })
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update product'
        );
      }

      const updatedProduct =
        data.product || data;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? updatedProduct
            : p
        )
      );

      return updatedProduct;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedData,
              price: parseFloat(
                updatedData.price
              ),
              quantity: parseInt(
                updatedData.quantity,
                10
              )
            }
          : p
      )
    );
  };

  // -------------------------------------------------------------------------
  // Delete product
  // -------------------------------------------------------------------------

  const deleteProduct = async (
    id
  ) => {
    if (isUUID(id)) {
      const res = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: 'DELETE'
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to delete product'
        );
      }
    }

    setProducts((prev) =>
      prev.filter(
        (p) => p.id !== id
      )
    );
  };

  // -------------------------------------------------------------------------
  // ADD ORDER WITH X402
  // -------------------------------------------------------------------------

  const addOrder = async (
    orderData,
    options = {}
  ) => {
    const { paymentFetch } =
      options;

    console.log(
      '========== x402 ORDER START =========='
    );

    console.log(
      'API URL:',
      API_URL
    );

    console.log(
      'Current user:',
      currentUser
    );

    console.log(
      'Order data:',
      orderData
    );

    console.log(
      'Payment fetch available:',
      typeof paymentFetch ===
        'function'
    );

    // -------------------------------------------------------
    // Validate payment fetch
    // -------------------------------------------------------

    if (
      typeof paymentFetch !==
      'function'
    ) {
      throw new Error(
        'Payment-enabled fetch is not available.'
      );
    }

    // -------------------------------------------------------
    // Validate authenticated Supabase user
    // -------------------------------------------------------

    if (
      !currentUser?.id ||
      !isUUID(currentUser.id)
    ) {
      console.error(
        'Invalid current user:',
        currentUser
      );

      throw new Error(
        'Please log in with your Supabase account before placing an order.'
      );
    }

    console.log(
      'Using customer UUID:',
      currentUser.id
    );

    let res;

    try {
      res =
        await paymentFetch(
          `${API_URL}/api/orders`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              customerId:
                currentUser.id,

              ordersName:
                orderData.ordersName,

              deliveryAddress:
                orderData.deliveryAddress,

              contactPlace:
                orderData.contactPlace,

              items:
                orderData.items
            })
          }
        );
    } catch (error) {
      console.error(
        '========== x402 FETCH ERROR =========='
      );

      console.error(
        'Error:',
        error
      );

      console.error(
        'Message:',
        error?.message
      );

      console.error(
        'Stack:',
        error?.stack
      );

      throw error;
    }

    // -------------------------------------------------------
    // x402 response debugging
    // -------------------------------------------------------

    console.log(
      '========== x402 RESPONSE =========='
    );

    console.log(
      'HTTP status:',
      res.status
    );

    console.log(
      'HTTP status text:',
      res.statusText
    );

    console.log(
      'Response URL:',
      res.url
    );

    console.log(
      'Response headers:',
      [
        ...res.headers.entries()
      ]
    );

    try {
      const debugResponse =
        res.clone();

      const debugText =
        await debugResponse.text();

      console.log(
        'Raw response body:',
        debugText
      );
    } catch (error) {
      console.warn(
        'Could not read debug response body:',
        error
      );
    }

    // -------------------------------------------------------
    // Parse response
    // -------------------------------------------------------

    let data = {};

    try {
      data = await res.json();
    } catch (error) {
      console.warn(
        'Response was not JSON:',
        error
      );
    }

    console.log(
      'Parsed response data:',
      data
    );

    // -------------------------------------------------------
    // Handle 402
    // -------------------------------------------------------

    if (res.status === 402) {
      console.error(
        '========== X402 PAYMENT REQUIRED =========='
      );

      console.error(
        'The backend returned HTTP 402.'
      );

      console.error(
        'Response data:',
        data
      );

      console.error(
        'Response headers:',
        [
          ...res.headers.entries()
        ]
      );

      throw new Error(
        'Payment was not accepted by the x402 server. Check the browser console for the x402 response details.'
      );
    }

    // -------------------------------------------------------
    // Handle other HTTP errors
    // -------------------------------------------------------

    if (!res.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Order creation failed (${res.status})`
      );
    }

    // -------------------------------------------------------
    // Successful order
    // -------------------------------------------------------

    const createdOrder =
      data.order || data;

    const normalizedOrder =
      normalizeOrder(
        createdOrder,
        currentUser?.name ||
          'Customer'
      );

    setOrders((prev) => [
      normalizedOrder,
      ...prev
    ]);

    // Update local product quantities
    if (
      normalizedOrder.items &&
      normalizedOrder.items.length > 0
    ) {
      normalizedOrder.items.forEach(
        (item) => {
          setProducts(
            (prevProducts) =>
              prevProducts.map(
                (product) => {
                  if (
                    product.id ===
                    item.productId
                  ) {
                    return {
                      ...product,

                      quantity:
                        Math.max(
                          0,
                          Number(
                            product.quantity ||
                              0
                          ) -
                            Number(
                              item.quantity ||
                                0
                            )
                        )
                    };
                  }

                  return product;
                }
              )
          );
        }
      );
    }

    console.log(
      '========== x402 ORDER SUCCESS =========='
    );

    console.log(
      'Created order:',
      normalizedOrder
    );

    return normalizedOrder;
  };

  // -------------------------------------------------------------------------
  // Update order status
  // -------------------------------------------------------------------------

  const updateOrderStatus = (
    id,
    status
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status
            }
          : order
      )
    );
  };

  // -------------------------------------------------------------------------
  // Add review
  // -------------------------------------------------------------------------

  const addReview = (
    reviewData
  ) => {
    if (!currentUser) {
      throw new Error(
        'Please log in before adding a review.'
      );
    }

    const newReview = {
      id: `rev-${Date.now()}`,

      customerName:
        currentUser.name,

      date:
        new Date().toISOString(),

      ...reviewData
    };

    setReviews((prev) => [
      newReview,
      ...prev
    ]);

    setProducts(
      (prevProducts) =>
        prevProducts.map(
          (product) => {
            if (
              product.id !==
              reviewData.productId
            ) {
              return product;
            }

            const productReviews = [
              newReview,
              ...reviews.filter(
                (review) =>
                  review.productId ===
                  product.id
              )
            ];

            const totalRating =
              productReviews.reduce(
                (
                  sum,
                  review
                ) =>
                  sum +
                  Number(
                    review.rating ||
                      0
                  ),
                0
              );

            return {
              ...product,

              rating:
                productReviews.length >
                0
                  ? parseFloat(
                      (
                        totalRating /
                        productReviews.length
                      ).toFixed(1)
                    )
                  : 5.0,

              reviewsCount:
                productReviews.length
            };
          }
        )
    );
  };

  // -------------------------------------------------------------------------
  // Delete review
  // -------------------------------------------------------------------------

  const deleteReview = (
    id
  ) => {
    const reviewToDelete =
      reviews.find(
        (review) =>
          review.id === id
      );

    if (!reviewToDelete) {
      return;
    }

    setReviews((prev) =>
      prev.filter(
        (review) =>
          review.id !== id
      )
    );

    setProducts(
      (prevProducts) =>
        prevProducts.map(
          (product) => {
            if (
              product.id !==
              reviewToDelete.productId
            ) {
              return product;
            }

            const productReviews =
              reviews.filter(
                (review) =>
                  review.productId ===
                    product.id &&
                  review.id !== id
              );

            const totalRating =
              productReviews.reduce(
                (
                  sum,
                  review
                ) =>
                  sum +
                  Number(
                    review.rating ||
                      0
                  ),
                0
              );

            return {
              ...product,

              rating:
                productReviews.length >
                0
                  ? parseFloat(
                      (
                        totalRating /
                        productReviews.length
                      ).toFixed(1)
                    )
                  : 5.0,

              reviewsCount:
                productReviews.length
            };
          }
        )
    );
  };

  // -------------------------------------------------------------------------
  // Context Provider
  // -------------------------------------------------------------------------

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
        deleteReview,

        normalizeOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};