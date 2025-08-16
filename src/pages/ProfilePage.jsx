import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
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
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState(null);

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
                setMessage("Error: Failed to load profile");
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
                setMessage("Profil mis à jour avec succès!");
                setTimeout(() => setMessage(""), 3000);
            })
            .catch(err => setMessage("Error: " + err.message));
    };

    const updatePassword = (data) => {
        setMessage("");

        // Use the dedicated password endpoint
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
                setMessage(response.message || "Mot de passe mis à jour avec succès!");
                setPasswordData({ password: "", confirmPassword: "" });
                setTimeout(() => setMessage(""), 3000);
            })
            .catch(err => setMessage("Erreur: " + err.message));
    };

    const handleProfileSubmit = e => {
        e.preventDefault();
        showConfirmationDialog("profile", profileData);
    };

    const handlePasswordSubmit = e => {
        e.preventDefault();
        
        if (passwordData.password !== passwordData.confirmPassword) {
            setMessage("Erreur: Les mots de passe ne correspondent pas");
            return;
        }
        
        if (passwordData.password.length < 6) {
            setMessage("Erreur: Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        showConfirmationDialog("password", passwordData);
    };

    if (loading) {
        return (
            <div className="profile-page-container">
                <div className="loading-text">
                    🔄 Chargement du profil...
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            <div className="profile-card">
                <h2 className="profile-title">Mon Profil</h2>
                
                {/* Tab Navigation */}
                <div className="section-tabs">
                    <button 
                        className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        👤 Informations
                    </button>
                    <button 
                        className={`tab-button ${activeTab === "password" ? "active" : ""}`}
                        onClick={() => setActiveTab("password")}
                    >
                        🔒 Mot de passe
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`message ${message.startsWith("Error") || message.startsWith("Erreur") ? "error" : "success"}`}>
                        {message}
                    </div>
                )}

                {/* Profile Information Tab */}
                {activeTab === "profile" && (
                    <form onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nom:</label>
                            <input
                                type="text"
                                name="nom"
                                value={profileData.nom}
                                onChange={handleProfileChange}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Prénom:</label>
                            <input
                                type="text"
                                name="prenom"
                                value={profileData.prenom}
                                onChange={handleProfileChange}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Email:</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleProfileChange}
                                className="form-input"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary">
                            💾 Mettre à jour le profil
                        </button>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === "password" && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nouveau mot de passe:</label>
                            <input
                                type="password"
                                name="password"
                                value={passwordData.password}
                                onChange={handlePasswordChange}
                                className="form-input"
                                placeholder="Minimum 6 caractères"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Confirmer le mot de passe:</label>
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
                            🔒 Changer le mot de passe
                        </button>
                    </form>
                )}
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="confirmation-overlay">
                    <div className="confirmation-dialog">
                        <h3 className="confirmation-title">Confirmer la modification</h3>
                        <p className="confirmation-message">
                            {pendingUpdate?.type === "profile" 
                                ? "Êtes-vous sûr de vouloir mettre à jour vos informations personnelles ?"
                                : "Êtes-vous sûr de vouloir changer votre mot de passe ?"
                            }
                        </p>
                        <div className="confirmation-buttons">
                            <button className="btn-confirm cancel" onClick={handleCancel}>
                                Annuler
                            </button>
                            <button className="btn-confirm confirm" onClick={handleConfirm}>
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;