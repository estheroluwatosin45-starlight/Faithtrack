import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Search } from 'lucide-react';
import { db } from '../lib/db';
import { Student } from '../types';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';

interface AttendanceFormProps {
  type: 'Chapel' | 'Devotion' | 'School';
  title: string;
  metadata: {
    theme?: string;
    speaker?: string;
    venue: string;
    startTime: string;
  };
}

export function AttendanceForm({ type, title, metadata }: AttendanceFormProps) {
  const [matric, setMatric] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [success, setSuccess] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newMatric, setNewMatric] = useState('');
  const [newDepartment, setNewDepartment] = useState('General');
  const [newLevel, setNewLevel] = useState('100L');
  const [statusOverride, setStatusOverride] = useState<'Auto' | 'Early' | 'Present' | 'Late' | 'Absent'>('Auto');

  const [settings, setSettings] = useState<any>(null);

  React.useEffect(() => {
    db.getStudents().then(list => {
      setStudents(list.sort((a, b) => a.full_name.localeCompare(b.full_name)));
    });
    db.getSettings().then(setSettings);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matric) return;
    const found = await db.getStudentByMatric(matric);
    if (found) {
      setStudent(found);
      setIsNew(false);
    } else {
      if (matric.toUpperCase().includes('IMP') || /\d/.test(matric) && matric.length > 3) {
        setNewMatric(matric.toUpperCase());
        setNewFullName('');
      } else {
        setNewFullName(matric);
        setNewMatric('');
      }
      setIsNew(true);
    }
  };

  const handleAddNewAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newMatric) {
      alert("Please provide both Full Name and Matric Number.");
      return;
    }
    const newStudent = await db.saveStudent({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      full_name: newFullName,
      department: newDepartment,
      level: newLevel,
      matric_number: newMatric
    } as Student);
    setStudent(newStudent);
    // Proceed to submit attendance in next tick
    setTimeout(() => {
      submitAttendanceForStudent(newStudent);
    }, 0);
  };

  const submitAttendanceForStudent = async (targetStudent: Student) => {
    // Determine status based on time
    const currentSettings = settings || await db.getSettings();
    let isLate = false;
    const now = new Date();
    const timeString = formatLagos(now, 'HH:mm');
    
    if (type === 'Chapel') {
      isLate = timeString > currentSettings.chapelLateTime;
    } else if (type === 'School') {
      isLate = timeString > currentSettings.schoolLateTime;
    } else {
      isLate = timeString > currentSettings.devotionLateTime;
    }

    let finalStatus: 'Present' | 'Late' | 'Absent' | 'Early';
    if (statusOverride !== 'Auto') {
      finalStatus = statusOverride as any;
    } else {
      finalStatus = isLate ? 'Late' : 'Present';
    }

    await db.saveAttendance({
      student_id: targetStudent.id,
      student_name: targetStudent.full_name,
      matric_number: targetStudent.matric_number,
      department: targetStudent.department,
      level: targetStudent.level,
      attendance_date: getLagosTodayStr(),
      status: finalStatus,
      type: type,
    });

    setSuccess(true);
    setTimeout(async () => {
      setSuccess(false);
      setStudent(null);
      setMatric('');
      setIsNew(false);
      setStatusOverride('Auto');
      // Refresh students list
      const list = await db.getStudents();
      setStudents(list.sort((a, b) => a.full_name.localeCompare(b.full_name)));
    }, 3000);
  };

  const handleSubmit = () => {
    if (!student) return;
    submitAttendanceForStudent(student);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p><strong>Date:</strong> {formatLagos(new Date(), 'MMM dd, yyyy')}</p>
              <p><strong>Time:</strong> {metadata.startTime}</p>
              <p><strong>Venue:</strong> {metadata.venue}</p>
              {metadata.theme && <p><strong>Theme:</strong> {metadata.theme}</p>}
              {metadata.speaker && <p><strong>Speaker:</strong> {metadata.speaker}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {!student && !isNew ? (
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="space-y-2 relative">
                    <label className="block text-sm font-medium text-gray-700">Search Name or Matric Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                        value={matric}
                        onChange={(e) => {
                          setMatric(e.target.value);
                          setIsNew(false);
                        }}
                        placeholder="Start typing name or matric number..."
                        required
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                    {matric.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden">
                        <ul className="max-h-60 overflow-auto divide-y divide-gray-100">
                          {students.filter(s => s.full_name.toLowerCase().includes(matric.toLowerCase()) || s.matric_number.toLowerCase().includes(matric.toLowerCase())).slice(0, 5).map(s => (
                            <li 
                              key={s.id} 
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                              onClick={() => {
                                setMatric(s.matric_number);
                                setStudent(s);
                                setIsNew(false);
                              }}
                            >
                              <div>
                                <div className="font-medium text-sm text-gray-900">{s.full_name}</div>
                                <div className="text-xs text-gray-500">{s.level} &bull; {s.department}</div>
                              </div>
                              <div className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {s.matric_number}
                              </div>
                            </li>
                          ))}
                          {students.filter(s => s.full_name.toLowerCase().includes(matric.toLowerCase()) || s.matric_number.toLowerCase().includes(matric.toLowerCase())).length === 0 && (
                            <li className="px-4 py-3 text-sm text-gray-500 text-center">
                              No match found. Continue to add new.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full py-3 h-auto text-base font-medium">Continue Check-in</Button>
                </form>
              ) : isNew ? (
                <form onSubmit={handleAddNewAndSubmit} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Student Not Found</h4>
                    <p className="text-sm text-blue-800 mb-4">
                      <strong>{matric}</strong> is not registered. You can add them as a new student to continue check-in.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matric Number *</label>
                        <input
                          type="text"
                          required
                          value={newMatric}
                          onChange={(e) => setNewMatric(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <input
                            type="text"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                          <select
                            value={newLevel}
                            onChange={(e) => setNewLevel(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Override (Optional)</label>
                        <select
                          value={statusOverride}
                          onChange={(e) => setStatusOverride(e.target.value as any)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Auto">Auto-detect based on time</option>
                          <option value="Early">Early</option>
                          <option value="Present">Present</option>
                          <option value="Late">Late</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setIsNew(false)} className="flex-1">Back</Button>
                    <Button type="submit" className="flex-1">Add & Check-in</Button>
                  </div>
                </form>
              ) : success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">Attendance Recorded!</h3>
                  <p className="text-gray-500">Thank you, {student?.full_name}.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Confirm Details</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{student?.full_name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Department</dt>
                        <dd className="mt-1 text-sm text-gray-900">{student?.department}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Level</dt>
                        <dd className="mt-1 text-sm text-gray-900">{student?.level}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 mb-1">Status Override (Optional)</dt>
                        <dd className="mt-1">
                          <select
                            value={statusOverride}
                            onChange={(e) => setStatusOverride(e.target.value as any)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="Auto">Auto-detect based on time</option>
                            <option value="Early">Early</option>
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStudent(null)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSubmit} className="flex-1">Submit Attendance</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
