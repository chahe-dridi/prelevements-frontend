import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../assets/Navbar.css';

function Navbar() {
    const { userRole, userEmail, logout } = useContext(AuthContext);
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

    // Navbar links for logged-in users
    const loggedInLinks = (
        <div className="user-dropdown-container" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="user-dropdown-button"
            >
                {userEmail} ({userRole}) ▼
            </button>

            {dropdownOpen && (
                <div className="dropdown-menu">
                  
                     <button
                        onClick={() => {
                            setDropdownOpen(false);
                            navigate('/profile');
                        }}
                        className="dropdown-logout"
                    >
                        Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="dropdown-logout"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );

    return (
    <nav className={`navbar ${(userRole === "SuperAdmin" || userRole === "Admin") ? 'admin' : 'user'}`}>
        {(userRole === "SuperAdmin" || userRole === "Admin") ? (
            <>
                <Link className="navbar-link" to="/admin/home">Home</Link>

                <Link className="navbar-link bold" to="/admin/dashboard">
                    Admin Dashboard
                </Link>
               
                <Link className="navbar-link" to="/admin/demandes">Gestion des Demandes</Link>
                <Link className="navbar-link" to="/demandes">Faire une demande</Link>
                <Link className="navbar-link" to="/demandes/history">Mon Historique</Link>

                 
                {userRole === 'SuperAdmin' && (
                    <Link to="/admin/users" className="navbar-link manage-users">
                        Manage Users
                    </Link>
                )}
                {userRole && loggedInLinks}
            </>
        ) : (
            <>
                <Link className="navbar-link bold" to="/">
                    Home
                </Link>
                {!userRole && (
                    <>
                        <Link className="navbar-link" to="/register">
                            Register
                        </Link>
                        <Link className="navbar-link" to="/login">
                            Login
                        </Link>
                    </>
                )}
                {userRole && loggedInLinks}
            </>
        )}

        {userRole === "Utilisateur" && (
                     
            <>
                <Link className="navbar-link" to="/demandes">Faire une demande</Link>
                <Link className="navbar-link" to="/demandes/historique">Mon Historique</Link>
            </>
        )}

    </nav>
);
}

export default Navbar;