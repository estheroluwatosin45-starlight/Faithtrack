/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import ChapelAttendance from './pages/ChapelAttendance';
import DevotionAttendance from './pages/DevotionAttendance';
import SchoolAttendance from './pages/SchoolAttendance';
import AdminDashboard from './pages/AdminDashboard';
import AdminCalendar from './pages/AdminCalendar';
import AdminStudents from './pages/AdminStudents';
import AdminRecords from './pages/AdminRecords';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="school" element={<SchoolAttendance />} />
          <Route path="chapel" element={<ChapelAttendance />} />
          <Route path="devotion" element={<DevotionAttendance />} />
          
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="records/school" element={<AdminRecords type="School" />} />
          <Route path="records/chapel" element={<AdminRecords type="Chapel" />} />
          <Route path="records/devotion" element={<AdminRecords type="Devotion" />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
