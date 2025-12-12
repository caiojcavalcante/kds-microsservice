-- Migration: Update RLS policies for addresses to allow employee/admin access
-- This is necessary because employees need to create addresses for other users (customers)
-- and for external customers (where user_id is null).

-- Enable RLS (just in case)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/confusion
DROP POLICY IF EXISTS "Individuals can create addresses." ON addresses;
DROP POLICY IF EXISTS "Individuals can view their own addresses." ON addresses;
DROP POLICY IF EXISTS "Individuals can update their own addresses." ON addresses;
DROP POLICY IF EXISTS "Individuals can delete their own addresses." ON addresses;
DROP POLICY IF EXISTS "Enable read access for all users" ON addresses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON addresses;

-- Create a permissive policy for authenticated users (Staff/Admins)
-- This allows any logged-in user to View, Create, Update, Delete ANY address.
-- In a more strict system, you might check for specific roles (e.g., 'admin' or 'cashier').
CREATE POLICY "Enable all access for authenticated users" 
ON addresses 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Optional: If you have public read requirements (unlikely for addresses), add them here.
-- Example: 
-- CREATE POLICY "Enable read access for everyone" ON addresses FOR SELECT USING (true);
