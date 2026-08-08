-- ============================================================
-- NdakoCare Database Migration 002
-- Create structured grocery order items
-- ============================================================
--
-- Purpose:
-- Store individual products belonging to a grocery order.
--
-- Relationship:
--
-- grocery_orders
--       |
--       | 1
--       |
--       | many
--       v
-- grocery_order_items
--
-- Existing grocery_orders.grocery_items is intentionally kept
-- for backward compatibility with existing orders.
-- ============================================================


CREATE TABLE IF NOT EXISTS public.grocery_order_items (

    -- Unique ID for each order item
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent grocery order
    order_id bigint NOT NULL,

    -- Product information captured at purchase time
    product_name text NOT NULL,
    product_unit text,

    -- Quantity selected by the customer
    quantity integer NOT NULL DEFAULT 1,

    -- Price of one unit at the time of purchase
    unit_price numeric(12,2) NOT NULL DEFAULT 0,

    -- Currency used for the item
    currency text NOT NULL DEFAULT 'XAF',

    -- Creation timestamp
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Relationship to grocery_orders
    CONSTRAINT grocery_order_items_order_id_fkey
        FOREIGN KEY (order_id)
        REFERENCES public.grocery_orders(id)
        ON DELETE CASCADE,

    -- Prevent invalid quantities
    CONSTRAINT grocery_order_items_quantity_check
        CHECK (quantity > 0),

    -- Prevent negative prices
    CONSTRAINT grocery_order_items_unit_price_check
        CHECK (unit_price >= 0)
);


-- ============================================================
-- Index
-- ============================================================
-- Makes queries such as:
--
-- SELECT *
-- FROM grocery_order_items
-- WHERE order_id = 7;
--
-- faster as the table grows.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_grocery_order_items_order_id
ON public.grocery_order_items(order_id);