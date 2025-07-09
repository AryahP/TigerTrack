import { useParams, useNavigate } from 'react-router-dom';
import {getStudentById} from '../../supabaseQueries'
import { useState, useEffect } from 'react';
import './StudentDetailPage.css';


export const StudentDetailPage = () => {

    const {studentId} = useParams();

    const navigate = useNavigate();

    const [studentData, setStudentData] = useState(null)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

   
     const groupCoursesBySemester = (courses) => {

        if (!courses || !Array.isArray(courses)) return {};

        const grouped = {};

        courses.forEach(({semester, enrollment_year, courses }) => {
           const key = `${semester} ${enrollment_year}`;
        if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(courses);    
     });
        return grouped; 
     };


      const groupedCourses = studentData ? groupCoursesBySemester(studentData.studentcourses) : null;

     useEffect(() => {
       
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getStudentById(studentId);
                setStudentData(data); 
            } catch (err) {
                setError(`Failed to fetch student data: ${err.message}`); 
            } finally {
                setLoading(false);
            }
        };

        fetchData();
     }, [studentId]);


    const goBackHome = () => {
        navigate('/');
    };


    if (loading) return <p>Loading student data...</p>
    if (error) return <p>{error}</p>

    return (

        <div className="student-detail-page">

<div className="left"> <h1>{studentData.first_name} {studentData.last_name}</h1>
           <p className="grad-year"> Class of {studentData.graduation_year}</p>
        
          <h2>Major</h2>
          <ul>
            {studentData.studentmajors?.map(({majors}) => (
                <div key={majors.three_letter_code} className="major-list">{majors.name} ({majors.three_letter_code})</div>
            ))}
          </ul>

          <h2>Minors</h2>
          <ul>
            {studentData.studentminors?.map(({minors}) => (
                <div key={minors.minor_id} className="minor-list">{minors.name}</div>
            ))}
          </ul>

           <h2>Tips and tidbits of advice</h2>
          {studentData.StudentTips && studentData.StudentTips.length > 0 ? (
            <div>
                {studentData.StudentTips.map((tip, index) => (
                    <div key={index} className="tip-list">{tip.tip_text}</div>
                ))}
            </div>
          ) : (
            <p>No tips available for now</p>
          )
        }

        <h2>Contact information </h2>
        
           <button onClick={goBackHome} className="go-back-home">
            Back to search
           </button>
           
          
          </div>
          

<div className="right">
     <h2>Courses by Semester</h2>
          {Object.entries(groupedCourses).map(([semesterLabel, courses]) => (

           <div key={semesterLabel}>
            <h3 >{semesterLabel}</h3>
            <ul>
                {courses.map((course) => (
                    <div key={course.class_code} className="highlighted-li">
                        {course.class_code}: {course.class_name}
                    </div>
                ))}
            </ul>
            </div>
          ))}
</div>
        </div>
    )
};