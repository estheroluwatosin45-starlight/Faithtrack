-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'General',
  faculty TEXT NOT NULL DEFAULT 'Science',
  level TEXT NOT NULL DEFAULT '100',
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  matric_number TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Absent', 'Early')),
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('Chapel', 'Devotion', 'School'))
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY CHECK (id = 1),
  chapel_start_time TEXT NOT NULL DEFAULT '09:00',
  chapel_late_time TEXT NOT NULL DEFAULT '09:30',
  devotion_start_time TEXT NOT NULL DEFAULT '07:00',
  devotion_late_time TEXT NOT NULL DEFAULT '07:15',
  school_start_time TEXT NOT NULL DEFAULT '08:00',
  school_late_time TEXT NOT NULL DEFAULT '08:30'
);

-- Seed default settings row if it doesn't exist
INSERT INTO settings (id, chapel_start_time, chapel_late_time, devotion_start_time, devotion_late_time, school_start_time, school_late_time)
VALUES (1, '09:00', '09:30', '07:00', '07:15', '08:00', '08:30')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public access (can be restricted as needed in production)
CREATE POLICY "Allow anonymous read/write access to students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read/write access to attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous read/write access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);
