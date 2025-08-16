import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../assets/UsersAdmin.css';
import Footer from './Footer';

const UsersAdmin = () => {
  const { token, userRole, userEmail } = useContext(AuthContext); // Add userEmail
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false); // New state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nom: "", 
    prenom: "", 
    email: "", 
    role: "",
    password: "",
    confirmPassword: "",
    updatePassword: false
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const roles = ['SuperAdmin', 'Admin', 'Utilisateur'];

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Check if the user is the current logged-in user
  const isCurrentUser = (user) => {
    return user.email === userEmail;
  };

  useEffect(() => {
    if (!token) {
      setError("Aucun token d'authentification trouvé.");
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
        if (!res.ok) throw new Error("Échec du chargement des utilisateurs: " + res.status);
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

  // Enhanced filter with multiple search criteria
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return users.filter(user => {
      const nom = (user.nom || '').toLowerCase();
      const prenom = (user.prenom || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const role = convertRoleToString(user.role).toLowerCase();
      
      return nom.includes(searchTermLower) || 
             prenom.includes(searchTermLower) || 
             email.includes(searchTermLower) ||
             role.includes(searchTermLower);
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

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: convertRoleToString(user.role),
      password: "",
      confirmPassword: "",
      updatePassword: false
    });
    setShowModal(true);
    setError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setEditForm({ 
      nom: "", 
      prenom: "", 
      email: "", 
      role: "",
      password: "",
      confirmPassword: "",
      updatePassword: false
    });
    setError("");
    setMessage('');
  };

  const closeRoleConfirmModal = () => {
    setShowRoleConfirmModal(false);
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    
    // Prevent deleting current user
    if (isCurrentUser(user)) {
      showMessage('❌ Vous ne pouvez pas supprimer votre propre compte!', 'error');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user?.nom} ${user?.prenom}?`)) return;

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
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Échec de la suppression';
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || 'Échec de la suppression';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      showMessage(result.message || '✅ Utilisateur supprimé avec succès!', 'success');
      
      // Adjust pagination if needed
      const newTotalCount = filteredUsers.length - 1;
      const newTotalPages = Math.ceil(newTotalCount / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      setError(err.message);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleChange = (newRole) => {
    // Check if promoting to SuperAdmin
    if (newRole === 'SuperAdmin' && editForm.role !== 'SuperAdmin') {
      setEditForm({ ...editForm, role: newRole });
      setShowRoleConfirmModal(true);
      return;
    }
    
    setEditForm({ ...editForm, role: newRole });
  };

  const confirmSuperAdminPromotion = () => {
    setShowRoleConfirmModal(false);
    // Role is already set in editForm, just continue
  };

  const cancelSuperAdminPromotion = () => {
    setShowRoleConfirmModal(false);
    // Reset role to previous value
    setEditForm({ ...editForm, role: convertRoleToString(editingUser.role) });
  };

  const saveUser = async () => {
    if (!editingUser) return;

    // Validation
    if (!editForm.nom.trim() || !editForm.prenom.trim() || !editForm.email.trim()) {
      setError("Tous les champs obligatoires doivent être remplis");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setError("Format d'email invalide");
      return;
    }

    // Password validation if updating password
    if (editForm.updatePassword) {
      if (!editForm.password || !editForm.confirmPassword) {
        setError("Veuillez saisir le mot de passe et sa confirmation");
        return;
      }

      if (editForm.password !== editForm.confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }

      if (editForm.password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }

    setUpdatingUserId(editingUser.id);
    setError("");

    const roleEnumValue = roles.indexOf(editForm.role);

    // Prepare the update data
    const updateData = {
      nom: editForm.nom.trim(),
      prenom: editForm.prenom.trim(),
      email: editForm.email.trim(),
      role: roleEnumValue
    };

    // Add password fields if updating password
    if (editForm.updatePassword) {
      updateData.password = editForm.password;
      updateData.confirmPassword = editForm.confirmPassword;
    }

    try {
      const response = await fetch(`https://localhost:7101/api/Users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Échec de la mise à jour';
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || 'Échec de la mise à jour';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUsers(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, nom: editForm.nom, prenom: editForm.prenom, email: editForm.email, role: roleEnumValue }
            : u
        )
      );
      
      const successMessage = editForm.updatePassword 
        ? result.message || '✅ Utilisateur et mot de passe mis à jour avec succès!'
        : result.message || '✅ Utilisateur mis à jour avec succès!';
      
      showMessage(successMessage, 'success');
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
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
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
        ← Précédent
      </button>
    );

    // First page
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

    // Page numbers
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

    // Last page
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
        Suivant →
      </button>
    );

    return buttons;
  };

  if (loading) {
    return (
      <div className="users-admin-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">🔄 Chargement des utilisateurs...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="users-admin-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Erreur: {error}</div>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            🔄 Réessayer
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      {/* Header Section */}
      <div className="users-admin-header">
        <div className="header-content">
          <h1 className="users-admin-title">👥 Gestion des Utilisateurs</h1>
          <p className="users-admin-subtitle">
            Gérez les comptes utilisateurs et leurs rôles
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{filteredUsers.length}</div>
            <div className="stat-label">
              Utilisateur{filteredUsers.length !== 1 ? 's' : ''}
              {searchTerm && ` (filtré${filteredUsers.length !== 1 ? 's' : ''} sur ${users.length})`}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

      {/* Controls Section */}
      <div className="pagination-controls">
        <div className="items-per-page">
          <label htmlFor="itemsPerPage">📄 Afficher:</label>
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
          <span>par page</span>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher par nom, prénom, email ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      {filteredUsers.length === 0 ? (
        <div className="no-users-message">
          {searchTerm 
            ? `Aucun résultat pour "${searchTerm}". Essayez un autre terme de recherche.`
            : "Aucun utilisateur trouvé."
          }
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>👤 Nom</th>
                  <th>👤 Prénom</th>
                  <th>📧 Email</th>
                  <th>🏷️ Rôle</th>
                  <th>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => {
                  const isCurrentUserRow = isCurrentUser(user);
                  return (
                    <tr key={user.id} className={`${updatingUserId === user.id ? 'updating' : ''} ${isCurrentUserRow ? 'current-user-row' : ''}`}>
                      <td>
                        {user.nom}
                        {isCurrentUserRow && <span className="current-user-badge">👤 Vous</span>}
                      </td>
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
                            title={isCurrentUserRow ? "Modifier votre profil (rôle non modifiable)" : "Modifier l'utilisateur"}
                          >
                            ✏️ Modifier
                          </button>
                          
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={updatingUserId === user.id || isCurrentUserRow}
                            title={isCurrentUserRow ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer l'utilisateur"}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Affichage {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} entrées
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
              <h3 className="modal-title">
                ✏️ Modifier l'Utilisateur
                {isCurrentUser(editingUser) && <span className="current-user-indicator"> (Votre Profil)</span>}
              </h3>
              <button className="close-button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); saveUser(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">👤 Nom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.nom}
                    onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                    placeholder="Entrez le nom"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">👤 Prénom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.prenom}
                    onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                    placeholder="Entrez le prénom"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📧 Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="exemple@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">🏷️ Rôle *</label>
                <select
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={isCurrentUser(editingUser)}
                  required
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {isCurrentUser(editingUser) && (
                  <div className="role-restriction-notice">
                    ⚠️ Vous ne pouvez pas modifier votre propre rôle
                  </div>
                )}
              </div>

              {/* Password Update Section */}
              <div className="password-section">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.updatePassword}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        updatePassword: e.target.checked,
                        password: "",
                        confirmPassword: ""
                      })}
                      className="form-checkbox"
                    />
                    <span className="checkbox-text">🔑 Modifier le mot de passe</span>
                  </label>
                </div>

                {editForm.updatePassword && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">🔒 Nouveau mot de passe *</label>
                        <input
                          type="password"
                          className="form-input"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Minimum 6 caractères"
                          required={editForm.updatePassword}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">🔒 Confirmer le mot de passe *</label>
                        <input
                          type="password"
                          className="form-input"
                          value={editForm.confirmPassword}
                          onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                          placeholder="Répétez le mot de passe"
                          required={editForm.updatePassword}
                        />
                      </div>
                    </div>

                    {editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword && (
                      <div className="password-mismatch-warning">
                        ⚠️ Les mots de passe ne correspondent pas
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="form-error">
                  ❌ {error}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button"
                  className="cancel-button" 
                  onClick={closeModal}
                >
                  ❌ Annuler
                </button>
                <button 
                  type="submit"
                  className="save-button" 
                  disabled={updatingUserId === editingUser?.id}
                >
                  {updatingUserId === editingUser?.id ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SuperAdmin Confirmation Modal */}
      {showRoleConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h3 className="modal-title">⚠️ Promotion SuperAdmin</h3>
            </div>
            <div className="confirmation-content">
              <div className="warning-icon">🚨</div>
              <p className="confirmation-message">
                Êtes-vous sûr de vouloir promouvoir <strong>{editForm.nom} {editForm.prenom}</strong> au rôle de <strong>SuperAdmin</strong> ?
              </p>
              <p className="warning-text">
                Cette action donnera à cet utilisateur tous les droits d'administration.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-button" 
                onClick={cancelSuperAdminPromotion}
              >
                ❌ Annuler
              </button>
              <button 
                className="confirm-button superadmin-confirm" 
                onClick={confirmSuperAdminPromotion}
              >
                ✅ Confirmer la promotion
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UsersAdmin;