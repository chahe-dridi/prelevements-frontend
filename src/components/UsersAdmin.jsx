import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../assets/UsersAdmin.css';

const UsersAdmin = () => {
  const { token, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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

  const getRoleBadgeClass = (role) => {
    const roleString = convertRoleToString(role).toLowerCase();
    return `role-badge ${roleString}`;
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

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: convertRoleToString(user.role)
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setEditForm({ nom: "", prenom: "", email: "", role: "" });
    setError("");
  };


        const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        setUpdatingUserId(userId);
        setError("");

        try {
            const response = await fetch(`https://localhost:7101/api/Users/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            });

            if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingUserId(null);
        }
        };





  const saveUser = async () => {
    if (!editingUser) return;

    setUpdatingUserId(editingUser.id);
    setError("");

    const roleEnumValue = roles.indexOf(editForm.role);

    try {
      const response = await fetch(`https://localhost:7101/api/Users/${editingUser.id}`, {
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
          u.id === editingUser.id
            ? { ...u, ...editForm, role: roleEnumValue }
            : u
        )
      );
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="users-admin-container">
        <div className="loading-message">🔄 Loading users...</div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="users-admin-container">
        <div className="error-message">❌ Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      <div className="users-admin-header">
        <h2 className="users-admin-title">👥 Users Management</h2>
        <span className="users-count">{users.length} users</span>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="no-users-message">No users found.</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
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
                  <td>{user.nom}</td>
                  <td>{user.prenom}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {convertRoleToString(user.role)}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => openEditModal(user)}
                        disabled={updatingUserId === user.id}
                      >
                        ✏️ Edit
                      </button>
                     

                       




                    
                    {/* <select
                    className="role-select"
                    value={convertRoleToString(user.role)}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingUserId === user.id || userRole !== 'SuperAdmin'}
                    >
                    {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                    </select> */}

                         <button 
                        className="delete-button"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={updatingUserId === user.id}
                        >
                        🗑️ Delete
                        </button>



                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit User</h3>
              <button className="close-button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveUser(); }}>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  required
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button" 
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="save-button" 
                  disabled={updatingUserId === editingUser?.id}
                >
                  {updatingUserId === editingUser?.id ? '⏳ Saving...' : '💾 Save Changes'}
                </button>




              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;