/*
  # ER Watch Database Schema
  
  ## Overview
  Creates the core schema for tracking emergency room wait times and hospital information.
  
  ## New Tables
  
  ### `hospitals`
  Stores hospital information and metadata
  - `id` (uuid, primary key)
  - `name` (text) - Hospital name
  - `address` (text) - Full street address
  - `lat` (decimal) - Latitude coordinate
  - `lng` (decimal) - Longitude coordinate
  - `trauma_level` (int) - Trauma center level (1-4, null for non-trauma)
  - `type` (text) - 'emergency' or 'urgent_care'
  - `parking_available` (boolean) - Has parking
  - `pediatric` (boolean) - Pediatric services available
  - `open_24h` (boolean) - Open 24 hours
  - `phone` (text) - Contact phone number
  - `created_at` (timestamptz)
  
  ### `wait_times`
  Stores current and historical wait time data
  - `id` (uuid, primary key)
  - `hospital_id` (uuid, foreign key) - References hospitals
  - `wait_minutes` (int) - ER wait time in minutes
  - `drive_minutes` (int) - Estimated drive time (can be updated per user)
  - `crowd_level` (text) - 'low', 'medium', 'high'
  - `timestamp` (timestamptz) - When this data point was recorded
  - `created_at` (timestamptz)
  
  ### `user_reports`
  Stores user-submitted vibe checks and reports
  - `id` (uuid, primary key)
  - `hospital_id` (uuid, foreign key)
  - `report_type` (text) - Type of report
  - `value` (text) - Report value/description
  - `timestamp` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Public read access (authenticated and anonymous)
  - Write access for authenticated users only
*/

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  lat decimal(10, 8) NOT NULL,
  lng decimal(11, 8) NOT NULL,
  trauma_level int,
  type text NOT NULL DEFAULT 'emergency',
  parking_available boolean DEFAULT true,
  pediatric boolean DEFAULT false,
  open_24h boolean DEFAULT true,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create wait_times table
CREATE TABLE IF NOT EXISTS wait_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  wait_minutes int NOT NULL,
  drive_minutes int DEFAULT 15,
  crowd_level text DEFAULT 'medium',
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user_reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  value text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wait_times_hospital_id ON wait_times(hospital_id);
CREATE INDEX IF NOT EXISTS idx_wait_times_timestamp ON wait_times(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_hospital_id ON user_reports(hospital_id);

-- Enable Row Level Security
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wait_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Policies for hospitals (public read)
CREATE POLICY "Anyone can view hospitals"
  ON hospitals FOR SELECT
  TO public
  USING (true);

-- Policies for wait_times (public read)
CREATE POLICY "Anyone can view wait times"
  ON wait_times FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert wait times"
  ON wait_times FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for user_reports (public read, authenticated write)
CREATE POLICY "Anyone can view reports"
  ON user_reports FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can submit reports"
  ON user_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);