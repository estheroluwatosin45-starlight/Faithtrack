import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Settings } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    chapelStartTime: '', chapelLateTime: '', devotionStartTime: '', devotionLateTime: '', schoolStartTime: '', schoolLateTime: ''
  });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    db.getSettings()
      .then(setSettings)
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.saveSettings(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <h2 className="text-xl font-bold tracking-tight">System Settings & Controls</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-700">Chapel Services</h3>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <Input type="time" label="Start Time" value={settings.chapelStartTime} onChange={e => setSettings({...settings, chapelStartTime: e.target.value})} required />
                  <Input type="time" label="Late Mark Threshold" value={settings.chapelLateTime} onChange={e => setSettings({...settings, chapelLateTime: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-700">Morning Devotion</h3>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <Input type="time" label="Start Time" value={settings.devotionStartTime} onChange={e => setSettings({...settings, devotionStartTime: e.target.value})} required />
                  <Input type="time" label="Late Mark Threshold" value={settings.devotionLateTime} onChange={e => setSettings({...settings, devotionLateTime: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-700">School Attendance</h3>
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <Input type="time" label="Start Time" value={settings.schoolStartTime} onChange={e => setSettings({...settings, schoolStartTime: e.target.value})} required />
                  <Input type="time" label="Late Mark Threshold" value={settings.schoolLateTime} onChange={e => setSettings({...settings, schoolLateTime: e.target.value})} required />
                </div>
              </div>

              <Button type="submit">Save Settings</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-500">Generate a unique session QR code for students to scan on arrival.</p>
            
            <div className="flex gap-4">
              <Button onClick={() => setShowQR(true)}>Generate QR Code</Button>
            </div>

            {showQR && (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <QRCodeSVG value="https://faithtrack.example.com/check-in/today" size={200} />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">Session ID: FT-{new Date().getTime().toString().slice(-6)}</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowQR(false)}>Hide QR Code</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
