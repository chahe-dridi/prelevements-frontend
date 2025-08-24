import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import Footer from '../components/Footer';
import '../assets/ProfilePage.css';

function ProfilePage() {
    const { token, userEmail } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("profile");
    const [profileData, setProfileData] = useState({
        nom: "",
        prenom: "",
        email: ""
    });
    const [passwordData, setPasswordData] = useState({
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(null);

    const showMessage = (msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    useEffect(() => {
        if (!token) return;

        fetch("https://localhost:7101/api/Users/profile", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to load profile");
                return res.json();
            })
            .then(data => {
                setProfileData({
                    nom: data.nom || "",
                    prenom: data.prenom || "",
                    email: data.email || ""
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                showMessage("Erreur lors du chargement du profil", "error");
                setLoading(false);
            });
    }, [token]);

    const handleProfileChange = e => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChange = e => {
        setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const showConfirmationDialog = (updateType, data) => {
        setPendingUpdate({ type: updateType, data });
        setShowConfirmation(true);
    };

    const handleConfirm = () => {
        setShowConfirmation(false);
        if (pendingUpdate?.type === "profile") {
            updateProfile(pendingUpdate.data);
        } else if (pendingUpdate?.type === "password") {
            updatePassword(pendingUpdate.data);
        }
        setPendingUpdate(null);
    };

    const handleCancel = () => {
        setShowConfirmation(false);
        setPendingUpdate(null);
    };

    const updateProfile = (data) => {
        setMessage("");

        fetch("https://localhost:7101/api/Users/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update profile");
                return res.text();
            })
            .then(() => {
                showMessage("Profil mis à jour avec succès!", "success");
            })
            .catch(err => showMessage("Erreur lors de la mise à jour du profil", "error"));
    };

    const updatePassword = (data) => {
        setMessage("");

        fetch("https://localhost:7101/api/Users/password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                password: data.password,
                confirmPassword: data.confirmPassword
            })
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(errorData => {
                        throw new Error(errorData.message || "Failed to update password");
                    });
                }
                return res.json();
            })
            .then((response) => {
                showMessage(response.message || "Mot de passe mis à jour avec succès!", "success");
                setPasswordData({ password: "", confirmPassword: "" });
            })
            .catch(err => showMessage("Erreur lors de la mise à jour du mot de passe", "error"));
    };

    const handleProfileSubmit = e => {
        e.preventDefault();
        showConfirmationDialog("profile", profileData);
    };

    const handlePasswordSubmit = e => {
        e.preventDefault();
        
        if (passwordData.password !== passwordData.confirmPassword) {
            showMessage("Les mots de passe ne correspondent pas", "error");
            return;
        }
        
        if (passwordData.password.length < 6) {
            showMessage("Le mot de passe doit contenir au moins 6 caractères", "error");
            return;
        }

        showConfirmationDialog("password", passwordData);
    };

    if (loading) {
        return (
            <div className="profile-page-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Chargement du profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            {/* Header */}
            <div className="profile-header">
                <h1 className="profile-main-title">👤 Mon Profil</h1>
                <p className="profile-subtitle">
                    Gérez vos informations personnelles et paramètres de sécurité
                </p>
            </div>

            {/* Main Content */}
            <div className="profile-content">
                <div className="profile-card">
                    {/* User Info Header */}
                    <div className="user-info-header">
                        <div className="user-avatar">
                            <span className="avatar-icon">👤</span>
                        </div>
                        <div className="user-details">
                            <h2 className="user-name">
                                {profileData.prenom} {profileData.nom}
                            </h2>
                            <p className="user-email">{profileData.email}</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="section-tabs">
                        <button 
                            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <span className="tab-icon">📝</span>
                            Informations personnelles
                        </button>
                        <button 
                            className={`tab-button ${activeTab === "password" ? "active" : ""}`}
                            onClick={() => setActiveTab("password")}
                        >
                            <span className="tab-icon">🔒</span>
                            Sécurité
                        </button>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`profile-message ${messageType}`}>
                            <span className="message-icon">
                                {messageType === 'success' ? '✅' : '❌'}
                            </span>
                            {message}
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="tab-content">
                        {/* Profile Information Tab */}
                        {activeTab === "profile" && (
                            <div className="tab-panel">
                                <div className="panel-header">
                                    <h3>📝 Informations personnelles</h3>
                                    <p>Modifiez vos informations de base</p>
                                </div>
                                
                                <form onSubmit={handleProfileSubmit} className="profile-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">
                                                <span className="label-icon">👤</span>
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                name="nom"
                                                value={profileData.nom}
                                                onChange={handleProfileChange}
                                                className="form-input"
                                                placeholder="Votre nom"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="form-label">
                                                <span className="label-icon">👤</span>
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                name="prenom"
                                                value={profileData.prenom}
                                                onChange={handleProfileChange}
                                                className="form-input"
                                                placeholder="Votre prénom"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">📧</span>
                                            Adresse email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            className="form-input"
                                            placeholder="votre.email@exemple.com"
                                            required
                                        />
                                    </div>
                                    
                                    <button type="submit" className="btn btn-primary">
                                        <span className="btn-icon">💾</span>
                                        Mettre à jour le profil
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === "password" && (
                            <div className="tab-panel">
                                <div className="panel-header">
                                    <h3>🔒 Sécurité du compte</h3>
                                    <p>Modifiez votre mot de passe pour sécuriser votre compte</p>
                                </div>
                                
                                <form onSubmit={handlePasswordSubmit} className="profile-form">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">🔑</span>
                                            Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={passwordData.password}
                                            onChange={handlePasswordChange}
                                            className="form-input"
                                            placeholder="Minimum 6 caractères"
                                            required
                                        />
                                        <small className="form-hint">
                                            Le mot de passe doit contenir au moins 6 caractères
                                        </small>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">🔑</span>
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="form-input"
                                            placeholder="Répétez le mot de passe"
                                            required
                                        />
                                    </div>
                                    
                                    <button type="submit" className="btn btn-secondary">
                                        <span className="btn-icon">🔒</span>
                                        Changer le mot de passe
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="confirmation-overlay">
                    <div className="confirmation-dialog">
                        <div className="confirmation-header">
                            <h3 className="confirmation-title">
                                <span className="confirmation-icon">⚠️</span>
                                Confirmer la modification
                            </h3>
                        </div>
                        <div className="confirmation-content">
                            <p className="confirmation-message">
                                {pendingUpdate?.type === "profile" 
                                    ? "Êtes-vous sûr de vouloir mettre à jour vos informations personnelles ?"
                                    : "Êtes-vous sûr de vouloir changer votre mot de passe ?"
                                }
                            </p>
                        </div>
                        <div className="confirmation-actions">
                            <button className="btn-confirm cancel" onClick={handleCancel}>
                                <span className="btn-icon">❌</span>
                                Annuler
                            </button>
                            <button className="btn-confirm confirm" onClick={handleConfirm}>
                                <span className="btn-icon">✅</span>
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default ProfilePage;