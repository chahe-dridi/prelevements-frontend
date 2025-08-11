import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav style={{ padding: "10px", background: "#222", color: "#fff" }}>
            <Link style={{ marginRight: "10px", color: "#fff" }} to="/">Home</Link>
            <Link style={{ marginRight: "10px", color: "#fff" }} to="/register">Register</Link>
            <Link style={{ marginRight: "10px", color: "#fff" }} to="/login">Login</Link>
        </nav>
    );
}

export default Navbar;
