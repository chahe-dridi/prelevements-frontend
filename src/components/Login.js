import React, { useState, useContext } from 'react';
import { loginUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Login() {
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

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)"
        }}>
            <div style={{
                background: "#fff",
                padding: "2.5rem 2rem",
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                minWidth: "340px",
                maxWidth: "90vw"
            }}>
                <h2 style={{
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    color: "#3730a3",
                    letterSpacing: "1px"
                }}>Login</h2>
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        required
                        style={{
                            padding: "0.75rem 1rem",
                            border: "1px solid #c7d2fe",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "border 0.2s",
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        style={{
                            padding: "0.75rem 1rem",
                            border: "1px solid #c7d2fe",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            outline: "none",
                            transition: "border 0.2s",
                        }}
                    />
                    <button type="submit" style={{
                        padding: "0.75rem 1rem",
                        background: "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        cursor: "pointer",
                        transition: "background 0.2s"
                    }}>
                        Login
                    </button>
                </form>
                <p style={{
                    marginTop: "1rem",
                    textAlign: "center",
                    color: message.startsWith("✅") ? "#16a34a" : "#dc2626",
                    minHeight: "1.5em"
                }}>{message}</p>
            </div>
        </div>
    );
}

export default Login;
