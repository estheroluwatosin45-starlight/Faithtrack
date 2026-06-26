import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseServer';
import { initialStudents } from '../../../lib/data';

export async function GET() {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;

    // Auto-seed if students table is completely empty
    if (!students || students.length === 0) {
      console.log('Students table is empty, seeding with initial students...');
      
      const seeded = initialStudents.map(s => ({
        matric_number: s.matric_number,
        full_name: s.full_name,
        department: s.department || 'General',
        faculty: s.faculty || 'Science',
        level: s.level || '100L',
        email: s.email,
        created_at: new Date().toISOString()
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('students')
        .insert(seeded)
        .select();

      if (insertError) throw insertError;
      return NextResponse.json(inserted);
    }

    return NextResponse.json(students);
  } catch (err: any) {
    console.error('Error in GET /api/students:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const formatted = body.map(s => {
        const matricUpper = (s.matric_number || '').toUpperCase();
        let dept = s.department || 'General';
        let fac = s.faculty || 'Nursing';
        
        if (matricUpper.includes('NUR')) {
          dept = 'Nursing';
          fac = 'Nursing';
        } else if (matricUpper.includes('PHT')) {
          dept = 'Physiotherapy';
          fac = 'Nursing';
        }

        const studentData: any = {
          matric_number: s.matric_number,
          full_name: s.full_name,
          department: dept,
          faculty: fac,
          level: s.level || '200L',
          email: s.email || '',
          phone: s.phone || null
        };
        if (s.id && !s.id.startsWith('student-initial-')) {
          studentData.id = s.id;
        }
        return studentData;
      });

      const { data, error } = await supabase
        .from('students')
        .upsert(formatted, { onConflict: 'matric_number' })
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { id, matric_number, full_name, department, faculty, level, email, phone } = body;

    const matricUpper = (matric_number || '').toUpperCase();
    let dept = department || 'General';
    let fac = faculty || 'Nursing';
    
    if (matricUpper.includes('NUR')) {
      dept = 'Nursing';
      fac = 'Nursing';
    } else if (matricUpper.includes('PHT')) {
      dept = 'Physiotherapy';
      fac = 'Nursing';
    }

    const studentData: any = {
      matric_number,
      full_name,
      department: dept,
      faculty: fac,
      level: level || '200L',
      email,
      phone
    };

    // If a valid ID is provided, include it to trigger an update/upsert
    if (id && !id.startsWith('student-initial-')) {
      studentData.id = id;
    }

    const { data, error } = await supabase
      .from('students')
      .upsert(studentData)
      .select()
      .single();

    if (error) throw error;

    // Propagate changes to attendance records if this is an edit operation
    if (id && !id.startsWith('student-initial-')) {
      const { error: updateRecordsError } = await supabase
        .from('attendance_records')
        .update({
          matric_number: data.matric_number,
          student_name: data.full_name,
          department: data.department,
          level: data.level
        })
        .eq('student_id', id);

      if (updateRecordsError) {
        console.error('Failed to update student attendance records:', updateRecordsError);
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error in POST /api/students:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/students:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
