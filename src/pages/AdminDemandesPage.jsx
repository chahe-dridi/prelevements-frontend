import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../assets/AdminDemandesPage.css';

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  
  // Delete functionality state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDemandes();
  }, []);

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setError(message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please login.");
      }

      const res = await fetch("https://localhost:7101/api/admindemandes", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        let errorMessage = `HTTP error! status: ${res.status}`;
        if (res.status === 401) {
          errorMessage = "Unauthorized: Please check your credentials and login again.";
        } else if (res.status === 403) {
          errorMessage = "Forbidden: You don't have permission to access this resource.";
        }
        throw new Error(errorMessage);
      }
  
      const data = await res.json();
      // Sort by date (newest first)
      const sortedData = (data || []).sort((a, b) => new Date(b.dateDemande) - new Date(a.dateDemande));
      setDemandes(sortedData);
    } catch (err) {
      console.error("Error fetching demandes:", err);
      setError("Erreur chargement demandes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete single demande
  const handleDeleteClick = (demande) => {
    setDemandeToDelete(demande);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!demandeToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`https://localhost:7101/api/admindemandes/${demandeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      showMessage('✅ Demande supprimée avec succès!', 'success');
      setShowDeleteModal(false);
      setDemandeToDelete(null);
      
      // Refresh the list
      await fetchDemandes();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'enattente':
        return 'status-enattente';
      case 'validee':
        return 'status-validee';
      case 'refusee':
        return 'status-refusee';
      default:
        return 'status-enattente';
    }
  };

  const getStatusText = (statut) => {
    switch (statut?.toLowerCase()) {
      case 'enattente':
        return 'En Attente';
      case 'validee':
        return 'Validée';
      case 'refusee':
        return 'Refusée';
      default:
        return statut || 'Statut inconnu';
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = demandes.length;
    const enAttente = demandes.filter(d => d.statut?.toLowerCase() === 'enattente').length;
    const validees = demandes.filter(d => d.statut?.toLowerCase() === 'validee').length;
    const refusees = demandes.filter(d => d.statut?.toLowerCase() === 'refusee').length;
    
    return { total, enAttente, validees, refusees };
  };

  const stats = getStatistics();

  const filteredDemandes = demandes.filter(demande => {
    // Status filter
    if (statusFilter && demande.statut?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    
    // Email filter - Updated to check both cases
    if (emailFilter) {
      const userEmail = demande.utilisateur?.Email || demande.utilisateur?.email;
      if (!userEmail?.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDemandes = filteredDemandes.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, emailFilter]);

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'Date non disponible', time: '' };
    
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('fr-FR');
    const timeStr = date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return { date: dateStr, time: timeStr };
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
        buttons.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
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
        buttons.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
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
      <div className="admin-demandes-container">
        <div className="loading-message">
          🔄 Chargement des demandes...
        </div>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="admin-demandes-container">
        <div className="error-message">
          ❌ {error}
          <br />
          <button className="retry-button" onClick={fetchDemandes}>
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (demandes.length === 0) {
    return (
      <div className="admin-demandes-container">
        <div className="admin-demandes-header">
          <h1 className="admin-demandes-title">Gestion des Demandes</h1>
        </div>
        <div className="form-section">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">Aucune demande trouvée</h3>
            <p className="empty-state-subtitle">Il n'y a actuellement aucune demande à afficher.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-demandes-container">
      {/* Header Section with Stats */}
      <div className="form-section">
        <div className="admin-demandes-header">
          <h1 className="admin-demandes-title">Gestion des Demandes</h1>
        </div>

        {/* Display success messages */}
        {successMessage && (
          <div className="message success">
            {successMessage}
          </div>
        )}

        {/* Display error messages */}
        {error && (
          <div className="message error">
            ❌ {error}
          </div>
        )}

        {/* Statistics Section */}
        <div className="stats-container">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{stats.enAttente}</div>
              <div className="stat-label">En Attente</div>
            </div>
          </div>
          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.validees}</div>
              <div className="stat-label">Validées</div>
            </div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-number">{stats.refusees}</div>
              <div className="stat-label">Refusées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">Statut:</label>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="enattente">En Attente</option>
            <option value="validee">Validée</option>
            <option value="refusee">Refusée</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Email:</label>
          <input 
            type="text"
            className="filter-input"
            placeholder="Rechercher par email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Par page:</label>
          <select 
            className="filter-select"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Résultats:</span>
          <span className="results-count">
            {filteredDemandes.length} sur {demandes.length}
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="form-section">
        <div className="table-container">
          <table className="demandes-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Catégorie & Articles</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDemandes.map((d) => {
                const dateTime = formatDateTime(d.dateDemande);
                const displayItems = d.items ? d.items.slice(0, 3) : [];
                const hasMoreItems = d.items && d.items.length > 3;
                
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="user-info">
                        <span className="user-name">
                          {d.utilisateur?.prenom} {d.utilisateur?.nom}
                        </span>
                        <span className="user-email">
                           {d.utilisateur?.Email || d.utilisateur?.email || 'Email non disponible'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="category-info">
                        <div className="category-name">
                          {d.categorie?.nom || 'Catégorie non disponible'}
                        </div>
                        {displayItems.length > 0 && (
                          <div className="items-summary">
                            {displayItems.map((item, index) => (
                              <span key={item.id || index} className="item-chip">
                                {item.nom} <span className="item-qty">x{item.quantite}</span>
                              </span>
                            ))}
                            {hasMoreItems && (
                              <span className="more-items">
                                +{d.items.length - 3} autres
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(d.statut)}`}>
                        {getStatusText(d.statut)}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <span className="date-primary">{dateTime.date}</span>
                        <span className="date-time">{dateTime.time}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => navigate(`/admin/demandes/${d.id}`)}
                        >
                          👁️ Détails
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteClick(d)}
                          disabled={loading}
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
      </div>

      {/* Pagination Section */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            {startIndex + 1} à {Math.min(endIndex, filteredDemandes.length)} sur {filteredDemandes.length}
          </div>
          <div className="pagination-controls">
            {renderPaginationButtons()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && demandeToDelete && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h3 className="modal-title">Confirmer la suppression</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <p>Êtes-vous sûr de vouloir supprimer cette demande ?</p>
                <p><strong>Utilisateur:</strong> {demandeToDelete.utilisateur?.prenom} {demandeToDelete.utilisateur?.nom}</p>
                <p><strong>Email:</strong> {demandeToDelete.utilisateur?.Email || demandeToDelete.utilisateur?.email}</p>
                <p><strong>Catégorie:</strong> {demandeToDelete.categorie?.nom}</p>
                <p><strong>Date:</strong> {formatDateTime(demandeToDelete.dateDemande).date}</p>
                <div className="warning-text">
                  Cette action est irréversible. La demande et toutes ses données associées seront définitivement supprimées.
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? '⏳ Suppression...' : '🗑️ Oui, supprimer'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}