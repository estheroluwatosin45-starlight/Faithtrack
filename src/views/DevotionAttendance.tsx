import { useEffect, useState } from 'react';
import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';
import { Settings } from '../types';
import { ShieldAlert } from 'lucide-react';

export default function DevotionAttendance() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    db.getSettings()
      .then(setSettings)
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Database Connection Failed</h3>
            <p className="text-sm text-slate-600">
              The application could not retrieve the settings from the database. This is usually because your Supabase credentials are not configured on Vercel yet.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100 space-y-2.5 text-xs text-slate-700">
            <p className="font-semibold text-slate-800">To fix this on Vercel:</p>
            <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>Open your <strong>Vercel Dashboard</strong>.</li>
              <li>Go to <strong>Settings &gt; Environment Variables</strong>.</li>
              <li>Add <code className="font-mono text-red-600 bg-red-50 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono text-red-600 bg-red-50 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
              <li>Go to <strong>Deployments</strong> and click <strong>Redeploy</strong> on your latest build.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

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
