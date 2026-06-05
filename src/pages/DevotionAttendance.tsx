import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';

export default function DevotionAttendance() {
  const settings = db.getSettings();
  
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
