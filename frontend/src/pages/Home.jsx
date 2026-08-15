import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Truck, MessageSquare } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import './Home.css';

export const Home = () => {
  const { products } = useContext(AppContext);
  
  // Get top 3 highly rated products to feature
  const featuredProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const categories = [
    { name: 'Vegetables', icon: '🥦', count: products.filter(p => p.category === 'Vegetables').length },
    { name: 'Fruits', icon: '🍎', count: products.filter(p => p.category === 'Fruits').length },
    { name: 'Dairy & Eggs', icon: '🥚', count: products.filter(p => p.category === 'Dairy & Eggs').length },
    { name: 'Honey & Preserves', icon: '🍯', count: products.filter(p => p.category === 'Honey & Preserves').length }
  ];

  return (
    <div className="home-page" id="home-page-container">
      {/* Hero Banner */}
      <header className="hero-banner">
        <div className="hero-content">
          <span className="hero-badge">Skip the Middleman</span>
          <h1>Fresh Agricultural Products Directly From Farmers</h1>
          <p>
            Connect directly with local growers, browse fresh seasonal harvests, and get pure organic goods delivered right to your doorstep. Supporting local agriculture has never been so simple.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary-hero">
              Browse Products
            </Link>
            <a href="#benefits-section" className="btn-secondary-hero">
              Learn More
            </a>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="hero-circle-bg"></div>
          {/* A premium mockup of a crop crate */}
          <img 
            src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600" 
            alt="Farm Fresh Veggies"
            className="hero-img-mock"
          />
        </div>
      </header>

      {/* Categories Grid */}
      <section className="categories-section">
        <div className="section-header-layout">
          <h2>Shop by Category</h2>
          <p>Discover fresh farm harvests by their categories</p>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link 
              to={`/products?category=${cat.name}`} 
              key={cat.name} 
              className="category-card-home"
              id={`cat-card-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="cat-icon">{cat.icon}</span>
              <h3>{cat.name}</h3>
              <span className="cat-count">{cat.count} Items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section" id="benefits-section">
        <div className="section-header-layout">
          <h2>Why FarmFresh?</h2>
          <p>We are creating a fairer and fresher food cycle</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <Sprout size={28} />
            </div>
            <h3>100% Direct</h3>
            <p>Your orders go straight to the farmer. No wholesalers, no cold storages, no delayed logistics.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <ShieldCheck size={28} />
            </div>
            <h3>Verified Quality</h3>
            <p>All farmers undergo strict verification. Review farm certifications and community ratings before purchase.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <Truck size={28} />
            </div>
            <h3>Direct Delivery</h3>
            <p>Farmers pack and ship items themselves, ensuring minimal handling and the absolute highest freshness.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <MessageSquare size={28} />
            </div>
            <h3>Community Powered</h3>
            <p>Interact with farmers, write product ratings, and read transparent customer reviews post-purchase.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header-layout">
          <h2>Top Harvests This Week</h2>
          <p>Highly rated and freshly available items from our grower community</p>
        </div>
        <div className="products-grid-home">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="featured-bottom-action">
          <Link to="/products" className="view-all-harvests-btn">
            View All Catalog Products
          </Link>
        </div>
      </section>
    </div>
  );
};
