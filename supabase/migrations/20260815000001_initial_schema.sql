-- ==============================================================================
-- FarmFresh Database Schema - Initial Migration
-- Migration: 20260815000001_initial_schema.sql
-- Description: Core tables, enums, triggers, and indexes for FarmFresh platform.
-- ==============================================================================

-- 1. Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'farmer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.product_category AS ENUM ('Vegetables', 'Fruits', 'Dairy & Eggs', 'Honey & Preserves');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Utility Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'customer',
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    farm_name TEXT,
    farm_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to automatically create a public.profile record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, full_name, farm_name)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'FarmFresh User'),
        NEW.raw_user_meta_data->>'farm_name'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    unit TEXT NOT NULL DEFAULT 'lb',
    category public.product_category NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for products.updated_at
DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    delivery_address TEXT NOT NULL,
    contact_phone TEXT,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status public.order_status NOT NULL DEFAULT 'pending',
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL DEFAULT 'x402 Protocol',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for orders.updated_at
DROP TRIGGER IF EXISTS tr_orders_updated_at ON public.orders;
CREATE TRIGGER tr_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Order Items Table (Normalized line items preserving historical purchase price)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_reported BOOLEAN NOT NULL DEFAULT false,
    report_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for reviews.updated_at
DROP TRIGGER IF EXISTS tr_reviews_updated_at ON public.reviews;
CREATE TRIGGER tr_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON public.products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_reported ON public.reviews(is_reported);
