import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../assets/AdminDemandesPage.css';

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDemandes();
  }, []);

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
    if (!statusFilter) return true;
    return demande.statut?.toLowerCase() === statusFilter.toLowerCase();
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDemandes = filteredDemandes.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

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

  if (error) {
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
          <button className="refresh-button" onClick={fetchDemandes}>
            🔄 Actualiser
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">Aucune demande trouvée</h3>
          <p className="empty-state-subtitle">Il n'y a actuellement aucune demande à afficher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-demandes-container">
      <div className="admin-demandes-header">
        <div>
          <h1 className="admin-demandes-title">Gestion des Demandes</h1>
          <p className="admin-subtitle">Dernières demandes en premier</p>
        </div>
        <button className="refresh-button" onClick={fetchDemandes}>
          🔄 Actualiser
        </button>
      </div>

      {/* Statistics Cards */}
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

      <div className="filters-container">
        <div className="filter-group">
          <label className="filter-label">Filtrer par statut:</label>
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="enattente">En Attente</option>
            <option value="validee">Validée</option>
            <option value="refusee">Refusée</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Éléments par page:</label>
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
          <span style={{ color: '#6b7280', fontWeight: '500' }}>
            {filteredDemandes.length} sur {demandes.length} demandes
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="demandes-table">
          <thead>
            <tr>
              <th>👤 Utilisateur</th>
              <th>📦 Catégorie</th>
              <th>📊 Statut</th>
              <th>📅 Date Demande</th>
              <th>⚡ Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentDemandes.map((d) => {
              const dateTime = formatDateTime(d.dateDemande);
              return (
                <tr key={d.id}>
                  <td>
                    <div className="user-info">
                      <span className="user-name">
                        {d.utilisateur?.prenom} {d.utilisateur?.nom}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="category-info">
                      <div className="category-name">
                        {d.categorie?.nom || 'Catégorie non disponible'}
                      </div>
                      {d.items && d.items.length > 0 && (
                        <div className="items-list">
                          {d.items.map((item, index) => (
                            <div key={item.id || index} className="item-detail">
                              <span className="item-name">{item.nom}</span>
                              <span className="item-quantity">x{item.quantite}</span>
                            </div>
                          ))}
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
                    <button 
                      className="action-button"
                      onClick={() => navigate(`/admin/demandes/${d.id}`)}
                    >
                      👁️ Voir détails
                    </button>
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
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDemandes.length)} sur {filteredDemandes.length} entrées
          </div>
          <div className="pagination-controls">
            {renderPaginationButtons()}
          </div>
        </div>
      )}
    </div>
  );
}