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
                  
                    <div className="dropdown-profile">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                        Profile
                    </Link>
                    </div>

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
            {userRole === 'SuperAdmin' && (
                <Link to="/admin/users" className="navbar-link manage-users">
                    Manage Users
                </Link>
            )}

            {(userRole === "SuperAdmin" || userRole === "Admin") ? (
                <>
                    <Link className="navbar-link bold" to="/admin/dashboard">
                        Admin Dashboard
                    </Link>
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
        </nav>
    );
}

export default Navbar;