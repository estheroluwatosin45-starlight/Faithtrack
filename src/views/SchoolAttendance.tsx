import { useEffect, useState } from 'react';
import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';
import { Settings } from '../types';

export default function SchoolAttendance() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    db.getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-slate-500 font-medium">Loading settings...</div>
      </div>
    );
  }
  
  return (
    <AttendanceForm 
      type="School"
      title="School Attendance"
      metadata={{
        venue: "Academic Block Lecture Hall",
        startTime: settings.schoolStartTime
      }}
    />
  );
}
