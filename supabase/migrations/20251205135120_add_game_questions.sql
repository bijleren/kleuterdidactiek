/*
  # Add Game Questions Table
  
  ## Overview
  Creates table to store interactive quiz questions for each learning game.
  
  ## New Tables
  
  ### `game_questions`
  - `id` (uuid, primary key)
  - `game_id` (uuid, foreign key) - References learning_games table
  - `question` (text) - The question text
  - `visual` (text) - Visual element (emoji or HTML)
  - `answer` (text) - Correct answer
  - `options` (text[]) - Multiple choice options
  - `sort_order` (integer) - Question order
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS
  - Read access for all authenticated users
*/

CREATE TABLE IF NOT EXISTS game_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES learning_games(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  visual text NOT NULL DEFAULT '',
  answer text NOT NULL,
  options text[] NOT NULL DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game questions"
  ON game_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_game_questions_game ON game_questions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_questions_sort ON game_questions(game_id, sort_order);
