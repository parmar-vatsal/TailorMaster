-- 1. Profiles (Extends auth.users through Trigger)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  shop_name text not null default 'My Shop',
  mobile text,
  email text,
  address text,
  gst_in text,
  logo_url text,
  pin text default '0000',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 2. Customers
create table public.customers (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  mobile text not null,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 3. Measurements
create table public.measurements (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  garment_type text not null, -- 'Shirt', 'Pant', etc.
  values jsonb not null default '{}'::jsonb,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id),
  -- Ensure one measurement set per garment type per customer
  unique (customer_id, garment_type)
);

-- 4. Orders
create table public.orders (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'Received', -- 'Received', 'Cutting', 'Stitching', 'Completed', 'Delivered'
  delivery_date date not null,
  total_amount numeric(10,2) not null default 0,
  advance_amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 5. Order Items
create table public.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  garment_type text not null,
  qty integer not null default 1,
  price numeric(10,2) not null default 0,
  measurement_snapshot jsonb, -- Freeze measurements at time of order
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 6. Expenses
create table public.expenses (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  amount numeric(10,2) not null,
  note text,
  date date not null default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 7. Designs (Catalog)
create table public.designs (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.measurements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;
alter table public.designs enable row level security;

-- Policies

-- Profiles: Users can only see/edit their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Customers
create policy "Users can manage own customers" on public.customers
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Measurements
create policy "Users can manage own measurements" on public.measurements
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Orders
create policy "Users can manage own orders" on public.orders
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Order Items (Indirectly secured by order_id, but better to explicit or join)
-- Since order_items don't have profile_id, we rely on the order relationship.
-- Ideally we duplicate profile_id or join. For strict RLS, easiest is:
-- Allow generic access if user owns the parent order.
create policy "Users can manage own order items" on public.order_items
  using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.profile_id = auth.uid())
  );

-- Expenses
create policy "Users can manage own expenses" on public.expenses
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Designs
create policy "Users can manage own designs" on public.designs
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Triggers for User Profile Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
