import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/db';
import { AttendanceRecord, Student } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';
import { Folder, FolderOpen, ChevronDown, ChevronRight, Users, Clock, Calendar } from 'lucide-react';

export default function AdminRecords({ type = 'All' }: { type?: 'All' | 'Chapel' | 'Devotion' | 'School' }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<AttendanceRecord>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    matric_number: '',
    level: '100L',
    type: type === 'All' ? 'Chapel' : type,
    status: 'Present' as 'Present' | 'Late' | 'Absent' | 'Early'
  });

  const fetchRecords = async () => {
    try {
      let data = await db.getAttendance();
      if (type !== 'All') {
        data = data.filter(r => r.type === type);
      }
      setRecords(data.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    await db.deleteAttendanceRecord(id);
    fetchRecords();
    setConfirmingDeleteId(null);
  };

  useEffect(() => {
    fetchRecords();
    db.getStudents().then(setStudents).catch(err => console.error(err));
    setFormData(prev => ({ ...prev, type: type === 'All' ? 'Chapel' : type }));
  }, [type]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    let student = await db.getStudentByMatric(formData.matric_number);
    
    if (!student) {
      if (window.confirm("Student not found. Would you like to add them dynamically?")) {
        student = await db.saveStudent({
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
    
    const allAtt = await db.getAttendance();
    const existingEntry = allAtt.find(
      r => r.student_id === student.id && 
           r.attendance_date === getLagosTodayStr() && 
           r.type === formData.type
    );

    if (existingEntry) {
      alert(`Student is already marked present for ${formData.type} today.`);
      return;
    }
    
    const todayStr = getLagosTodayStr();
    await db.saveAttendance({
      student_id: student.id,
      student_name: student.full_name,
      matric_number: student.matric_number,
      department: student.department,
      level: student.level,
      attendance_date: todayStr,
      status: formData.status,
      type: formData.type as 'Chapel' | 'Devotion' | 'School',
    });
    
    // Refresh records list
    await fetchRecords();
    
    // Automatically expand today's date folder
    setExpandedDates(prev => ({ ...prev, [todayStr]: true }));
    
    setFormData({ ...formData, matric_number: '', level: '100L' });
    alert(`Successfully marked ${student.full_name} present for ${formData.type}.`);
  };

  // Filter records based on search criteria
  const filtered = useMemo(() => {
    return records.filter(r => {
      const term = search.toLowerCase();
      const dateStrFormatted = formatLagos(new Date(r.check_in_time), 'MMMM d yyyy').toLowerCase();
      const dateStrISO = r.attendance_date.toLowerCase();
      return r.student_name.toLowerCase().includes(term) || 
             (r.matric_number || '').toLowerCase().includes(term) ||
             r.department.toLowerCase().includes(term) ||
             dateStrFormatted.includes(term) ||
             dateStrISO.includes(term);
    });
  }, [records, search]);

  // Group filtered records by attendance_date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    filtered.forEach(record => {
      const date = record.attendance_date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    return groups;
  }, [filtered]);

  // Sorted dates descending (most recent first)
  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
  }, [groupedByDate]);

  // Auto-expand the most recent folder on initial load if no expansion is tracked yet
  useEffect(() => {
    if (sortedDates.length > 0 && Object.keys(expandedDates).length === 0) {
      setExpandedDates({ [sortedDates[0]]: true });
    }
  }, [sortedDates, expandedDates]);

  // Auto-expand folders when a search query is active
  useEffect(() => {
    if (search.trim() !== '') {
      const allExpanded: Record<string, boolean> = {};
      sortedDates.forEach(date => {
        allExpanded[date] = true;
      });
      setExpandedDates(allExpanded);
    }
  }, [search, sortedDates]);

  const formatDateHeader = (dateStr: string, sampleRecord: AttendanceRecord) => {
    try {
      return formatLagos(new Date(sampleRecord.check_in_time), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
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
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Manual Attendance Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRecord} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-slate-700">Select Student</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
                  value={formData.matric_number}
                  onChange={e => setFormData({...formData, matric_number: e.target.value})}
                  list="students-list-admin"
                  placeholder="Search name or matric..."
                  required
                />
                <datalist id="students-list-admin">
                  {students.sort((a,b) => a.full_name.localeCompare(b.full_name)).map(s => (
                    <option key={s.id} value={s.full_name}>{s.matric_number}</option>
                  ))}
                </datalist>
              </div>
              
              <div className="flex-1 w-full space-y-1">
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-slate-700">Level (if new)</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <Input 
            placeholder="Filter by Name, Matric, Department, or Date (e.g. june 4)..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md cursor-text"
          />
        </CardHeader>
        <CardContent className="p-4 bg-slate-50/20 space-y-4">
          {sortedDates.map(dateStr => {
            const dayRecords = groupedByDate[dateStr];
            const isExpanded = !!expandedDates[dateStr];
            const sampleRecord = dayRecords[0];
            const formattedDate = formatDateHeader(dateStr, sampleRecord);

            const presentCount = dayRecords.filter(r => r.status === 'Present' || r.status === 'Early').length;
            const lateCount = dayRecords.filter(r => r.status === 'Late').length;
            const absentCount = dayRecords.filter(r => r.status === 'Absent').length;

            return (
              <div 
                key={dateStr} 
                className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200"
              >
                {/* Collapsible Date Folder Header */}
                <button
                  type="button"
                  onClick={() => setExpandedDates(prev => ({ ...prev, [dateStr]: !isExpanded }))}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 cursor-pointer text-left transition-colors duration-200 gap-3 border-b border-transparent data-[expanded=true]:border-slate-200"
                  data-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-5 h-5 transition-transform duration-200" />
                      )}
                    </span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      {isExpanded ? (
                        <FolderOpen className="w-5 h-5" />
                      ) : (
                        <Folder className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-base">
                        {formattedDate}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {dayRecords.length} student{dayRecords.length === 1 ? '' : 's'} recorded
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                    {presentCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                        {presentCount} Present
                      </span>
                    )}
                    {lateCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10">
                        {lateCount} Late
                      </span>
                    )}
                    {absentCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                        {absentCount} Absent
                      </span>
                    )}
                  </div>
                </button>

                {/* Sub-table within the folder */}
                {isExpanded && (
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 font-medium w-16">#</th>
                          <th className="px-6 py-3 font-medium">Student</th>
                          <th className="px-6 py-3 font-medium">Department</th>
                          {type === 'All' && <th className="px-6 py-3 font-medium">Type</th>}
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Time</th>
                          <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayRecords.map((record, index) => (
                          <tr key={record.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-400">{index + 1}</td>
                            
                            {editingRecordId === record.id ? (
                              <>
                                <td className="px-6 py-4" colSpan={type === 'All' ? 3 : 2}>
                                  <div className="space-y-1">
                                    <div className="font-semibold text-slate-900">{record.student_name}</div>
                                    <div className="text-xs text-slate-500">{record.matric_number}</div>
                                  </div>
                                </td>
                                {type === 'All' && (
                                  <td className="px-6 py-4">
                                    <select 
                                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm bg-white text-slate-900"
                                      value={editFormData.type}
                                      onChange={e => setEditFormData({...editFormData, type: e.target.value as any})}
                                    >
                                      <option value="Chapel">Chapel</option>
                                      <option value="Devotion">Devotion</option>
                                      <option value="School">School</option>
                                    </select>
                                  </td>
                                )}
                                <td className="px-6 py-4">
                                  <select 
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm bg-white text-slate-900"
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
                                  <input 
                                    type="time" 
                                    step="1"
                                    className="w-full font-mono rounded-md border border-slate-300 px-2 py-1 text-sm bg-white text-slate-900"
                                    value={
                                      editFormData.check_in_time 
                                        ? new Date(editFormData.check_in_time).toLocaleTimeString('en-GB', { hour12: false }) 
                                        : ''
                                    }
                                    onChange={e => {
                                      try {
                                        const newTime = e.target.value; // HH:mm:ss
                                        const originalDateObj = new Date(record.check_in_time);
                                        const [h, m, s] = newTime.split(':');
                                        originalDateObj.setHours(parseInt(h || '0'), parseInt(m || '0'), parseInt(s || '0'));
                                        setEditFormData({...editFormData, check_in_time: originalDateObj.toISOString()});
                                      } catch(err) {}
                                    }}
                                  />
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                  <Button size="sm" onClick={async () => {
                                    await db.updateAttendance(record.id, editFormData);
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
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-800">{record.student_name}</div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5">{record.matric_number}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{record.department}</td>
                                {type === 'All' && (
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                      record.type === 'Chapel' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                                      record.type === 'School' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                                      'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                    }`}>
                                      {record.type}
                                    </span>
                                  </td>
                                )}
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                    record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                                    record.status === 'Early' ? 'bg-teal-50 text-teal-700 ring-teal-600/20' : 
                                    record.status === 'Late' ? 'bg-amber-50 text-amber-800 ring-amber-600/20' :
                                    'bg-rose-50 text-rose-800 ring-rose-600/20'
                                  }`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {formatLagos(new Date(record.check_in_time), 'HH:mm:ss')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                  {confirmingDeleteId === record.id ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
                                      <Button variant="outline" size="sm" onClick={() => handleDeleteRecord(record.id)} className="bg-rose-600 hover:bg-rose-700 text-white border-transparent">
                                        Yes, Remove
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                                        Cancel
                                      </Button>
                                    </div>
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
                                      <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteId(record.id)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
                                        Remove
                                      </Button>
                                    </>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {sortedDates.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Folder className="w-12 h-12 text-slate-300" />
              <p className="font-medium text-slate-700">No attendance folders found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or record attendance first.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
