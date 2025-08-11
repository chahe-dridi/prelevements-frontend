import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

function Register() {
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await registerUser(nom, prenom, email, password);
            setMessage("✅ Registered successfully! Redirecting to login...");

            // Redirect after short delay and pass email/password in state
            setTimeout(() => {
                navigate("/login", { state: { email, password } });
            }, 1500);

        } catch (err) {
            setMessage("❌ " + (err.response?.data || "Error occurred"));
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
                <input placeholder="Prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Register</button>
            </form>
            <p>{message}</p>
        </div>
    );
}

export default Register;
