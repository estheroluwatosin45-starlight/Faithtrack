import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { AttendanceRecord, Student } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';

export default function AdminRecords({ type = 'All' }: { type?: 'All' | 'Chapel' | 'Devotion' | 'School' }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AttendanceRecord>>({});
  const [formData, setFormData] = useState({
    matric_number: '',
    level: '100L',
    type: type === 'All' ? 'Chapel' : type,
    status: 'Present' as 'Present' | 'Late' | 'Absent' | 'Early'
  });

  const fetchRecords = () => {
    let data = db.getAttendance();
    if (type !== 'All') {
      data = data.filter(r => r.type === type);
    }
    setRecords(data.sort((a,b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()));
  };

  const handleDeleteRecord = (id: string) => {
    db.deleteAttendanceRecord(id);
    fetchRecords();
    setConfirmingDeleteId(null);
  };

  useEffect(() => {
    fetchRecords();
    setFormData(prev => ({ ...prev, type: type === 'All' ? 'Chapel' : type }));
  }, [type]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    let student = db.getStudentByMatric(formData.matric_number);
    
    if (!student) {
      if (window.confirm("Student not found. Would you like to add them dynamically?")) {
        student = db.saveStudent({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          full_name: formData.matric_number,
          department: 'General',
          level: formData.level,
          matric_number: formData.matric_number
        } as Student);
      } else {
        return;
      }
    }
    
    const existingEntry = db.getAttendance().find(
      r => r.student_id === student.id && 
           r.attendance_date === getLagosTodayStr() && 
           r.type === formData.type
    );

    if (existingEntry) {
      alert(`Student is already marked present for ${formData.type} today.`);
      return;
    }
    
    db.saveAttendance({
      student_id: student.id,
      student_name: student.full_name,
      matric_number: student.matric_number,
      department: student.department,
      level: student.level,
      attendance_date: getLagosTodayStr(),
      status: formData.status,
      type: formData.type as 'Chapel' | 'Devotion' | 'School',
    });
    
    fetchRecords();
    setFormData({ ...formData, matric_number: '', level: '100L' });
    alert(`Successfully marked ${student.full_name} present for ${formData.type}.`);
  };

  const filtered = records.filter(r => {
    const term = search.toLowerCase();
    const dateStrFormatted = formatLagos(new Date(r.check_in_time), 'MMMM d yyyy').toLowerCase();
    const dateStrISO = r.attendance_date.toLowerCase();
    return r.student_name.toLowerCase().includes(term) || 
           (r.matric_number || '').toLowerCase().includes(term) ||
           r.department.toLowerCase().includes(term) ||
           dateStrFormatted.includes(term) ||
           dateStrISO.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold tracking-tight">
          {type === 'All' ? 'Complete Attendance Records' : `${type} Attendance`}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => {
            const dataRow = records.map(r => 
              `${r.attendance_date},${r.student_name},${r.matric_number},${r.department},${r.type},${r.status},${new Date(r.check_in_time).toISOString()}`
            ).join('\n');
            const csv = `Date,Student,Matric,Department,Type,Status,CheckIn\n${dataRow}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `semester_attendance_${type}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}>
            Export Full Semester
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Close Manual Entry' : 'Take Attendance'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Manual Attendance Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRecord} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-gray-700">Select Student</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.matric_number}
                  onChange={e => setFormData({...formData, matric_number: e.target.value})}
                  list="students-list-admin"
                  placeholder="Search name or matric..."
                  required
                />
                <datalist id="students-list-admin">
                  {db.getStudents().sort((a,b) => a.full_name.localeCompare(b.full_name)).map(s => (
                    <option key={s.id} value={s.full_name}>{s.matric_number}</option>
                  ))}
                </datalist>
              </div>
              
              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  required
                >
                  <option value="Chapel">Chapel</option>
                  <option value="Devotion">Morning Devotion</option>
                  <option value="School">School Start</option>
                </select>
              </div>

              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-gray-700">Level (if new)</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value})}
                  required
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

              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Early">Early</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              
              <Button type="submit" className="w-full sm:w-auto h-10">Mark Present</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <Input 
            placeholder="Filter by Name, Matric, Department, or Date (e.g. june 4)..." 
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
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Student</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                    
                    {editingRecordId === record.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input 
                            type="date"
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editFormData.attendance_date}
                            onChange={e => setEditFormData({...editFormData, attendance_date: e.target.value})}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{record.student_name}</div>
                        </td>
                        <td className="px-6 py-4">{record.department}</td>
                        <td className="px-6 py-4">
                          <select 
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editFormData.type}
                            onChange={e => setEditFormData({...editFormData, type: e.target.value as any})}
                          >
                            <option value="Chapel">Chapel</option>
                            <option value="Devotion">Devotion</option>
                            <option value="School">School</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={editFormData.status}
                            onChange={e => setEditFormData({...editFormData, status: e.target.value as any})}
                          >
                            <option value="Present">Present</option>
                            <option value="Early">Early</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {/* Time Editor - we construct a simple local time string for the input */}
                          <input 
                            type="time" 
                            step="1"
                            className="w-full font-mono rounded-md border border-gray-300 px-2 py-1 text-sm"
                            value={
                              editFormData.check_in_time 
                                ? new Date(editFormData.check_in_time).toLocaleTimeString('en-GB', { hour12: false }) 
                                : ''
                            }
                            onChange={e => {
                              try {
                                const newTime = e.target.value; // HH:mm:ss
                                const newDateStr = editFormData.attendance_date || record.attendance_date;
                                const originalDateObj = new Date(record.check_in_time);
                                const [h, m, s] = newTime.split(':');
                                originalDateObj.setHours(parseInt(h || '0'), parseInt(m || '0'), parseInt(s || '0'));
                                setEditFormData({...editFormData, check_in_time: originalDateObj.toISOString()});
                              } catch(err) {}
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                          <Button size="sm" onClick={() => {
                            db.updateAttendance(record.id, editFormData);
                            setEditingRecordId(null);
                            fetchRecords();
                          }}>
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingRecordId(null)}>
                            Cancel
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">{formatLagos(new Date(record.check_in_time), 'MMMM d yyyy')}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{record.student_name}</div>
                        </td>
                        <td className="px-6 py-4">{record.department}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            record.type === 'Chapel' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                            record.type === 'School' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                            'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            record.status === 'Present' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            record.status === 'Early' ? 'bg-teal-50 text-teal-700 ring-teal-600/20' : 
                            record.status === 'Late' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                            'bg-red-50 text-red-800 ring-red-600/20'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {formatLagos(new Date(record.check_in_time), 'HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                          {confirmingDeleteId === record.id ? (
                            <>
                              <span className="text-sm text-red-600 flex items-center mr-2">Confirm?</span>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteRecord(record.id)} className="bg-red-600 text-white hover:bg-red-700 border-transparent">
                                Yes, Remove
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => {
                                setEditingRecordId(record.id);
                                setEditFormData({
                                  type: record.type,
                                  status: record.status,
                                  attendance_date: record.attendance_date,
                                  check_in_time: record.check_in_time,
                                });
                              }}>
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(record.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                Remove
                              </Button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No records found.
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
