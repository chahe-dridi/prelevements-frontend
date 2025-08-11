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

  // Fetch profile on mount
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
    <div style={{ padding: "20px" }}>
      <h2>Update My Profile</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
        <div>
          <label>Nom:</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Prénom:</label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          Update Profile
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
