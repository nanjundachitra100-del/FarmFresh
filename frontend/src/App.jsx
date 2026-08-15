import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { BrowseProducts } from './pages/BrowseProducts';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { CustomerOrders } from './pages/CustomerOrders';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { FarmerProducts } from './pages/FarmerProducts';
import { FarmerOrders } from './pages/FarmerOrders';
import { AdminDashboard } from './pages/AdminDashboard';

// Style sheets
import './styles/variables.css';
import './App.css';

function App() {
  return (
    <AppProvider>
      <CartProvider>
        <Router>
          <div className="app-layout" id="farmfresh-app-layout">
            <Navbar />
            
            <main className="main-content-layout">
              <Routes>
                {/* Customer / Common Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<BrowseProducts />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<CustomerOrders />} />

                {/* Farmer Routes */}
                <Route path="/farmer" element={<FarmerDashboard />} />
                <Route path="/farmer/products" element={<FarmerProducts />} />
                <Route path="/farmer/orders" element={<FarmerOrders />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AppProvider>
  );
}

export default App;
