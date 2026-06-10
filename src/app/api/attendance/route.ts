import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseServer';
import { historicAttendance } from '../../../lib/historicData';

// Helper to normalize names for mapping historic data
const normalizeName = (name: string) => {
  let cleaned = name.trim().replace(/\s*\d{3,}lvl\s*/i, "").replace(/^\d+\.\s*/, "").replace(/[^a-zA-Z\s]/g, " ").trim().toLowerCase();
  
  const aliases: Record<string, string> = {
    "fatile ephzibah": "fatile hepzibah ayoola",
    "fatile hepizibah": "fatile hepzibah ayoola",
    "fatile hepzibah": "fatile hepzibah ayoola",
    "adaron kola charles": "adaran-kola charles",
    "adarankola charles": "adaran-kola charles",
    "adaronkola charles": "adaran-kola charles",
    "adarana kola charles": "adaran-kola charles",
    "adaran kola  charles": "adaran-kola charles",
    "adaran-kola charles": "adaran-kola charles",
    "adeyiwol favor": "adeyiwola favour",
    "adeyiwola favour": "adeyiwola favour",
    "adu moyin": "adu moyinoluwa",
    "adu moyinoluwa": "adu moyinoluwa",
    "mr nathaniel": "oladunjoye nathaniel",
    "oladunjole nataniel": "oladunjoye nathaniel",
    "oladunjoye nathaniel": "oladunjoye nathaniel",
    "oliwafemi israel": "oluwafemi israel",
    "akerele oluwadamilola": "akerele damilola",
    "akerele damilola": "akerele damilola",
    "adebayo lfunu samuel": "adebayo ifunu samuel",
    "itunu samuel": "adebayo ifunu samuel",
    "timothy austin": "timothy pelumi austine",
    "timothy austine": "timothy pelumi austine",
    "timothy ustin": "timothy pelumi austine",
    "akonolafe toyinsole": "akomolafe toyinsola",
    "toyinsole": "akomolafe toyinsola",
    "adebayo steven": "adebayo stephen",
    "ekundayo success": "ekundayo success",
    "ekundayo stephen": "ekundayo success",
    "ayodele oluwajuwon": "ayodele olajuwon"
  };

  for (const [key, val] of Object.entries(aliases)) {
    if (cleaned.includes(key)) {
      return val;
    }
  }

  if (cleaned.includes("damilola") && !cleaned.includes("akerele")) return "akerele damilola";
  if (cleaned.includes("austin") && !cleaned.includes("timothy")) return "timothy pelumi austine";
  if (cleaned === "solomon") return "olawuyi solomon";
  if (cleaned === "destiny") return "agu destiny";
  if (cleaned === "babatunde") return "yusuf babatunde";
  if (cleaned === "progress") return "adeojo progress";
  
  return cleaned;
};

const matchStudent = (name: string, studentsList: any[]) => {
  const norm = normalizeName(name);
  let found = studentsList.find(s => s.full_name.toLowerCase() === norm);
  if (!found) {
    found = studentsList.find(s => {
      const sNorm = s.full_name.toLowerCase();
      return sNorm.includes(norm) || norm.includes(sNorm);
    });
  }
  return found;
};

export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('check_in_time', { ascending: false });

    if (error) throw error;

    // Auto-seed historic records if there are very few devotion records in the database (indicating it is not yet seeded)
    const devotionCount = records ? records.filter(r => r.type === 'Devotion').length : 0;
    if (devotionCount < 10 && historicAttendance && historicAttendance.length > 0) {
      console.log('Attendance records table has no historic data, seeding from historicData.ts...');
      
      // Fetch students list for mapping name -> id
      const { data: students, error: studentsErr } = await supabase
        .from('students')
        .select('*');

      if (studentsErr) throw studentsErr;

      if (students && students.length > 0) {
        const seededRecords: any[] = [];
        
        for (const item of historicAttendance) {
          const student = matchStudent(item.name, students);
          if (student) {
            seededRecords.push({
              student_id: student.id,
              student_name: student.full_name,
              matric_number: student.matric_number,
              department: student.department || 'General',
              level: student.level || '100L',
              attendance_date: item.date,
              status: 'Present',
              type: 'Devotion',
              check_in_time: `${item.date}T06:15:00.000Z`
            });
          }
        }

        console.log(`Prepared ${seededRecords.length} historic records for seeding.`);

        // Insert in batches of 1000 to avoid request body size limits
        const batchSize = 1000;
        for (let i = 0; i < seededRecords.length; i += batchSize) {
          const batch = seededRecords.slice(i, i + batchSize);
          const { error: batchErr } = await supabase
            .from('attendance_records')
            .insert(batch);
          if (batchErr) throw batchErr;
        }

        console.log('Seeded historic attendance successfully.');
        
        // Re-fetch records
        const { data: newRecords, error: refetchErr } = await supabase
          .from('attendance_records')
          .select('*')
          .order('check_in_time', { ascending: false });

        if (refetchErr) throw refetchErr;
        return NextResponse.json(newRecords || []);
      }
    }

    return NextResponse.json(records || []);
  } catch (err: any) {
    console.error('Error in GET /api/attendance:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { student_id, student_name, matric_number, department, level, attendance_date, status, type, check_in_time } = body;

    const newRecord = {
      student_id,
      student_name,
      matric_number,
      department: department || 'General',
      level: level || '100L',
      attendance_date,
      status,
      type,
      check_in_time: check_in_time || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('attendance_records')
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error in POST /api/attendance:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error in PATCH /api/attendance:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing record ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/attendance:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
