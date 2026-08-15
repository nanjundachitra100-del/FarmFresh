-- ==============================================================================
-- FarmFresh Database Schema - Row Level Security (RLS) Policies
-- Migration: 20260815000002_row_level_security.sql
-- Description: Enable RLS and define granular role-based security policies.
-- ==============================================================================

-- 1. Helper function for secure Admin privilege check
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uid IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_uid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Helper function to verify if a user is the farmer for a given product
CREATE OR REPLACE FUNCTION public.is_farmer_of_product(prod_id UUID, user_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uid IS NULL OR prod_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.products
        WHERE id = prod_id AND farmer_id = user_uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. PROFILES POLICIES
-- ==============================================================================

-- Anyone can read public profile details (Farmer names, reviews author display)
CREATE POLICY "Public can view profiles"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update only their own profile; Admins can update any
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- ==============================================================================
-- 5. PRODUCTS POLICIES
-- ==============================================================================

-- Anyone can browse products catalog
CREATE POLICY "Public can view all products"
    ON public.products
    FOR SELECT
    USING (true);

-- Only authenticated farmers can insert products for themselves, or Admins
CREATE POLICY "Farmers can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = farmer_id OR public.is_admin(auth.uid()));

-- Farmers can update only their own products; Admins can update any
CREATE POLICY "Farmers can update own products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = farmer_id OR public.is_admin(auth.uid()));

-- Farmers can delete only their own products; Admins can delete any
CREATE POLICY "Farmers can delete own products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (auth.uid() = farmer_id OR public.is_admin(auth.uid()));

-- ==============================================================================
-- 6. ORDERS POLICIES
-- ==============================================================================

-- Customers can view their own orders; Farmers can view orders for their products; Admins view all
CREATE POLICY "Customers, farmers, and admins can view relevant orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = customer_id
        OR public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            WHERE oi.order_id = public.orders.id AND p.farmer_id = auth.uid()
        )
    );

-- Authenticated customers can place orders for themselves
CREATE POLICY "Customers can create orders"
    ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = customer_id);

-- Farmers can update orders containing their items (status updates); Admins can update all
CREATE POLICY "Farmers and admins can update orders"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.order_items oi
            JOIN public.products p ON oi.product_id = p.id
            WHERE oi.order_id = public.orders.id AND p.farmer_id = auth.uid()
        )
    );

-- ==============================================================================
-- 7. ORDER ITEMS POLICIES
-- ==============================================================================

-- View items: Customers who placed the order, Farmers who own the product, or Admins
CREATE POLICY "Relevant parties can view order items"
    ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = public.order_items.order_id AND o.customer_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = public.order_items.product_id AND p.farmer_id = auth.uid()
        )
    );

-- Customers can insert items for their own orders
CREATE POLICY "Customers can insert order items"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = public.order_items.order_id AND o.customer_id = auth.uid()
        )
    );

-- ==============================================================================
-- 8. REVIEWS POLICIES
-- ==============================================================================

-- Anyone can view product reviews
CREATE POLICY "Public can view reviews"
    ON public.reviews
    FOR SELECT
    USING (true);

-- Customers can submit reviews for products
CREATE POLICY "Customers can create reviews"
    ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own reviews; Admins can update/moderate any review
CREATE POLICY "Customers and admins can update reviews"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = customer_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = customer_id OR public.is_admin(auth.uid()));

-- Customers can delete their own reviews; Admins can delete any review
CREATE POLICY "Customers and admins can delete reviews"
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid() = customer_id OR public.is_admin(auth.uid()));
