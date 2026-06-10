import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../lib/db';
import { Student, AttendanceRecord } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';

// Helper to parse raw 2D grid from Excel and detect columns flexibly (e.g. for PDF converted layouts)
const parseExcelGrid = (grid: any[][]): Student[] => {
  if (grid.length === 0) return [];

  let headerRowIndex = -1;
  let nameColIndex = -1;
  let matricColIndex = -1;
  let deptColIndex = -1;
  let levelColIndex = -1;

  // 1. Search for a header row in the first 15 rows of the grid
  const maxSearchHeaderRows = Math.min(15, grid.length);
  for (let r = 0; r < maxSearchHeaderRows; r++) {
    const row = grid[r];
    if (!Array.isArray(row)) continue;

    let hasSN = false;
    let hasName = false;
    let hasMatric = false;

    row.forEach((cell) => {
      if (cell === null || cell === undefined) return;
      const val = String(cell).toLowerCase().trim();
      
      if (val === 's/n' || val === 'sn' || val === 's.n' || val === 'serial' || val === 'no' || val === 's.no' || val === 's/no') {
        hasSN = true;
      }
      if (val.includes('name') || val === 'student' || val === 'students') {
        hasName = true;
      }
      if (val.includes('matric') || val.includes('reg') || (val.includes('no') && val.includes('mat'))) {
        hasMatric = true;
      }
    });

    // If we find a row containing at least "Name" or Sn + Name, select it as the header
    if (hasName || (hasSN && grid[r].some(cell => String(cell).toLowerCase().includes('name')))) {
      headerRowIndex = r;
      break;
    }
  }

  // 2. Identify column indices based on the found header row
  if (headerRowIndex !== -1) {
    const headerRow = grid[headerRowIndex];
    headerRow.forEach((cell, cIndex) => {
      if (cell === null || cell === undefined) return;
      const val = String(cell).toLowerCase().trim().replace(/[^a-z0-9/]/g, '');

      if (val.includes('name') || val === 'student' || val === 'fullname' || val === 'studentname') {
        nameColIndex = cIndex;
      }
      else if (val.includes('matric') || val.includes('reg') || val.includes('id') || (val.includes('no') && val.includes('mat'))) {
        matricColIndex = cIndex;
      }
      else if (val.includes('dept') || val.includes('department') || val.includes('course') || val.includes('programme')) {
        deptColIndex = cIndex;
      }
      else if (val.includes('level') || val.includes('lvl') || val === 'year') {
        levelColIndex = cIndex;
      }
    });
  }

  // 3. Fallback: If no header row is identified, auto-detect columns by inspecting cell value types!
  if (nameColIndex === -1) {
    const colCount = Math.max(...grid.slice(0, 10).map(row => row.length));
    
    let bestNameCol = -1;
    let bestMatricCol = -1;
    let bestSNCol = -1;

    for (let c = 0; c < colCount; c++) {
      let nameLikes = 0;
      let matricLikes = 0;
      let serialLikes = 0;
      let sampleRows = 0;

      for (let r = 0; r < Math.min(10, grid.length); r++) {
        const row = grid[r];
        if (!Array.isArray(row) || c >= row.length) continue;
        const cell = row[c];
        if (cell === null || cell === undefined || String(cell).trim() === '') continue;
        const val = String(cell).trim();
        sampleRows++;

        if (/^[a-zA-Z0-9/-]{6,20}$/.test(val) && (val.includes('/') || val.includes('-') || /\d{3,}/.test(val))) {
          matricLikes++;
        }
        else if (/^[a-zA-Z\s]{5,40}$/.test(val) && val.includes(' ')) {
          nameLikes++;
        }
        else if (/^\d{1,3}$/.test(val)) {
          serialLikes++;
        }
      }

      if (sampleRows > 0) {
        if (nameLikes / sampleRows > 0.4) bestNameCol = c;
        if (matricLikes / sampleRows > 0.4) bestMatricCol = c;
        if (serialLikes / sampleRows > 0.6) bestSNCol = c;
      }
    }

    nameColIndex = bestNameCol;
    matricColIndex = bestMatricCol;

    if (nameColIndex === -1 && colCount > 1) {
      if (bestSNCol === 0) {
        nameColIndex = 1;
        if (colCount > 2) matricColIndex = 2;
      } else {
        nameColIndex = 0;
        if (colCount > 1) matricColIndex = 1;
      }
    }
  }

  // 4. Extract students from data rows
  const students: Student[] = [];
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let r = startRow; r < grid.length; r++) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const nameCell = nameColIndex !== -1 && nameColIndex < row.length ? row[nameColIndex] : null;
    const matricCell = matricColIndex !== -1 && matricColIndex < row.length ? row[matricColIndex] : null;
    const deptCell = deptColIndex !== -1 && deptColIndex < row.length ? row[deptColIndex] : null;
    const levelCell = levelColIndex !== -1 && levelColIndex < row.length ? row[levelColIndex] : null;

    if (!nameCell) continue;

    const nameStr = String(nameCell).trim();
    if (!nameStr || nameStr.toLowerCase() === 'name' || nameStr.toLowerCase() === 'student' || nameStr.toLowerCase().includes('total')) continue;

    let matricStr = matricCell ? String(matricCell).trim() : '';
    if (!matricStr || matricStr.toLowerCase() === 'matric' || matricStr.toLowerCase() === 'id' || matricStr.toLowerCase() === 'matric no' || matricStr.toLowerCase() === 'matric number') {
      matricStr = `IMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const deptStr = deptCell ? String(deptCell).trim() : 'General';
    let levelStr = levelCell ? String(levelCell).trim() : '100L';
    if (levelStr && !levelStr.endsWith('L') && !isNaN(Number(levelStr))) {
      levelStr = `${levelStr}L`;
    }

    students.push({
      id: crypto.randomUUID(),
      matric_number: matricStr,
      full_name: nameStr,
      department: deptStr,
      faculty: 'Science',
      level: levelStr,
      email: `${matricStr.toLowerCase()}@faithtrack.edu`,
      created_at: new Date().toISOString()
    } as Student);
  }

  return students;
};

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Correction Modal State
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<Student | null>(null);
  const [newRecordDate, setNewRecordDate] = useState(getLagosTodayStr());
  const [newRecordStatus, setNewRecordStatus] = useState<'Present' | 'Late' | 'Absent' | 'Early'>('Present');

  const [formData, setFormData] = useState({
    matric_number: '',
    full_name: '',
    department: '',
    faculty: '',
    level: '100L',
    email: '',
  });

  const fetchData = async () => {
    try {
      const [studentsList, attendanceList] = await Promise.all([
        db.getStudents(),
        db.getAttendance()
      ]);
      setStudents(studentsList);
      setAllAttendanceRecords(attendanceList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const devotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAttendanceRecords.filter(a => a.type === 'Devotion').forEach(record => {
      counts[record.student_id] = (counts[record.student_id] || 0) + 1;
    });
    return counts;
  }, [allAttendanceRecords]);

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
    try {
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
      await fetchData();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ matric_number: '', full_name: '', department: '', faculty: '', level: '100L', email: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to save student. Please verify that the matric number is unique and not already registered to another student.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await db.deleteStudent(id);
      await fetchData();
      setConfirmingDeleteId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete student.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(new Uint8Array(dataBuffer), { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Read as 2D array of rows
        const grid = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        // Parse the grid flexibly using our helper
        const studentsToImport = parseExcelGrid(grid);
        
        if (studentsToImport.length > 0) {
          await db.saveStudentsBulk(studentsToImport);
          await fetchData();
          alert(`Successfully imported ${studentsToImport.length} students!`);
        } else {
          alert("Could not identify any students in the Excel sheet. Please make sure there is a 'Name' or 'Full Name' column.");
        }
      } catch (err) {
        console.error("Error parsing Excel file", err);
        alert("Failed to parse the Excel file. Please ensure it's a valid format.");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddNewRecord = async () => {
    if (!selectedStudentForAttendance) return;
    try {
      const customTime = `${newRecordDate}T07:15:00.000Z`;

      await db.saveAttendance({
        student_id: selectedStudentForAttendance.id,
        student_name: selectedStudentForAttendance.full_name,
        matric_number: selectedStudentForAttendance.matric_number,
        department: selectedStudentForAttendance.department,
        level: selectedStudentForAttendance.level,
        attendance_date: newRecordDate,
        status: newRecordStatus,
        type: 'Devotion',
        ...({ check_in_time: customTime } as any)
      });

      await fetchData();
      alert(`Added devotion attendance for ${selectedStudentForAttendance.full_name} on ${newRecordDate}.`);
    } catch (err) {
      console.error(err);
      alert("Failed to add attendance record.");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm("Are you sure you want to remove this check-in?")) return;
    try {
      await db.deleteAttendanceRecord(recordId);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  const selectedStudentRecords = useMemo(() => {
    if (!selectedStudentForAttendance) return [];
    return allAttendanceRecords
      .filter(r => r.student_id === selectedStudentForAttendance.id && r.type === 'Devotion')
      .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime());
  }, [selectedStudentForAttendance, allAttendanceRecords]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Student Directory</h2>
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
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-800">{editingId ? 'Edit Student Details' : 'Register New Student'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <Input label="Full Name" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              <Input label="Matric Number" required value={formData.matric_number} onChange={e => setFormData({...formData, matric_number: e.target.value})} />
              <Input label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              <Input label="Faculty" required value={formData.faculty} onChange={e => setFormData({...formData, faculty: e.target.value})} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
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

      <Card className="border-slate-200">
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
                    <td className="px-6 py-4 text-center">
                      <button 
                        type="button" 
                        onClick={() => setSelectedStudentForAttendance(student)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-transparent border-none"
                        title="Click to correct attendance records"
                      >
                        {devotionCounts[student.id] || 0}
                      </button>
                    </td>
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

      {/* Manage Attendance Modal */}
      {selectedStudentForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Correct Attendance Records</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage devotion attendance history for <span className="font-semibold text-slate-700">{selectedStudentForAttendance.full_name}</span> ({selectedStudentForAttendance.matric_number})
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStudentForAttendance(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Add Manual Record Form */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Attendance Record</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">Select Date</label>
                    <input 
                      type="date"
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      value={newRecordDate}
                      onChange={e => setNewRecordDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">Status</label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      value={newRecordStatus}
                      onChange={e => setNewRecordStatus(e.target.value as any)}
                    >
                      <option value="Present">Present</option>
                      <option value="Early">Early</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                  <Button 
                    onClick={handleAddNewRecord} 
                    className="h-9 w-full sm:w-auto px-4 text-xs shrink-0"
                  >
                    Add Record
                  </Button>
                </div>
              </div>

              {/* Attendance Log List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Log</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[35vh] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudentRecords.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {formatLagos(new Date(record.check_in_time), 'EEEE, MMMM d, yyyy')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                              record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                              record.status === 'Early' ? 'bg-teal-50 text-teal-700 ring-teal-600/20' : 
                              record.status === 'Late' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                              'bg-rose-50 text-rose-800 ring-rose-600/20'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 px-2 py-1 h-7 text-[10px]"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {selectedStudentRecords.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-500 font-medium">
                            No devotion check-ins recorded for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/30">
              <Button onClick={() => setSelectedStudentForAttendance(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
