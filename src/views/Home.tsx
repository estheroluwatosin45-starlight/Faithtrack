import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ShieldCheck, BookOpen, Clock, CalendarCheck, GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { AttendanceRecord } from '../types';
import { Input } from '../components/ui/Input';
import { formatLagos, getLagosTodayStr } from '../lib/dateUtils';

export default function Home() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    db.getAttendance().then(allRecords => {
      allRecords.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime());
      setRecords(allRecords);
    }).catch(err => console.error(err));
  }, []);

  const filtered = records.filter(r => {
    const todayStr = getLagosTodayStr();
    const term = searchTerm.toLowerCase();
    const dateStrFormatted = formatLagos(new Date(r.check_in_time), 'MMMM d yyyy').toLowerCase();
    const dateStrISO = r.attendance_date.toLowerCase();
    
    // If there is no search term, only show today's records
    if (!searchTerm) {
      return r.attendance_date === todayStr;
    }
    
    // Otherwise show records that match the search term in name, department, or date
    return r.student_name.toLowerCase().includes(term) || 
           r.department.toLowerCase().includes(term) ||
           dateStrFormatted.includes(term) ||
           dateStrISO.includes(term);
  });

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-600/20">
              Welcome to Vessel of His Mercy
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl text-balance">
            School & Chapel Attendance System
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 text-balance">
            A digital platform for managing School, Chapel, and Morning Devotion attendance efficiently and accurately. Mark your attendance securely, or manage participation directly.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/school">
              <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">School Check-in</Button>
            </Link>
            <Link href="/devotion">
              <Button size="lg" className="rounded-full px-8 w-full sm:w-auto">Devotion Check-in</Button>
            </Link>
            <Link href="/chapel">
              <Button size="lg" className="rounded-full px-8 bg-gray-900 hover:bg-gray-800 w-full sm:w-auto">Chapel Check-in</Button>
            </Link>
          </div>
          <div className="mt-4 flex justify-center">
            <a href="#recent-checkins">
              <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50">View Recent Check-ins</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Public Attendance Records Section */}
      <section id="recent-checkins" className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Directory</h2>
            <p className="mt-4 text-lg text-gray-600">
              Search your name below to view your recent attendance records.
            </p>
          </div>
          
          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 cursor-text"
                placeholder="Search by name, department or date (e.g., june 4 2026)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-t border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((record, index) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4">{formatLagos(new Date(record.check_in_time), 'MMMM d yyyy')}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{record.student_name}</div>
                        <div className="text-xs text-slate-500">{record.department}</div>
                      </td>
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
                          record.status === 'Present' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {formatLagos(new Date(record.check_in_time), 'HH:mm')}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Faster Check-ins</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to track participation
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {[
                {
                  title: 'School Attendance',
                  description: 'Daily check-in for academic activities and regular class sessions.',
                  icon: GraduationCap,
                },
                {
                  title: 'Morning Devotion Attendance',
                  description: 'Students can quickly check in for daily devotion sessions using their Matric Number.',
                  icon: Clock,
                },
                {
                  title: 'Chapel Attendance',
                  description: 'Record participation during weekly chapel services with automated time logging.',
                  icon: BookOpen,
                },
                {
                  title: 'Attendance Reports',
                  description: 'Track attendance percentages and generate participation records across the semester.',
                  icon: CalendarCheck,
                },
              ].map((feature) => (
                <Card key={feature.title} className="border-none shadow-sm bg-white">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400">
                      <feature.icon className="h-6 w-6 text-yellow-950" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold leading-7 text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
