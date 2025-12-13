-- Add fields for order conversion tracking
ALTER TABLE catering_quotes
ADD COLUMN IF NOT EXISTS converted_order_id UUID REFERENCES orders(id),
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_catering_quotes_converted_order ON catering_quotes(converted_order_id);
