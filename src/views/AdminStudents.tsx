import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../lib/db';
import { Student, AttendanceRecord } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    matric_number: '',
    full_name: '',
    department: '',
    faculty: '',
    level: '100L',
    email: '',
  });

  useEffect(() => {
    Promise.all([db.getStudents(), db.getAttendance()])
      .then(([studentsList, attendanceList]) => {
        setStudents(studentsList);
        setAttendance(attendanceList.filter(a => a.type === 'Devotion'));
      })
      .catch(err => console.error(err));
  }, []);

  const devotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    attendance.forEach(record => {
      counts[record.student_id] = (counts[record.student_id] || 0) + 1;
    });
    return counts;
  }, [attendance]);

  const handleEdit = (student: Student) => {
    setFormData({
      matric_number: student.matric_number,
      full_name: student.full_name,
      department: student.department || '',
      faculty: student.faculty || '',
      level: student.level || '100L',
      email: student.email || '',
    });
    setEditingId(student.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const studentToUpdate = students.find(s => s.id === editingId);
      if (studentToUpdate) {
        await db.saveStudent({
          ...studentToUpdate,
          ...formData
        });
      }
    } else {
      await db.saveStudent({
        ...formData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      } as Student);
    }
    const updatedStudents = await db.getStudents();
    setStudents(updatedStudents);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ matric_number: '', full_name: '', department: '', faculty: '', level: '100L', email: '' });
  };

  const handleDelete = async (id: string) => {
    await db.deleteStudent(id);
    const updatedStudents = await db.getStudents();
    setStudents(updatedStudents);
    setConfirmingDeleteId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let count = 0;
        const promises: Promise<any>[] = [];
        for (const row of (data as any[])) {
          // Normalize keys to lowercase for flexible matching
          const normalizedRow: Record<string, string> = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = String(row[key]);
          });

          const matric = normalizedRow['matricnumber'] || normalizedRow['matricno'] || normalizedRow['matric'] || `IMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const name = normalizedRow['fullname'] || normalizedRow['name'] || normalizedRow['studentname'];
          
          if (name) {
            promises.push(db.saveStudent({
              id: crypto.randomUUID(),
              matric_number: matric,
              full_name: name,
              department: normalizedRow['department'] || normalizedRow['dept'] || '',
              faculty: normalizedRow['faculty'] || '',
              level: normalizedRow['level'] || '100L',
              email: normalizedRow['email'] || '',
              created_at: new Date().toISOString()
            } as Student));
            count++;
          }
        }
        
        await Promise.all(promises);
        const updatedStudents = await db.getStudents();
        setStudents(updatedStudents);
        alert(`Successfully imported ${count} students!`);
      } catch (err) {
        console.error("Error parsing Excel file", err);
        alert("Failed to parse the Excel file. Please ensure it's a valid format.");
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold tracking-tight">Student Directory</h2>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import Excel
          </Button>
          <Button onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) setEditingId(null);
          }}>
            {showAddForm ? 'Close Form' : 'Add New Student'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Student' : 'Register Student'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <Input label="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              <Input label="Matric Number" required value={formData.matric_number} onChange={e => setFormData({...formData, matric_number: e.target.value})} />
              <Input label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              <Input label="Faculty" required value={formData.faculty} onChange={e => setFormData({...formData, faculty: e.target.value})} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value})}
                >
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="submit">Save Student</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <Input 
            placeholder="Search by Name, Matric, or Department..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md cursor-text"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-t border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Matric Number</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Level</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium text-center">Devotion Att.</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.filter(s => {
                  const term = search.toLowerCase();
                  return s.full_name.toLowerCase().includes(term) || 
                         (s.matric_number || '').toLowerCase().includes(term) || 
                         (s.department || '').toLowerCase().includes(term);
                }).map(student => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{student.matric_number}</td>
                    <td className="px-6 py-4">{student.full_name}</td>
                    <td className="px-6 py-4">{student.department}</td>
                    <td className="px-6 py-4">{student.level}</td>
                    <td className="px-6 py-4 text-slate-500">{student.email}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">{devotionCounts[student.id] || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {confirmingDeleteId === student.id ? (
                          <>
                            <span className="text-sm text-red-600 flex items-center mr-2">Confirm?</span>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(student.id)} className="bg-red-600 text-white hover:bg-red-700 border-transparent">
                              Yes, Remove
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(student.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No students are currently registered in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
