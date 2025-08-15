import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../assets/DemandeHistoryPage.css';

const DemandeHistoryPage = () => {
  const { token, userEmail } = useContext(AuthContext);
  
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [categories, setCategories] = useState([]);
  const [updatedItems, setUpdatedItems] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [availableItems, setAvailableItems] = useState([]);

  const API_BASE_URL = 'https://localhost:7101';

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Non renseignée";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Format de date invalide" : d.toLocaleString("fr-FR");
  };

  // Fixed status handling functions - Updated to handle numeric enums properly
  const getStatusClass = (statut) => {
    // Handle both string and number statut
    const statusValue = statut;
    
    // Check for numeric enum values first
    if (statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente') {
      return 'status-pending';
    }
    if (statusValue === 1 || statusValue === '1' || String(statusValue).toLowerCase() === 'validee') {
      return 'status-approved';
    }
    if (statusValue === 2 || statusValue === '2' || String(statusValue).toLowerCase() === 'refusee') {
      return 'status-rejected';
    }
    
    console.log('Unknown status value:', statusValue, typeof statusValue); // Debug log
    return 'status-pending'; // Default to pending for unknown statuses
  };

  const getStatusText = (statut) => {
    // Handle both string and number statut
    const statusValue = statut;
    
    // Check for numeric enum values first
    if (statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente') {
      return 'En Attente';
    }
    if (statusValue === 1 || statusValue === '1' || String(statusValue).toLowerCase() === 'validee') {
      return 'Validée';
    }
    if (statusValue === 2 || statusValue === '2' || String(statusValue).toLowerCase() === 'refusee') {
      return 'Refusée';
    }
    
    console.log('Unknown status value:', statusValue, typeof statusValue); // Debug log
    return `Statut: ${statusValue}`;
  };

  // Helper function to check if status is "En Attente"
  const isStatusPending = (statut) => {
    const statusValue = statut;
    return statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente';
  };

  const calculateTotal = (demandeItems) => {
    if (!demandeItems) return 0;
    return demandeItems.reduce((total, item) => {
      return total + (item.quantite * item.item.prixUnitaire);
    }, 0);
  };

  // Calculate total for modal
  const calculateModalTotal = () => {
    if (!availableItems || !updatedItems) return 0;
    return Object.entries(updatedItems).reduce((total, [itemId, quantity]) => {
      if (quantity > 0) {
        const item = availableItems.find(i => i.id === itemId);
        if (item) {
          return total + (quantity * item.prixUnitaire);
        }
      }
      return total;
    }, 0);
  };

  // Enhanced fetch function with better error handling
  const fetchDemandes = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching demandes...');
      const res = await fetch(`${API_BASE_URL}/api/demandes/my-demandes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log('Raw response data:', data); // Debug log
      
      // Log status values for debugging
      if (data && data.length > 0) {
        data.forEach((demande, index) => {
          console.log(`Demande ${index} status:`, demande.statut, typeof demande.statut);
        });
      }
      
      setDemandes(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      showMessage(`Erreur chargement historique: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for update modal
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/demandes/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur chargement catégories');
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Categories fetch error:', err);
      showMessage(`Erreur chargement catégories: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    if (userEmail && token) {
      fetchDemandes();
      fetchCategories();
    } else {
      setLoading(false);
      if (!userEmail) {
        showMessage('Utilisateur non identifié', 'error');
      }
      if (!token) {
        showMessage('Token d\'authentification manquant', 'error');
      }
    }
  }, [userEmail, token]);

  // Handle category change in modal
  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    
    // Find the selected category and its items
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (selectedCategory) {
      setAvailableItems(selectedCategory.items || []);
      
      // Reset item quantities when category changes, but keep existing items if they exist in new category
      const newUpdatedItems = {};
      selectedCategory.items.forEach(item => {
        // Keep existing quantity if item was already selected, otherwise set to 0
        newUpdatedItems[item.id] = updatedItems[item.id] || 0;
      });
      setUpdatedItems(newUpdatedItems);
    }
  };

  // Open update modal
  const handleUpdateClick = (demande) => {
    setSelectedDemande(demande);
    setSelectedCategoryId(demande.categorieId);
    
    // Find the category and set available items
    const category = categories.find(c => c.id === demande.categorieId);
    if (category) {
      setAvailableItems(category.items || []);
      
      // Initialize updated items with current quantities and all available items
      const itemsData = {};
      
      // First, set all available items to 0
      category.items.forEach(item => {
        itemsData[item.id] = 0;
      });
      
      // Then, set current demande items to their quantities
      demande.demandeItems.forEach(di => {
        itemsData[di.item.id] = di.quantite;
      });
      
      setUpdatedItems(itemsData);
    }
    
    setShowUpdateModal(true);
  };

  // Handle quantity change in modal
  const handleQuantityChange = (itemId, quantity) => {
    const qty = parseInt(quantity) || 0;
    setUpdatedItems(prev => ({
      ...prev,
      [itemId]: qty >= 0 ? qty : 0
    }));
  };

  // Enhanced update submit with better error handling
  const handleUpdateSubmit = async () => {
    if (!selectedDemande || !selectedCategoryId) {
      showMessage('Données manquantes pour la mise à jour.', 'error');
      return;
    }

    // Filter items with quantity > 0
    const filteredItems = Object.entries(updatedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantite]) => ({
        itemId,
        quantite: parseInt(quantite)
      }));

    if (filteredItems.length === 0) {
      showMessage('Veuillez sélectionner au moins un item avec quantité.', 'error');
      return;
    }

    console.log('Updating demande:', {
      id: selectedDemande.id,
      categorieId: selectedCategoryId,
      items: filteredItems
    });

    try {
      setLoading(true);
      
      const requestBody = {
        categorieId: selectedCategoryId,
        items: filteredItems
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch(`${API_BASE_URL}/api/demandes/${selectedDemande.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Update response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Update error response:', errorText);
        throw new Error(errorText || 'Erreur lors de la mise à jour');
      }

      const responseData = await res.text();
      console.log('Update response:', responseData);

      showMessage('✅ Demande mise à jour avec succès!', 'success');
      handleCloseModal();
      await fetchDemandes(); // Refresh the list
    } catch (err) {
      console.error('Update error:', err);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowUpdateModal(false);
    setSelectedDemande(null);
    setSelectedCategoryId('');
    setAvailableItems([]);
    setUpdatedItems({});
  };

  if (loading && (userEmail && token)) {
    return (
      <div className="history-container">
        <div className="loading-container">
          <div className="loading-text">🔄 Chargement de l'historique...</div>
        </div>
      </div>
    );
  }

  if (!userEmail || !token) {
    return (
      <div className="history-container">
        <div className="history-header">
          <h1 className="history-title">Mon Historique de Demandes</h1>
        </div>
        <div className="no-demandes">
          <div className="no-demandes-icon">⚠️</div>
          <h3>Erreur d'authentification</h3>
          <p>Veuillez vous connecter pour accéder à votre historique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">Mon Historique de Demandes</h1>
        <p className="history-subtitle">Consultez et modifiez vos demandes</p>
      </div>

      {/* Temporary Debug Section - Remove after fixing */}
      {demandes.length > 0 && (
        <div className="message info">
          <strong>Debug Info:</strong> First demande status: {JSON.stringify(demandes[0].statut)} (type: {typeof demandes[0].statut})
        </div>
      )}

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {demandes.length === 0 ? (
        <div className="no-demandes">
          <div className="no-demandes-icon">📝</div>
          <h3>Aucune demande trouvée</h3>
          <p>Vous n'avez pas encore créé de demandes.</p>
        </div>
      ) : (
        <div className="demandes-grid">
          {demandes.map(demande => (
            <div key={demande.id} className="demande-card">
              <div className="card-header">
                <div className="card-date">{formatDate(demande.dateDemande)}</div>
                <div className={`status-badge ${getStatusClass(demande.statut)}`}>
                  {getStatusText(demande.statut)}
                </div>
              </div>

              <div className="card-content">
                <div className="card-info">
                  <h3 className="card-title">Catégorie: {demande.categorie?.nom}</h3>
                  <p className="card-description">{demande.categorie?.description}</p>
                </div>

                <div className="card-items">
                  <h4 className="items-title">Articles demandés:</h4>
                  <div className="items-list">
                    {demande.demandeItems?.map(di => (
                      <div key={di.id} className="item-detail">
                        <span className="item-name">{di.item.nom}</span>
                        <span className="item-qty">Qty: {di.quantite}</span>
                        <span className="item-price">{di.item.prixUnitaire}DT</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-total">
                  <strong>Total: {calculateTotal(demande.demandeItems).toFixed(2)}DT</strong>
                </div>
              </div>

              <div className="card-actions">
                {isStatusPending(demande.statut) ? (
                  <button 
                    className="btn btn-update"
                    onClick={() => handleUpdateClick(demande)}
                    disabled={loading}
                  >
                    ✏️ Modifier
                  </button>
                ) : (
                  <div className="status-info">
                    {getStatusText(demande.statut) === 'Validée' && (
                      <span className="status-text">✅ Demande validée</span>
                    )}
                    {getStatusText(demande.statut) === 'Refusée' && (
                      <span className="status-text">❌ Demande refusée</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Update Modal */}
      {showUpdateModal && selectedDemande && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Modifier la demande</h3>
              <button 
                className="modal-close"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Date de création:</strong> {formatDate(selectedDemande.dateDemande)}</p>
                <p><strong>Statut:</strong> {getStatusText(selectedDemande.statut)}</p>
                <p><strong>Catégorie actuelle:</strong> {selectedDemande.categorie?.nom}</p>
              </div>

              {/* Category Selection */}
              <div className="modal-section">
                <h4>Choisir une catégorie:</h4>
                <select 
                  value={selectedCategoryId} 
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.nom} - {category.description}
                    </option>
                  ))}
                </select>
                {selectedCategoryId !== selectedDemande.categorieId && (
                  <div className="category-change-notice">
                    ⚠️ Vous changez de catégorie. Les anciens articles seront remplacés.
                  </div>
                )}
              </div>

              {/* Items Selection */}
              {availableItems.length > 0 && (
                <div className="modal-section">
                  <h4>Sélectionner les articles:</h4>
                  <div className="modal-items-grid">
                    {availableItems.map(item => (
                      <div key={item.id} className={`modal-item-row ${updatedItems[item.id] > 0 ? 'item-selected' : ''}`}>
                        <div className="modal-item-info">
                          <div className="modal-item-name">{item.nom}</div>
                          <div className="modal-item-price">Prix: {item.prixUnitaire}DT</div>
                        </div>
                        <div className="modal-item-quantity">
                          <label>Quantité:</label>
                          <input
                            type="number"
                            min="0"
                            value={updatedItems[item.id] || 0}
                            onChange={e => handleQuantityChange(item.id, e.target.value)}
                            className="quantity-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick actions for all items */}
                  <div className="modal-quick-actions">
                    <button 
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        const resetItems = {};
                        availableItems.forEach(item => {
                          resetItems[item.id] = 0;
                        });
                        setUpdatedItems(resetItems);
                      }}
                    >
                      🗑️ Tout vider
                    </button>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        const oneEachItems = {};
                        availableItems.forEach(item => {
                          oneEachItems[item.id] = 1;
                        });
                        setUpdatedItems(oneEachItems);
                      }}
                    >
                      ➕ Tout à 1
                    </button>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="modal-summary">
                <div className="summary-row">
                  <span>Articles sélectionnés:</span>
                  <span className="summary-count">
                    {Object.values(updatedItems).filter(qty => qty > 0).length}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Quantité totale:</span>
                  <span className="summary-count">
                    {Object.values(updatedItems).reduce((sum, qty) => sum + (qty || 0), 0)}
                  </span>
                </div>
                <div className="summary-row total-row">
                  <span>Total estimé:</span>
                  <span className="summary-total">
                    {calculateModalTotal().toFixed(2)}DT
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-save"
                onClick={handleUpdateSubmit}
                disabled={loading || Object.values(updatedItems).every(qty => qty === 0)}
              >
                {loading ? '⏳ Mise à jour...' : '💾 Sauvegarder les modifications'}
              </button>
              <button 
                className="btn btn-cancel"
                onClick={handleCloseModal}
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
};

export default DemandeHistoryPage;