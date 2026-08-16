// Centralized demo/demo-auth ID mappings for frontend
export const KNOWN_FARMER_ID = '2eb6466a-513a-4079-a4a0-60b2a21ca0e7';

// Other demo IDs used across the UI for legacy/demo purposes
export const LEGACY_DEMO_FARM_IDS = [
  '00000000-0000-0000-0000-000000000001', // default fallback farmer profile
  'farm-1'
];

export const ALL_DEMO_FARM_IDS = [
  ...LEGACY_DEMO_FARM_IDS,
  KNOWN_FARMER_ID
];

export default {
  KNOWN_FARMER_ID,
  LEGACY_DEMO_FARM_IDS,
  ALL_DEMO_FARM_IDS
};
