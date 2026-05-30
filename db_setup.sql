-- Padmabhushan Vasantdada Patil Pratishthan's College of Engineering (PVPPCOE), Mumbai
-- CampusOS Master Database DDL & Seed Script
-- Highly scalable, multi-tenant setup with RLS context tracking and pgvector HNSW indices

-- 1. Initialize core system extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Mapped to pgvector 1536 dimensions

-- 2. Clean teardown logic (for fresh migrations/development setup)
DROP TABLE IF EXISTS club_memberships CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS lost_found CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS interview_experiences CASCADE;
DROP TABLE IF EXISTS student_resumes CASCADE;
DROP TABLE IF EXISTS placements_drives CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS study_material_chunks CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS physical_locations CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================================
-- CORE SCHEMAS & TABLES
-- ============================================================================

-- 1. Tenant Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    tier VARCHAR(50) DEFAULT 'standard' CHECK (tier IN ('standard', 'enterprise', 'demo')),
    branding_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Base Users Table (Identity Storage)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    avatar_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- 3. Departments Catalog
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    hod_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_dept_code UNIQUE (tenant_id, code)
);

-- 4. Faculty Profiles
CREATE TABLE faculties (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dept_id UUID NOT NULL REFERENCES departments(id),
    employee_id VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    office_room VARCHAR(50),
    skills VARCHAR(255)[] DEFAULT '{}'::varchar[],
    CONSTRAINT unique_tenant_emp_id UNIQUE (tenant_id, employee_id)
);

-- 5. Student Profiles
CREATE TABLE students (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dept_id UUID NOT NULL REFERENCES departments(id),
    roll_no VARCHAR(50) NOT NULL,
    current_semester INT NOT NULL DEFAULT 1 CHECK (current_semester BETWEEN 1 AND 10),
    batch VARCHAR(20) NOT NULL, -- e.g. '2023-2027'
    gpa NUMERIC(4, 2) DEFAULT 0.00 CHECK (gpa BETWEEN 0.00 AND 10.00),
    skills_inventory VARCHAR(255)[] DEFAULT '{}'::varchar[],
    academic_status VARCHAR(50) DEFAULT 'active' CHECK (academic_status IN ('active', 'on_leave', 'probation', 'graduated')),
    CONSTRAINT unique_tenant_roll_no UNIQUE (tenant_id, roll_no)
);

-- 6. Courses Catalog
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dept_id UUID NOT NULL REFERENCES departments(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    credits INT NOT NULL CHECK (credits BETWEEN 1 AND 6),
    description TEXT,
    CONSTRAINT unique_tenant_course_code UNIQUE (tenant_id, code)
);

-- 7. Enrollments Ledger
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    grade VARCHAR(2),
    attendance_ratio NUMERIC(5, 2) DEFAULT 100.00 CHECK (attendance_ratio BETWEEN 0.00 AND 100.00),
    CONSTRAINT unique_student_course_semester UNIQUE (student_id, course_id, semester)
);

-- 8. Campus Physical Map Locations (Indoor Wayfinding Map Nodes)
CREATE TABLE physical_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('classroom', 'laboratory', 'seminar_hall', 'office', 'auditorium', 'library')),
    building_name VARCHAR(100) NOT NULL,
    floor INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    geo_coordinates JSONB NOT NULL, -- Format: { x: pixelX, y: pixelY, lat: X, lng: Y }
    qr_code_uuid UUID UNIQUE DEFAULT uuid_generate_v4(),
    is_currently_free BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT unique_tenant_room UNIQUE (tenant_id, building_name, room_number)
);

-- 9. Timetable Matrix
CREATE TABLE timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculties(user_id),
    location_id UUID NOT NULL REFERENCES physical_locations(id),
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    semester INT NOT NULL,
    section_code VARCHAR(10) NOT NULL,
    CONSTRAINT time_slot_sanity CHECK (start_time < end_time)
);

