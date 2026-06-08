import { Student, AttendanceRecord, Settings } from '../types';

export const db = {
  getStudents: async (): Promise<Student[]> => {
    const res = await fetch('/api/students');
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },
  
  saveStudent: async (student: Student): Promise<Student> => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    });
    if (!res.ok) throw new Error('Failed to save student');
    return res.json();
  },

  getStudentByMatric: async (matric: string): Promise<Student | undefined> => {
    const search = matric.toLowerCase();
    const students = await db.getStudents();
    return students.find(
      s => s.matric_number.toLowerCase() === search || 
           s.full_name.toLowerCase() === search ||
           s.full_name.toLowerCase().includes(search)
    );
  },

  deleteStudent: async (id: string): Promise<void> => {
    const res = await fetch(`/api/students?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete student');
  },

  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const res = await fetch('/api/attendance');
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  updateAttendance: async (id: string, updates: Partial<AttendanceRecord>): Promise<void> => {
    const res = await fetch('/api/attendance', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed to update attendance');
  },

  deleteAttendanceRecord: async (id: string): Promise<void> => {
    const res = await fetch(`/api/attendance?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attendance record');
  },

  saveAttendance: async (record: Omit<AttendanceRecord, 'id' | 'check_in_time'>): Promise<AttendanceRecord> => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to save attendance record');
    return res.json();
  },

  getSettings: async (): Promise<Settings> => {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },
  
  saveSettings: async (settings: Settings): Promise<void> => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  },

  isAdminAuth: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('faithtrack_auth') === 'true';
  },

  setAdminAuth: (status: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_auth', status ? 'true' : 'false');
  },
  
  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('faithtrack_auth');
  }
};
