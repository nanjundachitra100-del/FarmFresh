const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Default fallback farmer profile for demo/testing before Milestone 3 auth login
const DEFAULT_FARMER_ID = '00000000-0000-0000-0000-000000000001';

async function ensureDefaultFarmer() {
  if (!supabaseAdmin) return;
  try {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', DEFAULT_FARMER_ID)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('profiles').insert({
        id: DEFAULT_FARMER_ID,
        role: 'farmer',
        full_name: 'Green Valley Organic Farms',
        farm_name: 'Green Valley Organic Farms',
        phone: '+1 (555) 234-5678',
        address: '100 Farmer Way, Yakima, WA 98901',
        farm_description: 'Family-owned certified organic vegetable and fruit farm.'
      });
    }
  } catch (err) {
    console.warn('[Products Controller] Could not ensure default farmer profile:', err.message);
  }
}

// Format product row to standard frontend shape
function formatProduct(row, reviews = []) {
  const prodReviews = reviews.filter((r) => r.product_id === row.id);
  const avgRating =
    prodReviews.length > 0
      ? parseFloat((prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length).toFixed(1))
      : 5.0;

  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.profiles ? (row.profiles.farm_name || row.profiles.full_name) : 'Green Valley Organic Farms',
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    unit: row.unit || 'lb',
    category: row.category,
    quantity: parseInt(row.quantity, 10),
    image: row.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
    rating: avgRating,
    reviewsCount: prodReviews.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 1. GET /api/products - Browse products with search, category filter, stock filter, sorting
async function getProducts(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database service is unavailable. Please verify backend Supabase configuration.'
    });
  }

  try {
    const { search, category, inStockOnly, sortBy } = req.query;

    let query = supabaseAdmin
      .from('products')
      .select('*, profiles:farmer_id (id, full_name, farm_name)');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (inStockOnly === 'true' || inStockOnly === true) {
      query = query.gt('quantity', 0);
    }

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    // Apply sorting
    if (sortBy === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: productsData, error: prodError } = await query;
    if (prodError) {
      return res.status(500).json({ error: `Failed to fetch products: ${prodError.message}` });
    }

    // Fetch reviews to calculate ratings
    const { data: reviewsData } = await supabaseAdmin
      .from('reviews')
      .select('product_id, rating');

    const formatted = (productsData || []).map((p) => formatProduct(p, reviewsData || []));

    // Sort by rating if requested
    if (sortBy === 'rating') {
      formatted.sort((a, b) => b.rating - a.rating);
    }

    return res.json({
      success: true,
      count: formatted.length,
      products: formatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// 2. GET /api/products/:id - Get single product by ID
async function getProductById(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database service is unavailable. Please verify backend Supabase configuration.'
    });
  }

  const { id } = req.params;

  try {
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('*, profiles:farmer_id (id, full_name, farm_name, phone, address, farm_description)')
      .eq('id', id)
      .maybeSingle();

    if (prodError) {
      return res.status(500).json({ error: prodError.message });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles:customer_id (full_name)')
      .eq('product_id', id)
      .order('created_at', { ascending: false });

    const formattedProduct = formatProduct(product, reviews || []);

    return res.json({
      success: true,
      product: {
        ...formattedProduct,
        farmerDetails: product.profiles || null,
        reviews: (reviews || []).map((r) => ({
          id: r.id,
          customerName: r.profiles ? r.profiles.full_name : 'Verified Customer',
          rating: r.rating,
          comment: r.comment,
          date: r.created_at
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// 3. POST /api/products - Create new product (Farmer)
async function createProduct(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database service is unavailable. Cannot create product.'
    });
  }

  const { name, description, price, unit, category, quantity, image, imageUrl, farmerId } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'Product description is required.' });
  }
  if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return res.status(400).json({ error: 'Valid non-negative price is required.' });
  }
  if (quantity === undefined || quantity === null || isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 0) {
    return res.status(400).json({ error: 'Valid non-negative quantity is required.' });
  }
  const validCategories = ['Vegetables', 'Fruits', 'Dairy & Eggs', 'Honey & Preserves'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    });
  }

  await ensureDefaultFarmer();

  // Validate or assign valid UUID farmer_id
  let targetFarmerId = farmerId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!targetFarmerId || !isUuid.test(targetFarmerId)) {
    targetFarmerId = DEFAULT_FARMER_ID;
  }

  try {
    const { data: newProd, error: insertError } = await supabaseAdmin
      .from('products')
      .insert({
        farmer_id: targetFarmerId,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        unit: (unit || 'lb').trim(),
        category,
        quantity: parseInt(quantity, 10),
        image_url: (imageUrl || image || '').trim()
      })
      .select('*, profiles:farmer_id (id, full_name, farm_name)')
      .single();

    if (insertError) {
      return res.status(500).json({ error: `Failed to create product: ${insertError.message}` });
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: formatProduct(newProd, [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// 4. PUT /api/products/:id - Update product (Farmer)
async function updateProduct(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database service is unavailable. Cannot update product.'
    });
  }

  const { id } = req.params;
  const { name, description, price, unit, category, quantity, image, imageUrl } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Product name cannot be empty.' });
    updates.name = name.trim();
  }
  if (description !== undefined) {
    if (!description.trim()) return res.status(400).json({ error: 'Description cannot be empty.' });
    updates.description = description.trim();
  }
  if (price !== undefined) {
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }
    updates.price = parseFloat(price);
  }
  if (quantity !== undefined) {
    if (isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer.' });
    }
    updates.quantity = parseInt(quantity, 10);
  }
  if (unit !== undefined) updates.unit = unit.trim();
  if (category !== undefined) {
    const validCategories = ['Vegetables', 'Fruits', 'Dairy & Eggs', 'Honey & Preserves'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }
    updates.category = category;
  }
  if (imageUrl !== undefined || image !== undefined) {
    updates.image_url = (imageUrl || image || '').trim();
  }

  try {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, profiles:farmer_id (id, full_name, farm_name)')
      .single();

    if (updateError) {
      return res.status(500).json({ error: `Failed to update product: ${updateError.message}` });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: formatProduct(updated, [])
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// 5. DELETE /api/products/:id - Delete product (Farmer)
async function deleteProduct(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: 'Database service is unavailable. Cannot delete product.'
    });
  }

  const { id } = req.params;

  try {
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: `Failed to delete product: ${deleteError.message}` });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
      id
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
