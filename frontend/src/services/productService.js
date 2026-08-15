const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const productService = {
  // Fetch all products with optional search, category, inStockOnly, and sorting
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.inStockOnly) params.append('inStockOnly', 'true');
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_URL}/api/products${queryString}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch products (Status ${res.status})`);
    }

    const data = await res.json();
    return data.products || [];
  },

  // Fetch a single product by ID
  async getProductById(id) {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to fetch product details (Status ${res.status})`);
    }

    const data = await res.json();
    return data.product;
  },

  // Create a new product (Farmer)
  async createProduct(productData) {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create product (Status ${res.status})`);
    }

    const data = await res.json();
    return data.product;
  },

  // Update an existing product (Farmer)
  async updateProduct(id, productData) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update product (Status ${res.status})`);
    }

    const data = await res.json();
    return data.product;
  },

  // Delete a product (Farmer)
  async deleteProduct(id) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to delete product (Status ${res.status})`);
    }

    const data = await res.json();
    return data;
  }
};
