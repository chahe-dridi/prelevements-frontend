import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../assets/AdminDashboard.css';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  
  // State for analytics data
  const [analytics, setAnalytics] = useState({
    totalDemandes: 0,
    totalSpent: 0,
    totalUsers: 0,
    demandesParStatut: {},
    topUsers: [],
    topCategories: [],
    recentDemandes: [],
    monthlyStats: []
  });

  // State for filters
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    categorieId: '',
    itemId: '',
    utilisateurId: '',
    statut: ''
  });

  // State for data lists
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredData, setFilteredData] = useState(null);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const API_BASE_URL = 'https://localhost:7101';

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Non renseignée";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Format de date invalide" : d.toLocaleDateString("fr-FR");
  };

  // Fetch initial analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admindemandes/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erreur lors du chargement des données analytiques');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      showMessage(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories, items, and users for filters
  const fetchFilterData = async () => {
    try {
      const [categoriesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/demandes/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admindemandes/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Filter data fetch error:', error);
    }
  };

  // Handle category change to load items
  const handleCategoryChange = async (categorieId) => {
    setFilters(prev => ({ ...prev, categorieId, itemId: '' }));
    
    if (categorieId) {
      try {
        const category = categories.find(c => c.id === categorieId);
        if (category && category.items) {
          setItems(category.items);
        }
      } catch (error) {
        console.error('Items fetch error:', error);
      }
    } else {
      setItems([]);
    }
  };

  // Apply filters to get custom analytics
  const applyFilters = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/api/admindemandes/analytics/filtered?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Erreur lors du filtrage des données');
      
      const data = await response.json();
      setFilteredData(data);
      showMessage('Filtres appliqués avec succès', 'success');
    } catch (error) {
      console.error('Filter apply error:', error);
      showMessage(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      categorieId: '',
      itemId: '',
      utilisateurId: '',
      statut: ''
    });
    setItems([]);
    setFilteredData(null);
    showMessage('Filtres réinitialisés', 'info');
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchFilterData();
    }
  }, [token]);

  const currentData = filteredData || analytics;

  if (loading && !analytics.totalDemandes) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-dashboard-loading-container">
          <div className="admin-dashboard-loading-spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>🎛️ Tableau de Bord Administrateur</h1>
        <p>Vue d'ensemble des demandes et statistiques</p>
      </div>

      {message && (
        <div className={`admin-dashboard-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-dashboard-tab-navigation">
        <button 
          className={`admin-dashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Vue d'ensemble
        </button>
        <button 
          className={`admin-dashboard-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analyses détaillées
        </button>
        <button 
          className={`admin-dashboard-tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
          onClick={() => setActiveTab('filters')}
        >
          🔍 Filtres avancés
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="admin-dashboard-overview-section">
          {/* Key Metrics Cards */}
          <div className="admin-dashboard-metrics-grid">
            <div className="admin-dashboard-metric-card admin-dashboard-total-demandes">
              <div className="admin-dashboard-metric-icon">📋</div>
              <div className="admin-dashboard-metric-content">
                <h3>Total Demandes</h3>
                <p className="admin-dashboard-metric-value">{currentData.totalDemandes}</p>
              </div>
            </div>

            <div className="admin-dashboard-metric-card admin-dashboard-total-spent">
              <div className="admin-dashboard-metric-icon">💰</div>
              <div className="admin-dashboard-metric-content">
                <h3>Montant Total</h3>
                <p className="admin-dashboard-metric-value">{formatCurrency(currentData.totalSpent)}</p>
              </div>
            </div>

            <div className="admin-dashboard-metric-card admin-dashboard-total-users">
              <div className="admin-dashboard-metric-icon">👥</div>
              <div className="admin-dashboard-metric-content">
                <h3>Utilisateurs Actifs</h3>
                <p className="admin-dashboard-metric-value">{currentData.totalUsers}</p>
              </div>
            </div>

            <div className="admin-dashboard-metric-card admin-dashboard-avg-per-user">
              <div className="admin-dashboard-metric-icon">📊</div>
              <div className="admin-dashboard-metric-content">
                <h3>Moyenne par Utilisateur</h3>
                <p className="admin-dashboard-metric-value">
                  {currentData.totalUsers > 0 
                    ? formatCurrency(currentData.totalSpent / currentData.totalUsers)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          {currentData.demandesParStatut && (
            <div className="admin-dashboard-status-distribution">
              <h3>🎯 Répartition par Statut</h3>
              <div className="admin-dashboard-status-cards">
                <div className="admin-dashboard-status-card pending">
                  <h4>En Attente</h4>
                  <p>{currentData.demandesParStatut.EnAttente || 0}</p>
                </div>
                <div className="admin-dashboard-status-card approved">
                  <h4>Validées</h4>
                  <p>{currentData.demandesParStatut.Validee || 0}</p>
                </div>
                <div className="admin-dashboard-status-card rejected">
                  <h4>Refusées</h4>
                  <p>{currentData.demandesParStatut.Refusee || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="admin-dashboard-analytics-section">
          <div className="admin-dashboard-analytics-grid">
            {/* Top Users */}
            <div className="admin-dashboard-analytics-card">
              <h3>🏆 Top Utilisateurs</h3>
              <div className="admin-dashboard-top-list">
                {currentData.topUsers && currentData.topUsers.length > 0 ? (
                  currentData.topUsers.map((user, index) => (
                    <div key={user.id} className="admin-dashboard-top-item">
                      <div className="admin-dashboard-rank">#{index + 1}</div>
                      <div className="admin-dashboard-details">
                        <p className="name">{user.nom} {user.prenom}</p>
                        <p className="stats">
                          {user.totalDemandes} demandes • {formatCurrency(user.totalSpent)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="admin-dashboard-no-data">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="admin-dashboard-analytics-card">
              <h3>🏷️ Top Catégories</h3>
              <div className="admin-dashboard-top-list">
                {currentData.topCategories && currentData.topCategories.length > 0 ? (
                  currentData.topCategories.map((category, index) => (
                    <div key={category.id} className="admin-dashboard-top-item">
                      <div className="admin-dashboard-rank">#{index + 1}</div>
                      <div className="admin-dashboard-details">
                        <p className="name">{category.nom}</p>
                        <p className="stats">
                          {category.totalDemandes} demandes • {formatCurrency(category.totalSpent)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="admin-dashboard-no-data">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-dashboard-recent-activity">
            <h3>🕒 Activité Récente</h3>
            <div className="admin-dashboard-activity-list">
              {currentData.recentDemandes && currentData.recentDemandes.length > 0 ? (
                currentData.recentDemandes.map((demande) => (
                  <div key={demande.id} className="admin-dashboard-activity-item">
                    <div className="admin-dashboard-activity-date">{formatDate(demande.dateDemande)}</div>
                    <div className="admin-dashboard-activity-content">
                      <p>{demande.utilisateur.nom} {demande.utilisateur.prenom}</p>
                      <p className="admin-dashboard-activity-details">
                        {demande.categorie.nom} • 
                        <span className={`admin-dashboard-status ${demande.statut.toLowerCase()}`}>
                          {demande.statut}
                        </span>
                      </p>
                    </div>
                    <div className="admin-dashboard-activity-amount">
                      {formatCurrency(demande.montantTotal || 0)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="admin-dashboard-no-data">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <div className="admin-dashboard-filters-section">
          <div className="admin-dashboard-filters-header">
            <h3>🔍 Filtres Avancés</h3>
            <p>Appliquez des filtres pour analyser des données spécifiques</p>
          </div>

          <div className="admin-dashboard-filters-form">
            <div className="admin-dashboard-filter-row">
              <div className="admin-dashboard-filter-group">
                <label>Date de début:</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
                />
              </div>

              <div className="admin-dashboard-filter-group">
                <label>Date de fin:</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
                />
              </div>
            </div>

            <div className="admin-dashboard-filter-row">
              <div className="admin-dashboard-filter-group">
                <label>Catégorie:</label>
                <select
                  value={filters.categorieId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-dashboard-filter-group">
                <label>Article:</label>
                <select
                  value={filters.itemId}
                  onChange={(e) => setFilters(prev => ({ ...prev, itemId: e.target.value }))}
                  disabled={!filters.categorieId}
                >
                  <option value="">Tous les articles</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-dashboard-filter-row">
              <div className="admin-dashboard-filter-group">
                <label>Utilisateur:</label>
                <select
                  value={filters.utilisateurId}
                  onChange={(e) => setFilters(prev => ({ ...prev, utilisateurId: e.target.value }))}
                >
                  <option value="">Tous les utilisateurs</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nom} {user.prenom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-dashboard-filter-group">
                <label>Statut:</label>
                <select
                  value={filters.statut}
                  onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                >
                  <option value="">Tous les statuts</option>
                  <option value="EnAttente">En Attente</option>
                  <option value="Validee">Validée</option>
                  <option value="Refusee">Refusée</option>
                </select>
              </div>
            </div>

            <div className="admin-dashboard-filter-actions">
              <button 
                className="admin-dashboard-btn admin-dashboard-btn-primary"
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? '⏳ Application...' : '🔍 Appliquer les filtres'}
              </button>
              <button 
                className="admin-dashboard-btn admin-dashboard-btn-secondary"
                onClick={resetFilters}
              >
                🔄 Réinitialiser
              </button>
            </div>
          </div>

          {/* Filtered Results */}
          {filteredData && (
            <div className="admin-dashboard-filtered-results">
              <h4>📊 Résultats Filtrés</h4>
              <div className="admin-dashboard-filtered-metrics">
                <div className="admin-dashboard-filtered-metric">
                  <span className="label">Demandes trouvées:</span>
                  <span className="value">{filteredData.totalDemandes}</span>
                </div>
                <div className="admin-dashboard-filtered-metric">
                  <span className="label">Montant total:</span>
                  <span className="value">{formatCurrency(filteredData.totalSpent)}</span>
                </div>
                <div className="admin-dashboard-filtered-metric">
                  <span className="label">Utilisateurs impliqués:</span>
                  <span className="value">{filteredData.totalUsers}</span>
                </div>
                {filteredData.averagePerDemande && (
                  <div className="admin-dashboard-filtered-metric">
                    <span className="label">Moyenne par demande:</span>
                    <span className="value">{formatCurrency(filteredData.averagePerDemande)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;