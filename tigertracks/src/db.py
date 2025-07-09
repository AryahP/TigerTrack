import json
import psycopg2
import json
import os
#https://hskaqgwyqykfrijmsgos.supabase.co

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

cur = conn.cursor()

try:

    json_files = {
            'courses': 'extracted_courses.json',
            'majors': 'majors.json',
            'students': 'student.json',
            'certificates': 'certificates.json',
            'minors': 'minors.json',
            'student_classes': 'student_classes.json',
            'student_major': 'student_major.json',
            'student_minor': 'student_minor.json',
            'student_certificate': 'student_certificate.json',
            'student_tips': 'student_tip.json'
        }

    data = {}
    for key, filename in json_files.items():
        try:
            with open(filename, 'r') as f:
                data[key] = json.load(f)
            print(f" Loaded {filename}")
        except FileNotFoundError:
            print(f"Warning {filename} not fo.")
    
    def batch_insert(query, data_list, batch_size=1000):
        for i in range(0, len(data_list), batch_size):
            batch = data_list[i:i + batch_size]
            cur.executemany(query, batch)
            print(f" Inserted batch {i}")
   

    # (G) Junction: Student ↔ Course (student_classes)
    if data['courses']:
            print("Inserting Courses...")
            course_data = [(c["class_id"], c["class_code"], c["class_name"]) for c in data['courses']]
            batch_insert("INSERT INTO Courses (class_id, class_code, class_name) VALUES (%s, %s, %s)", course_data)
        
        # Insert Majors
    if data['majors']:
            print("Inserting Majors...")
            major_data = [(m["three_letter_code"], m["name"]) for m in data['majors']]
            batch_insert("INSERT INTO Majors (three_letter_code, name) VALUES (%s, %s)", major_data)
        
        # Insert Minors
    if data['minors']:
            print("Inserting Minors...")
            minor_data = [(m["name"],) for m in data['minors']]
            batch_insert("INSERT INTO Minors (name) VALUES (%s)", minor_data)
        
        # Insert Certificates
    if data['certificates']:
            print("Inserting Certificates...")
            cert_data = [(c["name"],) for c in data['certificates']]
            batch_insert("INSERT INTO Certificates (name) VALUES (%s)", cert_data)
        
        # Insert Students
    if data['students']:
            print("Inserting Students...")
            student_data = [(s["first_name"], s["last_name"], s["graduation_year"]) for s in data['students']]
            batch_insert("INSERT INTO Students (first_name, last_name, graduation_year) VALUES (%s, %s, %s)", student_data)
        
        # Insert Student-Major relationships
    if data['student_major']:
            print("Inserting Student-Major relationships...")
            sm_data = [(sm["student_id"], sm["major_id"]) for sm in data['student_major']]
            batch_insert("INSERT INTO StudentMajors (student_id, major_id) VALUES (%s, %s)", sm_data)
        
        # Insert Student-Minor relationships
    if data['student_minor']:
            print("Inserting Student-Minor relationships...")
            smin_data = [(sm["student_id"], sm["minor_id"]) for sm in data['student_minor']]
            batch_insert("INSERT INTO StudentMinors (student_id, minor_id) VALUES (%s, %s)", smin_data)
        
        # Insert Student-Certificate relationships
    if data['student_certificate']:
            print("Inserting Student-Certificate relationships...")
            sc_data = [(sc["student_id"], sc["certificate_id"]) for sc in data['student_certificate']]
            batch_insert("INSERT INTO StudentCertificates (student_id, certificate_id) VALUES (%s, %s)", sc_data)
        
        # Insert Student Tips
    if data['student_tips']:
            print("Inserting Student Tips...")
            tip_data = [(st["student_tip_id"], st["student_id"], st["tip_text"]) for st in data['student_tips']]
            batch_insert("INSERT INTO StudentTips (student_tip_id, student_id, tip_text) VALUES (%s, %s, %s)", tip_data)
        
        # Insert Student-Course relationships
    if data['student_classes']:
            print("Inserting Student-Course relationships...")
            sc_data = [(sc["student_id"], sc["class_id"], sc["enrollment_year"], sc["semester"]) for sc in data['student_classes']]
            batch_insert("INSERT INTO StudentCourses (student_id, class_id, enrollment_year, semester) VALUES (%s, %s, %s, %s)", sc_data)

        
    conn.commit()

except Exception as e:
    conn.rollback()
    print(f"Error occurred: {e}")
finally:
    cur.close()
    conn.close()