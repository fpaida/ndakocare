-- ============================================================
-- NdakoCare Database Migration
-- Migration: 001_fix_grocery_created_at.sql
--
-- Purpose:
-- Ensure every new grocery order receives the actual
-- date and time when the order is created.
--
-- Previous problem:
-- grocery_orders.created_at used a fixed timestamp:
-- 2026-05-27 07:20:36.87369+00
--
-- As a result, every newly created grocery order received
-- the same May 27, 2026 timestamp.
--
-- Fix:
-- PostgreSQL now evaluates now() whenever a new row is created.
-- ============================================================

ALTER TABLE public.grocery_orders
ALTER COLUMN created_at SET DEFAULT now();