import { useEffect, useState } from 'react';
import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';
import { Settings } from '../types';

export default function DevotionAttendance() {
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
      type="Devotion"
      title="Morning Devotion Attendance"
      metadata={{
        theme: "Daily Proverbs",
        speaker: "Chaplain Office",
        venue: "Faculty Halls",
        startTime: settings.devotionStartTime
      }}
    />
  );
}
