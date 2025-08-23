// Replace the existing component with this updated version:

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../assets/FinancialAnalytics.css';

const FinancialAnalytics = () => {
  const { token } = useContext(AuthContext);
  
  // State for financial data
  const [financialData, setFinancialData] = useState({
    effectueParAnalytics: [], // Changed from faveurAnalytics
    categoryAnalytics: [],
    userSpendingAnalytics: [],
    itemAnalytics: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    dateRange: '12', // months
    minAmount: '',
    maxAmount: '',
    categorieId: '',
    showFaveurOnly: false
  });

  // Data lists for filters
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (amount === null || amount === undefined || isNaN(amount)) return "0,00 TND";
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const makeApiCall = async (url, options = {}) => {
    try {
      const defaultOptions = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        ...options
      };

      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  // Fetch financial analytics data
  const fetchFinancialAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Fetching financial analytics...');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.dateRange) queryParams.append('months', filters.dateRange);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
      if (filters.categorieId) queryParams.append('categorieId', filters.categorieId);
      if (filters.showFaveurOnly) queryParams.append('faveurOnly', 'true');

      const url = `${API_BASE_URL}/api/admindemandes/analytics/financial?${queryParams}`;
      const data = await makeApiCall(url);
      
      setFinancialData(data);
      showMessage('Analyses financières chargées avec succès', 'success');
    } catch (error) {
      console.error('Financial analytics fetch error:', error);
      showMessage(`Erreur lors du chargement: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const data = await makeApiCall(`${API_BASE_URL}/api/demandes/categories`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Categories fetch error:', error);
      setCategories([]);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchFinancialAnalytics();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateRange: '12',
      minAmount: '',
      maxAmount: '',
      categorieId: '',
      showFaveurOnly: false
    });
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchFinancialAnalytics();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="financial-analytics-container">
        <div className="financial-analytics-loading">
          <div className="spinner"></div>
          <p>Chargement des analyses financières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-analytics-container">
      {/* Header */}
      <div className="financial-analytics-header">
        <h1>💰 Analyses Financières</h1>
        <p>Analyse détaillée des dépenses par utilisateur, catégorie et article</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`financial-analytics-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Filters Section */}
      <div className="financial-analytics-filters">
        <h3>🔍 Filtres d'Analyse</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Période (mois):</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="filter-select"
            >
              <option value="1">1 mois</option>
              <option value="3">3 mois</option>
              <option value="6">6 mois</option>
              <option value="12">12 mois</option>
              <option value="24">24 mois</option>
              <option value="0">Toute la période</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Montant minimum (TND):</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="0.00"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Montant maximum (TND):</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="Aucune limite"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Catégorie:</label>
            <select
              value={filters.categorieId}
              onChange={(e) => handleFilterChange('categorieId', e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showFaveurOnly}
                onChange={(e) => handleFilterChange('showFaveurOnly', e.target.checked)}
              />
              Demandes Faveur uniquement
            </label>
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="apply-filters-btn">
            🔍 Appliquer les filtres
          </button>
          <button onClick={resetFilters} className="reset-filters-btn">
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      {/* Payment Executors Analysis (EffectuePar) */}
      <div className="financial-analytics-section">
        <h2>👨‍💼 Analyse des Exécuteurs de Paiement</h2>
        <p className="section-description">
          Analyse des personnes qui effectuent les paiements (champ "EffectuéPar")
        </p>
        <div className="effectue-par-analytics-grid">
          {financialData.effectueParAnalytics && financialData.effectueParAnalytics.length > 0 ? (
            financialData.effectueParAnalytics.map((executor, index) => (
              <div key={executor.executorName || index} className="executor-card">
                <div className="executor-rank">#{index + 1}</div>
                <div className="executor-info">
                  <h4>{executor.executorName || 'Exécuteur inconnu'}</h4>
                  <div className="executor-stats">
                    <div className="stat-item">
                      <span className="stat-label">💰 Total traité:</span>
                      <span className="stat-value">{formatCurrency(executor.totalSpent)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">💳 Paiements effectués:</span>
                      <span className="stat-value">{executor.totalPayments || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">📊 Moyenne/paiement:</span>
                      <span className="stat-value">{formatCurrency(executor.averagePerPayment)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">👥 Utilisateurs servis:</span>
                      <span className="stat-value">{executor.uniqueUsers || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">👑 Paiements Faveur:</span>
                      <span className="stat-value faveur">{executor.faveurPayments || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">👤 Paiements Réguliers:</span>
                      <span className="stat-value regular">{executor.regularPayments || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">📅 Dernier paiement:</span>
                      <span className="stat-value">
                        {executor.lastPaymentDate ? new Date(executor.lastPaymentDate).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">Aucune donnée d'exécuteur de paiement disponible</p>
          )}
        </div>
      </div>

      {/* User Spending Analysis */}
      <div className="financial-analytics-section">
        <h2>👥 Analyse des Dépenses par Utilisateur</h2>
        <div className="user-spending-table">
          <div className="table-header">
            <div className="table-cell">Rang</div>
            <div className="table-cell">Utilisateur</div>
            <div className="table-cell">Type</div>
            <div className="table-cell">Demandes</div>
            <div className="table-cell">Total dépensé</div>
            <div className="table-cell">Moyenne</div>
            <div className="table-cell">Traité par</div>
          </div>
          {financialData.userSpendingAnalytics && financialData.userSpendingAnalytics.length > 0 ? (
            financialData.userSpendingAnalytics.map((user, index) => (
              <div key={user.userId || index} className="table-row">
                <div className="table-cell">
                  <span className="rank-badge">#{index + 1}</span>
                </div>
                <div className="table-cell">
                  <div className="user-info">
                    <span className="user-name">{user.userName || 'N/A'}</span>
                    <span className="user-email">{user.userEmail || ''}</span>
                  </div>
                </div>
                <div className="table-cell">
                  <span className={`user-type ${user.isFaveur ? 'faveur' : 'regular'}`}>
                    {user.isFaveur ? '👑 Faveur' : '👤 Regular'}
                  </span>
                </div>
                <div className="table-cell">{user.totalDemandes || 0}</div>
                <div className="table-cell amount">{formatCurrency(user.totalSpent)}</div>
                <div className="table-cell">{formatCurrency(user.averagePerRequest)}</div>
                <div className="table-cell">
                  <span className="processor-name">{user.processedBy || 'N/A'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="table-row">
              <div className="table-cell no-data" colSpan="7">Aucune donnée utilisateur disponible</div>
            </div>
          )}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="financial-analytics-section">
        <h2>📦 Analyse par Catégorie</h2>
        <div className="category-analytics-grid">
          {financialData.categoryAnalytics && financialData.categoryAnalytics.length > 0 ? (
            financialData.categoryAnalytics.map((category, index) => (
              <div key={category.categoryId || index} className="category-card">
                <div className="category-header">
                  <h4>{category.categoryName || 'Catégorie inconnue'}</h4>
                  <span className="category-rank">#{index + 1}</span>
                </div>
                <div className="category-stats">
                  <div className="stat-row">
                    <span className="stat-label">💰 Total dépensé:</span>
                    <span className="stat-value">{formatCurrency(category.totalSpent)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">📋 Nombre de demandes:</span>
                    <span className="stat-value">{category.totalDemandes || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">🎯 Articles différents:</span>
                    <span className="stat-value">{category.uniqueItems || 0}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">📊 Moyenne/demande:</span>
                    <span className="stat-value">{formatCurrency(category.averagePerRequest)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">👥 Utilisateurs actifs:</span>
                    <span className="stat-value">{category.activeUsers || 0}</span>
                  </div>
                </div>
                
                {/* Top executors for this category */}
                {category.topExecutors && category.topExecutors.length > 0 && (
                  <div className="category-executors">
                    <h5>👨‍💼 Top Exécuteurs:</h5>
                    {category.topExecutors.map((executor, execIndex) => (
                      <div key={execIndex} className="executor-summary">
                        <span className="executor-name">{executor.executorName}</span>
                        <span className="executor-value">{formatCurrency(executor.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top items in this category */}
                {category.topItems && category.topItems.length > 0 && (
                  <div className="category-items">
                    <h5>🏆 Top Articles:</h5>
                    {category.topItems.slice(0, 3).map((item, itemIndex) => (
                      <div key={item.itemId || itemIndex} className="item-summary">
                        <span className="item-name">{item.itemName}</span>
                        <span className="item-value">{formatCurrency(item.totalValue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="no-data">Aucune donnée catégorie disponible</p>
          )}
        </div>
      </div>

      {/* Item Analysis */}
      <div className="financial-analytics-section">
        <h2>🎯 Analyse par Article</h2>
        <div className="item-analytics-table">
          <div className="table-header">
            <div className="table-cell">Rang</div>
            <div className="table-cell">Article</div>
            <div className="table-cell">Catégorie</div>
            <div className="table-cell">Quantité totale</div>
            <div className="table-cell">Valeur totale</div>
            <div className="table-cell">Prix moyen</div>
            <div className="table-cell">Fréquence</div>
            <div className="table-cell">Top Exécuteur</div>
          </div>
          {financialData.itemAnalytics && financialData.itemAnalytics.length > 0 ? (
            financialData.itemAnalytics.map((item, index) => (
              <div key={item.itemId || index} className="table-row">
                <div className="table-cell">
                  <span className="rank-badge">#{index + 1}</span>
                </div>
                <div className="table-cell">
                  <span className="item-name">{item.itemName || 'Article inconnu'}</span>
                </div>
                <div className="table-cell">
                  <span className="category-name">{item.categoryName || 'N/A'}</span>
                </div>
                <div className="table-cell">{item.totalQuantity || 0}</div>
                <div className="table-cell amount">{formatCurrency(item.totalValue)}</div>
                <div className="table-cell">{formatCurrency(item.averagePrice)}</div>
                <div className="table-cell">{item.orderFrequency || 0} commandes</div>
                <div className="table-cell">
                  <span className="top-executor">{item.topExecutor || 'N/A'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="table-row">
              <div className="table-cell no-data" colSpan="8">Aucune donnée article disponible</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;