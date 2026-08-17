/*
# Create Group Board Rules Tables

## Overview
Adds two tables for group-level activity board restrictions that teachers can configure
per group. These rules are enforced on the activity board view when assigning students.

## New Tables

### `group_student_pair_restrictions`
Stores pairs of students who must NOT be placed in the same activity slot simultaneously.
- `id` (uuid, primary key)
- `group_id` (uuid, FK to groups) — which group this rule applies to
- `student_id_a` (uuid, FK to students) — first student in the banned pair (always the lesser uuid to prevent duplicates)
- `student_id_b` (uuid, FK to students) — second student in the banned pair (always the greater uuid)
- `created_by` (uuid, FK to auth.users) — teacher who created the rule
- `created_at` (timestamptz)

Unique constraint on (group_id, student_id_a, student_id_b) with a check that student_id_a < student_id_b
ensures every pair is stored exactly once regardless of insertion order.

### `group_activity_student_blocks`
Blocks a specific student from being placed in a specific activity option on any board for that group.
- `id` (uuid, primary key)
- `group_id` (uuid, FK to groups) — which group this rule applies to
- `activity_option_id` (uuid, FK to activity_options) — which activity slot is blocked
- `student_id` (uuid, FK to students) — which student is blocked from that activity
- `created_by` (uuid, FK to auth.users)
- `created_at` (timestamptz)

Unique constraint on (group_id, activity_option_id, student_id).

## Security
- RLS enabled on both tables.
- Authenticated school team members can read/write/delete rules for their school's groups.
  Checked via: groups → school_id → school_teammembers → user_id = auth.uid()

## Indexes
- group_id indexes on both tables for fast lookups when opening a board.
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Pair restrictions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_student_pair_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id_a uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_id_b uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, student_id_a, student_id_b),
  CHECK (student_id_a < student_id_b)
);

ALTER TABLE group_student_pair_restrictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gspr_group_id ON group_student_pair_restrictions(group_id);

DROP POLICY IF EXISTS "gspr_select" ON group_student_pair_restrictions;
CREATE POLICY "gspr_select" ON group_student_pair_restrictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_student_pair_restrictions.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "gspr_insert" ON group_student_pair_restrictions;
CREATE POLICY "gspr_insert" ON group_student_pair_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_student_pair_restrictions.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "gspr_delete" ON group_student_pair_restrictions;
CREATE POLICY "gspr_delete" ON group_student_pair_restrictions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_student_pair_restrictions.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Activity student blocks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_activity_student_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  activity_option_id uuid NOT NULL REFERENCES activity_options(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, activity_option_id, student_id)
);

ALTER TABLE group_activity_student_blocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gasb_group_id ON group_activity_student_blocks(group_id);

DROP POLICY IF EXISTS "gasb_select" ON group_activity_student_blocks;
CREATE POLICY "gasb_select" ON group_activity_student_blocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_activity_student_blocks.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "gasb_insert" ON group_activity_student_blocks;
CREATE POLICY "gasb_insert" ON group_activity_student_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_activity_student_blocks.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "gasb_delete" ON group_activity_student_blocks;
CREATE POLICY "gasb_delete" ON group_activity_student_blocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      JOIN school_teammembers stm ON stm.school_id = g.school_id
      WHERE g.id = group_activity_student_blocks.group_id
      AND stm.user_id = (SELECT auth.uid())
    )
  );
