import './ProfileCard'
//import {SearchStudents} from '../SearchStudents/SearchStudents';
import './ProfileCard.css'
import { Link } from 'react-router-dom'

export const ProfileCard = ({ item }) => {


    return (
        <>
     <Link to={`/profile/${item.student_id}`} className="no-underline-students">
            
            <div className="profile-card">
                <p className="student-name">{item.first_name} {item.last_name}</p>
                <p className="student-year">{item.graduation_year}</p>
            </div>
        </Link>
</>
    );};