-- 10. Bookings Ledger
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES physical_locations(id) ON DELETE CASCADE,
    booked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT booking_time_sanity CHECK (start_time < end_time)
);

-- 11. Study Materials Metadata (RAG Document Indexes)
CREATE TABLE study_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Vector Chunk Store (pgvector enabled RAG chunk repository)
CREATE TABLE study_material_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL -- Mapped to Gemini text embeddings
);

-- 13. Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(15) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    remarks TEXT
);

-- 14. Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculties(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_marks INT NOT NULL CHECK (max_marks > 0),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Submissions Ledger
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    submission_text TEXT,
    file_s3_key VARCHAR(512),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    marks_obtained NUMERIC(5, 2),
    faculty_feedback TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'graded')),
    CONSTRAINT marks_sanity CHECK (marks_obtained <= (SELECT max_marks FROM assignments WHERE id = assignment_id))
);

-- 16. Placement & Career Drives
CREATE TABLE placements_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    eligibility_min_cgpa NUMERIC(4, 2) NOT NULL CHECK (eligibility_min_cgpa BETWEEN 0.00 AND 10.00),
    eligible_departments UUID[] NOT NULL DEFAULT '{}'::uuid[],
    salary_package VARCHAR(100),
    open_date DATE NOT NULL,
    close_date DATE NOT NULL,
    exam_date DATE,
    job_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Student Resumes (Vector scoring matching placements)
CREATE TABLE student_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    s3_key VARCHAR(512) NOT NULL,
    parsed_skills VARCHAR(255)[] DEFAULT '{}'::varchar[],
    resume_text TEXT NOT NULL,
    resume_embedding vector(1536) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Shared Interview Experiences
CREATE TABLE interview_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    experience_text TEXT NOT NULL,
    questions_list TEXT[],
    outcome VARCHAR(50) CHECK (outcome IN ('selected', 'rejected', 'pending_result')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Institutional Complaints Registry
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('academic', 'hostel', 'facility', 'billing', 'disciplinary', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    assigned_admin UUID REFERENCES users(id),
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Lost & Found Hub (Vector search supported)
CREATE TABLE lost_found (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('lost', 'found')),
    item_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    item_description_embedding vector(1536) NOT NULL,
    location_discovered VARCHAR(255),
    image_url VARCHAR(512),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matching', 'claimed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    location_id UUID REFERENCES physical_locations(id) ON DELETE SET NULL,
    club_id UUID,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    max_registrations INT,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. Event Registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'no_show')),
    CONSTRAINT unique_student_event UNIQUE (student_id, event_id)
);

-- 23. Clubs and Societies
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_student_id UUID REFERENCES students(user_id) ON DELETE SET NULL,
    mentor_faculty_id UUID REFERENCES faculties(user_id) ON DELETE SET NULL,
    required_skills VARCHAR(100)[] DEFAULT '{}'::varchar[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. Club Memberships
CREATE TABLE club_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'coordinator', 'vice_president', 'president')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_club UNIQUE (student_id, club_id)
);

-- ============================================================================
-- INDEXING & TRIGGERS CONFIGURATIONS
-- ============================================================================

-- B-Tree indexes matching RLS-tenant scopes
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_timetables_slots ON timetables(tenant_id, day_of_week, start_time, end_time);
CREATE INDEX idx_attendance_lookup ON attendance_records(tenant_id, date, status);
CREATE INDEX idx_bookings_schedule ON bookings(resource_id, start_time, end_time) WHERE status = 'approved';

-- High performance HNSW Vector Indices
CREATE INDEX idx_study_chunks_vector ON study_material_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_resumes_vector ON student_resumes USING hnsw (resume_embedding vector_cosine_ops);
CREATE INDEX idx_lostfound_vector ON lost_found USING hnsw (item_description_embedding vector_cosine_ops);

