/*
  # Games, Writing Exercises, and Physical Tasks Tables
  
  ## Overview
  Creates tables for interactive learning games, writing exercises, and physical tasks
  for Flemish kindergarten education.
  
  ## New Tables
  
  ### `learning_games`
  - `id` (uuid, primary key)
  - `name` (text) - Game name
  - `emoji` (text) - Display emoji
  - `description` (text) - Short description
  - `question_count` (integer) - Number of questions in game
  - `goal_codes` (text[]) - Associated educational goal codes
  - `game_type` (text) - Type classification (colors, counting, shapes, etc.)
  - `difficulty_level` (integer) - 1-3 difficulty scale
  - `sort_order` (integer) - Display order
  - `is_active` (boolean) - Whether game is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `writing_exercises`
  - `id` (uuid, primary key)
  - `title` (text) - Exercise title
  - `emoji` (text) - Display emoji
  - `goal_codes` (text[]) - Associated goal codes
  - `description` (text) - Exercise description
  - `instructions` (text) - Detailed instructions
  - `tips` (text[]) - Array of tips
  - `exercise_type` (text) - pengreep, houding, lijnen, patronen, etc.
  - `sort_order` (integer) - Display order
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `physical_tasks`
  - `id` (uuid, primary key)
  - `title` (text) - Task title
  - `emoji` (text) - Display emoji
  - `goal_codes` (text[]) - Associated goal codes
  - `description` (text) - Task description
  - `instructions` (text) - How to perform the task
  - `duration_minutes` (integer) - Suggested duration
  - `materials_needed` (text[]) - Required materials
  - `task_category` (text) - motoriek, beweging, spel, etc.
  - `sort_order` (integer)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `game_sessions`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `game_id` (uuid, foreign key) - References learning_games table
  - `played_at` (timestamptz) - When game was played
  - `score` (integer) - Score achieved
  - `total_questions` (integer) - Total questions
  - `correct_answers` (integer) - Number correct
  - `duration_seconds` (integer) - Time taken
  - `created_by` (uuid, foreign key) - Teacher who logged it
  - `created_at` (timestamptz)
  
  ### `writing_practice_log`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `exercise_id` (uuid, foreign key) - References writing_exercises table
  - `practiced_at` (timestamptz) - When practiced
  - `notes` (text) - Teacher notes
  - `created_by` (uuid, foreign key)
  - `created_at` (timestamptz)
  
  ### `task_completion_log`
  - `id` (uuid, primary key)
  - `group_id` (uuid, foreign key) - References groups table
  - `task_id` (uuid, foreign key) - References physical_tasks table
  - `completed_at` (timestamptz) - When completed
  - `notes` (text) - Teacher notes
  - `created_by` (uuid, foreign key)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Read access for all authenticated users
  - Only school team members can log activities
*/

-- Create learning_games table
CREATE TABLE IF NOT EXISTS learning_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🎮',
  description text NOT NULL,
  question_count integer DEFAULT 10,
  goal_codes text[] NOT NULL DEFAULT '{}',
  game_type text NOT NULL,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 3),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create writing_exercises table
CREATE TABLE IF NOT EXISTS writing_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '✏️',
  goal_codes text[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  tips text[] DEFAULT '{}',
  exercise_type text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create physical_tasks table
CREATE TABLE IF NOT EXISTS physical_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  emoji text NOT NULL DEFAULT '✋',
  goal_codes text[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  duration_minutes integer DEFAULT 10,
  materials_needed text[] DEFAULT '{}',
  task_category text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  game_id uuid REFERENCES learning_games(id) ON DELETE CASCADE NOT NULL,
  played_at timestamptz DEFAULT now(),
  score integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create writing_practice_log table
CREATE TABLE IF NOT EXISTS writing_practice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES writing_exercises(id) ON DELETE CASCADE NOT NULL,
  practiced_at timestamptz DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create task_completion_log table
CREATE TABLE IF NOT EXISTS task_completion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES physical_tasks(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learning_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_practice_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_log ENABLE ROW LEVEL SECURITY;

-- Policies for learning_games (read-only for authenticated users)
CREATE POLICY "Anyone can read games"
  ON learning_games
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for writing_exercises (read-only for authenticated users)
CREATE POLICY "Anyone can read writing exercises"
  ON writing_exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for physical_tasks (read-only for authenticated users)
CREATE POLICY "Anyone can read physical tasks"
  ON physical_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for game_sessions
CREATE POLICY "Users can view sessions for their school's groups"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = game_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can log game sessions"
  ON game_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = game_sessions.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policies for writing_practice_log
CREATE POLICY "Users can view writing practice for their school's groups"
  ON writing_practice_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = writing_practice_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can log writing practice"
  ON writing_practice_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = writing_practice_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Policies for task_completion_log
CREATE POLICY "Users can view task completions for their school's groups"
  ON task_completion_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = task_completion_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can log task completions"
  ON task_completion_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = task_completion_log.group_id
      AND stm.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_games_type ON learning_games(game_type);
CREATE INDEX IF NOT EXISTS idx_learning_games_active ON learning_games(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_writing_exercises_type ON writing_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_physical_tasks_category ON physical_tasks(task_category);
CREATE INDEX IF NOT EXISTS idx_game_sessions_group ON game_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_writing_practice_group ON writing_practice_log(group_id);
CREATE INDEX IF NOT EXISTS idx_task_completion_group ON task_completion_log(group_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_learning_games_updated_at ON learning_games;
CREATE TRIGGER update_learning_games_updated_at
  BEFORE UPDATE ON learning_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_writing_exercises_updated_at ON writing_exercises;
CREATE TRIGGER update_writing_exercises_updated_at
  BEFORE UPDATE ON writing_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_physical_tasks_updated_at ON physical_tasks;
CREATE TRIGGER update_physical_tasks_updated_at
  BEFORE UPDATE ON physical_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
