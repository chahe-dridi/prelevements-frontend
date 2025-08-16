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

    const handleDropdownClick = (action) => {
        setDropdownOpen(false);
        if (action === 'profile') {
            navigate('/profile');
        } else if (action === 'logout') {
            handleLogout();
        }
    };

    // User dropdown component
    const UserDropdown = () => (
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
                        onClick={() => handleDropdownClick('profile')}
                        className="dropdown-item"
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={() => handleDropdownClick('logout')}
                        className="dropdown-item dropdown-logout"
                    >
                        🚪 Logout
                    </button>
                </div>
            )}
        </div>
    );

    // Navigation links based on user role
    const renderNavigationLinks = () => {
        if (!userRole) {
            // Not logged in
            return (
                <>
                    <Link className="navbar-link navbar-brand" to="/">
                        🏠 Home
                    </Link>
                    <div className="navbar-spacer"></div>
                    <Link className="navbar-link" to="/register">
                        📝 Register
                    </Link>
                    <Link className="navbar-link" to="/login">
                        🔑 Login
                    </Link>
                </>
            );
        }

        if (userRole === "SuperAdmin" || userRole === "Admin") {
            // Admin/SuperAdmin navigation
            return (
                <>
                    <Link className="navbar-link navbar-brand" to="/admin/home">
                        🏠 Home
                    </Link>
                    <Link className="navbar-link admin-dashboard" to="/admin/dashboard">
                        📊 Admin Dashboard
                    </Link>
                    <Link className="navbar-link" to="/admin/demandes">
                        📋 Gestion des Demandes
                    </Link>
                    <Link className="navbar-link" to="/demandes">
                        ➕ Faire une demande
                    </Link>
                    <Link className="navbar-link" to="/demandes/historique">
                        📜 Mon Historique
                    </Link>
                    
                    {userRole === 'SuperAdmin' && (
                        <Link to="/admin/users" className="navbar-link superadmin-link">
                            👥 Manage Users
                        </Link>
                    )}
                    
                    <div className="navbar-spacer"></div>
                    <UserDropdown />
                </>
            );
        }

        if (userRole === "Utilisateur") {
            // Regular user navigation
            return (
                <>
                    <Link className="navbar-link navbar-brand" to="/">
                        🏠 Home
                    </Link>
                    <Link className="navbar-link" to="/demandes">
                        ➕ Faire une demande
                    </Link>
                    <Link className="navbar-link" to="/demandes/historique">
                        📜 Mon Historique
                    </Link>
                    
                    <div className="navbar-spacer"></div>
                    <UserDropdown />
                </>
            );
        }

        // Fallback for other roles
        return (
            <>
                <Link className="navbar-link navbar-brand" to="/">
                    🏠 Home
                </Link>
                <div className="navbar-spacer"></div>
                <UserDropdown />
            </>
        );
    };

    return (
        <nav className={`navbar ${getNavbarClass(userRole)}`}>
            {renderNavigationLinks()}
        </nav>
    );
}

// Helper function to determine navbar class
function getNavbarClass(userRole) {
    if (userRole === "SuperAdmin" || userRole === "Admin") {
        return 'admin';
    }
    if (userRole === "Utilisateur") {
        return 'user';
    }
    return 'guest';
}

export default Navbar;