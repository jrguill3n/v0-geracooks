-- Add quote type fields to catering_quotes table
ALTER TABLE catering_quotes 
ADD COLUMN IF NOT EXISTS quote_type TEXT DEFAULT 'items' CHECK (quote_type IN ('items', 'per_person'));

ALTER TABLE catering_quotes 
ADD COLUMN IF NOT EXISTS people_count INTEGER;

ALTER TABLE catering_quotes 
ADD COLUMN IF NOT EXISTS price_per_person NUMERIC(10, 2);

-- Add index for quote_type
CREATE INDEX IF NOT EXISTS idx_catering_quotes_quote_type ON catering_quotes(quote_type);
