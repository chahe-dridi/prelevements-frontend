import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
    const { userRole, userEmail, logout } = useContext(AuthContext);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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

    const profilePath = "/profile";

    const navLinkStyle = {
        color: "#fff",
        fontWeight: "bold",
        textDecoration: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        transition: "background 0.2s",
        margin: "0 4px",
        fontSize: "16px",
    };

    const navLinkHoverStyle = {
        background: "rgba(255,255,255,0.12)",
    };

    // Navbar links for logged-in users
    const loggedInLinks = (
        <div style={{ marginLeft: "auto", position: "relative" }} ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(prev => !prev)}
                style={{
                    cursor: "pointer",
                    background: "linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <span style={{
                    background: "#fff",
                    color: "#4e54c8",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "15px",
                }}>
                    {userEmail ? userEmail[0].toUpperCase() : "U"}
                </span>
                <span>{userEmail} ({userRole})</span>
                <span style={{ fontSize: "14px" }}>▼</span>
            </button>

            {dropdownOpen && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "110%",
                        background: "#fff",
                        borderRadius: "8px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        zIndex: 1000,
                        minWidth: "180px",
                        overflow: "hidden",
                        animation: "fadeIn 0.2s",
                    }}
                >
                    <Link
                        to={profilePath}
                        style={{
                            display: "block",
                            padding: "12px 20px",
                            color: "#4e54c8",
                            textDecoration: "none",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                            background: "none",
                            transition: "background 0.2s",
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "#f5f6fa"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
                    >
                        Profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            padding: "12px 20px",
                            background: "none",
                            border: "none",
                            color: "#e74c3c",
                            cursor: "pointer",
                            textAlign: "left",
                            fontWeight: "bold",
                            fontSize: "15px",
                            transition: "background 0.2s",
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "#f5f6fa"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
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
            padding: "0 32px",
            background: "linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)",
            color: "#fff",
            gap: "10px",
            height: "64px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            borderRadius: "0 0 16px 16px",
            position: "sticky",
            top: 0,
            zIndex: 100,
        }}>
            <Link
                to="/"
                style={{
                    ...navLinkStyle,
                    fontSize: "22px",
                    letterSpacing: "2px",
                    fontWeight: "900",
                    background: "rgba(255,255,255,0.10)",
                    marginRight: "18px",
                }}
            >
                Prelevements
            </Link>
            {(userRole === "SuperAdmin" || userRole === "Admin") ? (
                <>
                    <Link
                        style={navLinkStyle}
                        to="/admin/dashboard"
                        onMouseOver={e => e.currentTarget.style.background = navLinkHoverStyle.background}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
                    >
                        Admin Dashboard
                    </Link>
                    {userRole === 'SuperAdmin' && (
                        <Link
                            to="/admin/users"
                            style={navLinkStyle}
                            onMouseOver={e => e.currentTarget.style.background = navLinkHoverStyle.background}
                            onMouseOut={e => e.currentTarget.style.background = "none"}
                        >
                            Manage Users
                        </Link>
                    )}
                    {userRole && loggedInLinks}
                </>
            ) : (
                <>
                    <Link
                        style={navLinkStyle}
                        to="/"
                        onMouseOver={e => e.currentTarget.style.background = navLinkHoverStyle.background}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
                    >
                        Home
                    </Link>
                    {!userRole && (
                        <>
                            <Link
                                style={navLinkStyle}
                                to="/register"
                                onMouseOver={e => e.currentTarget.style.background = navLinkHoverStyle.background}
                                onMouseOut={e => e.currentTarget.style.background = "none"}
                            >
                                Register
                            </Link>
                            <Link
                                style={navLinkStyle}
                                to="/login"
                                onMouseOver={e => e.currentTarget.style.background = navLinkHoverStyle.background}
                                onMouseOut={e => e.currentTarget.style.background = "none"}
                            >
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
