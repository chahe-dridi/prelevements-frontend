import React, { useState, useContext } from 'react';
import { loginUser } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // named import now

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
            const role = decoded.role || "Utilisateur";
            const userEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || "";

            setUser(role, userEmail);

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
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p>{message}</p>
        </div>
    );
}

export default Login;
