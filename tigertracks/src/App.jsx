import { BrowserRouter, Routes, Route, Navigate, } from 'react-router-dom';
import "./App.css";
//import {Users} from "./users";
//import { useState } from 'react';
//import Table from './Table';
//import axios from "axios"; 
import {SearchStudents} from "./components/SearchStudents/SearchStudents";
import {StudentDetailPage} from "./components/StudentDetailPage/StudentDetailPage";
import  Navbar from './components/Navbar/Navbar.jsx';


  /**
  const [query, setQuery] = useState("");
  const [data, setData] = useState([])

  useEffect(() =>{
    const fetchUsers = async () => {
      const res = await axios.get(`http://localhost:5000?q=${query}`)
      setData(res.data)
    };
    if(query.length === 0)
    if (query.length === 0 || query.length > 2) fetchUsers()

  }, [query])
   */
  /*

  const keys = ["first_name", "last_name", "email"]

  console.log(Users[0]["first_name"])

  console.log(Users.filter(user=>user.first_name.toLowerCase().includes("query") ||
user.last_name.toLowerCase().includes("query")||user.email.toLowerCase().includes("query")));

  const search = (data) =>{
    return data.filter(
      (item)=>keys.some(key=>item[key].toLowerCase().includes(query)))
  }
**/
function App() {

  return ( 
    <>
    <BrowserRouter>
    <Navbar/>
    <div className="search-content">
    <Routes>
    <Route path="/" element={<SearchStudents/>}/>
    <Route path="/profile/:studentId" element={<StudentDetailPage/>}/>
    </Routes>
    </div>
 </BrowserRouter>


    </>
   
  );
  
}

export default App
