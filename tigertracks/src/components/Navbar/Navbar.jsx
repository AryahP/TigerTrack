import { Link } from 'react-router-dom';
import './Navbar.css';
import TigerTracksLogo from '../../assets/TigerTracksLogo.png';

const Navbar = () => {
  return (

    <div className="top-bar">
      <img src={TigerTracksLogo} alt="Tiger Tracks Logo" className="logo-img"/>
      <div className="nav-title">TigerTracks</div>
    </div>
  );
};

export default Navbar; 