import fs from "fs";
import crypto from "crypto";

const rawText = fs.readFileSync("./src/data/raw-devotion.txt", "utf-8");

// Parse logic
let currentDate = "";
let year = 2026;
const records = [];
const students = new Map();

// Helper to normalize names
const normalizeName = (name) => {
  let cleaned = name.trim().replace(/\s*\d{3,}lvl\s*/i, "").replace(/^\d+\.\s*/, "").replace(/[^a-zA-Z\s]/g, " ").trim().toLowerCase();
  
  const aliases = {
    "adaron kola charles": "Adaran Kola Charles",
    "adaran kola charles": "Adaran Kola Charles",
    "adarankola charles": "Adaran Kola Charles",
    "adaronkola charles": "Adaran Kola Charles",
    "adarana kola charles": "Adaran Kola Charles",
    "adaran kola  charles": "Adaran Kola Charles",
    "adaran": "Adaran Kola Charles",
    
    "fatile ephzibah": "Fatile Hepzibah",
    "fatile hepizibah": "Fatile Hepzibah",
    "fatile hepzibah": "Fatile Hepzibah",
    
    "adeyiwol favor": "Adeyiwola Favour",
    "adeyiwola favour": "Adeyiwola Favour",
    
    "adu moyin": "Adu Moyinoluwa",
    "adu moyinoluwa": "Adu Moyinoluwa",
    
    "mr nathaniel": "Oladunjoye Nathaniel",
    "oladunjole nataniel": "Oladunjoye Nathaniel",
    "oladunjoye nathaniel": "Oladunjoye Nathaniel",
    
    "oliwafemi israel": "Oluwafemi Israel",
    "oluwafemi israel": "Oluwafemi Israel",
    
    "akerele oluwadamilola": "Akerele Damilola",
    "akerele damilola": "Akerele Damilola",
    
    "adebayo lfunu samuel": "Adebayo Ifunu Samuel",
    "adebayo ifunu samuel": "Adebayo Ifunu Samuel",
    "itunu samuel": "Adebayo Ifunu Samuel",
    
    "timothy austin": "Timothy Pelumi Austine",
    "timothy austine": "Timothy Pelumi Austine",
    "timothy pelumi austine": "Timothy Pelumi Austine",
    "timothy ustin": "Timothy Pelumi Austine",
    
    "akonolafe toyinsole": "Akomolafe Toyinsola",
    "akomolafe toyinsola": "Akomolafe Toyinsola",
    "toyinsole": "Akomolafe Toyinsola",
    
    "adebayo steven": "Adebayo Stephen",
    "adebayo stephen": "Adebayo Stephen",
    
    "ekundayo success": "Ekundayo Success",
    "ekundayo stephen": "Ekundayo Success",
    
    "ayodele oluwajuwon": "Ayodele Olajuwon",
    "ayodele olajuwon": "Ayodele Olajuwon"
  };

  for (const [key, val] of Object.entries(aliases)) {
    if (cleaned.includes(key)) {
      return val.replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  
  if (cleaned.includes("damilola") && !cleaned.includes("akerele")) return "Akerele Damilola";
  if (cleaned.includes("austin") && !cleaned.includes("timothy")) return "Timothy Pelumi Austine";
  if (cleaned === "solomon") return "Olawuyi Solomon";
  if (cleaned === "destiny") return "Agu Destiny";
  if (cleaned === "babatunde") return "Yusuf Babatunde";
  if (cleaned === "progress") return "Adeojo Progress";
  if (cleaned === "oluwaseyi" && !cleaned.includes("tiwo")) return "Tiwo Oluwaseyi";
  if (cleaned === "favour" && !cleaned.includes("adeyiwola")) return "Adeyiwola Favour";
  if (cleaned === "samuel" && !cleaned.includes("bamidele") && !cleaned.includes("adebayo") && !cleaned.includes("bamigboye") && !cleaned.includes("joseph") && !cleaned.includes("adegboyega")) return "Bamigboye Samuel"; // default samuel but safe
  
  return cleaned.replace(/\b\w/g, c => c.toUpperCase());
};

const extractLevel = (name) => {
  const match = name.match(/(\d{3})l/i);
  return match ? `${match[1]}L` : null;
};

const fuzzyMatchOrCreateStudent = (rawName) => {
  const normalized = normalizeName(rawName);
  const level = extractLevel(rawName) || '100L';
  
  if (!normalized) return null;
  
  // Create student base if not exists
  let studentId = null;
  for (const [id, s] of students.entries()) {
    // Simple exact match or subset match (like 'Fatile' vs 'Fatile Hepizibah')
    if (s.name.toLowerCase() === normalized.toLowerCase()) {
      studentId = id;
      break;
    }
  }
  
  if (!studentId) {
    studentId = crypto.randomUUID();
    students.set(studentId, {
      id: studentId,
      name: normalized,
      level: level
    });
  }
  return studentId;
}


const lines = rawText.split('\n');

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  
  // Match dates like 'monday', '11 March', '12th March', '24th March 2025'
  const dateMatch = trimmed.match(/^([0-9]{1,2}(?:st|nd|rd|th)?\s*[a-zA-Z]+(?:\s*202[5-6])?|monday)\s*\.?$/i);
  if (dateMatch) {
    let dateStr = dateMatch[1].toLowerCase().replace(/(st|nd|rd|th)/g, "");
    
    // Default to a March Monday if it's just 'monday'
    if (dateStr === "monday") {
      dateStr = "10 march 2026";
    }
    
    if (!dateStr.includes("202")) {
      dateStr += " 2026";
    } else {
      // Normalize to 2026 for consistency if desired, or leave as is. User mentioned "correct it with this again"
      dateStr = dateStr.replace("2025", "2026");
    }
    
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      currentDate = parsedDate.toISOString().split("T")[0];
    } else {
      console.log("Could not parse date:", dateStr);
    }
    continue;
  }
  
  // Match student lines like "1. Fatile Ephzibah" or "Stephen 300lvvl"
  const studentMatch = trimmed.match(/^(?:\d+\.\s*)?(.+)$/);
  if (studentMatch && currentDate) {
    const studentId = fuzzyMatchOrCreateStudent(studentMatch[1]);
    if (studentId) {
      records.push({
        studentId,
        date: currentDate,
        originalName: studentMatch[1]
      });
    }
  }
}

const finalStudents = Array.from(students.values()).map((s, i) => ({
  id: s.id,
  full_name: s.name,
  matric_number: `IMP/DEV/${(i+1).toString().padStart(4, '0')}`,
  department: 'General',
  level: s.level,
  created_at: new Date().toISOString()
}));

const finalRecords = records.map(r => {
  const s = finalStudents.find(fs => fs.id === r.studentId);
  return {
    id: crypto.randomUUID(),
    student_id: s.id,
    student_name: s.full_name,
    matric_number: s.matric_number,
    department: s.department,
    level: s.level,
    attendance_date: r.date,
    status: 'Present',
    type: 'Devotion',
    check_in_time: `${r.date}T06:15:00.000Z` // 07:15 AM WAT
  };
});

fs.writeFileSync("./src/data/parsed-devotion-students.json", JSON.stringify(finalStudents, null, 2));
fs.writeFileSync("./src/data/parsed-devotion-records.json", JSON.stringify(finalRecords, null, 2));

console.log(`Parsed ${finalStudents.length} students and ${finalRecords.length} records.`);