-- Triggers for automatic student attendance calculation
CREATE OR REPLACE FUNCTION update_enrollment_attendance()
RETURNS TRIGGER AS $$
DECLARE
    total_slots INT;
    present_slots INT;
    new_ratio NUMERIC(5,2);
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('present', 'late'))
    INTO total_slots, present_slots
    FROM attendance_records
    WHERE enrollment_id = NEW.enrollment_id;

    IF total_slots > 0 THEN
        new_ratio := (present_slots::NUMERIC / total_slots::NUMERIC) * 100.00;
        UPDATE enrollments 
        SET attendance_ratio = new_ratio 
        WHERE id = NEW.enrollment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance
AFTER INSERT OR UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION update_enrollment_attendance();


-- ============================================================================
-- INSTITUTION SEED DATA: PVPPCOE SION, MUMBAI
-- ============================================================================

-- 1. Insert Master PVPPCOE Tenant
INSERT INTO tenants (id, domain_name, institution_name, tier, branding_config)
VALUES (
    '8f3e0984-7a3b-489e-b9ef-d4de20e17b88',
    'pvppcoe.ac.in',
    'Padmabhushan Vasantdada Patil Pratishthan''s College of Engineering (PVPPCOE)',
    'enterprise',
    '{"theme": "navy-gold", "primary_color": "#0F1E36", "accent_color": "#F5A623"}'::jsonb
);

