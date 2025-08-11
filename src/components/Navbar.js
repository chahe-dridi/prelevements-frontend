import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
 const { userRole, userEmail, logout } = useContext(AuthContext);  // add userEmail here

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profilePath = "/profile"; // Adjust to your profile update page route

  // Navbar links for logged-in users
  const loggedInLinks = (
    <div style={{ marginLeft: "auto", position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        style={{
          cursor: "pointer",
          background: "transparent",
          border: "none",
          color: "#fff",
          fontWeight: "bold",
          padding: "5px 10px",
        }}
      >
        Profile ▼
      </button>

      {dropdownOpen && (
  <div
    style={{
      position: "absolute",
      right: 0,
      top: "100%",
      background: "#333",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      zIndex: 1000,
      minWidth: "140px",
    }}
  >
    <div
      style={{
        padding: "10px",
        color: "#fff",
        borderBottom: "1px solid #444",
        whiteSpace: "nowrap",
        fontWeight: "bold",
      }}
    >
      {userEmail}
    </div>
    <button
      onClick={handleLogout}
      style={{
        width: "100%",
        padding: "10px",
        background: "none",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      Logout
    </button>
  </div>
)}




    </div>
  );

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 20px",
      background: userRole === "SuperAdmin" || userRole === "Admin" ? "#444" : "#222",
      color: "#fff",
      gap: "10px",
    }}>
      {
        
        (userRole === 'SuperAdmin' && (
          <Link to="/admin/users" style={{ color: '#fff', marginLeft: '15px' }}>
            Manage Users
          </Link>
        ))
      }

      {(userRole === "SuperAdmin" || userRole === "Admin") ? (
        <>
          <Link style={{ color: "#fff", fontWeight: "bold" }} to="/admin/dashboard">Admin Dashboard</Link>
          {userRole && loggedInLinks}
        </>


      ) : (
        <>
          <Link style={{ color: "#fff", fontWeight: "bold" }} to="/">Home</Link>
          {!userRole && (
            <>
              <Link style={{ color: "#fff" }} to="/register">Register</Link>
              <Link style={{ color: "#fff" }} to="/login">Login</Link>
            </>
          )}
          {userRole && loggedInLinks}
        </>
      )}
    </nav>
  );
}

export default Navbar;
