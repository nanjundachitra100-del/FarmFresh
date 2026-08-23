/**
 * import-products.js
 *
 * One-time script to import backend/products.json into the Supabase products table.
 * Safe to run multiple times — skips products that already exist by name.
 *
 * Usage (from the backend/ folder):
 *   node import-products.js
 *
 * Requires in backend/.env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The script finds a real Supabase Auth user with role='farmer' to use as
 * farmer_id, respecting the FK constraint products.farmer_id -> profiles.id
 * -> auth.users.id.  It never creates a fake/arbitrary UUID.
 */

'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Supabase admin client (service role — server-side only)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// ---------------------------------------------------------------------------
// Price parser: "Rp8.000" -> 8000, "Rp25.500" -> 25500, "2000" -> 2000
// Indonesian format uses "." as thousands separator.
// ---------------------------------------------------------------------------
function parsePrice(raw) {
  if (typeof raw === 'number') return raw;
  const s = String(raw).trim();
  const cleaned = s.replace(/^Rp/i, '').replace(/\./g, '').replace(/,/g, '.').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) throw new Error(`Cannot parse price: "${raw}"`);
  return num;
}

// ---------------------------------------------------------------------------
// Category mapper: Firebase "type" -> Supabase product_category enum
// ---------------------------------------------------------------------------
function mapCategory(type) {
  const t = (type || '').toLowerCase().trim();
  if (t === 'buah') return 'Fruits';
  if (t === 'sayuran') return 'Vegetables';
  if (t === 'bumbu dapur') return 'Vegetables';
  console.warn(`  Unknown type "${type}" — defaulting to Vegetables`);
  return 'Vegetables';
}

// ---------------------------------------------------------------------------
// Find a real farmer profile from Supabase Auth + profiles table.
// Priority:
//   1. Any profile with role = 'farmer'
//   2. Any profile with role = 'admin' (admin can own demo products)
//   3. Any profile at all (first user)
// Returns { id, email } or null.
// ---------------------------------------------------------------------------
async function findFarmerUser() {
  // Look in public.profiles for a farmer or admin, joined with auth.users via
  // the admin API (listUsers) to get the email.

  // Step 1: find a farmer profile
  const { data: farmerProfiles, error: farmerErr } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'farmer')
    .limit(1);

  if (farmerErr) {
    console.error('ERROR querying profiles:', farmerErr.message);
    return null;
  }

  let profileId = farmerProfiles?.[0]?.id ?? null;
  let profileRole = 'farmer';

  // Step 2: fall back to admin
  if (!profileId) {
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'admin')
      .limit(1);
    profileId = adminProfiles?.[0]?.id ?? null;
    profileRole = 'admin';
  }

  // Step 3: fall back to any profile
  if (!profileId) {
    const { data: anyProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);
    profileId = anyProfiles?.[0]?.id ?? null;
    profileRole = anyProfiles?.[0]?.role ?? 'unknown';
  }

  if (!profileId) return null;

  // Resolve email from auth.users via the admin API
  const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(profileId);
  const email = userData?.user?.email ?? '(email unavailable)';
  if (userErr) {
    // Non-fatal — we still have the ID
  }

  return { id: profileId, email, role: profileRole };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== FarmFresh Product Import ===\n');

  // 1. Read products.json
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error(`ERROR: ${PRODUCTS_FILE} not found`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Products found in file: ${raw.length}`);

  // 2. Deduplicate and filter
  const seenNames = new Set();
  const skipped = [];
  const valid = [];

  for (const p of raw) {
    const name = (p.name || '').trim();

    if (name.toLowerCase() === 'test') {
      skipped.push({ name, reason: 'test record' });
      continue;
    }
    if (seenNames.has(name.toLowerCase())) {
      skipped.push({ name, reason: 'duplicate name' });
      continue;
    }
    seenNames.add(name.toLowerCase());
    valid.push(p);
  }

  console.log(`Skipped:   ${skipped.length}`);
  skipped.forEach(s => console.log(`  - "${s.name}" (${s.reason})`));
  console.log(`To import: ${valid.length}\n`);

  // 3. Resolve a real farmer_id from Supabase Auth
  console.log('Looking up farmer user in Supabase Auth...');
  const farmer = await findFarmerUser();

  if (!farmer) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║  NO SUITABLE USER FOUND IN SUPABASE                     ║');
    console.error('╠══════════════════════════════════════════════════════════╣');
    console.error('║  To fix this, create a farmer account in Supabase:       ║');
    console.error('║                                                           ║');
    console.error('║  1. Open your Supabase project dashboard.                ║');
    console.error('║  2. Go to: Authentication → Users → Add User             ║');
    console.error('║  3. Create a user with email:                            ║');
    console.error('║       farmer@farmfresh.com                               ║');
    console.error('║     and any password.                                    ║');
    console.error('║  4. Copy the UUID that Supabase assigns to that user.    ║');
    console.error('║  5. Go to: Table Editor → profiles                       ║');
    console.error('║  6. Insert a row:                                        ║');
    console.error('║       id        = <the UUID from step 4>                 ║');
    console.error('║       role      = farmer                                 ║');
    console.error('║       full_name = Green Valley Organic Farms             ║');
    console.error('║       farm_name = Green Valley Organic Farms             ║');
    console.error('║  7. Re-run: node import-products.js                      ║');
    console.error('╚══════════════════════════════════════════════════════════╝');
    process.exit(1);
  }

  console.log(`\nFARMER ID:    ${farmer.id}`);
  console.log(`FARMER EMAIL: ${farmer.email}`);
  console.log(`FARMER ROLE:  ${farmer.role}\n`);

  // 4. Fetch existing product names (idempotency)
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('name');

  if (fetchError) {
    console.error(`ERROR fetching existing products: ${fetchError.message}`);
    process.exit(1);
  }

  const existingNames = new Set(
    (existing || []).map(p => p.name.toLowerCase().trim())
  );
  console.log(`Already in Supabase: ${existingNames.size} product(s)\n`);

  // 5. Insert
  let inserted = 0;
  let alreadyExisted = 0;
  let errors = 0;

  for (const p of valid) {
    const name = p.name.trim();

    if (existingNames.has(name.toLowerCase())) {
      alreadyExisted++;
      console.log(`  SKIP (exists): ${name}`);
      continue;
    }

    let price;
    try {
      price = parsePrice(p.price);
    } catch (err) {
      console.error(`  ERROR parsing price for "${name}": ${err.message}`);
      errors++;
      continue;
    }

    const row = {
      farmer_id: farmer.id,
      name,
      description: (p.description || '').trim(),
      price,
      unit: 'kg',
      category: mapCategory(p.type),
      quantity: 100,
      image_url: (p.image || '').trim()
    };

    const { error: insertError } = await supabase
      .from('products')
      .insert(row);

    if (insertError) {
      console.error(`  ERROR inserting "${name}": ${insertError.message}`);
      errors++;
    } else {
      inserted++;
      console.log(`  INSERT: ${name} (${row.category}, Rp${price.toLocaleString('id-ID')})`);
    }
  }

  // 6. Summary
  console.log('\n=== Import Summary ===');
  console.log(`Total in file:       ${raw.length}`);
  console.log(`Skipped (filtered):  ${skipped.length}`);
  console.log(`Already in Supabase: ${alreadyExisted}`);
  console.log(`Inserted:            ${inserted}`);
  console.log(`Errors:              ${errors}`);
  console.log('=====================');

  if (errors > 0) process.exit(1);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
