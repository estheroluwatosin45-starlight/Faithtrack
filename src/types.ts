export interface Student {
  id: string; // Internal UUID
  matric_number: string;
  full_name: string;
  department: string;
  faculty: string;
  level: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string; // Foreign key
  student_name: string; // Denormalized for easy display
  matric_number: string; // Denormalized
  department: string; // Denormalized
  level: string; // Denormalized
  attendance_date: string; // YYYY-MM-DD
  status: 'Present' | 'Late' | 'Absent' | 'Early';
  check_in_time: string; // ISO string
  type: 'Chapel' | 'Devotion' | 'School';
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'SuperAdmin' | 'Admin';
  created_at: string;
}

export interface Settings {
  chapelStartTime: string;
  chapelLateTime: string;
  devotionStartTime: string;
  devotionLateTime: string;
  schoolStartTime: string;
  schoolLateTime: string;
}
