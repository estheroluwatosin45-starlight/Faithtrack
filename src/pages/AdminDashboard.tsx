import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, BookOpen, Clock, AlertCircle, GraduationCap } from 'lucide-react';
import { db } from '../lib/db';
import { AttendanceRecord, Student } from '../types';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    setStudents(db.getStudents());
    setAttendance(db.getAttendance());
  }, []);

  const today = getLagosTodayStr();
  const chapelToday = attendance.filter(a => a.type === 'Chapel' && a.attendance_date === today);
  const devotionToday = attendance.filter(a => a.type === 'Devotion' && a.attendance_date === today);
  const schoolToday = attendance.filter(a => a.type === 'School' && a.attendance_date === today);

  // Calculate top attendee for morning devotion
  const devotionRecords = attendance.filter(a => a.type === 'Devotion');
  const devotionCounts = devotionRecords.reduce((acc, rec) => {
    acc[rec.student_id] = (acc[rec.student_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let topDevotionStudentId = '';
  let topDevotionCount = 0;
  for (const [id, count] of Object.entries(devotionCounts)) {
    if ((count as number) > topDevotionCount) {
      topDevotionCount = count as number;
      topDevotionStudentId = id;
    }
  }
  const topDevotionStudent = students.find(s => s.id === topDevotionStudentId);

  // Generate dynamic chart data for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = formatLagos(d, 'yyyy-MM-dd');
    const dayName = formatLagos(d, 'EEE');
    
    return {
      name: dayName,
      Chapel: attendance.filter(a => a.type === 'Chapel' && a.attendance_date === dateStr).length,
      Devotion: attendance.filter(a => a.type === 'Devotion' && a.attendance_date === dateStr).length,
      School: attendance.filter(a => a.type === 'School' && a.attendance_date === dateStr).length,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome! Here is the attendance summary for today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-slate-500">Registered in system</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapel Today</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chapelToday.length}</div>
            <p className="text-xs text-slate-500">Check-ins recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devotion Today</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devotionToday.length}</div>
            <p className="text-xs text-slate-500">Check-ins recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Today</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolToday.length}</div>
            <p className="text-xs text-slate-500">Check-ins recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Attendance Trends (This Week)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="Chapel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Devotion" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="School" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">🏆 Top Devotion Attendee</CardTitle>
            </CardHeader>
            <CardContent>
              {topDevotionStudent ? (
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {topDevotionStudent.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{topDevotionStudent.full_name}</div>
                    <div className="text-sm font-medium text-slate-500">{topDevotionCount} total morning devotion attendances</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">No devotion data yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Check-Ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...attendance].sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()).slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center">
                    <div className={`mr-4 h-2 w-2 rounded-full ${
                      a.type === 'Chapel' ? 'bg-blue-500' : 
                      a.type === 'School' ? 'bg-yellow-400' : 
                      'bg-emerald-500'
                    }`} />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">{a.student_name}</p>
                      <p className="text-xs text-slate-500">{a.type}</p>
                    </div>
                    <div className="ml-auto text-xs text-slate-500 font-medium">
                      {formatLagos(new Date(a.check_in_time), 'HH:mm')}
                    </div>
                  </div>
                ))}
                {attendance.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-8">No attendance records yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