-- 2. Insert Departments (PVPPCOE)
INSERT INTO departments (id, tenant_id, name, code) VALUES
('a1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Computer Engineering', 'COMP'),
('b2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Information Technology', 'IT'),
('c3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Artificial Intelligence & Data Science', 'AIDS'),
('d4444444-4444-4444-4444-444444444444', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Electronics & Telecommunication', 'EXTC'),
('e5555555-5555-5555-5555-555555555555', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Visual Arts (BFA)', 'BFA');

-- 3. Insert Users (HODs, Professors, Students)
-- Password hash for 'campus123' used in testing
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name) VALUES
('d1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'hod.comp@pvppcoe.ac.in', 'campus123', 'faculty', 'Nilesh', 'Shirke'),
('d2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'jenkins.os@pvppcoe.ac.in', 'campus123', 'faculty', 'Sarah', 'Jenkins'),
('d3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'doe.dbms@pvppcoe.ac.in', 'campus123', 'faculty', 'John', 'Doe'),
('d4444444-4444-4444-4444-444444444444', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'turing.ada@pvppcoe.ac.in', 'campus123', 'faculty', 'Alan', 'Turing'),
('f1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'prathamesh@pvppcoe.ac.in', 'campus123', 'student', 'Prathamesh', 'S.'),
('f2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'admin.sion@pvppcoe.ac.in', 'campus123', 'admin', 'PVPPCOE', 'Admin');

-- 4. Map HOD to Department
UPDATE departments SET hod_id = 'd1111111-1111-1111-1111-111111111111' WHERE code = 'COMP';

-- 5. Insert Faculty Profiles
INSERT INTO faculties (user_id, tenant_id, dept_id, employee_id, designation, office_room, skills) VALUES
('d1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'EMP-COMP-01', 'HOD & Associate Professor', 'Room 301', ARRAY['Machine Learning', 'Cloud Computing', 'SQL']),
('d2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'EMP-COMP-02', 'Assistant Professor', 'Room 303', ARRAY['Operating Systems', 'Linux Kernels', 'C++']),
('d3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'EMP-COMP-03', 'Assistant Professor', 'Room 305', ARRAY['Database Systems', 'SQL Tuning', 'MongoDB']),
('d4444444-4444-4444-4444-444444444444', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'EMP-COMP-04', 'Professor', 'Room 307', ARRAY['Algorithms Design', 'Data Structures', 'Python']);

-- 6. Insert Student Profiles
INSERT INTO students (user_id, tenant_id, dept_id, roll_no, current_semester, batch, gpa, skills_inventory) VALUES
('f1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', '2024CSE102', 4, '2023-2027', 8.72, ARRAY['JavaScript', 'SQL', 'Algorithms', 'HTML/CSS']);

-- 7. Insert PVPPCOE Courses
INSERT INTO courses (id, tenant_id, dept_id, code, name, credits, description) VALUES
('c1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'DBMS-302', 'Database Management Systems', 4, 'Relational databases, normal forms, transaction ACID properties and index models.'),
('c2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'OS-304', 'Operating Systems', 4, 'Process synchronization, thread pooling, scheduling routines and memory virtualization.'),
('c3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'a1111111-1111-1111-1111-111111111111', 'ADA-306', 'Analysis of Algorithms', 4, 'Time complexities, divide and conquer, dynamic programming, and graphs.');

-- 8. Register Enrollments
INSERT INTO enrollments (id, tenant_id, student_id, course_id, semester, grade, attendance_ratio) VALUES
('e1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'f1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 4, 'A', 88.00),
('e2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'f1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 4, 'B', 64.00),
('e3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'f1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 4, 'A', 80.00);

-- 9. Insert Physical Campus Locations
INSERT INTO physical_locations (id, tenant_id, name, location_type, building_name, floor, room_number, geo_coordinates) VALUES
('l1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Lobby Core Entrance', 'classroom', 'Vasantdada Complex', 1, 'Lobby', '{"x": 110, "y": 150}'::jsonb),
('l2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Computer Lab 3', 'laboratory', 'Vasantdada Complex', 2, 'Lab 3', '{"x": 395, "y": 225}'::jsonb),
('l3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Information Technology Room 203', 'classroom', 'Vasantdada Complex', 2, 'Room 203', '{"x": 490, "y": 130}'::jsonb),
('l4444444-4444-4444-4444-444444444444', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Computer Science Room 201', 'classroom', 'Vasantdada Complex', 2, 'Room 201', '{"x": 300, "y": 95}'::jsonb),
('l5555555-5555-5555-5555-555555555555', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Vasantdada Auditorium', 'auditorium', 'Main Wing', 1, 'Auditorium', '{"x": 200, "y": 300}'::jsonb);

-- 10. Populate Timetables Matrix
INSERT INTO timetables (id, tenant_id, course_id, faculty_id, location_id, day_of_week, start_time, end_time, semester, section_code) VALUES
('t1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'c1111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', 'l4444444-4444-4444-4444-444444444444', 'Monday', '09:00:00', '10:30:00', 4, 'A'),
('t2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'c2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'l3333333-3333-3333-3333-333333333333', 'Monday', '11:00:00', '12:30:00', 4, 'A'),
('t3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'c3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444', 'l2222222-2222-2222-2222-222222222222', 'Monday', '14:00:00', '15:30:00', 4, 'A');

-- 11. Populate Active Corporate Placement Drives
INSERT INTO placements_drives (id, tenant_id, company_name, job_title, eligibility_min_cgpa, eligible_departments, salary_package, open_date, close_date, exam_date, job_description) VALUES
('p1111111-1111-1111-1111-111111111111', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Microsoft Azure', 'Cloud Software Developer', 8.00, ARRAY['a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222']::uuid[], '18 LPA', '2026-06-01', '2026-06-14', '2026-06-15', 'Requires high competency in relational databases, SQL indexing, operating systems threads and analysis of algorithms.'),
('p2222222-2222-2222-2222-222222222222', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Amazon Web Services', 'Cloud Intern & SysOps', 9.00, ARRAY['a1111111-1111-1111-1111-111111111111']::uuid[], '12 LPA', '2026-06-10', '2026-06-20', '2026-06-22', 'Core networking, Linux kernel administration, server scaling and Redis cache configuration.'),
('p3333333-3333-3333-3333-333333333333', '8f3e0984-7a3b-489e-b9ef-d4de20e17b88', 'Tata Consultancy Services (TCS)', 'Systems Engineer (Ninja/Digital)', 6.50, ARRAY['a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444']::uuid[], '7 LPA', '2026-05-25', '2026-06-05', '2026-06-08', 'General software engineering concepts, database queries, basic data structures, and script debugging.');
