/*
  # Create accounting tables for record management
  
  1. New Tables
    - `records` - Store accounting records (income, expense, debt, repayment)
    - `settings` - Store application settings (budget limits, warnings)
  
  2. Security
    - Enable RLS for both tables
    - Public read/write for demo (can be restricted later)
*/

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount FLOAT NOT NULL,
  note TEXT DEFAULT '',
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  budget_limit FLOAT DEFAULT 0,
  debt_warning_line FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on records" ON records FOR SELECT USING (true);
CREATE POLICY "Allow public insert on records" ON records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on records" ON records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on records" ON records FOR DELETE USING (true);

CREATE POLICY "Allow public read on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on settings" ON settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on settings" ON settings FOR DELETE USING (true);