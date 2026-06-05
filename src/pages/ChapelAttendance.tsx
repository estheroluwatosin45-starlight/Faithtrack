import { AttendanceForm } from '../components/AttendanceForm';
import { db } from '../lib/db';

export default function ChapelAttendance() {
  const settings = db.getSettings();
  
  return (
    <AttendanceForm 
      type="Chapel"
      title="Chapel Service Attendance"
      metadata={{
        theme: "Walking in Purpose",
        speaker: "Guest Minister Rev. Smith",
        venue: "Main University Auditorium",
        startTime: settings.chapelStartTime
      }}
    />
  );
}
