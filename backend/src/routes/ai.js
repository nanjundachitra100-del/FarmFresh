const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { callDeliveryOptimizer } = require('../services/m2mClient');

// Regex fallback parsing
function parseWithRegex(text) {
  const items = [];
  let maxBudget = null;

  // 1. Parse budget: e.g., "under 300", "budget 300", "max 300", "₹300", "$300"
  const budgetRegex = /(?:under|budget|max|limit|less than|within|₹|\$)\s*(\d+)/i;
  const budgetMatch = text.match(budgetRegex);
  if (budgetMatch) {
    maxBudget = parseFloat(budgetMatch[1]);
  }

  // 2. Parse items: e.g. "5 kg tomatoes", "2 kg tomatoes and 1 kg onions", "apples"
  const parts = text.split(/(?:and|plus|,|\+)/gi);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    const itemRegex = /^\s*(\d+(?:\.\d+)?)\s*(kg|lbs|lb|dozen|jar|jars|pack|packs|g|oz)?\s+(.+)$/i;
    const match = trimmed.match(itemRegex);
    if (match) {
      items.push({
        product: match[3].trim().toLowerCase(),
        quantity: parseFloat(match[1]),
        unit: match[2] ? match[2].trim().toLowerCase() : ''
      });
    } else {
      let cleanProd = trimmed
        .replace(/(?:under|budget|max|limit|less than|within|₹|\$)\s*\d+/gi, '')
        .trim();
      if (cleanProd) {
        items.push({
          product: cleanProd.toLowerCase(),
          quantity: 1,
          unit: ''
        });
      }
    }
  }

  return { items, maxBudget };
}

// Call Gemini API if key is present
async function parseWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Parse the following user request for products from an organic farm marketplace into a structured JSON format.\n\nUser request: "${text}"\n\nYou MUST respond with ONLY a valid JSON object matching this schema, without any markdown formatting, backticks, or extra text:\n{\n  "items": [\n    {\n      "product": "product name (e.g. tomatoes)",\n      "quantity": 5,\n      "unit": "kg"\n    }\n  ],\n  "maxBudget": 300\n}\n\nRules:\n1. If a quantity is not specified, default to 1.\n2. If a unit is not specified, leave it empty or default to 'lb' or 'kg' if implied.\n3. Extract maxBudget as a number. If not specified, maxBudget should be null.\n4. Only return valid JSON.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error('[aiRouter] Gemini API parsing failed, falling back to regex:', err.message);
    return null;
  }
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[aiRouter] Processing message: "${message}"`);

    // 1. Parse message
    let parsed = null;
    if (process.env.GEMINI_API_KEY) {
      parsed = await parseWithGemini(message);
    }
    
    if (!parsed) {
      parsed = parseWithRegex(message);
      parsed.parsedBy = 'regex-fallback';
    } else {
      parsed.parsedBy = 'gemini';
    }

    console.log('[aiRouter] Parsed intent:', JSON.stringify(parsed));

    // 2. Query all products from Supabase
    const { data: products, error: prodError } = await supabaseAdmin
      .from('products')
      .select('*, profiles:farmer_id (id, full_name, farm_name)')
      .order('created_at', { ascending: false });

    if (prodError) {
      return res.status(500).json({ error: `Failed to fetch products: ${prodError.message}` });
    }

    // 3. Match items in products list
    const matchedProducts = [];
    const missingItems = [];

    for (const item of parsed.items) {
      const term = item.product.toLowerCase();
      // Match singular / plural versions or fuzzy matching
      const matches = products.filter(p => {
        const pName = p.name.toLowerCase();
        const pDesc = p.description ? p.description.toLowerCase() : '';
        // Check if product name or description contains the search term or vice-versa
        return pName.includes(term) || term.includes(pName) || pDesc.includes(term);
      });

      if (matches.length > 0) {
        // Enforce maximum budget filter if set
        let filteredMatches = matches;
        if (parsed.maxBudget !== null && parsed.maxBudget !== undefined) {
          filteredMatches = matches.filter(p => {
            const calculatedTotal = parseFloat(p.price) * item.quantity;
            return calculatedTotal <= parsed.maxBudget;
          });
        }

        // Format products to standard UI shape
        const formatted = filteredMatches.map(row => ({
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
          requestedQty: item.quantity,
          requestedUnit: item.unit
        }));

        matchedProducts.push(...formatted);
      } else {
        missingItems.push(item.product);
      }
    }

    // 4. Request backend M2M delivery optimization
    let m2mResult = null;
    if (parsed.items.length > 0) {
      m2mResult = await callDeliveryOptimizer(parsed.items);
    }

    // 5. Generate human-readable response text
    let responseText = '';
    if (matchedProducts.length > 0) {
      responseText += `🍅 I found these matching items in the FarmFresh marketplace:\n\n`;
      matchedProducts.forEach((p, idx) => {
        responseText += `${idx + 1}. **${p.name}** - $${p.price.toFixed(2)}/${p.unit} (Farmer: ${p.farmerName})\n`;
      });
      responseText += `\nYou can add any of these directly to your cart below.`;
    } else {
      responseText += `🔍 Sorry, I couldn't find any products in our catalog matching "${parsed.items.map(i => i.product).join(', ')}"`;
      if (parsed.maxBudget) {
        responseText += ` under budget $${parsed.maxBudget}`;
      }
      responseText += `. Try searching for another farm item like tomatoes, apples, honey, or cheese.`;
    }

    if (m2mResult && m2mResult.m2mStatus === 'paid') {
      responseText += `\n\n🚚 *EcoExpress delivery fee optimized automatically (M2M x402 payment complete!)*`;
    } else if (m2mResult && m2mResult.m2mStatus === 'payment_required') {
      responseText += `\n\n⚠️ *Delivery optimizer requires M2M payment. Configure M2M_ALGORAND_MNEMONIC in backend to execute x402 payment.*`;
    }

    return res.json({
      success: true,
      message: responseText,
      intent: parsed,
      products: matchedProducts,
      missing: missingItems,
      m2m: m2mResult
    });

  } catch (error) {
    console.error('[aiRouter] Chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
