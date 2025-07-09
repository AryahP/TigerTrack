-- FIXED DATABASE SCHEMA
-- This addresses the data type inconsistencies and function signature issues

-- Students Table (No changes needed)
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    graduation_year SMALLINT NOT NULL
);

-- Majors Table (No changes needed)
CREATE TABLE Majors (
    major_id SERIAL PRIMARY KEY,
    three_letter_code CHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Minors Table (No changes needed)
CREATE TABLE Minors (
    minor_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Certificates Table (No changes needed)
CREATE TABLE Certificates (
    certificate_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- FIXED: Courses Table - Consistent data types
CREATE TABLE Courses (
    class_id SERIAL PRIMARY KEY,
    class_code CHAR(10) UNIQUE NOT NULL,
    class_name VARCHAR(150) NOT NULL
);

-- Junction Tables (No changes needed)
CREATE TABLE StudentMajors (
    student_id INT NOT NULL,
    major_id INT NOT NULL,
    PRIMARY KEY (student_id, major_id),
    CONSTRAINT fk_student_major
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_major_student
        FOREIGN KEY (major_id) REFERENCES Majors(major_id) ON DELETE CASCADE
);

CREATE TABLE StudentMinors (
    student_id INT NOT NULL,
    minor_id INT NOT NULL,
    PRIMARY KEY (student_id, minor_id),
    CONSTRAINT fk_student_minor
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_minor_student
        FOREIGN KEY (minor_id) REFERENCES Minors(minor_id) ON DELETE CASCADE
);

CREATE TABLE StudentCertificates (
    student_id INT NOT NULL,
    certificate_id INT NOT NULL,
    PRIMARY KEY (student_id, certificate_id),
    CONSTRAINT fk_student_certificate
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_certificate_student
        FOREIGN KEY (certificate_id) REFERENCES Certificates(certificate_id) ON DELETE CASCADE
);

CREATE TABLE StudentTips (
    student_tip_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    tip_text TEXT NOT NULL,
    CONSTRAINT fk_student_tip
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- FIXED: StudentCourses - Consistent data types
CREATE TABLE StudentCourses (
    student_id INT NOT NULL,
    class_id INT NOT NULL,  -- This now matches Courses.class_id (INT)
    enrollment_year SMALLINT NOT NULL,
    semester VARCHAR(10),
    PRIMARY KEY (student_id, class_id, enrollment_year, semester),
    CONSTRAINT fk_student_class
        FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_class_student
        FOREIGN KEY (class_id) REFERENCES Courses(class_id) ON DELETE CASCADE
);

-- FIXED: Updated search function with proper array handling
-- FIXED: Updated search function with correct return types that match your table schema
-- CORRECTED: search_students_by_criteria function with proper type matching
-- CORRECTED: search_students_by_criteria function with proper type matching
CREATE OR REPLACE FUNCTION search_students_by_criteria(
  major_ids INTEGER[] DEFAULT NULL,
  minor_ids INTEGER[] DEFAULT NULL,
  certificate_ids INTEGER[] DEFAULT NULL,
  course_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  student_id INTEGER,
  first_name VARCHAR(50),   -- Match your actual table definition
  last_name VARCHAR(50),    -- Match your actual table definition
  graduation_year SMALLINT,
  majors TEXT[],
  minors TEXT[],
  certificates TEXT[],
  courses TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.student_id,
    s.first_name,        -- No cast needed - matches VARCHAR(50)
    s.last_name,         -- No cast needed - matches VARCHAR(50)
    s.graduation_year,

    COALESCE(
      (SELECT ARRAY_AGG(m.name::TEXT)  -- Explicit cast to TEXT
       FROM StudentMajors sm 
       JOIN Majors m ON sm.major_id = m.major_id 
       WHERE sm.student_id = s.student_id),
      ARRAY[]::TEXT[]
    ) AS majors,

    COALESCE(
      (SELECT ARRAY_AGG(mi.name::TEXT)  -- Explicit cast to TEXT
       FROM StudentMinors smi 
       JOIN Minors mi ON smi.minor_id = mi.minor_id 
       WHERE smi.student_id = s.student_id),
      ARRAY[]::TEXT[]
    ) AS minors,

    COALESCE(
      (SELECT ARRAY_AGG(c.name::TEXT)   -- Explicit cast to TEXT
       FROM StudentCertificates sc 
       JOIN Certificates c ON sc.certificate_id = c.certificate_id 
       WHERE sc.student_id = s.student_id),
      ARRAY[]::TEXT[]
    ) AS certificates,

    COALESCE(
      (SELECT ARRAY_AGG(co.class_code::TEXT)  -- Explicit cast to TEXT
       FROM StudentCourses sco 
       JOIN Courses co ON sco.class_id = co.class_id 
       WHERE sco.student_id = s.student_id),
      ARRAY[]::TEXT[]
    ) AS courses

  FROM students s
  WHERE 
    (major_ids IS NULL OR array_length(major_ids, 1) IS NULL OR 
     (SELECT COUNT(*) 
      FROM StudentMajors sm 
      WHERE sm.student_id = s.student_id AND sm.major_id = ANY(major_ids)
     ) = array_length(major_ids, 1))
    AND
    (minor_ids IS NULL OR array_length(minor_ids, 1) IS NULL OR 
     (SELECT COUNT(*) 
      FROM StudentMinors sm 
      WHERE sm.student_id = s.student_id AND sm.minor_id = ANY(minor_ids)
     ) = array_length(minor_ids, 1))
    AND
    (certificate_ids IS NULL OR array_length(certificate_ids, 1) IS NULL OR 
     (SELECT COUNT(*) 
      FROM StudentCertificates sc 
      WHERE sc.student_id = s.student_id AND sc.certificate_id = ANY(certificate_ids)
     ) = array_length(certificate_ids, 1))
    AND
    (course_ids IS NULL OR array_length(course_ids, 1) IS NULL OR 
     (SELECT COUNT(*) 
      FROM StudentCourses sc 
      WHERE sc.student_id = s.student_id AND sc.class_id = ANY(course_ids)
     ) = array_length(course_ids, 1))
  ORDER BY s.last_name, s.first_name;
END;
$$ LANGUAGE plpgsql;
-- Helper function remains the same
/*CREATE OR REPLACE FUNCTION get_all_dropdown_options()
RETURNS TABLE(id INTEGER, type TEXT, name TEXT, code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT 
            m.major_id::INTEGER as id, 
            1 as priority,
            'major'::TEXT as type, 
            m.name::TEXT as name,  
            m.three_letter_code::TEXT as code
        FROM Majors m 
        WHERE m.name IS NOT NULL

        UNION ALL

        SELECT 
            mi.minor_id::INTEGER as id, 
            2 as priority,
            'minor'::TEXT as type, 
            mi.name::TEXT as name,  
            NULL::TEXT as code
        FROM Minors mi 
        WHERE mi.name IS NOT NULL

        UNION ALL

        SELECT 
            c.certificate_id::INTEGER as id, 
            3 as priority,
            'certificate'::TEXT as type, 
            c.name::TEXT as name,  
            NULL::TEXT as code
        FROM Certificates c 
        WHERE c.name IS NOT NULL

        UNION ALL

        SELECT 
            co.class_id::INTEGER as id, 
            4 as priority,
            'course'::TEXT as type, 
            co.class_name::TEXT as name,  
            co.class_code::TEXT as code
        FROM Courses co 
        WHERE co.class_name IS NOT NULL 
        AND co.class_code IS NOT NULL

    ) AS unified
    ORDER BY priority, name;
END;
$$;
*/

CREATE OR REPLACE FUNCTION search_majors(query_text TEXT)
RETURNS TABLE(
    id INTEGER, type TEXT, name TEXT, code TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT m.major_id, 'major'::TEXT, m.name::TEXT, m.three_letter_code::TEXT
    FROM Majors m 
    WHERE query_text IS NOT NULL 
        AND length(trim(query_text)) > 2 
        AND m.name ILIKE '%' || query_text || '%'
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql; 

CREATE OR REPLACE FUNCTION search_minors(query_text TEXT)
RETURNS TABLE(
    id INTEGER, type TEXT, name TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT mi.minor_id, 'minor'::TEXT, mi.name::TEXT
    FROM Minors mi
    WHERE query_text IS NOT NULL 
        AND length(trim(query_text)) > 2 
        AND mi.name ILIKE '%' || query_text || '%'
    ORDER BY mi.name;
END;
$$ LANGUAGE plpgsql; 

CREATE OR REPLACE FUNCTION search_certificates(query_text TEXT)
RETURNS TABLE(
    id INTEGER, type TEXT, name TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT c.certificate_id, 'certificate'::TEXT, c.name::TEXT
    FROM Certificates c
    WHERE query_text IS NOT NULL 
        AND length(trim(query_text)) > 2 
        AND c.name ILIKE '%' || query_text || '%'
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql; 

CREATE OR REPLACE FUNCTION search_courses(query_text TEXT)
RETURNS TABLE(
    id INTEGER, type TEXT, name TEXT, code TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT co.class_id, 'course'::TEXT, co.class_name::TEXT, co.class_code::TEXT
    FROM Courses co
    WHERE query_text IS NOT NULL 
        AND length(trim(query_text)) > 2 
        AND (
           
        REPLACE(LOWER(co.class_code),' ', '') ILIKE '%' || REPLACE(LOWER(trim(query_text)),' ','') || '%' OR 
        LOWER(trim(co.class_name)) ILIKE '%' || LOWER(trim(query_text)) || '%'
        
        )
    ORDER BY co.class_name;
END;
$$ LANGUAGE plpgsql; 



-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_majors_student_id ON StudentMajors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_minors_student_id ON StudentMinors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_student_id ON StudentCertificates(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON StudentCourses(student_id);

CREATE INDEX IF NOT EXISTS idx_student_majors_major_id ON StudentMajors(major_id);
CREATE INDEX IF NOT EXISTS idx_student_minors_minor_id ON StudentMinors(minor_id);
CREATE INDEX IF NOT EXISTS idx_student_certificates_certificate_id ON StudentCertificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_class_id ON StudentCourses(class_id);

CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);--dont really need this bc not searching ppl up by name

CREATE INDEX IF NOT EXISTS idx_majors_name ON Majors(name);
CREATE INDEX IF NOT EXISTS idx_certificates_name ON Certificates(name);
CREATE INDEX IF NOT EXISTS idx_minors_name ON Minors(name);
--CREATE INDEX IF NOT EXISTS idx_courses_name ON Courses(name);

CREATE INDEX IF NOT EXISTS idx_courses_code ON Courses(class_code);
