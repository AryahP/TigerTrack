import React, { useState, useEffect } from "react";
import "./SearchStudents.css";
import {ChevronDown, ChevronUp } from 'lucide-react'; 

import {
  performSearchMajors,
  performSearchMinors,
  performSearchCertificates,
  performSearchCourses,
  searchStudentsWithRPC,
} from '../../supabaseQueries.js';
import { ProfileCard } from "../ProfileCard/ProfileCard.jsx";


const DropdownComponent = ({ majors, minors, certificates, courses, handleClick}) => {


  const DropdownMajors = ({majors, handleClick}) => {

  const [isOpen, setIsOpen] = useState(true)
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  };
  
  return (
    <div className="dropdown">
      <button className="major-drop" onClick={toggleDropdown}><span className="major-block">Majors</span><span className="chevron-icon">{isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </span>
      </button>
      {isOpen && (
         <div className="dropdown-content">
        {
          majors.map(item => (
        <div key={`major-${item.id}`} onClick={() => handleClick(item)} className="major"> {item.name}</div>
      ))
    }
     </div>
      )}
      </div>
      );};



const DropdownMinors = ({minors, handleClick}) => {

  const [isOpen, setIsOpen] = useState(true)
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  };
  
  return (
    <div className="dropdown">


      <button className="minor-drop" onClick={toggleDropdown}><span className="minor-block">Minors</span><span className="chevron-icon">{isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </span></button>
      {isOpen && (
         <div className="dropdown-content">
        {
          minors.map(item => (
        <div key={`minor-${item.id}`} onClick={() => handleClick(item)} className="minor"> {item.name}</div>
      ))
    }
     </div>
      )}
      
      </div>)}



const DropdownCertificates = ({certificates, handleClick}) => {

  const [isOpen, setIsOpen] = useState(true)
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  };
  
  return (
    <div className="dropdown">


      <button className="certificate-drop" onClick={toggleDropdown}><span className="certificate-block">Certificates</span><span className="chevron-icon">{isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </span></button>
      {isOpen && (
         <div className="dropdown-content">
        {
          certificates.map(item => (
        <div key={`certificate-${item.id}`} onClick={() => handleClick(item)} className="certificate"> {item.name}</div>
      ))
    }
     </div>
      )}
      </div>)}



const DropdownCourses = ({courses, handleClick}) => {

  const [isOpen, setIsOpen] = useState(true)
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  };
  
  return (
    <div className="dropdown">


      <button className="course-drop" onClick={toggleDropdown}><span className="course-block">Courses</span><span className="chevron-icon">{isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </span></button>
      {isOpen && (
         <div className="dropdown-content">
        {
          courses.map(item => (
        <div key={`course-${item.id}`} onClick={() => handleClick(item)} className="course"> {item.code}: {item.name}</div>
      ))
    }
     </div>
      )}</div>)}

  
  return(
  <>
      <DropdownMajors majors={majors} handleClick={handleClick}/>
      <DropdownMinors minors={minors} handleClick={handleClick}/>
      <DropdownCertificates certificates={certificates} handleClick={handleClick}/>
      <DropdownCourses courses={courses} handleClick={handleClick}/>
  </>
  
);};

export const SearchStudents = () => {
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState([]);
  const [visibleDropDown, setVisibleDropDown] = useState(false);
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (query.length > 2) {
      const fetchData = async () => {
        const majors = await performSearchMajors(query);
        const minors = await performSearchMinors(query);
        const certificates = await performSearchCertificates(query);
        const courses = await performSearchCourses(query);

        console.log('Search results: ', {majors, minors, certificates, courses})

        setMajors(majors);
        setMinors(minors);
        setCertificates(certificates);
        setCourses(courses);
        setVisibleDropDown(true);
      };
      fetchData();
    } else {
      setVisibleDropDown(false);
    }
  }, [query]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (tags.length > 0) {
        try {
          const data = await searchStudentsWithRPC(tags);
          setStudents(data);
        } catch (error) {
          console.error('Error searching students: ', error);
          setStudents([]);
        }
      } else {
        setStudents([]);
      }
    };
    fetchStudents();
  }, [tags]);

  const clearSearchResults = () => {
    setMajors([]);
    setMinors([]);
    setCertificates([]);
    setCourses([]);
    setVisibleDropDown(false);
    setQuery('');
  };

  const handleClick = (item) => {
    setTags(prev => [...prev, item]);
    clearSearchResults();

    item.type === 'major'
  };

  const handleDeleteTag = (item) => {
    setTags(prev => prev.filter(tag => tag !== item));
  };


  const filteredMajors = majors.filter(
    major => !tags.some(tag => tag.type === 'major' && tag.id === major.id)
  );
  const filteredMinors = minors.filter(
    minor => !tags.some(tag => tag.type === 'minor' && tag.id === minor.id)
  );
  const filteredCertificates = certificates.filter(
    cert => !tags.some(tag => tag.type === 'certificate' && tag.id === cert.id)
  );
  const filteredCourses = courses.filter(
    course => !tags.some(tag => tag.type === 'course' && tag.id === course.id)
  );

  console.log('Rendering check for query "' + query + '":', {
  visibleDropDown,
  filteredMajors: filteredMajors.length,
  filteredMinors: filteredMinors.length, 
  filteredCertificates: filteredCertificates.length,
  filteredCourses: filteredCourses.length,
  tags: tags.length

});




  return (
    <>
    
    <div className="search-title"> Connecting You With Upperclassmen Who have Already Been There</div>
<div className="search-center">

    <div className='search-bar-container'>

      

        {tags.map(tag => (
          <div className={`tags tag-${tag.type}`}>
          <span key={`${tag.type}-${tag.id}`}>
            <button onClick={() => handleDeleteTag(tag)} className="close">&times;</button>
            {tag.type=="course" ? tag.code + ": " :null}{tag.name}
      
          </span>
          </div>
        ))}

         <input
        type="text"
        placeholder="Search classes, majors, minors etc..."
        className="tags-input"
        value={query}
        onChange={(e) => setQuery(e.target.value) 
        
        }
      />
      

</div>
   
      {visibleDropDown && (
        <DropdownComponent
          majors={filteredMajors}
          minors={filteredMinors}
          certificates={filteredCertificates}
          courses={filteredCourses}
          handleClick={handleClick}
        />
      )}
      
</div>

{students.length > 0 ?(
  <>
  <div className="student-result">
      Results
     </div> 
     <div className="student-line"></div>
      <div className="students">
        {students.map(student => (
          <ProfileCard key={student.student_id} item={student}/>
        ))}
      </div>
      </>

):(
  
    tags.length > 0 ? (<p className="no-result"><p className="no-result title">No students match the given tags.</p>We are in the process of adding more students, so be on the lookout for updates!</p>) : (null)
  
)}
    
   
   </>
  );
};
