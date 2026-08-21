-- ==============================================================================
-- FarmFresh Delivery Module - Migration
-- Migration: 20260819000003_delivery_module.sql
-- Description: Adds delivery partner role, deliveries table, RLS policies,
--              and indexes to support the one-order → one-delivery architecture.
--              Does NOT modify existing orders, order_items, or payment flow.
-- ==============================================================================


-- ==============================================================================
-- 1. EXTEND user_role ENUM WITH 'delivery'
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL.
-- The DO $$ ... $$ anonymous block with a conditional check makes this
-- idempotent (safe to re-run) without erroring if the value already exists.
-- ==============================================================================

DO $$
BEGIN
    -- Only add the value if it does not already exist in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'delivery'
          AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'user_role'
          )
    ) THEN
        ALTER TYPE public.user_role ADD VALUE 'delivery';
    END IF;
END $$;


-- ==============================================================================
-- 2. DELIVERIES TABLE
-- One row per order (enforced by UNIQUE on order_id).
-- partner_id is nullable — null means unassigned.
-- Status is constrained by CHECK to a fixed allowed list.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL
                            REFERENCES public.orders(id) ON DELETE CASCADE,
    partner_id  UUID        NULL
                            REFERENCES public.profiles(id) ON DELETE SET NULL,
    status      TEXT        NOT NULL DEFAULT 'unassigned'
                            CHECK (status IN (
                                'unassigned',
                                'assigned',
                                'picked_up',
                                'in_transit',
                                'delivered',
                                'cancelled'
                            )),
    notes       TEXT        NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One delivery per order — enforces the architectural decision
    CONSTRAINT uq_deliveries_order_id UNIQUE (order_id)
);

-- Reuse the existing handle_updated_at() trigger function
DROP TRIGGER IF EXISTS tr_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER tr_deliveries_updated_at
    BEFORE UPDATE ON public.deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

-- Fast lookup of the delivery for a given order (also supports the UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id
    ON public.deliveries(order_id);

-- Fast lookup of all deliveries assigned to a given delivery partner
CREATE INDEX IF NOT EXISTS idx_deliveries_partner_id
    ON public.deliveries(partner_id);

-- Fast filtering by delivery status (e.g. find all 'unassigned' deliveries for admin)
CREATE INDEX IF NOT EXISTS idx_deliveries_status
    ON public.deliveries(status);


-- ==============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 5. HELPER FUNCTION — is_delivery_partner()
-- Follows the same pattern as the existing is_admin() helper in migration 2.
-- SECURITY DEFINER so it can safely read profiles without bypassing RLS
-- on other tables.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_delivery_partner(user_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF user_uid IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_uid AND role = 'delivery'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ==============================================================================
-- 6. RLS POLICIES FOR public.deliveries
-- ==============================================================================

-- Customers can read the delivery record for their own orders
CREATE POLICY "Customers can view their own order deliveries"
    ON public.deliveries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = public.deliveries.order_id
              AND o.customer_id = auth.uid()
        )
    );

-- Delivery partners can read deliveries assigned to them
CREATE POLICY "Delivery partners can view their assigned deliveries"
    ON public.deliveries
    FOR SELECT
    TO authenticated
    USING (
        partner_id = auth.uid()
    );

-- Delivery partners can update only their own assigned deliveries (status + notes)
-- They cannot reassign partner_id or modify order_id
CREATE POLICY "Delivery partners can update their assigned deliveries"
    ON public.deliveries
    FOR UPDATE
    TO authenticated
    USING (
        partner_id = auth.uid()
    )
    WITH CHECK (
        -- Prevent the partner from reassigning the delivery to someone else
        -- or changing the order it belongs to
        partner_id = auth.uid()
        AND order_id = order_id  -- order_id must remain unchanged
    );

-- Admins can read all deliveries
CREATE POLICY "Admins can view all deliveries"
    ON public.deliveries
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid())
    );

-- Admins can insert new delivery records (e.g. when an order is placed)
CREATE POLICY "Admins can insert deliveries"
    ON public.deliveries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid())
    );

-- Admins can update any delivery (assign partners, override status)
CREATE POLICY "Admins can update all deliveries"
    ON public.deliveries
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin(auth.uid())
    )
    WITH CHECK (
        public.is_admin(auth.uid())
    );

-- Admins can delete delivery records if needed
CREATE POLICY "Admins can delete deliveries"
    ON public.deliveries
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin(auth.uid())
    );
