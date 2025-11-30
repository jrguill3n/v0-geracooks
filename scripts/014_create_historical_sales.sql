-- Create table for historical sales data from previous years
CREATE TABLE IF NOT EXISTS historical_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  revenue DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Insert historical data from 2023, 2024, and 2025
INSERT INTO historical_sales (year, month, revenue) VALUES
  -- 2023 Data
  (2023, 1, 775.00),
  (2023, 2, 336.00),
  (2023, 3, 1029.00),
  (2023, 4, 1120.00),
  (2023, 5, 1252.00),
  (2023, 6, 1366.00),
  (2023, 7, 2776.00),
  (2023, 8, 1122.00),
  (2023, 9, 1890.50),
  (2023, 10, 1484.00),
  (2023, 11, 1440.00),
  (2023, 12, 2952.00),
  
  -- 2024 Data
  (2024, 1, 1260.00),
  (2024, 2, 2045.70),
  (2024, 3, 2555.00),
  (2024, 4, 2179.00),
  (2024, 5, 3632.00),
  (2024, 6, 1993.00),
  (2024, 7, 3083.00),
  (2024, 8, 2231.00),
  (2024, 9, 3740.00),
  (2024, 10, 1950.00),
  (2024, 11, 3829.00),
  (2024, 12, 4200.00),
  
  -- 2025 Data (partial year)
  (2025, 1, 3134.20),
  (2025, 2, 3081.10),
  (2025, 3, 4416.00),
  (2025, 4, 3293.00),
  (2025, 5, 7201.00),
  (2025, 7, 3503.00),
  (2025, 8, 3879.80),
  (2025, 9, 4713.50),
  (2025, 10, 1866.00)
ON CONFLICT (year, month) DO NOTHING;

-- Enable RLS
ALTER TABLE historical_sales ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read historical data
CREATE POLICY "Allow authenticated users to read historical sales"
  ON historical_sales
  FOR SELECT
  TO authenticated
  USING (true);
