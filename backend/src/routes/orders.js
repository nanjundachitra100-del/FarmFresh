const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { calculateOrderTotalFromItems } = require('../services/orderPricing');

// Create a new order — only reachable after official x402 middleware verifies/settles payment
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      ordersName,
      deliveryAddress,
      contactPlace,
      items
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'customerId and at least one item are required'
      });
    }

    const productIds = items.map((item) => item.productId);

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, unit, farmer_id')
      .in('id', productIds);

    if (productsError) {
      return res.status(500).json({
        error: productsError.message
      });
    }

    if (!products || products.length !== productIds.length) {
      return res.status(400).json({
        error: 'One or more products were not found'
      });
    }

    let totalAmount = 0;

    const orderItems = items.map((item) => {
      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(
          `Invalid quantity for product ${item.productId}`
        );
      }

      totalAmount += Number(product.price) * quantity;

      return {
        product_id: product.id,
        quantity
      };
    });

    // Verify total matches server-side pricing (never trust client totals)
    const expectedTotal = await calculateOrderTotalFromItems(items);
    if (Math.abs(totalAmount - expectedTotal) > 0.001) {
      return res.status(400).json({
        error: 'Order total mismatch'
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        orders_name: ordersName || `Order by ${customerId}`,
        customer_id: customerId,
        delivery_address: deliveryAddress || '',
        contact_place: contactPlace || '',
        total_amount: totalAmount,
        status: 'Pending',
        payment_status: 'Paid',
        payment_method: 'x402 Protocol (Algorand)'
      })
      .select()
      .single();

    if (orderError) {
      return res.status(500).json({
        error: orderError.message
      });
    }

    const itemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', order.id);

      return res.status(500).json({
        error: itemsError.message
      });
    }

    return res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});


// Get orders for a farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    const { data: farmerProducts, error: farmerProductsError } =
      await supabaseAdmin
        .from('products')
        .select('id')
        .eq('farmer_id', farmerId);

    if (farmerProductsError) {
      return res.status(500).json({
        error: farmerProductsError.message
      });
    }

    const productIds = farmerProducts.map(
      (product) => product.id
    );

    if (productIds.length === 0) {
      return res.json([]);
    }

    const { data: orderItems, error: orderItemsError } =
      await supabaseAdmin
        .from('order_items')
        .select('order_id, product_id, quantity')
        .in('product_id', productIds);

    if (orderItemsError) {
      return res.status(500).json({
        error: orderItemsError.message
      });
    }

    const orderIds = [
      ...new Set(orderItems.map((item) => item.order_id))
    ];

    if (orderIds.length === 0) {
      return res.json([]);
    }

    const { data: orders, error: ordersError } =
      await supabaseAdmin
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

    if (ordersError) {
      return res.status(500).json({
        error: ordersError.message
      });
    }

    const customerIds = [...new Set((orders || []).map((order) => order.customer_id).filter(Boolean))];
    let customerMap = {};

    if (customerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);

      if (profilesError) {
        console.error('Load customer profiles failed:', profilesError.message);
      } else {
        customerMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile.full_name]));
      }
    }

    const productIdsForLookup = [...new Set((orderItems || []).map((item) => item.product_id))];
    let productMap = {};

    if (productIdsForLookup.length > 0) {
      const { data: productRows, error: productRowsError } = await supabaseAdmin
        .from('products')
        .select('id, name, unit, price')
        .in('id', productIdsForLookup);

      if (productRowsError) {
        console.error('Load product details failed:', productRowsError.message);
      } else {
        productMap = Object.fromEntries((productRows || []).map((product) => [product.id, product]));
      }
    }

    const enrichedOrders = (orders || []).map((order) => {
      const farmerItems = (orderItems || [])
        .filter((item) => item.order_id === order.id && productIds.includes(item.product_id))
        .map((item) => {
          const product = productMap[item.product_id] || {};
          const quantity = Number(item.quantity || 0);
          const price = Number(product.price || 0);

          return {
            productId: item.product_id,
            quantity,
            name: product.name || 'Product',
            unit: product.unit || '',
            price,
            farmerSubtotal: Number((price * quantity).toFixed(2))
          };
        });

      return {
        id: order.id,
        customerName: customerMap[order.customer_id] || order.orders_name || 'Customer',
        deliveryAddress: order.delivery_address,
        date: order.created_at,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        totalAmount: Number(order.total_amount || 0),
        items: farmerItems,
        farmerSubtotal: farmerItems.reduce((sum, item) => sum + item.farmerSubtotal, 0)
      };
    });

    return res.json(enrichedOrders);

  } catch (error) {
    console.error('Get farmer orders error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});


// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Pending',
      'In Transit',
      'Delivered',
      'Cancelled'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid order status'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.json({
      message: 'Order status updated',
      order: data
    });

  } catch (error) {
    console.error('Update order status error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
