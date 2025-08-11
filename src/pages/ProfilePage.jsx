// src/pages/ProfilePage.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

function ProfilePage() {
    const { token, userEmail } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: ""
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

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
                setFormData({
                    nom: data.nom || "",
                    prenom: data.prenom || "",
                    email: data.email || ""
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token]);

    const handleChange = e => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        setMessage("");

        fetch("https://localhost:7101/api/Users/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update profile");
                return res.text();
            })
            .then(() => setMessage("Profile updated successfully!"))
            .catch(err => setMessage("Error: " + err.message));
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
            <div style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                padding: "32px 40px",
                maxWidth: "420px",
                width: "100%"
            }}>
                <h2 style={{
                    textAlign: "center",
                    marginBottom: "24px",
                    color: "#2d3a4b",
                    letterSpacing: "1px"
                }}>
                    Update My Profile
                </h2>
                {message && (
                    <div style={{
                        marginBottom: "16px",
                        padding: "10px",
                        borderRadius: "6px",
                        background: message.startsWith("Error") ? "#ffeaea" : "#e6ffed",
                        color: message.startsWith("Error") ? "#d93025" : "#137333",
                        border: message.startsWith("Error") ? "1px solid #f5c6cb" : "1px solid #b7eb8f"
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "bold",
                            color: "#2d3a4b"
                        }}>Nom:</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "16px",
                                outline: "none",
                                transition: "border 0.2s",
                                boxSizing: "border-box"
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "bold",
                            color: "#2d3a4b"
                        }}>Prénom:</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "16px",
                                outline: "none",
                                transition: "border 0.2s",
                                boxSizing: "border-box"
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{
                            display: "block",
                            marginBottom: "6px",
                            fontWeight: "bold",
                            color: "#2d3a4b"
                        }}>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "16px",
                                outline: "none",
                                transition: "border 0.2s",
                                boxSizing: "border-box"
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "16px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(79,140,255,0.10)",
                            transition: "background 0.2s"
                        }}
                    >
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfilePage;
