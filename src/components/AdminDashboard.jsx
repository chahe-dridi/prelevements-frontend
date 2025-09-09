import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../assets/AdminDashboard.css';
import FinancialAnalytics from './FinancialAnalytics';
import Footer from './Footer';

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
    monthlyTrends: [],
    topItems: []
  });

  // Advanced analytics state
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Simplified export filters
  const [exportFilters, setExportFilters] = useState({
    categorieId: '',
    utilisateurId: '',
    itemId: ''
  });

  // State for data lists
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filteredItems, setFilteredItems] = useState([]);

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
    if (amount === null || amount === undefined || isNaN(amount)) return "0,00 TND";
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

  const formatGrowth = (growth) => {
    if (growth === null || growth === undefined || isNaN(growth)) return <span>N/A</span>;
    const isPositive = growth >= 0;
    return (
      <span className={`growth ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '📈' : '📉'} {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  // Enhanced fetch function with better error handling
  const makeApiCall = async (url, options = {}) => {
    try {
      const defaultOptions = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        ...options
      };

      console.log(`Making API call to: ${url}`);
      const response = await fetch(url, defaultOptions);
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.log('Error response:', errorData);
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || parsedError.title || errorMessage;
        } catch (parseError) {
          console.log('Could not parse error response');
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  // Fetch initial analytics data with better error handling
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      const data = await makeApiCall(`${API_BASE_URL}/api/admindemandes/analytics`);
      
      // Validate and normalize data
      const normalizedData = {
        totalDemandes: data.totalDemandes || 0,
        totalSpent: data.totalSpent || 0,
        totalUsers: data.totalUsers || 0,
        demandesParStatut: data.demandesParStatut || {},
        topUsers: Array.isArray(data.topUsers) ? data.topUsers : [],
        topCategories: Array.isArray(data.topCategories) ? data.topCategories : [],
        recentDemandes: Array.isArray(data.recentDemandes) ? data.recentDemandes : [],
        monthlyTrends: Array.isArray(data.monthlyTrends) ? data.monthlyTrends : [],
        topItems: Array.isArray(data.topItems) ? data.topItems : []
      };
      
      setAnalytics(normalizedData);
      setRetryCount(0); // Reset retry count on success
      showMessage('Données analytiques chargées avec succès', 'success');
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      // Set default values on error
      setAnalytics({
        totalDemandes: 0,
        totalSpent: 0,
        totalUsers: 0,
        demandesParStatut: {},
        topUsers: [],
        topCategories: [],
        recentDemandes: [],
        monthlyTrends: [],
        topItems: []
      });
      
      showMessage(`Erreur lors du chargement des données: ${error.message}`, 'error');
      
      // Retry logic
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAnalytics();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch advanced analytics with error handling
  const fetchAdvancedAnalytics = async () => {
    try {
      console.log('Fetching advanced analytics...');
      const data = await makeApiCall(`${API_BASE_URL}/api/admindemandes/analytics/advanced`);
      setAdvancedAnalytics(data);
    } catch (error) {
      console.error('Advanced analytics fetch error:', error);
      // Don't show error message for advanced analytics - it's optional
    }
  };

  // Function to fetch items by category
  const fetchItemsByCategory = async (categorieId) => {
    try {
      if (!categorieId) {
        // If no category selected, show all items
        setFilteredItems(items);
        return;
      }

      const itemsData = await makeApiCall(`${API_BASE_URL}/api/admindemandes/items?categorieId=${categorieId}`);
      setFilteredItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.error('Items by category fetch error:', error);
      setFilteredItems([]);
    }
  };

  // Handle category change
  const handleCategoryChange = (categorieId) => {
    setExportFilters(prev => ({
      ...prev,
      categorieId: categorieId,
      itemId: '' // Reset item selection when category changes
    }));
    
    // Fetch items for the selected category
    fetchItemsByCategory(categorieId);
  };

  // Fetch performance metrics with error handling
  const fetchPerformanceMetrics = async () => {
    try {
      console.log('Fetching performance metrics...');
      const data = await makeApiCall(`${API_BASE_URL}/api/admindemandes/analytics/performance`);
      setPerformanceMetrics(data);
    } catch (error) {
      console.error('Performance metrics fetch error:', error);
      // Don't show error message for performance metrics - it's optional
    }
  };

  // Fetch summary statistics with error handling
  const fetchSummary = async () => {
    try {
      console.log('Fetching summary...');
      const data = await makeApiCall(`${API_BASE_URL}/api/admindemandes/statistics/summary`);
      setSummary(data);
    } catch (error) {
      console.error('Summary fetch error:', error);
      // Don't show error message for summary - it's optional
    }
  };

  // Fetch categories and users for export filters
  const fetchFilterData = async () => {
    try {
      console.log('Fetching filter data...');
      
      // Fetch categories
      try {
        const categoriesData = await makeApiCall(`${API_BASE_URL}/api/demandes/categories`);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error('Categories fetch error:', error);
        setCategories([]);
      }

      // Fetch users
      try {
        const usersData = await makeApiCall(`${API_BASE_URL}/api/admindemandes/users`);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Users fetch error:', error);
        setUsers([]);
      }

      // Fetch all items initially
      try {
        const itemsData = await makeApiCall(`${API_BASE_URL}/api/admindemandes/items`);
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setFilteredItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (error) {
        console.error('Items fetch error:', error);
        setItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
      console.error('Filter data fetch error:', error);
    }
  };

  // Simplified export function
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const queryParams = new URLSearchParams();
      
      // Add simple filters if selected
      if (exportFilters.categorieId) {
        queryParams.append('categorieId', exportFilters.categorieId);
      }
      if (exportFilters.utilisateurId) {
        queryParams.append('utilisateurId', exportFilters.utilisateurId);
      }
      if (exportFilters.itemId) {
        queryParams.append('itemId', exportFilters.itemId);
      }

      const exportUrl = `${API_BASE_URL}/api/admindemandes/export/excel?${queryParams}`;
      console.log('Export URL:', exportUrl);

      const result = await makeApiCall(exportUrl);
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de l\'export');
      }
      
      if (!result.data || result.data.length === 0) {
        showMessage('Aucune donnée à exporter', 'warning');
        return;
      }
      
      // Convert to CSV format for download
      const csvContent = convertToCSV(result.data);
      const filename = `demandes_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      
      showMessage(`Export réussi: ${result.totalRecords} enregistrements exportés (${result.exportType})`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage(`Erreur d'export: ${error.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    try {
      // French headers mapping
      const headerMapping = {
        'DateDemande': 'Date Demande',
        'Statut': 'Statut',
        'Utilisateur': 'Utilisateur',
        'Email': 'Email',
        'EstFaveur': 'Faveur',
        'Categorie': 'Catégorie',
        'NombreItems': 'Nombre Articles',
        'Items': 'Articles Détaillés',
        'MontantTotal': 'Montant Total (TND)',
        'MontantEnLettres': 'Montant en Lettres',
        'ComptePaiement': 'Compte Paiement',
        'DatePaiement': 'Date Paiement',
        'EffectuePar': 'Effectué Par'
      };
      
      const originalHeaders = Object.keys(data[0]);
      const translatedHeaders = originalHeaders.map(header => headerMapping[header] || header);
      
      const csvRows = [
        // Add BOM for proper UTF-8 encoding in Excel + translated headers
        '\uFEFF' + translatedHeaders.map(header => `"${header}"`).join(','),
        ...data.map(row => originalHeaders.map(header => {
          const value = row[header];
          const cleanValue = value == null ? '' : String(value).replace(/"/g, '""');
          return `"${cleanValue}"`;
        }).join(','))
      ];
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error converting data to CSV:', error);
      throw new Error('Erreur lors de la conversion des données en CSV');
    }
  };

  // Helper function to download CSV
  const downloadCSV = (csvContent, filename) => {
    try {
      if (!csvContent) {
        throw new Error('Aucun contenu à télécharger');
      }

      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('Download error:', error);
      showMessage('Erreur lors du téléchargement du fichier', 'error');
    }
  };

  // Retry function for manual retry
  const retryFetch = () => {
    setRetryCount(0);
    fetchAnalytics();
    fetchAdvancedAnalytics();
    fetchPerformanceMetrics();
    fetchSummary();
  };

  // Simple chart component for monthly trends
  const MonthlyTrendsChart = ({ data }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <p className="no-data">Aucune donnée disponible</p>;
    }

    const validData = data.filter(d => d && typeof d.totalSpent === 'number');
    if (validData.length === 0) {
      return <p className="no-data">Aucune donnée valide disponible</p>;
    }

    // Take the last 6 months and ensure we have meaningful data
    const chartData = validData.slice(-6);
    const maxValue = Math.max(...chartData.map(d => d.totalSpent));
    
    // Set a minimum scale to ensure bars are visible
    const minScale = 20; // Minimum percentage for the smallest bar
    
    return (
      <div className="chart">
        <div className="chart-bars">
          {chartData.map((trend, index) => {
            // Calculate height with minimum scale
            let heightPercentage = 0;
            if (maxValue > 0) {
              heightPercentage = Math.max(
                minScale, 
                (trend.totalSpent / maxValue) * 100
              );
            } else {
              heightPercentage = minScale;
            }

            return (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar"
                  style={{ 
                    height: `${heightPercentage}%`
                  }}
                  title={`${trend.totalDemandes || 0} demandes - ${formatCurrency(trend.totalSpent)}`}
                />
                <div className="chart-label">
                  {trend.year && trend.month ? 
                    new Date(trend.year, trend.month - 1).toLocaleDateString('fr-FR', { 
                      month: 'short',
                      year: '2-digit'
                    }) :
                    'N/A'
                  }
                </div>
                <div className="chart-value">
                  {formatCurrency(trend.totalSpent)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Performance gauge component
  const PerformanceGauge = ({ value, label, max = 100, color = '#4f8cff' }) => {
    const safeValue = value && !isNaN(value) ? Number(value) : 0;
    const percentage = Math.min((safeValue / max) * 100, 100);
    
    return (
      <div className="gauge">
        <div className="gauge-container">
          <svg viewBox="0 0 100 50" className="gauge-svg">
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              stroke="#e9ecef"
              strokeWidth="6"
              fill="none"
            />
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              stroke={color}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${percentage * 1.26} 126`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          <div className="gauge-value">
            {safeValue.toFixed(1)}%
          </div>
        </div>
        <div className="gauge-label">{label}</div>
      </div>
    );
  };

  useEffect(() => {
    if (token) {
      console.log('Token available, starting data fetch...');
      fetchAnalytics();
      fetchFilterData();
      fetchSummary();
      fetchAdvancedAnalytics();
      fetchPerformanceMetrics();
      
    } else {
      console.log('No token available');
    }
  }, [
      token,
      fetchAnalytics,
      fetchFilterData,
      fetchSummary,
      fetchAdvancedAnalytics,
      fetchPerformanceMetrics


  ]);

  if (loading && analytics.totalDemandes === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🔧 Tableau de Bord Administrateur</h1>
          <p className="dashboard-subtitle">Vue d'ensemble et analytics des demandes système</p>
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des données... {retryCount > 0 && `(Tentative ${retryCount + 1})`}</p>
          {retryCount >= 2 && (
            <button onClick={retryFetch} className="btn btn-primary">
              Réessayer
            </button>
          )}
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">🔧 Tableau de Bord Administrateur</h1>
        <p className="dashboard-subtitle">Vue d'ensemble et analytics des demandes système</p>
        {retryCount >= 2 && (
          <button onClick={retryFetch} className="btn btn-primary">
            🔄 Actualiser les données
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Vue d'ensemble
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          💰 Finances
        </button>
        <button 
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          🔍 Insights
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button 
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📋 Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon">📋</div>
                <div className="metric-content">
                  <h3>Total Demandes</h3>
                  <p className="metric-value">{analytics.totalDemandes?.toLocaleString() || '0'}</p>
                  {summary && (
                    <small className="metric-growth">
                      Ce mois: {summary.currentMonth?.demandes || 0} {formatGrowth(summary.growth?.demandes)}
                    </small>
                  )}
                </div>
              </div>

              <div className="metric-card success">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <h3>Montant Total</h3>
                  <p className="metric-value">{formatCurrency(analytics.totalSpent)}</p>
                  {summary && (
                    <small className="metric-growth">
                      Ce mois: {formatCurrency(summary.currentMonth?.spent)} {formatGrowth(summary.growth?.spent)}
                    </small>
                  )}
                </div>
              </div>

              <div className="metric-card info">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h3>Utilisateurs Actifs</h3>
                  <p className="metric-value">{analytics.totalUsers || 0}</p>
                  {summary && (
                    <small className="metric-growth">
                      Faveur: {summary.faveurUsers || 0} / {summary.totalUsers || 0}
                    </small>
                  )}
                </div>
              </div>

              <div className="metric-card warning">
                <div className="metric-icon">⏳</div>
                <div className="metric-content">
                  <h3>En Attente</h3>
                  <p className="metric-value">{analytics.demandesParStatut?.EnAttente || 0}</p>
                  <small className="metric-growth">Nécessitent une action</small>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="form-section">
              <h2 className="section-title">🔄 Distribution des Statuts</h2>
              <div className="status-grid">
                {Object.entries(analytics.demandesParStatut || {}).map(([status, count]) => (
                  <div key={status} className={`status-card status-${status.toLowerCase()}`}>
                    <div className="status-header">
                      <span className="status-icon">
                        {status === 'Validee' && '✅'}
                        {status === 'EnAttente' && '⏳'}
                        {status === 'Refusee' && '❌'}
                      </span>
                      <h4>{status.replace('Validee', 'Validée').replace('EnAttente', 'En Attente').replace('Refusee', 'Refusée')}</h4>
                    </div>
                    <p className="status-count">{count || 0}</p>
                    <div className="status-percentage">
                      {analytics.totalDemandes > 0 ? ((count / analytics.totalDemandes) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="form-section">
              <h2 className="section-title">🕐 Activité Récente</h2>
              <div className="recent-activity">
                {analytics.recentDemandes && analytics.recentDemandes.length > 0 ? (
                  analytics.recentDemandes.map((demande, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <span className={`status-indicator status-${demande.statut?.toLowerCase() || 'unknown'}`}>
                          {demande.statut === 'Validee' && '✅'}
                          {demande.statut === 'EnAttente' && '⏳'}
                          {demande.statut === 'Refusee' && '❌'}
                        </span>
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-user">
                            {demande.utilisateur?.nom || ''} {demande.utilisateur?.prenom || ''}
                            {demande.utilisateur?.isFaveur && <span className="faveur-badge">👑</span>}
                          </span>
                          <span className="activity-time">{formatDate(demande.dateDemande)}</span>
                        </div>
                        <div className="activity-details">
                          <span className="activity-category">{demande.categorie?.nom || 'N/A'}</span>
                          <span className="activity-items">{demande.itemsCount || 0} article(s)</span>
                          <span className="activity-amount">{formatCurrency(demande.montantTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">Aucune activité récente</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-content">
            
            {/* Monthly Trends */}
            <div className="form-section">
              <h2 className="section-title">📊 Tendances Mensuelles</h2>
              <div className="chart-container">
                <MonthlyTrendsChart data={analytics.monthlyTrends} />
              </div>
            </div>

            {/* Top Users and Categories */}
            <div className="two-column">
              
              {/* Top Users */}
              <div className="form-section">
                <h2 className="section-title">🏆 Top Utilisateurs</h2>
                <div className="top-list">
                  {analytics.topUsers && analytics.topUsers.length > 0 ? (
                    analytics.topUsers.slice(0, 5).map((user, index) => (
                      <div key={user.id || index} className="top-item">
                        <div className="top-item-rank">#{index + 1}</div>
                        <div className="top-item-content">
                          <div className="top-item-header">
                            <span className="top-item-name">
                              {user.nom || ''} {user.prenom || ''}
                              {user.isFaveur && <span className="faveur-badge">👑</span>}
                            </span>
                          </div>
                          <div className="top-item-stats">
                            <span>{user.totalDemandes || 0} demandes</span>
                            <span className="top-item-amount">{formatCurrency(user.totalSpent)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">Aucune donnée utilisateur</p>
                  )}
                </div>
              </div>

              {/* Top Categories */}
              <div className="form-section">
                <h2 className="section-title">📦 Top Catégories</h2>
                <div className="top-list">
                  {analytics.topCategories && analytics.topCategories.length > 0 ? (
                    analytics.topCategories.slice(0, 5).map((category, index) => (
                      <div key={category.id || index} className="top-item">
                        <div className="top-item-rank">#{index + 1}</div>
                        <div className="top-item-content">
                          <div className="top-item-header">
                            <span className="top-item-name">{category.nom || 'N/A'}</span>
                          </div>
                          <div className="top-item-stats">
                            <span>{category.totalDemandes || 0} demandes</span>
                            <span className="top-item-amount">{formatCurrency(category.totalSpent)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">Aucune donnée catégorie</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top Items */}
            <div className="form-section">
              <h2 className="section-title">🎯 Articles les Plus Demandés</h2>
              <div className="items-grid">
                {analytics.topItems && analytics.topItems.length > 0 ? (
                  analytics.topItems.slice(0, 6).map((item, index) => (
                    <div key={item.id || index} className="admin-item-card">
                      <div className="item-rank">#{index + 1}</div>
                      <div className="admin-item-info">
                        <h4 className="admin-item-name">{item.nom || 'N/A'}</h4>
                        <div className="item-stats">
                          <div className="item-stat">
                            <span className="stat-label">Quantité:</span>
                            <span className="stat-value">{item.totalQuantity || 0}</span>
                          </div>
                          <div className="item-stat">
                            <span className="stat-label">Commandes:</span>
                            <span className="stat-value">{item.totalOrders || 0}</span>
                          </div>
                          <div className="item-stat">
                            <span className="stat-label">Valeur:</span>
                            <span className="stat-value">{formatCurrency(item.totalValue)}</span>
                          </div>
                          <div className="item-stat">
                            <span className="stat-label">Prix Moyen:</span>
                            <span className="stat-value">{formatCurrency(item.averagePrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">Aucune donnée article</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Financial Analytics Tab */}
        {activeTab === 'financial' && <FinancialAnalytics />}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="insights-content">
            {advancedAnalytics ? (
              <>
                {/* Yearly Comparison */}
                <div className="form-section">
                  <h2 className="section-title">📅 Comparaison Annuelle</h2>
                  <div className="yearly-comparison">
                    {(advancedAnalytics.yearlyComparison || []).map((year, index) => (
                      <div key={index} className="yearly-card">
                        <div className="year-header">
                          <h3>{year.year || 'N/A'}</h3>
                        </div>
                        <div className="year-stats">
                          <div className="year-stat">
                            <span className="stat-label">Demandes:</span>
                            <span className="stat-value">{year.totalDemandes || 0}</span>
                          </div>
                          <div className="year-stat">
                            <span className="stat-label">Montant:</span>
                            <span className="stat-value">{formatCurrency(year.totalSpent)}</span>
                          </div>
                          <div className="year-stat">
                            <span className="stat-label">Moyenne:</span>
                            <span className="stat-value">{formatCurrency(year.averageAmount)}</span>
                          </div>
                          <div className="year-stat">
                            <span className="stat-label">Utilisateurs:</span>
                            <span className="stat-value">{year.uniqueUsers || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Predictive Insights */}
                {advancedAnalytics.predictiveInsights && (
                  <div className="form-section">
                    <h2 className="section-title">🔮 Prédictions</h2>
                    <div className="predictions">
                      <div className="prediction-card">
                        <h4>📊 Moyenne Mensuelle</h4>
                        <p className="prediction-value">
                          {(advancedAnalytics.predictiveInsights.avgMonthlyDemandes || 0).toFixed(1)} demandes
                        </p>
                        <p className="prediction-amount">
                          {formatCurrency(advancedAnalytics.predictiveInsights.avgMonthlySpent)}
                        </p>
                      </div>
                      <div className="prediction-card">
                        <h4>📈 Prochaine Prédiction</h4>
                        <p className="prediction-value">
                          {(advancedAnalytics.predictiveInsights.projectedNextMonth || 0).toFixed(1)} demandes
                        </p>
                        <p className="prediction-trend">
                          Tendance: {advancedAnalytics.predictiveInsights.trendDirection || 'stable'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Insights */}
                {advancedAnalytics.financialInsights && (
                  <div className="form-section">
                    <h2 className="section-title">💡 Insights Financiers</h2>
                    <div className="financial-insights">
                      <div className="insight-card">
                        <h4>💎 Demandes de Haute Valeur</h4>
                        <p className="insight-value">{advancedAnalytics.financialInsights.highValueRequests || 0}</p>
                        <small>Demandes > 1000 TND</small>
                      </div>
                      <div className="insight-card">
                        <h4>📊 Valeur Moyenne</h4>
                        <p className="insight-value">{formatCurrency(advancedAnalytics.financialInsights.averageRequestValue)}</p>
                        <small>Par demande</small>
                      </div>
                      <div className="insight-card">
                        <h4>📈 Croissance Mensuelle</h4>
                        <p className="insight-value">{formatGrowth(advancedAnalytics.financialInsights.monthlyGrowthRate)}</p>
                        <small>Comparé au mois dernier</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Spending Departments */}
                {advancedAnalytics.financialInsights?.topSpendingDepartments && (
                  <div className="form-section">
                    <h2 className="section-title">🏢 Départements</h2>
                    <div className="departments">
                      {advancedAnalytics.financialInsights.topSpendingDepartments.map((dept, index) => (
                        <div key={index} className="department-card">
                          <h4>{dept.department || 'N/A'}</h4>
                          <div className="department-stats">
                            <span>{dept.requestCount || 0} demandes</span>
                            <span>{formatCurrency(dept.totalSpent)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="loading-container">
                <p>Chargement des insights avancés...</p>
                <button onClick={fetchAdvancedAnalytics} className="btn btn-primary">
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="performance-content">
            {performanceMetrics ? (
              <>
                {/* Performance Gauges */}
                <div className="form-section">
                  <h2 className="section-title">⚡ Métriques de Performance</h2>
                  <div className="gauges">
                    <PerformanceGauge 
                      value={performanceMetrics.approvalRate} 
                      label="Taux d'Approbation" 
                      color="#10b981" 
                    />
                    <PerformanceGauge 
                      value={100 - (performanceMetrics.rejectionRate || 0)} 
                      label="Taux de Succès" 
                      color="#4f8cff" 
                    />
                    <PerformanceGauge 
                      value={Math.max(0, 100 - (performanceMetrics.avgProcessingTime || 0) * 10)} 
                      label="Rapidité de Traitement" 
                      color="#f59e0b" 
                    />
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="form-section">
                  <h2 className="section-title">📈 Statistiques de Performance</h2>
                  <div className="performance-stats">
                    <div className="performance-stat">
                      <h4>⏱️ Temps de Traitement Moyen</h4>
                      <p className="stat-value">{(performanceMetrics.avgProcessingTime || 0).toFixed(1)} jours</p>
                    </div>
                    <div className="performance-stat">
                      <h4>⏳ Demandes en Attente</h4>
                      <p className="stat-value">{performanceMetrics.pendingRequests || 0}</p>
                    </div>
                    <div className="performance-stat">
                      <h4>✅ Taux d'Approbation</h4>
                      <p className="stat-value">{(performanceMetrics.approvalRate || 0).toFixed(1)}%</p>
                    </div>
                    <div className="performance-stat">
                      <h4>❌ Taux de Rejet</h4>
                      <p className="stat-value">{(performanceMetrics.rejectionRate || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Comparison */}
                <div className="form-section">
                  <h2 className="section-title">📊 Comparaison Hebdomadaire</h2>
                  <div className="weekly-comparison">
                    {(performanceMetrics.weeklyComparison || []).map((week, index) => (
                      <div key={index} className="weekly-card">
                        <h4>{week.period === 'This Week' ? 'Cette Semaine' : 'Semaine Dernière'}</h4>
                        <div className="weekly-stats">
                          <div className="weekly-stat">
                            <span>Demandes:</span>
                            <span>{week.count || 0}</span>
                          </div>
                          <div className="weekly-stat">
                            <span>Valeur:</span>
                            <span>{formatCurrency(week.totalValue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                {performanceMetrics.systemHealth && (
                  <div className="form-section">
                    <h2 className="section-title">🔧 Santé du Système</h2>
                    <div className="system-health">
                      <div className="health-metric">
                        <h4>👥 Utilisateurs Totaux</h4>
                        <p>{performanceMetrics.systemHealth.totalUsers || 0}</p>
                      </div>
                      <div className="health-metric">
                        <h4>📦 Catégories Actives</h4>
                        <p>{performanceMetrics.systemHealth.activeCategories || 0}</p>
                      </div>
                      <div className="health-metric">
                        <h4>🎯 Articles Actifs</h4>
                        <p>{performanceMetrics.systemHealth.activeItems || 0}</p>
                      </div>
                      <div className="health-metric">
                        <h4>🔥 Activité (7 jours)</h4>
                        <p>{performanceMetrics.systemHealth.lastWeekActivity || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="loading-container">
                <p>Chargement des métriques de performance...</p>
                <button onClick={fetchPerformanceMetrics} className="btn btn-primary">
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

         {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="export-content">
            <div className="form-section">
              <h2 className="section-title">📋 Export des Données</h2>
              <p>Exportez les données des demandes au format CSV pour analyse externe.</p>
              
              {/* Export Filters */}
              <div className="export-filters">
                <div className="form-group">
                  <label htmlFor="categoryFilter" className="form-label">Filtrer par Catégorie:</label>
                  <select
                    id="categoryFilter"
                    value={exportFilters.categorieId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="userFilter" className="form-label">Filtrer par Utilisateur:</label>
                  <select
                    id="userFilter"
                    value={exportFilters.utilisateurId}
                    onChange={(e) => setExportFilters(prev => ({
                      ...prev,
                      utilisateurId: e.target.value
                    }))}
                    className="form-select"
                  >
                    <option value="">Tous les utilisateurs</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.nom} {user.prenom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="itemFilter" className="form-label">Filtrer par Article:</label>
                  <select
                    id="itemFilter"
                    value={exportFilters.itemId}
                    onChange={(e) => setExportFilters(prev => ({
                      ...prev,
                      itemId: e.target.value
                    }))}
                    className="form-select"
                    disabled={!exportFilters.categorieId && filteredItems.length === 0}
                  >
                    <option value="">
                      {exportFilters.categorieId 
                        ? "Tous les articles de cette catégorie" 
                        : "Sélectionnez d'abord une catégorie"}
                    </option>
                    {filteredItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nom} {item.prixUnitaire && `- ${formatCurrency(item.prixUnitaire)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Summary */}
              {(exportFilters.categorieId || exportFilters.utilisateurId || exportFilters.itemId) && (
                <div className="filter-summary">
                  <h4>🔍 Filtres Appliqués:</h4>
                  <div className="filter-tags">
                    {exportFilters.categorieId && (
                      <span className="filter-tag">
                        📦 {categories.find(c => c.id === exportFilters.categorieId)?.nom || 'Catégorie sélectionnée'}
                      </span>
                    )}
                    {exportFilters.utilisateurId && (
                      <span className="filter-tag">
                        👤 {users.find(u => u.id === exportFilters.utilisateurId)?.nom || 'Utilisateur'} {users.find(u => u.id === exportFilters.utilisateurId)?.prenom || ''}
                      </span>
                    )}
                    {exportFilters.itemId && (
                      <span className="filter-tag">
                        🎯 {filteredItems.find(i => i.id === exportFilters.itemId)?.nom || 'Article sélectionné'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="export-actions">
                <button
                  onClick={exportToExcel}
                  disabled={exportLoading}
                  className="btn btn-primary export-button"
                >
                  {exportLoading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Export en cours...
                    </>
                  ) : (
                    <>
                      📁 Exporter en CSV
                    </>
                  )}
                </button>
              </div>

              {/* Export Info */}
              <div className="export-info">
                <h4>ℹ️ Informations sur l'Export</h4>
                <ul>
                  <li>Le fichier sera téléchargé au format CSV</li>
                  <li>Encodage UTF-8 compatible avec Excel</li>
                  <li>Inclut toutes les données de demandes et paiements</li>
                  <li>Sélectionnez une catégorie pour voir ses articles spécifiques</li>
                  <li>Les filtres peuvent être combinés pour affiner les résultats</li>
                  <li>Si aucun article n'est sélectionné, tous les articles de la catégorie sont inclus</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default AdminDashboard;