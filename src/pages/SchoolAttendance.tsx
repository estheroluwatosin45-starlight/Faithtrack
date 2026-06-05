import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';

export default function SchoolAttendance() {
  const settings = db.getSettings();
  
  return (
    <AttendanceForm 
      type="School"
      title="School Attendance Check-In"
      metadata={{
        theme: "Regular Academic Session",
        speaker: "Faculty Office",
        venue: "University Campus",
        startTime: settings.schoolStartTime
      }}
    />
  );
}
