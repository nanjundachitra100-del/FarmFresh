import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, X, Sprout, Tag, RefreshCw } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './FarmerProducts.css';

const PRESET_IMAGES = [
  { name: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600' },
  { name: 'Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600' },
  { name: 'Honey', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600' },
  { name: 'Eggs', url: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600' },
  { name: 'Cheese', url: 'https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&q=80&w=600' },
  { name: 'Berries', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=600' }
];

export const FarmerProducts = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Filter products by farmer ID ('farm-1')
  const farmerProducts = products.filter((p) => p.farmerId === 'farm-1');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lb');
  const [category, setCategory] = useState('Vegetables');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);

  // Check URL query parameters for ?edit=id (for card shortcut clicks)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editParam = params.get('edit');
    if (editParam) {
      const prodToEdit = products.find(p => p.id === editParam);
      if (prodToEdit) {
        startEdit(prodToEdit);
      }
      // Remove query param cleanly
      navigate('/farmer/products', { replace: true });
    }
  }, [location.search]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setQuantity('');
    setUnit('lb');
    setCategory('Vegetables');
    setImageUrl(PRESET_IMAGES[0].url);
    setIsEditing(false);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setUnit(product.unit);
    setCategory(product.category);
    setImageUrl(product.image);
    setIsEditing(true);
    setEditingId(product.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !quantity) return;

    const productData = {
      name,
      description,
      price,
      quantity,
      unit,
      category,
      image: imageUrl
    };

    if (isEditing) {
      updateProduct(editingId, productData);
    } else {
      addProduct(productData);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product listing from FarmFresh?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="farmer-products-page" id="inventory-management-page">
      <header className="inventory-header">
        <h1>Manage Farm Inventory</h1>
        <p>List new agricultural products, update stocks, or remove items from your public catalog.</p>
      </header>

      <div className="inventory-layout-grid">
        {/* Left Column: List Catalog */}
        <div className="catalog-list-card">
          <h3>Listed Farm Products ({farmerProducts.length})</h3>
          
          {farmerProducts.length > 0 ? (
            <div className="catalog-table-wrapper">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {farmerProducts.map((prod) => (
                    <tr key={prod.id} className="catalog-row" id={`inventory-row-${prod.id}`}>
                      {/* details */}
                      <td>
                        <div className="table-product-details">
                          <img src={prod.image} alt={prod.name} className="table-product-img" />
                          <div className="table-product-text">
                            <span className="table-product-title">{prod.name}</span>
                            <span className="table-product-desc-trunc" title={prod.description}>
                              {prod.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* category */}
                      <td>
                        <span className="table-cat-badge">
                          <Tag size={12} />
                          <span>{prod.category}</span>
                        </span>
                      </td>

                      {/* price */}
                      <td className="td-price">
                        <strong>${prod.price.toFixed(2)}</strong> / {prod.unit}
                      </td>

                      {/* quantity */}
                      <td>
                        <span className={`td-stock-tag ${prod.quantity === 0 ? 'out' : prod.quantity <= 5 ? 'low' : 'in'}`}>
                          {prod.quantity === 0 ? 'Out of Stock' : `${prod.quantity} ${prod.unit}s`}
                        </span>
                      </td>

                      {/* actions */}
                      <td className="td-actions">
                        <div className="table-action-btns">
                          <button 
                            onClick={() => startEdit(prod)} 
                            className="action-icon-btn edit-color"
                            title="Edit product"
                            id={`edit-btn-${prod.id}`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(prod.id)} 
                            className="action-icon-btn delete-color"
                            title="Delete product"
                            id={`delete-btn-${prod.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-catalog-box">
              <Sprout size={32} className="empty-catalog-icon" />
              <p>Your shop catalog is currently empty. Use the form to list your first farm product!</p>
            </div>
          )}
        </div>

        {/* Right Column: Add/Edit Form */}
        <div className="catalog-form-card">
          <div className="form-card-header">
            <h3>{isEditing ? 'Update Listing Details' : 'Add New Farm Product'}</h3>
            {isEditing && (
              <button onClick={resetForm} className="cancel-edit-btn" title="Cancel edit">
                <X size={16} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="inventory-form">
            <div className="form-group-inventory">
              <label htmlFor="prod-name-input">Product Title</label>
              <input
                type="text"
                id="prod-name-input"
                placeholder="e.g. Organic Heirloom Tomatoes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-inventory">
              <label htmlFor="prod-desc-input">Description</label>
              <textarea
                id="prod-desc-input"
                rows="3"
                placeholder="Describe your harvest, farming methods, freshness..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Row price and quantity */}
            <div className="form-row-inventory">
              <div className="form-group-inventory flex-1">
                <label htmlFor="prod-price-input">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="prod-price-input"
                  placeholder="4.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-inventory flex-1">
                <label htmlFor="prod-unit-select">Sale Unit</label>
                <select
                  id="prod-unit-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="lb">lb (Pound)</option>
                  <option value="oz">oz (Ounce)</option>
                  <option value="dozen">dozen</option>
                  <option value="bunch">bunch</option>
                  <option value="jar (16oz)">jar (16oz)</option>
                  <option value="pack (6oz)">pack (6oz)</option>
                  <option value="bag">bag</option>
                </select>
              </div>
            </div>

            <div className="form-row-inventory">
              <div className="form-group-inventory flex-1">
                <label htmlFor="prod-qty-input">Available Stock</label>
                <input
                  type="number"
                  min="0"
                  id="prod-qty-input"
                  placeholder="50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-inventory flex-1">
                <label htmlFor="prod-cat-select">Category</label>
                <select
                  id="prod-cat-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Honey & Preserves">Honey & Preserves</option>
                </select>
              </div>
            </div>

            {/* Premium Preset Image Selector */}
            <div className="form-group-inventory">
              <label>Choose Product Image Banner</label>
              <div className="preset-images-picker">
                {PRESET_IMAGES.map((img) => (
                  <button
                    type="button"
                    key={img.name}
                    className={`preset-btn-img ${imageUrl === img.url ? 'selected' : ''}`}
                    onClick={() => setImageUrl(img.url)}
                    style={{ backgroundImage: `url(${img.url})` }}
                    title={img.name}
                  >
                    <span className="preset-name-overlay">{img.name}</span>
                  </button>
                ))}
              </div>
              <input
                type="url"
                className="custom-img-url-input"
                placeholder="Or paste custom image HTTPS URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-inventory-btn" id="prod-submit-btn">
              {isEditing ? (
                <>
                  <RefreshCw size={18} />
                  <span>Update Catalog Listing</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Publish Farm Harvest</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
