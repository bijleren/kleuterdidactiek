/*
  # Vocabulary Categories and Words Tables
  
  ## Overview
  Creates tables to store vocabulary categories and words for Flemish kindergarten education,
  integrating with the existing goal tracking system.
  
  ## New Tables
  
  ### `vocabulary_categories`
  - `id` (uuid, primary key)
  - `name` (text) - Category name (e.g., "Positie & Richting", "Aarde & Landschap")
  - `emoji` (text) - Display emoji for the category
  - `goal_codes` (text[]) - Associated educational goal codes
  - `goal_description` (text) - Description of what goals this category addresses
  - `category_type` (text) - Type classification (location, nature, weather, time, body, math, etc.)
  - `sort_order` (integer) - Display order
  - `is_active` (boolean) - Whether category is currently active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `vocabulary_words`
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key) - References vocabulary_categories
  - `word` (text) - The vocabulary word
  - `goal_codes` (text[]) - Specific goal codes for this word
  - `sort_order` (integer) - Display order within category
  - `is_active` (boolean) - Whether word is currently active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - All authenticated users can read vocabulary data
  - Only system/admin can modify vocabulary data
*/

-- Create vocabulary_categories table
CREATE TABLE IF NOT EXISTS vocabulary_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📚',
  goal_codes text[] NOT NULL DEFAULT '{}',
  goal_description text NOT NULL DEFAULT '',
  category_type text NOT NULL CHECK (category_type IN ('location', 'nature', 'weather', 'time', 'body', 'math', 'music', 'animals', 'art', 'writing', 'geography')),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vocabulary_words table
CREATE TABLE IF NOT EXISTS vocabulary_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES vocabulary_categories(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  goal_codes text[] NOT NULL DEFAULT '{}',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vocabulary_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_words ENABLE ROW LEVEL SECURITY;

-- Policies for vocabulary_categories
CREATE POLICY "Anyone can read vocabulary categories"
  ON vocabulary_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only system can modify vocabulary categories"
  ON vocabulary_categories
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Policies for vocabulary_words
CREATE POLICY "Anyone can read vocabulary words"
  ON vocabulary_words
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only system can modify vocabulary words"
  ON vocabulary_words
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vocabulary_categories_type ON vocabulary_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_vocabulary_categories_active ON vocabulary_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vocabulary_categories_sort ON vocabulary_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_vocabulary_words_category ON vocabulary_words(category_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_active ON vocabulary_words(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_sort ON vocabulary_words(category_id, sort_order);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_vocabulary_categories_updated_at ON vocabulary_categories;
CREATE TRIGGER update_vocabulary_categories_updated_at
  BEFORE UPDATE ON vocabulary_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vocabulary_words_updated_at ON vocabulary_words;
CREATE TRIGGER update_vocabulary_words_updated_at
  BEFORE UPDATE ON vocabulary_words
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
