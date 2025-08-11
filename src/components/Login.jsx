import React, { useState, useContext } from 'react';
import { loginUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../assets/Login.css';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const [email, setEmail] = useState(location.state?.email || "");
    const [password, setPassword] = useState(location.state?.password || "");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const data = await loginUser(email, password);

            const token = data.token;
            if (!token) {
                setMessage("❌ No token received");
                return;
            }

            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || "Utilisateur";
            const userEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || "";

            setUser(role, userEmail, token);

            setMessage("✅ Logged in! Redirecting...");

            if (role === "SuperAdmin" || role === "Admin") {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            console.error("Login error:", err);
            setMessage("❌ " + (err.response?.data || err.message || "Error occurred"));
        }
    };

    // Detect mobile screen
    const isMobile = window.innerWidth <= 480;

    return (
        <div className="login-container">
            <div className={`login-card ${isMobile ? 'mobile' : ''}`}>
                <h2 className={`login-title ${isMobile ? 'mobile' : ''}`}>
                    Login
                </h2>
                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                        className={`login-input ${isMobile ? 'mobile' : ''}`}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className={`login-input ${isMobile ? 'mobile' : ''}`}
                    />
                    <button 
                        type="submit"
                        className={`login-button ${isMobile ? 'mobile' : ''}`}
                    >
                        Login
                    </button>
                </form>
                <p className={`login-message ${isMobile ? 'mobile' : ''} ${
                    message.startsWith("✅") ? 'success' : message ? 'error' : ''
                }`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default Login;