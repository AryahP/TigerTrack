import json
from req_lib import ReqLib
major_list = ["AAS", "AFS", "AMS", "ANT", "AOS", "APC", "ARA", "ARC", "ART", "ASA", "ASL", "AST", "ATL", "BCS", "BNG", "BPY", "CBE", "CDH", "CEE", "CGS", "CHI", "CHM", "CHV", "CLA", "CLG", "COM", "COS", "CSE", "CWR", "DAN", "EAS", "ECE", "ECO", "ECS", "EEB", "EGR", "ENE", "ENG", "ENT", "ENV", "EPS", "FIN", "FRE", "FRS", "GEO", "GER", "GEZ", "GHP", "GSS", "HEB", "HIN", "HIS", "HLS", "HOS", "HUM", "ISC", "ITA", "JDS", "JPN", "JRN", "KOR", "LAO", "LAS", "LAT", "LIN", "MAE", "MAT", "MED", "MOD", "MOG", "MOL", "MPP", "MSE", "MTD", "MUS", "NES", "NEU", "ORF", "PAW", "PER", "PHI", "PHY", "PLS", "POL", "POP", "POR", "PSY", "QCB", "QSE", "REL", "RES", "ROB", "RUS", "SAN", "SAS", "SLA", "SML", "SOC", "SPA", "SPI", "STC", "SWA", "THR", "TPP", "TRA", "TUR", "TWI", "UKR", "URB", "URD", "VIS", "WRI"]
extracted_courses = []
term_codes = "1242","1244", "1252", "1254"
if __name__ == "__main__":
    req_lib = ReqLib()
    for code in term_codes:
        term_code = code
    
    
        for subj_name in major_list:
            subj = subj_name

            # Returns all courses in COS
            term_info = req_lib.getJSON(
                req_lib.configs.COURSE_COURSES,
                # To return a json version of the return value
                fmt="json",
                term=term_code, 
                subject=subj,
            )
            for term in term_info["term"]:
                if term['code'] != None:
                    for subject in term["subjects"]:
                        for course in subject["courses"]:
                            course_data = {
                                "class_code": subj + " " + course.get('catalog_number'),
                                "class_name": course['title']
                            }
                            if course_data not in extracted_courses:
                                extracted_courses.append(course_data)
                        
with open("extracted_courses.json", "w") as json_file:
    json.dump(extracted_courses, json_file, indent=4)

                            # prints each individual course returned
                            # by the endpoint. Each course has the 
                            # following parameters:

                            # guid (string of the term code and course id concatenated. Unique each term)
                            # course_id (course id according to the course registrar. Not unique each term)
                            # catalog_number (catalog number of the course. So, for COS 126 this would be 126)
                            # title (Title of the course)
                            # detail (detailed information about the course [start/end date, track, description])
                            # instructors 
                            # crosslistings (any crosslistings, if they exist)
                            # classes (class meetings, each section that is within the class)
                            
                            #1252, 1254