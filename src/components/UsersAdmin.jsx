import React, { useEffect, useState, useContext, useMemo } from 'react';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

   

  const searchTermLower = searchTerm.toLowerCase().trim();
  
  return users.filter(user => {
    // Search only by email
    const email = (user.email || '').toLowerCase();
    return email.includes(searchTermLower);
  });
}, [users, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    // Calculate range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        className="pagination-button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Previous
      </button>
    );

    // First page button
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          className="pagination-button"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="pagination-ellipsis">...</span>
        );
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Last page button
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="pagination-ellipsis">...</span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          className="pagination-button"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        className="pagination-button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next →
      </button>
    );

    return buttons;
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
        <span className="users-count">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
          {searchTerm && ` (filtered from ${users.length})`}
        </span>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <div className="items-per-page">
          <label htmlFor="itemsPerPage">Show:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="no-users-message">
          {searchTerm ? `No users found matching "${searchTerm}"` : "No users found."}
        </div>
      ) : (
        <>
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
                {currentUsers.map(user => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
              </div>
              <div className="pagination-controls-bottom">
                {renderPaginationButtons()}
              </div>
            </div>
          )}
        </>
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