import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseServer';

const defaultSettings = {
  chapelStartTime: '09:00',
  chapelLateTime: '09:30',
  devotionStartTime: '07:00',
  devotionLateTime: '07:15',
  schoolStartTime: '08:00',
  schoolLateTime: '08:30',
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ft_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json({
      chapelStartTime: data.chapel_start_time,
      chapelLateTime: data.chapel_late_time,
      devotionStartTime: data.devotion_start_time,
      devotionLateTime: data.devotion_late_time,
      schoolStartTime: data.school_start_time,
      schoolLateTime: data.school_late_time,
    });
  } catch (err: any) {
    console.error('Error in GET /api/settings:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chapelStartTime, chapelLateTime, devotionStartTime, devotionLateTime, schoolStartTime, schoolLateTime } = body;

    const dbSettings = {
      id: 1,
      chapel_start_time: chapelStartTime,
      chapel_late_time: chapelLateTime,
      devotion_start_time: devotionStartTime,
      devotion_late_time: devotionLateTime,
      school_start_time: schoolStartTime,
      school_late_time: schoolLateTime,
    };

    const { error } = await supabase
      .from('ft_settings')
      .upsert(dbSettings);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/settings:', err.message || err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
