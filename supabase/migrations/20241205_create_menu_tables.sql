-- Migration: Create menu tables
-- Run this in Supabase SQL Editor or via CLI

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sort_order integer default 0,
  schedule_available text default '1111111',
  schedule_type integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);PS C:\Users\Danie\Documents\Github\kds-microsservice> npx ts-node scripts/import-menu-to-supabase.ts
Need to install the following packages:
ts-node@10.9.2
Ok to proceed? (y) y

❌ Missing environment variables:
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
PS C:\Users\Danie\Documents\Github\kds-microsservice> 

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null default 0,
  promotional_price decimal(10,2),
  img text,
  sort_order integer default 0,
  schedule_available text default '1111111',
  schedule_type integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster category lookups
create index if not exists idx_products_category_id on products(category_id);

-- ============================================
-- 3. CHOICE GROUPS TABLE (Add-on groups like "ADICIONAIS")
-- ============================================
create table if not exists choice_groups (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade not null,
  name text not null,
  required boolean default false,
  min_selections integer default 0,
  max_selections integer default 1,
  use_greater_option_price boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster product lookups
create index if not exists idx_choice_groups_product_id on choice_groups(product_id);

-- ============================================
-- 4. CHOICE OPTIONS TABLE (Individual add-ons)
-- ============================================
create table if not exists choice_options (
  id uuid default gen_random_uuid() primary key,
  choice_group_id uuid references choice_groups(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) default 0,
  img text,
  max_quantity integer default 1,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster choice group lookups
create index if not exists idx_choice_options_group_id on choice_options(choice_group_id);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
alter table categories enable row level security;
alter table products enable row level security;
alter table choice_groups enable row level security;
alter table choice_options enable row level security;

-- Categories: Everyone can read, only admins can write
create policy "Categories are viewable by everyone" on categories
  for select using (true);

create policy "Only admins can insert categories" on categories
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update categories" on categories
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete categories" on categories
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Products: Everyone can read, only admins can write
create policy "Products are viewable by everyone" on products
  for select using (true);

create policy "Only admins can insert products" on products
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update products" on products
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete products" on products
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Choice Groups: Everyone can read, only admins can write
create policy "Choice groups are viewable by everyone" on choice_groups
  for select using (true);

create policy "Only admins can insert choice_groups" on choice_groups
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update choice_groups" on choice_groups
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete choice_groups" on choice_groups
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Choice Options: Everyone can read, only admins can write
create policy "Choice options are viewable by everyone" on choice_options
  for select using (true);

create policy "Only admins can insert choice_options" on choice_options
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update choice_options" on choice_options
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete choice_options" on choice_options
  for delete using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_categories_updated_at
  before update on categories
  for each row execute function update_updated_at_column();

create trigger update_products_updated_at
  before update on products
  for each row execute function update_updated_at_column();
