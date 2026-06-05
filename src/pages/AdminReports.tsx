import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AttendanceRecord, Student } from '../types';
import { Search } from 'lucide-react';

export default function AdminReports() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [searchMatric, setSearchMatric] = useState('');
  const [studentReport, setStudentReport] = useState<{
    student: Student;
    chapelCount: number;
    devotionCount: number;
    schoolCount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    setStudents(db.getStudents());
    setAttendance(db.getAttendance());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const search = searchMatric.toLowerCase();
    const student = students.find(s => s.matric_number.toLowerCase() === search || s.full_name.toLowerCase().includes(search));
    if (student) {
      const records = attendance.filter(a => a.student_id === student.id);
      const chapelCount = records.filter(a => a.type === 'Chapel').length;
      const devotionCount = records.filter(a => a.type === 'Devotion').length;
      const schoolCount = records.filter(a => a.type === 'School').length;
      setStudentReport({
        student,
        chapelCount,
        devotionCount,
        schoolCount,
        total: records.length
      });
    } else {
      setStudentReport(null);
      alert('Student not found.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold tracking-tight">System Reports</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Student Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                placeholder="Enter Name or Matric Number..." 
                value={searchMatric}
                onChange={e => setSearchMatric(e.target.value)}
                required
              />
              <Button type="submit" className="shrink-0 gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>

            {studentReport && (
              <div className="mt-8 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-lg">{studentReport.student.full_name}</h3>
                  <p className="text-slate-500 text-sm">{studentReport.student.matric_number} • {studentReport.student.department}</p>
                </div>

                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                    <dt className="text-sm font-medium text-slate-500">Total School</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">{studentReport.schoolCount}</dd>
                  </div>
                  <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                    <dt className="text-sm font-medium text-slate-500">Total Chapel</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">{studentReport.chapelCount}</dd>
                  </div>
                  <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                    <dt className="text-sm font-medium text-slate-500">Total Devotion</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-emerald-600">{studentReport.devotionCount}</dd>
                  </div>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <div className="text-sm font-medium text-slate-500">Total Database Records</div>
              <div className="mt-2 text-3xl font-semibold">{attendance.length} <span className="text-sm font-normal text-slate-500">check-ins</span></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full">Export to PDF</Button>
              <Button variant="outline" className="w-full">Export to Excel</Button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              Advanced reports and semester analytics will be generated as downloadable documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
