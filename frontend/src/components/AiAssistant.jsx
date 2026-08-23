import React, { useState, useContext } from 'react';
import {
  Sparkles,
  ShoppingCart,
  Info,
  Loader2,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { CartContext } from '../context/CartContext';
import { AppContext } from '../context/AppContext';
import './AiAssistant.css';

export const AiAssistant = () => {
  const { addToCart } = useContext(CartContext);
  const { currentUser } = useContext(AppContext) || {};

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Backend URL
  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const userRole = currentUser?.role;

  // ---------------------------------------------------------
  // Ask FarmFresh AI
  // ---------------------------------------------------------
  const handleAskAI = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage =
          'Failed to get a response from FarmFresh AI.';

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      console.error('FarmFresh AI error:', err);

      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Unable to connect to the FarmFresh backend. Please check that the backend is deployed and VITE_API_URL is configured correctly.'
        );
      } else {
        setError(
          err.message ||
          'An error occurred while contacting FarmFresh AI.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Add AI recommended product to cart
  // ---------------------------------------------------------
  const handleAddToCart = (product) => {
    const qty =
      Number(product.requestedQty) > 0
        ? Number(product.requestedQty)
        : 1;

    try {
      addToCart(product, qty);

      alert(
        `Added ${qty} ${product.unit || 'unit'}(s) of "${product.name}" to your cart.`
      );
    } catch (err) {
      console.error('Add to cart error:', err);

      alert('Unable to add this product to your cart.');
    }
  };

  // ---------------------------------------------------------
  // Format price safely
  // ---------------------------------------------------------
  const formatPrice = (price) => {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return '0.00';
    }

    return numericPrice.toFixed(2);
  };

  // ---------------------------------------------------------
  // Format stock
  // ---------------------------------------------------------
  const formatStock = (product) => {
    const quantity = Number(product.quantity);

    if (quantity <= 0) {
      return 'Out of stock';
    }

    return `${quantity} ${product.unit || 'unit'}${quantity === 1 ? '' : 's'
      } available`;
  };

  return (
    <div
      className="ai-assistant-container"
      id="ai-assistant-widget"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="ai-assistant-header">
        <div className="ai-title-wrap">
          <div className="ai-icon-bg">
            <Sparkles
              className="ai-sparkles-icon"
              size={20}
            />
          </div>

          <div>
            <h3>FarmFresh AI Assistant</h3>

            <p className="ai-subtitle">
              Search the local catalog using natural language
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SEARCH FORM
      ====================================================== */}
      <form
        onSubmit={handleAskAI}
        className="ai-input-form"
      >
        <div className="ai-input-wrapper">
          <input
            type="text"
            placeholder='Try: "I want 5 kg tomatoes under ₹300" or "Organic wildflower honey"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="ai-chat-input"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="ai-submit-btn"
          >
            {loading ? (
              <>
                <Loader2
                  className="spinner-icon animate-spin"
                  size={16}
                />

                <span>Thinking...</span>
              </>
            ) : (
              <span>Ask FarmFresh AI</span>
            )}
          </button>
        </div>
      </form>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="ai-error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          AI RESULT
      ====================================================== */}
      {result && (
        <div className="ai-result-panel animate-fade-in">

          {/* =================================================
              AI RESPONSE MESSAGE
          ================================================== */}
          {result.message && (
            <div className="ai-response-message">
              <p>{result.message}</p>
            </div>
          )}

          {/* =================================================
              AI INTERPRETATION DETAILS
          ================================================== */}
          {result.intent && (
            <div className="ai-intent-details">
              <div className="intent-header">
                <Info size={14} />

                <span>
                  AI Interpretation Details
                </span>

                <span className="intent-tag">
                  {result.intent.parsedBy === 'gemini'
                    ? 'Gemini AI'
                    : 'Regex Fallback'}
                </span>
              </div>

              <div className="intent-grid">

                {/* Search terms */}
                {Array.isArray(result.intent.items) &&
                  result.intent.items.length > 0 && (
                    <div>
                      <strong>Search terms:</strong>{' '}

                      {result.intent.items.map(
                        (item, index) => (
                          <span
                            key={index}
                            className="intent-item-tag"
                          >
                            {item.quantity || 1}{' '}
                            {item.unit || 'unit'}
                            {Number(item.quantity) === 1
                              ? ''
                              : 's'}{' '}
                            of {item.product}
                          </span>
                        )
                      )}
                    </div>
                  )}

                {/* Budget */}
                {result.intent.maxBudget !== null &&
                  result.intent.maxBudget !== undefined && (
                    <div>
                      <strong>
                        Budget Limit:
                      </strong>{' '}

                      <span className="intent-budget-tag">
                        ₹{formatPrice(
                          result.intent.maxBudget
                        )}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* =================================================
              M2M PAYMENT STATUS
          ================================================== */}
          {result.m2m && (
            <div
              className={`ai-m2m-status-box m2m-${result.m2m.m2mStatus}`}
            >
              <div className="m2m-status-header">
                <Cpu size={14} />

                <span>
                  M2M Delivery Optimizer Payment Status
                </span>
              </div>

              <div className="m2m-status-body">

                {/* PAID */}
                {result.m2m.m2mStatus === 'paid' && (
                  <div className="m2m-status-info success">
                    <CheckCircle2
                      size={16}
                      className="text-green"
                    />

                    <div>
                      <strong>
                        Payment Complete (Paid via x402 Protocol)
                      </strong>

                      <p>
                        Backend paid{' '}
                        {result.m2m.paymentAmount || 'USDC'}{' '}
                        using Algorand Testnet. Transaction settled automatically.
                      </p>

                      {result.m2m.data && (
                        <p className="m2m-details">
                          Provider:{' '}
                          {result.m2m.data.provider || 'N/A'}{' '}
                          | Est:{' '}
                          {result.m2m.data.estimatedDays || 'N/A'}{' '}
                          day(s)
                        </p>
                      )}

                      {result.m2m.transactionId && (
                        <p className="m2m-details">
                          Algorand Testnet Transaction:{' '}
                          <a
                            href={`https://lora.algokit.io/testnet/transaction/${result.m2m.transactionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ wordBreak: 'break-all', color: 'inherit', textDecoration: 'underline' }}
                          >
                            {result.m2m.transactionId}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* PAYMENT REQUIRED */}
                {result.m2m.m2mStatus ===
                  'payment_required' && (
                    <div className="m2m-status-info warning">
                      <AlertTriangle
                        size={16}
                        className="text-orange"
                      />

                      <div>
                        <strong>
                          x402 Payment Required
                          {result.m2m.paymentAmount ? ` (${result.m2m.paymentAmount})` : ''}
                        </strong>

                        <p>
                          The M2M service returned a 402 payment requirement.
                          The integration is functional, but no mnemonic key is
                          configured in the backend.
                        </p>

                        <p className="m2m-instructions">
                          Add{' '}
                          <code>M2M_ALGORAND_MNEMONIC</code>{' '}
                          to the backend <code>.env</code> to enable automatic
                          payment execution. Fund the wallet with Testnet USDC
                          (asset ID 10458941).
                        </p>
                      </div>
                    </div>
                  )}

                {/* ERROR */}
                {result.m2m.m2mStatus === 'error' && (
                  <div className="m2m-status-info error">
                    <AlertTriangle
                      size={16}
                      className="text-red"
                    />

                    <div>
                      <strong>
                        M2M Payment Error
                      </strong>

                      <p>
                        {result.m2m.message ||
                          'An M2M payment error occurred.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              MATCHING PRODUCTS
          ================================================== */}
          {Array.isArray(result.products) &&
            result.products.length > 0 ? (
            <div className="ai-products-section">

              <h4>
                Recommended Products (
                {result.products.length})
              </h4>

              <div className="ai-products-grid">

                {result.products.map((prod) => {
                  const stockQuantity =
                    Number(prod.quantity) || 0;

                  const requestedQty =
                    Number(prod.requestedQty) > 0
                      ? Number(prod.requestedQty)
                      : 1;

                  const isOutOfStock =
                    stockQuantity <= 0;

                  return (
                    <div
                      key={prod.id}
                      className="ai-product-card"
                    >

                      {/* Product image */}
                      <img
                        src={
                          prod.image ||
                          '/placeholder-product.png'
                        }
                        alt={prod.name}
                        className="ai-prod-img"
                        onError={(e) => {
                          e.currentTarget.src =
                            '/placeholder-product.png';
                        }}
                      />

                      <div className="ai-prod-info">

                        {/* Product name */}
                        <h5>{prod.name}</h5>

                        {/* Farmer */}
                        <span className="ai-prod-farmer">
                          {prod.farmerName ||
                            'FarmFresh Farmer'}
                        </span>

                        {/* Price + Cart */}
                        <div className="ai-prod-price-row">

                          <span className="ai-price">
                            ₹{formatPrice(prod.price)} /{' '}
                            {prod.unit || 'unit'}
                          </span>

                          {userRole === 'customer' ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart(prod)
                              }
                              disabled={isOutOfStock}
                              className="ai-add-cart-btn"
                            >
                              <ShoppingCart size={14} />

                              <span>
                                {isOutOfStock
                                  ? 'Out of Stock'
                                  : `Add ${requestedQty} ${prod.requestedUnit ||
                                  prod.unit ||
                                  'unit'
                                  }`}
                              </span>
                            </button>
                          ) : (
                            <span className="ai-role-badge">
                              Login as Customer to Buy
                            </span>
                          )}
                        </div>

                        {/* Stock */}
                        <span className="ai-stock-tag">
                          {formatStock(prod)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* =================================================
               NO PRODUCTS
            ================================================== */
            <div className="ai-no-products">
              <p>
                No products found matching these criteria
                in the database.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};