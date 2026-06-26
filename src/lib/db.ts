import { Student, AttendanceRecord, Settings } from '../types';
import { initialStudents } from './data';
import { historicAttendance } from './historicData';

export const db = {
  generateUUID: (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  isOfflineMode: (): boolean => {
    if (typeof window === 'undefined') return false;
    const manualOffline = localStorage.getItem('faithtrack_offline_mode') === 'true';
    const browserOffline = !navigator.onLine;
    return manualOffline || browserOffline;
  },

  setOfflineMode: (status: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_offline_mode', status ? 'true' : 'false');
    db.triggerStorageChange();
  },

  getCachedStudents: (): Student[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('faithtrack_students_cache') || '[]');
    } catch {
      return [];
    }
  },

  setCachedStudents: (students: Student[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_students_cache', JSON.stringify(students));
  },

  getOfflineStudents: (): Student[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('faithtrack_offline_students') || '[]');
    } catch {
      return [];
    }
  },

  setOfflineStudents: (students: Student[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_offline_students', JSON.stringify(students));
  },

  getCachedAttendance: (): AttendanceRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('faithtrack_attendance_cache') || '[]');
    } catch {
      return [];
    }
  },

  setCachedAttendance: (records: AttendanceRecord[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_attendance_cache', JSON.stringify(records));
  },

  getOfflineAttendance: (): AttendanceRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('faithtrack_offline_attendance') || '[]');
    } catch {
      return [];
    }
  },

  setOfflineAttendance: (records: AttendanceRecord[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('faithtrack_offline_attendance', JSON.stringify(records));
  },

  triggerStorageChange: () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('storage'));
  },

  getStudents: async (): Promise<Student[]> => {
    if (db.isOfflineMode()) {
      let cached = db.getCachedStudents();
      if (cached.length === 0) {
        cached = initialStudents;
        db.setCachedStudents(cached);
      }
      const offline = db.getOfflineStudents();
      return [...cached, ...offline];
    }
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      
      const finalData = (data && data.length > 0) ? data : initialStudents;
      db.setCachedStudents(finalData);
      
      const offline = db.getOfflineStudents();
      return [...finalData, ...offline];
    } catch (err) {
      console.warn('Failed to fetch students, using cache:', err);
      let cached = db.getCachedStudents();
      if (cached.length === 0) {
        cached = initialStudents;
        db.setCachedStudents(cached);
      }
      const offline = db.getOfflineStudents();
      return [...cached, ...offline];
    }
  },
  
  saveStudent: async (student: Student): Promise<Student> => {
    if (db.isOfflineMode()) {
      return db.queueOfflineStudent(student);
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
      });
      if (!res.ok) throw new Error('Failed to save student');
      const saved = await res.json();
      
      const cached = db.getCachedStudents();
      const idx = cached.findIndex(s => s.matric_number === saved.matric_number);
      if (idx !== -1) {
        cached[idx] = saved;
      } else {
        cached.push(saved);
      }
      db.setCachedStudents(cached);
      db.triggerStorageChange();
      
      return saved;
    } catch (err) {
      console.warn('Network request failed, queueing student offline:', err);
      return db.queueOfflineStudent(student);
    }
  },

  saveStudentsBulk: async (students: Student[]): Promise<Student[]> => {
    if (db.isOfflineMode()) {
      return db.queueOfflineStudentsBulk(students);
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(students),
      });
      if (!res.ok) throw new Error('Failed to save students in bulk');
      const saved = await res.json();
      
      const cached = db.getCachedStudents();
      saved.forEach((s: Student) => {
        const idx = cached.findIndex(c => c.matric_number === s.matric_number);
        if (idx !== -1) {
          cached[idx] = s;
        } else {
          cached.push(s);
        }
      });
      db.setCachedStudents(cached);
      db.triggerStorageChange();
      
      return saved;
    } catch (err) {
      console.warn('Network request failed, queueing students bulk offline:', err);
      return db.queueOfflineStudentsBulk(students);
    }
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
    if (db.isOfflineMode()) {
      const offline = db.getOfflineStudents();
      const filtered = offline.filter(s => s.id !== id);
      if (filtered.length < offline.length) {
        db.setOfflineStudents(filtered);
        const cached = db.getCachedStudents();
        db.setCachedStudents(cached.filter(s => s.id !== id));
        db.triggerStorageChange();
        return;
      }
      throw new Error('Deletions of server students are not supported in offline mode.');
    }

    const res = await fetch(`/api/students?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete student');
    
    const cached = db.getCachedStudents();
    db.setCachedStudents(cached.filter(s => s.id !== id));
    db.triggerStorageChange();
  },

  getAttendance: async (): Promise<AttendanceRecord[]> => {
    if (db.isOfflineMode()) {
      let cached = db.getCachedAttendance();
      if (cached.length === 0) {
        cached = db.getInitialAttendanceRecords();
        db.setCachedAttendance(cached);
      }
      const offline = db.getOfflineAttendance();
      return [...offline, ...cached];
    }
    try {
      const res = await fetch('/api/attendance');
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      
      const finalData = (data && data.length > 0) ? data : db.getInitialAttendanceRecords();
      db.setCachedAttendance(finalData);
      
      const offline = db.getOfflineAttendance();
      return [...offline, ...finalData];
    } catch (err) {
      console.warn('Failed to fetch attendance, using cache:', err);
      let cached = db.getCachedAttendance();
      if (cached.length === 0) {
        cached = db.getInitialAttendanceRecords();
        db.setCachedAttendance(cached);
      }
      const offline = db.getOfflineAttendance();
      return [...offline, ...cached];
    }
  },

  updateAttendance: async (id: string, updates: Partial<AttendanceRecord>): Promise<void> => {
    if (db.isOfflineMode()) {
      const offline = db.getOfflineAttendance();
      const idx = offline.findIndex(r => r.id === id);
      if (idx !== -1) {
        offline[idx] = { ...offline[idx], ...updates } as any;
        db.setOfflineAttendance(offline);
        db.triggerStorageChange();
        return;
      }
      throw new Error('Updates to server records are not supported in offline mode.');
    }

    const res = await fetch('/api/attendance', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) throw new Error('Failed to update attendance');
    
    const cached = db.getCachedAttendance();
    const idx = cached.findIndex(r => r.id === id);
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], ...updates } as any;
      db.setCachedAttendance(cached);
      db.triggerStorageChange();
    }
  },

  deleteAttendanceRecord: async (id: string): Promise<void> => {
    if (db.isOfflineMode()) {
      const offline = db.getOfflineAttendance();
      const filtered = offline.filter(r => r.id !== id);
      if (filtered.length < offline.length) {
        db.setOfflineAttendance(filtered);
        db.triggerStorageChange();
        return;
      }
      throw new Error('Deletions of server records are not supported in offline mode.');
    }

    const res = await fetch(`/api/attendance?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attendance record');
    
    const cached = db.getCachedAttendance();
    db.setCachedAttendance(cached.filter(r => r.id !== id));
    db.triggerStorageChange();
  },

  saveAttendance: async (record: Omit<AttendanceRecord, 'id' | 'check_in_time'>): Promise<AttendanceRecord> => {
    if (db.isOfflineMode()) {
      return db.queueOfflineAttendance(record);
    }
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('Failed to save attendance record');
      const saved = await res.json();
      
      const cached = db.getCachedAttendance();
      db.setCachedAttendance([saved, ...cached]);
      db.triggerStorageChange();
      
      return saved;
    } catch (err) {
      console.warn('Network request failed, queueing attendance offline:', err);
      return db.queueOfflineAttendance(record);
    }
  },

  getSettings: async (): Promise<Settings> => {
    const defaultSettings: Settings = {
      chapelStartTime: '09:00',
      chapelLateTime: '09:30',
      devotionStartTime: '07:00',
      devotionLateTime: '07:15',
      schoolStartTime: '08:00',
      schoolLateTime: '08:30',
    };
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('faithtrack_settings_cache', JSON.stringify(data));
      }
      return data;
    } catch (err) {
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('faithtrack_settings_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.chapelStartTime) {
              return parsed;
            }
          }
        } catch {}
      }
      console.warn('Failed to fetch settings, using defaults:', err);
      return defaultSettings;
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('faithtrack_settings_cache', JSON.stringify(settings));
    }
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
  },

  syncOfflineData: async (): Promise<{ success: boolean; studentsSynced: number; attendanceSynced: number }> => {
    const offlineStudents = db.getOfflineStudents();
    const offlineAttendance = db.getOfflineAttendance();

    if (offlineStudents.length === 0 && offlineAttendance.length === 0) {
      return { success: true, studentsSynced: 0, attendanceSynced: 0 };
    }

    try {
      // 1. Sync students first (to avoid foreign key references failing)
      if (offlineStudents.length > 0) {
        const studentRes = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offlineStudents),
        });
        if (!studentRes.ok) throw new Error('Failed to sync offline students');
      }

      // 2. Sync attendance next
      if (offlineAttendance.length > 0) {
        const attendanceRes = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offlineAttendance),
        });
        if (!attendanceRes.ok) throw new Error('Failed to sync offline attendance');
      }

      // Clear queues on success
      db.setOfflineStudents([]);
      db.setOfflineAttendance([]);
      db.triggerStorageChange();

      // Refresh cached students and attendance to keep them fully synced
      try {
        const students = await db.getStudents();
        db.setCachedStudents(students);
        const attendance = await db.getAttendance();
        db.setCachedAttendance(attendance);
      } catch (e) {
        console.warn('Failed to pre-fetch after sync:', e);
      }

      return {
        success: true,
        studentsSynced: offlineStudents.length,
        attendanceSynced: offlineAttendance.length,
      };
    } catch (err) {
      console.error('Error syncing offline data:', err);
      throw err;
    }
  },

  queueOfflineStudent: (student: Student): Student => {
    const offlineStudents = db.getOfflineStudents();
    const studentWithId = {
      ...student,
      id: student.id || db.generateUUID(),
      created_at: student.created_at || new Date().toISOString()
    };
    
    const existingIdx = offlineStudents.findIndex(s => s.matric_number === studentWithId.matric_number);
    if (existingIdx !== -1) {
      offlineStudents[existingIdx] = studentWithId;
    } else {
      offlineStudents.push(studentWithId);
    }
    db.setOfflineStudents(offlineStudents);

    const cached = db.getCachedStudents();
    const cachedIdx = cached.findIndex(s => s.matric_number === studentWithId.matric_number);
    if (cachedIdx !== -1) {
      cached[cachedIdx] = studentWithId;
    } else {
      cached.push(studentWithId);
    }
    db.setCachedStudents(cached);
    
    db.triggerStorageChange();
    return studentWithId;
  },

  queueOfflineStudentsBulk: (students: Student[]): Student[] => {
    const offlineStudents = db.getOfflineStudents();
    const studentsWithId = students.map(s => ({
      ...s,
      id: s.id || db.generateUUID(),
      created_at: s.created_at || new Date().toISOString()
    }));
    
    const newOfflineStudents = [...offlineStudents];
    const cached = db.getCachedStudents();
    const newCached = [...cached];

    studentsWithId.forEach(s => {
      const existingIdx = newOfflineStudents.findIndex(o => o.matric_number === s.matric_number);
      if (existingIdx !== -1) {
        newOfflineStudents[existingIdx] = s;
      } else {
        newOfflineStudents.push(s);
      }

      const cacheIdx = newCached.findIndex(c => c.matric_number === s.matric_number);
      if (cacheIdx !== -1) {
        newCached[cacheIdx] = s;
      } else {
        newCached.push(s);
      }
    });

    db.setOfflineStudents(newOfflineStudents);
    db.setCachedStudents(newCached);
    db.triggerStorageChange();
    return studentsWithId;
  },

  queueOfflineAttendance: (record: Omit<AttendanceRecord, 'id' | 'check_in_time'>): AttendanceRecord => {
    const offlineAttendance = db.getOfflineAttendance();
    const tempRecord: AttendanceRecord = {
      ...record,
      id: db.generateUUID(),
      check_in_time: new Date().toISOString()
    };
    offlineAttendance.push(tempRecord);
    db.setOfflineAttendance(offlineAttendance);
    db.triggerStorageChange();
    return tempRecord;
  },

  getInitialAttendanceRecords: (): AttendanceRecord[] => {
    return historicAttendance.map((item, idx) => {
      const normInput = item.name.toLowerCase().replace(/[^a-z]/g, '');
      const student = initialStudents.find(s => {
        const normS = s.full_name.toLowerCase().replace(/[^a-z]/g, '');
        return normS.includes(normInput) || normInput.includes(normS);
      }) || initialStudents[idx % initialStudents.length];

      return {
        id: `historic-${idx}`,
        student_id: student.id,
        student_name: student.full_name,
        matric_number: student.matric_number,
        department: student.department || 'General',
        level: student.level || '200L',
        attendance_date: item.date,
        status: 'Present' as const,
        check_in_time: `${item.date}T06:15:00.000Z`,
        type: 'Devotion' as const
      };
    });
  }
};

