-- ==============================================================================
-- FarmFresh Database Seed Data
-- File: supabase/seed.sql
-- Description: Representative initial product listings for development.
-- Note: Products link to farmer profile UUIDs. When applying to local/hosted Supabase,
-- substitute or create farmer accounts first.
-- ==============================================================================

-- Example helper block: Only seeds if at least one farmer profile exists
DO $$
DECLARE
    v_farmer_id UUID;
BEGIN
    -- Check if a farmer profile exists to attach sample products
    SELECT id INTO v_farmer_id FROM public.profiles WHERE role = 'farmer' LIMIT 1;
    
    IF v_farmer_id IS NOT NULL THEN
        -- Insert initial products linked to the existing farmer
        INSERT INTO public.products (farmer_id, name, description, price, unit, category, quantity, image_url)
        VALUES
        (
            v_farmer_id,
            'Organic Heirloom Tomatoes',
            'Juicy, vine-ripened multi-color heirloom tomatoes. Grown using 100% organic practices. Perfect for salads, sauces, or caprese.',
            4.99,
            'lb',
            'Vegetables',
            45,
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'
        ),
        (
            v_farmer_id,
            'Fresh Honeycrisp Apples',
            'Crisp, sweet, and slightly tart Honeycrisp apples freshly picked from our orchard. Excellent for snacking and baking.',
            3.49,
            'lb',
            'Fruits',
            120,
            'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=600'
        ),
        (
            v_farmer_id,
            'Raw Wildflower Honey',
            '100% pure, unfiltered wildflower honey. Harvested from our happy bees. Natural sweetener full of antioxidants.',
            9.99,
            'jar (16oz)',
            'Honey & Preserves',
            30,
            'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600'
        ),
        (
            v_farmer_id,
            'Farm-Fresh Free-Range Brown Eggs',
            'One dozen large brown eggs from free-range chickens. Fed with organic, non-GMO grains. Rich orange yolks.',
            5.99,
            'dozen',
            'Dairy & Eggs',
            18,
            'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&q=80&w=600'
        ),
        (
            v_farmer_id,
            'Fresh Goat Milk Cheese (Chevre)',
            'Creamy, tangy, and soft goat milk cheese. Infused with fresh garden herbs. Made in small batches.',
            7.50,
            'pack (6oz)',
            'Dairy & Eggs',
            25,
            'https://images.unsplash.com/photo-1486887396153-fa416525c108?auto=format&fit=crop&q=80&w=600'
        ),
        (
            v_farmer_id,
            'Sweet Sugar Snap Peas',
            'Crisp and sweet sugar snap peas. Eat them raw, in stir-fries, or steamed. Children love them!',
            3.99,
            'lb',
            'Vegetables',
            40,
            'https://images.unsplash.com/photo-1589135799797-df004122cc77?auto=format&fit=crop&q=80&w=600'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
