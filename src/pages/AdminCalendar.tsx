import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { AttendanceRecord, Student } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { formatLagos } from '../lib/dateUtils';
import { Users, GraduationCap, Clock, BookOpen } from 'lucide-react';

export default function AdminCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setAttendance(db.getAttendance());
  }, []);

  const selectedDateStr = selectedDate ? formatLagos(selectedDate, 'yyyy-MM-dd') : '';

  const dayAttendance = attendance.filter(a => a.attendance_date === selectedDateStr);
  const devotionRecords = dayAttendance.filter(a => a.type === 'Devotion');
  const chapelRecords = dayAttendance.filter(a => a.type === 'Chapel');
  const schoolRecords = dayAttendance.filter(a => a.type === 'School');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Attendance Calendar</h2>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border-0"
              modifiers={{
                hasData: (date) => {
                  const dStr = formatLagos(date, 'yyyy-MM-dd');
                  return attendance.some(a => a.attendance_date === dStr);
                }
              }}
              modifiersStyles={{
                hasData: { fontWeight: 'bold', textDecoration: 'underline' }
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                Summary for {selectedDate ? formatLagos(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center shadow-sm">
                    <div className="bg-blue-100 p-3 rounded-md text-blue-600 mr-4">
                      <Clock size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Morning Devotion</div>
                      <div className="text-2xl font-bold text-slate-900">{devotionRecords.length}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center shadow-sm">
                    <div className="bg-indigo-100 p-3 rounded-md text-indigo-600 mr-4">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">School</div>
                      <div className="text-2xl font-bold text-slate-900">{schoolRecords.length}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center shadow-sm">
                    <div className="bg-purple-100 p-3 rounded-md text-purple-600 mr-4">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Chapel</div>
                      <div className="text-2xl font-bold text-slate-900">{chapelRecords.length}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                  Please select a date on the calendar to view attendance details.
                </div>
              )}
            </CardContent>
          </Card>

          {selectedDate && dayAttendance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Records ({dayAttendance.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Matric No.</th>
                        <th className="px-6 py-3 font-medium text-center">Type</th>
                        <th className="px-6 py-3 font-medium text-center">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {dayAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-medium text-slate-900">{record.student_name}</div>
                            <div className="text-xs text-slate-500">{record.department}</div>
                          </td>
                          <td className="px-6 py-3 text-slate-500">{record.matric_number}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                              {record.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                record.status === 'Present' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                record.status === 'Late' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                'bg-red-50 text-red-800 ring-red-600/20'
                              }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-slate-500 font-mono">
                            {formatLagos(new Date(record.check_in_time), 'HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedDate && dayAttendance.length === 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-medium text-slate-900 mb-1">No Attendance Records</h3>
              <p className="text-sm text-slate-500">There are no attendance records for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
