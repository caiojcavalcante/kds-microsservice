-- Migration: Add img column to categories table
-- Run this in Supabase SQL Editor or via CLI

-- Add nullable img column to categories table for category images
-- These images will show all items and prices of the category
ALTER TABLE categories ADD COLUMN IF NOT EXISTS img text;
