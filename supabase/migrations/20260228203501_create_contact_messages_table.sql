/*
  # Create Contact Messages Table

  1. New Tables
    - `contact_messages`
      - `id` (uuid, primary key, auto-generated)
      - `created_at` (timestamptz, default now())
      - `name` (text, required) - Name of the person contacting
      - `email` (text, required) - Email address
      - `type` (text, required) - Type of contact (e.g., general, support, sales)
      - `subject` (text, required) - Subject line
      - `message` (text, required) - Message content
      - `ip` (text, nullable) - IP address of submitter
      - `status` (text, default 'new') - Status of the message (new, read, replied)
      - `notes` (text, nullable) - Internal notes
      - `replied_at` (timestamptz, nullable) - When replied
      - `replied_by` (text, nullable) - Who replied
      - `platform` (text, default 'bijleer.school') - Platform identifier

  2. Indexes
    - Index on status for filtering
    - Index on created_at for sorting
    - Index on email for lookup

  3. Security
    - Enable RLS on `contact_messages` table
    - Add policy for anonymous users to insert messages
    - Add policy for authenticated admins to read all messages
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  type text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  ip text,
  status text DEFAULT 'new',
  notes text,
  replied_at timestamptz,
  replied_by text,
  platform text NOT NULL DEFAULT 'bijleer.school'
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (true);