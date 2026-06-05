import { Student, AttendanceRecord, AdminUser, Settings } from '../types';
import { initialStudents } from './data';
import { getInitialAttendance } from './attendanceData';

const KEYS = {
  STUDENTS: 'faithtrack_students_v3',
  ATTENDANCE: 'faithtrack_attendance_v8',
  ADMINS: 'faithtrack_admins',
  SETTINGS: 'faithtrack_settings',
  AUTH: 'faithtrack_auth',
};

const defaultSettings: Settings = {
  chapelStartTime: '09:00',
  chapelLateTime: '09:30',
  devotionStartTime: '07:00',
  devotionLateTime: '07:15',
  schoolStartTime: '08:00',
  schoolLateTime: '08:30',
};

export const db = {
  getStudents: (): Student[] => {
    let stored = localStorage.getItem(KEYS.STUDENTS);
    let parsed: Student[];
    if (!stored) {
      parsed = [...initialStudents];
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(parsed));
    } else {
      parsed = JSON.parse(stored);
    }

    
    // Auto migration to fix name based on user request
    const needsMigration = parsed.some(s => s.full_name === 'ADARAN-KOLA AYOMIPOSI');
    if (needsMigration) {
      const fixed = parsed.map(s => s.full_name === 'ADARAN-KOLA AYOMIPOSI' ? { ...s, full_name: 'ADARAN-KOLA CHARLES' } : s);
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(fixed));
      
      // Also fix in attendance records
      const attStored = localStorage.getItem(KEYS.ATTENDANCE);
      if (attStored) {
        let records: AttendanceRecord[] = JSON.parse(attStored);
        records = records.map(r => r.student_name === 'ADARAN-KOLA AYOMIPOSI' ? { ...r, student_name: 'ADARAN-KOLA CHARLES' } : r);
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
      }
      parsed = fixed;
    }

    // Auto migration to fix name Ekundayo Stephen -> Ekundayo Success AND deduplicate any identical names
    let needsUpdate = false;
    const dedupIdsToRemove = new Set<string>();
    const uniqueStudents = new Map<string, Student>();
    
    // First pass, rename
    let updatedParsed = parsed.map(s => {
      if (s.full_name.toLowerCase().includes('ekundayo stephen')) {
        needsUpdate = true;
        return { ...s, full_name: 'Ekundayo Success' };
      }
      return s;
    });

    // Second pass, deduplicate
    for (const student of updatedParsed) {
      const key = student.full_name.toLowerCase().trim();
      if (uniqueStudents.has(key)) {
        // Keep the first one, mark this one for removal
        const master = uniqueStudents.get(key)!;
        dedupIdsToRemove.add(student.id);
        
        // Transfer attendance records from student.id to master.id
        const attStored = localStorage.getItem(KEYS.ATTENDANCE);
        if (attStored) {
          let records: AttendanceRecord[] = JSON.parse(attStored);
          let changed = false;
          records = records.map(r => {
            // Also rename in attendance if it matches ekundayo stephen
            let rName = r.student_name;
            if (rName.toLowerCase().includes('ekundayo stephen')) {
              rName = 'Ekundayo Success';
              changed = true;
            }
            if (r.student_id === student.id) {
              changed = true;
              return { ...r, student_id: master.id, student_name: master.full_name, matric_number: master.matric_number, department: master.department || '', level: master.level || '' };
            } else if (rName !== r.student_name) {
              return { ...r, student_name: rName };
            }
            return r;
          });
          if (changed) {
            localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
          }
        }
      } else {
        uniqueStudents.set(key, student);
      }
    }
    
    if (dedupIdsToRemove.size > 0 || needsUpdate) {
      parsed = updatedParsed.filter(s => !dedupIdsToRemove.has(s.id));
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(parsed));
      
      // One final sweep of attendance records for the name change just in case there were no duplicates
      if (needsUpdate) {
        const attStored = localStorage.getItem(KEYS.ATTENDANCE);
        if (attStored) {
          let records: AttendanceRecord[] = JSON.parse(attStored);
          let changed = false;
          records = records.map(r => {
            if (r.student_name.toLowerCase().includes('ekundayo stephen')) {
              changed = true;
              return { ...r, student_name: 'Ekundayo Success' };
            }
            return r;
          });
          if (changed) {
            localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
          }
        }
      }
    }

    return parsed;
  },
  
  saveStudent: (student: Student) => {
    const students = db.getStudents();
    const existingIndex = students.findIndex(s => s.id === student.id);
    if (existingIndex >= 0) {
      students[existingIndex] = { ...students[existingIndex], ...student };
    } else {
      // It's a new student. Assign an id if none exists.
      students.push({ ...student, id: student.id || crypto.randomUUID(), created_at: student.created_at || new Date().toISOString() });
    }
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    
    // Also update any attendance records if their name or matric_number changed
    if (existingIndex >= 0) {
      const attStored = localStorage.getItem(KEYS.ATTENDANCE);
      if (attStored) {
        let records: AttendanceRecord[] = JSON.parse(attStored);
        let changed = false;
        records = records.map(r => {
          if (r.student_id === student.id) {
            changed = true;
            return { ...r, student_name: student.full_name, matric_number: student.matric_number, department: student.department || '', level: student.level || '' };
          }
          return r;
        });
        if (changed) {
          localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
        }
      }
    }
    
    return student;
  },

  getStudentByMatric: (matric: string): Student | undefined => {
    const search = matric.toLowerCase();
    return db.getStudents().find(
      s => s.matric_number.toLowerCase() === search || 
           s.full_name.toLowerCase() === search ||
           s.full_name.toLowerCase().includes(search)
    );
  },

  deleteStudent: (id: string) => {
    const students = db.getStudents();
    const filtered = students.filter(s => s.id !== id);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(filtered));
  },

  getAttendance: (): AttendanceRecord[] => {
    const stored = localStorage.getItem(KEYS.ATTENDANCE);
    if (!stored) {
      const records = getInitialAttendance(db.getStudents());
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
      return records;
    }
    return JSON.parse(stored);
  },

  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => {
    const attendance = db.getAttendance();
    const index = attendance.findIndex(a => a.id === id);
    if (index !== -1) {
      attendance[index] = { ...attendance[index], ...updates };
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
    }
  },

  deleteAttendanceRecord: (id: string) => {
    const attendance = db.getAttendance();
    const filtered = attendance.filter(a => a.id !== id);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(filtered));
  },

  saveAttendance: (record: Omit<AttendanceRecord, 'id' | 'check_in_time'>) => {
    const attendance = db.getAttendance();
    const newRecord: AttendanceRecord = {
      ...record,
      id: crypto.randomUUID(),
      check_in_time: new Date().toISOString(),
    };
    attendance.push(newRecord);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
    return newRecord;
  },

  getSettings: (): Settings => {
    const s = localStorage.getItem(KEYS.SETTINGS);
    return s ? JSON.parse(s) : defaultSettings;
  },
  
  saveSettings: (settings: Settings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  isAdminAuth: (): boolean => {
    return localStorage.getItem(KEYS.AUTH) === 'true';
  },

  setAdminAuth: (status: boolean) => {
    localStorage.setItem(KEYS.AUTH, status ? 'true' : 'false');
  },
  
  logout: () => {
    localStorage.removeItem(KEYS.AUTH);
  }
};
