-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  total_price numeric(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamp with time zone default now()
);

-- Create order_items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- Enable Row Level Security (but allow all operations for now since no auth)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Create policies that allow anyone to insert/view orders (no authentication required for customers)
create policy "Allow anyone to insert orders"
  on public.orders for insert
  with check (true);

create policy "Allow anyone to view orders"
  on public.orders for select
  using (true);

create policy "Allow anyone to update orders"
  on public.orders for update
  using (true);

create policy "Allow anyone to insert order items"
  on public.order_items for insert
  with check (true);

create policy "Allow anyone to view order items"
  on public.order_items for select
  using (true);
