/**
 * High-Fidelity In-Memory & File-Based Mock Database Layer for CampusOS.
 * Replicates the database schemas and records of PVPPCOE Sion, Mumbai.
 * Provides a seamless query execution engine when local PostgreSQL is unreachable.
 */

const mockDb = {
  tenants: [
    {
      id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88',
      domain_name: 'pvppcoe.ac.in',
      institution_name: "Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE)",
      tier: 'enterprise',
      branding_config: { theme: 'navy-gold', primary_color: '#0F1E36', accent_color: '#F5A623' }
    }
  ],

  departments: [
    { id: 'a1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Computer Engineering', code: 'COMP', hod_id: 'd1111111-1111-1111-1111-111111111111' },
    { id: 'b2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Information Technology', code: 'IT', hod_id: null },
    { id: 'c3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Artificial Intelligence & Data Science', code: 'AIDS', hod_id: null },
    { id: 'd4444444-4444-4444-4444-444444444444', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Electronics & Telecommunication', code: 'EXTC', hod_id: null },
    { id: 'e5555555-5555-5555-5555-555555555555', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Visual Arts (BFA)', code: 'BFA', hod_id: null }
  ],

  users: [
    { id: 'd1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'hod.comp@pvppcoe.ac.in', password_hash: 'campus123', role: 'faculty', first_name: 'Nilesh', last_name: 'Shirke' },
    { id: 'd2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'jenkins.os@pvppcoe.ac.in', password_hash: 'campus123', role: 'faculty', first_name: 'Sarah', last_name: 'Jenkins' },
    { id: 'd3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'doe.dbms@pvppcoe.ac.in', password_hash: 'campus123', role: 'faculty', first_name: 'John', last_name: 'Doe' },
    { id: 'd4444444-4444-4444-4444-444444444444', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'turing.ada@pvppcoe.ac.in', password_hash: 'campus123', role: 'faculty', first_name: 'Alan', last_name: 'Turing' },
    { id: 'f1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'prathamesh@pvppcoe.ac.in', password_hash: 'campus123', role: 'student', first_name: 'Prathamesh', last_name: 'S.' },
    { id: 'f2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', email: 'admin.sion@pvppcoe.ac.in', password_hash: 'campus123', role: 'admin', first_name: 'PVPPCOE', last_name: 'Admin' }
  ],

  faculties: [
    { user_id: 'd1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', employee_id: 'EMP-COMP-01', designation: 'HOD & Associate Professor', office_room: 'Room 301', skills: ['Machine Learning', 'Cloud Computing', 'SQL'] },
    { user_id: 'd2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', employee_id: 'EMP-COMP-02', designation: 'Assistant Professor', office_room: 'Room 303', skills: ['Operating Systems', 'Linux Kernels', 'C++'] },
    { user_id: 'd3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', employee_id: 'EMP-COMP-03', designation: 'Assistant Professor', office_room: 'Room 305', skills: ['Database Systems', 'SQL Tuning', 'MongoDB'] },
    { user_id: 'd4444444-4444-4444-4444-444444444444', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', employee_id: 'EMP-COMP-04', designation: 'Professor', office_room: 'Room 307', skills: ['Algorithms Design', 'Data Structures', 'Python'] }
  ],

  students: [
    { user_id: 'f1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', roll_no: '2024CSE102', current_semester: 4, batch: '2023-2027', gpa: 8.72, skills_inventory: ['JavaScript', 'SQL', 'Algorithms', 'HTML/CSS'], academic_status: 'active' }
  ],

  courses: [
    { id: 'c1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', code: 'DBMS-302', name: 'Database Management Systems', credits: 4, description: 'Relational databases, normal forms, transaction ACID properties and index models.' },
    { id: 'c2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', code: 'OS-304', name: 'Operating Systems', credits: 4, description: 'Process synchronization, thread pooling, scheduling routines and memory virtualization.' },
    { id: 'c3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', dept_id: 'a1111111-1111-1111-1111-111111111111', code: 'ADA-306', name: 'Analysis of Algorithms', credits: 4, description: 'Time complexities, divide and conquer, dynamic programming, and graphs.' }
  ],

  enrollments: [
    { id: 'e1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', student_id: 'f1111111-1111-1111-1111-111111111111', course_id: 'c1111111-1111-1111-1111-111111111111', semester: 4, grade: 'A', attendance_ratio: 88.00 },
    { id: 'e2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', student_id: 'f1111111-1111-1111-1111-111111111111', course_id: 'c2222222-2222-2222-2222-222222222222', semester: 4, grade: 'B', attendance_ratio: 64.00 },
    { id: 'e3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', student_id: 'f1111111-1111-1111-1111-111111111111', course_id: 'c3333333-3333-3333-3333-333333333333', semester: 4, grade: 'A', attendance_ratio: 80.00 }
  ],

  physical_locations: [
    { id: 'l1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Lobby Core Entrance', location_type: 'classroom', building_name: 'Vasantdada Complex', floor: 1, room_number: 'Lobby', geo_coordinates: { x: 110, y: 150 }, is_currently_free: true },
    { id: 'l2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Computer Lab 3', location_type: 'laboratory', building_name: 'Vasantdada Complex', floor: 2, room_number: 'Lab 3', geo_coordinates: { x: 395, y: 225 }, is_currently_free: true },
    { id: 'l3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Information Technology Room 203', location_type: 'classroom', building_name: 'Vasantdada Complex', floor: 2, room_number: 'Room 203', geo_coordinates: { x: 490, y: 130 }, is_currently_free: true },
    { id: 'l4444444-4444-4444-4444-444444444444', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Computer Science Room 201', location_type: 'classroom', building_name: 'Vasantdada Complex', floor: 2, room_number: 'Room 201', geo_coordinates: { x: 300, y: 95 }, is_currently_free: true },
    { id: 'l5555555-5555-5555-5555-555555555555', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Vasantdada Auditorium', location_type: 'auditorium', building_name: 'Main Wing', floor: 1, room_number: 'Auditorium', geo_coordinates: { x: 200, y: 300 }, is_currently_free: true }
  ],

  timetables: [
    { id: 't1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', course_id: 'c1111111-1111-1111-1111-111111111111', faculty_id: 'd3333333-3333-3333-3333-333333333333', location_id: 'l4444444-4444-4444-4444-444444444444', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:30:00', semester: 4, section_code: 'A' },
    { id: 't2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', course_id: 'c2222222-2222-2222-2222-222222222222', faculty_id: 'd2222222-2222-2222-2222-222222222222', location_id: 'l3333333-3333-3333-3333-333333333333', day_of_week: 'Monday', start_time: '11:00:00', end_time: '12:30:00', semester: 4, section_code: 'A' },
    { id: 't3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', course_id: 'c3333333-3333-3333-3333-333333333333', faculty_id: 'd4444444-4444-4444-4444-444444444444', location_id: 'l2222222-2222-2222-2222-222222222222', day_of_week: 'Monday', start_time: '14:00:00', end_time: '15:30:00', semester: 4, section_code: 'A' }
  ],

  placements_drives: [
    { id: 'p1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', company_name: 'Microsoft Azure', job_title: 'Cloud Software Developer', eligibility_min_cgpa: 8.00, eligible_departments: ['a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'], salary_package: '18 LPA', open_date: '2026-06-01', close_date: '2026-06-14', exam_date: '2026-06-15', job_description: 'Requires high competency in relational databases, SQL indexing, operating systems threads and analysis of algorithms.' },
    { id: 'p2222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', company_name: 'Amazon Web Services', job_title: 'Cloud Intern & SysOps', eligibility_min_cgpa: 9.00, eligible_departments: ['a1111111-1111-1111-1111-111111111111'], salary_package: '12 LPA', open_date: '2026-06-10', close_date: '2026-06-20', exam_date: '2026-06-22', job_description: 'Core networking, Linux kernel administration, server scaling and Redis cache configuration.' },
    { id: 'p3333333-3333-3333-3333-333333333333', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', company_name: 'Tata Consultancy Services (TCS)', job_title: 'Systems Engineer (Ninja/Digital)', eligibility_min_cgpa: 6.50, eligible_departments: ['a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444'], salary_package: '7 LPA', open_date: '2026-05-25', close_date: '2026-06-05', exam_date: '2026-06-08', job_description: 'General software engineering concepts, database queries, basic data structures, and script debugging.' }
  ],

  clubs: [
    { id: 'cb111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'PVPPCOE Coding Club', description: 'Student developer forum collaborating on coding hackathons and software projects.', required_skills: ['JavaScript', 'SQL', 'Algorithms'] },
    { id: 'cb222222-2222-2222-2222-222222222222', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', name: 'Visual Arts Circle', description: 'Fine arts creative platform managing murals, campus branding designs, and exhibition painting.', required_skills: ['Painting', 'Graphic Design'] }
  ],

  events: [
    { id: 'ev111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', title: 'PVPPCOE Tech-Fest (Tantra)', description: 'Grand national engineering event with technical paper presentations, hackathons, and robot wars.', event_start: '2026-06-05T09:00:00Z', event_end: '2026-06-07T17:00:00Z', location_id: 'l5555555-5555-5555-5555-555555555555' }
  ],

  study_materials: [
    { id: 'm1111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', course_id: 'c1111111-1111-1111-1111-111111111111', uploaded_by: 'd3333333-3333-3333-3333-333333333333', title: 'DBMS Relational Model & SQL Indexing Notes.pdf', s3_key: 'materials/dbms_indexing.pdf', file_type: 'pdf', file_size: 4096 }
  ],

  study_material_chunks: [
    { id: 'ch111111-1111-1111-1111-111111111111', tenant_id: '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', material_id: 'm1111111-1111-1111-1111-111111111111', chunk_index: 1, content_text: 'A Database Management System (DBMS) organizes data using schemas. Relational databases enforce Primary Keys for uniqueness, which automatically create B-Tree clustered indexes in tables. Cosine similarity operations on high dimensional vector embeddings speed up unstructured RAG queries.' }
  ]
};

/**
 * Simulates SQL queries in memory matching PostgreSQL result format.
 */
const simulateQuery = async (tenantId, text, params) => {
  const q = text.toLowerCase();
  
  // 1. Auth Login Query
  if (q.includes('select id, email, password_hash, role, first_name, last_name from users where email')) {
    const email = params[0];
    const user = mockDb.users.find(u => u.email === email && u.tenant_id === tenantId);
    return { rows: user ? [user] : [] };
  }

  // 2. Timetable Student Semester Query
  if (q.includes('select dept_id, current_semester from students where user_id')) {
    const userId = params[0];
    const student = mockDb.students.find(s => s.user_id === userId && s.tenant_id === tenantId);
    return { rows: student ? [student] : [] };
  }

  // 3. Timetable Schedules Query
  if (q.includes('select t.id, t.start_time, t.end_time, t.section_code')) {
    const day = params[2]; // Day of week parameter
    const schedules = mockDb.timetables.filter(t => t.tenant_id === tenantId && t.day_of_week === day);
    
    // Enrich with courses, locations and faculty names
    const enriched = schedules.map(s => {
      const course = mockDb.courses.find(c => c.id === s.course_id);
      const loc = mockDb.physical_locations.find(l => l.id === s.location_id);
      const user = mockDb.users.find(u => u.id === s.faculty_id);
      return {
        id: s.id,
        start_time: s.start_time.substring(0, 5),
        end_time: s.end_time.substring(0, 5),
        section_code: s.section_code,
        course_name: course ? course.name : 'Unknown Course',
        course_code: course ? course.code : 'UNKNOWN',
        building_name: loc ? loc.building_name : 'Vasantdada Complex',
        room_number: loc ? loc.room_number : '203',
        instructor_name: user ? `${user.first_name} ${user.last_name}` : 'Prof. Sarah Jenkins'
      };
    });
    return { rows: enriched };
  }

  // 4. RAG Attendance Query
  if (q.includes('select attendance_ratio from enrollments')) {
    const studentId = params[0];
    const enrollment = mockDb.enrollments.find(e => e.student_id === studentId);
    return { rows: enrollment ? [enrollment] : [{ attendance_ratio: 88.00 }] };
  }

  // 5. RAG Active Timetable Slot Query
  if (q.includes('from timetables t') && q.includes('limit 1')) {
    const course = mockDb.courses[1]; // OS
    return { rows: [{ name: course.name, start_time: '11:00 AM', room_number: '203' }] };
  }

  // 6. RAG Labs Finder Query
  if (q.includes('location_type = \'laboratory\'')) {
    const labs = mockDb.physical_locations.filter(l => l.location_type === 'laboratory' && l.is_currently_free);
    return { rows: labs };
  }

  // 7. Placement Student GPA Query
  if (q.includes('select gpa from students where user_id')) {
    const userId = params[0];
    const student = mockDb.students.find(s => s.user_id === userId);
    return { rows: student ? [student] : [{ gpa: 8.72 }] };
  }

  // Generic Empty Result
  return { rows: [] };
};

module.exports = {
  mockDb,
  simulateQuery
};
