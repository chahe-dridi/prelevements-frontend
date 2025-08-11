import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function UsersAdmin() {
  const { token } = useContext(AuthContext); // JWT token
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const roles = ['SuperAdmin', 'Admin', 'Utilisateur'];

  useEffect(() => {
    if (!token) {
      setError("No authentication token found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch('https://localhost:7101/api/Users', {  // Use full URL or ensure proxy config
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users: " + res.status);
        return res.json();
      })
      .then(data => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  // Role coming from backend might be an integer enum — convert it to string
  // If your backend sends string role names, skip this
  const convertRoleToString = (role) => {
    // Example conversion, adjust as per your backend enum values:
    // SuperAdmin = 0, Admin = 1, Utilisateur = 2
    if (typeof role === "number") {
      return roles[role] || "Utilisateur";
    }
    return role; // assume it's already string
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError("");

    // Optional: convert role string back to enum number if backend expects numbers
    // e.g., const roleEnumValue = roles.indexOf(newRole);

    try {
      const response = await fetch('https://localhost:7101/api/Users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }), // or role: roleEnumValue
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to update role');
      }

      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Users Management</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prenom</th>
              <th>Email</th>
              <th>Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ id, nom, prenom, email, role }) => (
              <tr key={id}>
                <td>{nom}</td>
                <td>{prenom}</td>
                <td>{email}</td>
                <td>{convertRoleToString(role)}</td>
                <td>
                  <select
                    value={convertRoleToString(role)}
                    onChange={e => handleRoleChange(id, e.target.value)}
                    disabled={updatingUserId === id}
                  >
                    {roles.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {updatingUserId === id && <span> Updating...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersAdmin;
