import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import './BrowseProducts.css';

export const BrowseProducts = () => {
  const { products } = useContext(AppContext);
  const location = useLocation();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'price-asc', 'price-desc'
  const [inStockOnly, setInStockOnly] = useState(false);

  // Read initial category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [location.search]);

  // Categories list
  const categories = ['All', 'Vegetables', 'Fruits', 'Dairy & Eggs', 'Honey & Preserves'];

  // Filter products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesStock = !inStockOnly || product.quantity > 0;
      
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('rating');
    setInStockOnly(false);
  };

  return (
    <div className="browse-products-page" id="catalog-page">
      <header className="catalog-header">
        <h1>Fresh Farm Catalog</h1>
        <p>Browse fresh vegetables, sweet fruits, and natural artisanal goods harvested near you.</p>
      </header>

      {/* Control panel (Search & filters) */}
      <section className="catalog-control-panel">
        {/* Search */}
        <div className="search-box-wrap">
          <Search size={18} className="search-icon-catalog" />
          <input
            type="text"
            placeholder="Search farm products, descriptions, or growers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="product-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-btn">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters and Sorting Toolbar */}
        <div className="toolbar-wrap">
          {/* Category buttons */}
          <div className="category-filters-container">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                id={`cat-btn-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="right-tools">
            {/* Stock Switch */}
            <label className="checkbox-tool-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span className="checkbox-custom-label">In Stock Only</span>
            </label>

            {/* Sorter */}
            <div className="sort-box-wrap">
              <ArrowUpDown size={14} className="sort-icon-catalog" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                id="catalog-sort-select"
              >
                <option value="rating">Sort by: Top Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results grid */}
      <main className="catalog-results-section">
        <div className="results-info-row">
          <p className="results-count">
            Found <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
          {(searchTerm || selectedCategory !== 'All' || inStockOnly) && (
            <button onClick={clearFilters} className="clear-all-filters-btn">
              Clear All Filters
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="products-catalog-grid" id="products-list-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-results-box">
            <span className="no-results-emoji">🌾</span>
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your search terms or filters. Try adjusting your query or resetting filters.</p>
            <button onClick={clearFilters} className="reset-btn-catalog">
              Reset All Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
