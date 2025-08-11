import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import '../assets/Register.css';

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

            setTimeout(() => {
                navigate("/login", { state: { email, password } });
            }, 1500);

        } catch (err) {
            setMessage("❌ " + (err.response?.data || "Error occurred"));
        }
    };

    // Detect mobile screen
    const isMobile = window.innerWidth <= 480;

    return (
        <div className="register-container">
            <div className={`register-card ${isMobile ? 'mobile' : ''}`}>
                <h2 className={`register-title ${isMobile ? 'mobile' : ''}`}>
                    Créer un compte
                </h2>
                <form onSubmit={handleRegister} className="register-form">
                    <input
                        placeholder="Nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className={`register-input ${isMobile ? 'mobile' : ''}`}
                        required
                    />
                    <input
                        placeholder="Prénom"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className={`register-input ${isMobile ? 'mobile' : ''}`}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`register-input ${isMobile ? 'mobile' : ''}`}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`register-input ${isMobile ? 'mobile' : ''}`}
                        required
                    />
                    <button 
                        type="submit"
                        className={`register-button ${isMobile ? 'mobile' : ''}`}
                    >
                        S'inscrire
                    </button>
                </form>
                <p className={`register-message ${isMobile ? 'mobile' : ''} ${
                    message.startsWith("✅") ? 'success' : message ? 'error' : ''
                }`}>
                    {message}
                </p>
                <div className={`register-link-section ${isMobile ? 'mobile' : ''}`}>
                    <span className="register-link-text">Déjà inscrit ? </span>
                    <a href="/login" className="register-link">
                        Se connecter
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Register;