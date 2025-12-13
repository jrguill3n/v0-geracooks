-- Create catering_quotes table
CREATE TABLE IF NOT EXISTS catering_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create catering_quote_items table
CREATE TABLE IF NOT EXISTS catering_quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES catering_quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE catering_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_quote_items ENABLE ROW LEVEL SECURITY;

-- Policies for catering_quotes
CREATE POLICY "Allow anyone to view catering quotes"
  ON catering_quotes FOR SELECT
  USING (true);

CREATE POLICY "Allow anyone to insert catering quotes"
  ON catering_quotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anyone to update catering quotes"
  ON catering_quotes FOR UPDATE
  USING (true);

CREATE POLICY "Allow anyone to delete catering quotes"
  ON catering_quotes FOR DELETE
  USING (true);

-- Policies for catering_quote_items
CREATE POLICY "Allow anyone to view catering quote items"
  ON catering_quote_items FOR SELECT
  USING (true);

CREATE POLICY "Allow anyone to insert catering quote items"
  ON catering_quote_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anyone to update catering quote items"
  ON catering_quote_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow anyone to delete catering quote items"
  ON catering_quote_items FOR DELETE
  USING (true);
