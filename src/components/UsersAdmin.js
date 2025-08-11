import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function UsersAdmin() {
  const { token, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", email: "", role: "" });

  const roles = ['SuperAdmin', 'Admin', 'Utilisateur'];

  useEffect(() => {
    if (!token) {
      setError("No authentication token found.");
      setLoading(false);
      return;
    }

    if (userRole !== 'SuperAdmin') {
      navigate('/404', { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    fetch('https://localhost:7101/api/Users', {
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
  }, [token, userRole, navigate]);

  const convertRoleToString = (role) => {
    if (typeof role === "number") {
      return roles[role] || "Utilisateur";
    }
    return role;
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError("");

    const roleEnumValue = roles.indexOf(newRole);

    try {
      const response = await fetch('https://localhost:7101/api/Users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: roleEnumValue }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to update role');
      }

      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, role: roleEnumValue } : u
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: convertRoleToString(user.role)
    });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditForm({ nom: "", prenom: "", email: "", role: "" });
  };

  const saveUser = async (userId) => {
    setUpdatingUserId(userId);
    setError("");

    const roleEnumValue = roles.indexOf(editForm.role);

    try {
      const response = await fetch(`https://localhost:7101/api/Users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: editForm.nom,
          prenom: editForm.prenom,
          email: editForm.email,
          role: roleEnumValue
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to update user');
      }

      setUsers(prev =>
        prev.map(u =>
          u.id === userId
            ? { ...u, ...editForm, role: roleEnumValue }
            : u
        )
      );
      cancelEditing();
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
              <th>Prénom</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                {editingUserId === user.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editForm.nom}
                        onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editForm.prenom}
                        onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        {roles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => saveUser(user.id)} disabled={updatingUserId === user.id}>Save</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{user.nom}</td>
                    <td>{user.prenom}</td>
                    <td>{user.email}</td>
                    <td>{convertRoleToString(user.role)}</td>
                    <td>
                      <button onClick={() => startEditing(user)}>Edit</button>
                      <select
                        value={convertRoleToString(user.role)}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingUserId === user.id || userRole !== 'SuperAdmin'}
                      >
                        {roles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersAdmin;
