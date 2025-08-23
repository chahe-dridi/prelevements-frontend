import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../assets/DemandeHistoryPage.css';
 
import Footer from '../components/Footer';


const DemandeHistoryPage = () => {
  const { token, userEmail } = useContext(AuthContext);
  
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 6,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  
  // Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [categories, setCategories] = useState([]);
  const [updatedItems, setUpdatedItems] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [availableItems, setAvailableItems] = useState([]);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [demandeToCancel, setDemandeToCancel] = useState(null);

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

  // Helper function for items display
  const formatItemsDisplay = (demandeItems) => {
    if (!demandeItems || demandeItems.length === 0) {
      return { visibleItems: [], hasMore: false, totalCount: 0 };
    }
    
    // Show max 3 items, then indicate if there are more
    const maxVisible = 3;
    const visibleItems = demandeItems.slice(0, maxVisible);
    const hasMore = demandeItems.length > maxVisible;
    
    return { visibleItems, hasMore, totalCount: demandeItems.length };
  };

  // Fixed status handling functions
  const getStatusClass = (statut) => {
    const statusValue = statut;
    
    if (statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente') {
      return 'status-pending';
    }
    if (statusValue === 1 || statusValue === '1' || String(statusValue).toLowerCase() === 'validee') {
      return 'status-approved';
    }
    if (statusValue === 2 || statusValue === '2' || String(statusValue).toLowerCase() === 'refusee') {
      return 'status-rejected';
    }
    
    return 'status-pending';
  };

  const getStatusText = (statut) => {
    const statusValue = statut;
    
    if (statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente') {
      return 'En Attente';
    }
    if (statusValue === 1 || statusValue === '1' || String(statusValue).toLowerCase() === 'validee') {
      return 'Validée';
    }
    if (statusValue === 2 || statusValue === '2' || String(statusValue).toLowerCase() === 'refusee') {
      return 'Refusée';
    }
    
    return `Statut: ${statusValue}`;
  };

  const isStatusPending = (statut) => {
    const statusValue = statut;
    return statusValue === 0 || statusValue === '0' || String(statusValue).toLowerCase() === 'enattente';
  };

  // UPDATED: Handle new price structure - check prixUnitaire on demandeItem first, then fallback to item
 const calculateTotal = (demandeItems) => {
  if (!demandeItems) return 0;
  return demandeItems.reduce((total, demandeItem) => {
    // Priority: demandeItem.prixUnitaire > item.prixUnitaire > 0
    const unitPrice = demandeItem.prixUnitaire || demandeItem.item?.prixUnitaire || 0;
    return total + (demandeItem.quantite * unitPrice);
  }, 0);
};

  // UPDATED: Modal total calculation with new price structure
  const calculateModalTotal = () => {
    if (!availableItems || !updatedItems) return 0;
    return Object.entries(updatedItems).reduce((total, [itemId, quantity]) => {
      if (quantity > 0) {
        const item = availableItems.find(i => i.id === itemId);
        if (item) {
          // Use the item's base price for estimation in modal
          const unitPrice = item.prixUnitaire || 0;
          return total + (quantity * unitPrice);
        }
      }
      return total;
    }, 0);
  };

  // Enhanced fetch function - now uses consistent endpoint
  const fetchDemandes = async (page = 1) => {
    try {
      setLoading(true);
      
      const res = await fetch(`${API_BASE_URL}/api/demandes/my-demandes?page=${page}&pageSize=${pagination.pageSize}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
      }
      
      const response = await res.json();
      console.log('Demandes response:', response); // Debug log
      
      // Handle both paginated and non-paginated responses
      if (response.data && response.pagination) {
        setDemandes(response.data || []);
        setPagination(response.pagination);
      } else {
        // Fallback for non-paginated response
        setDemandes(response || []);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalCount: response?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showMessage(`Erreur chargement historique: ${err.message}`, 'error');
      setDemandes([]); // Set empty array on error
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
    if (token) { // Only check for token, not userEmail
      fetchDemandes(1);
      fetchCategories();
    } else {
      setLoading(false);
      showMessage('Token d\'authentification manquant', 'error');
    }
  }, [token]); // Only depend on token

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDemandes(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.hasPrevious) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  // Cancel demande functionality
  const handleCancelClick = (demande) => {
    setDemandeToCancel(demande);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!demandeToCancel) return;

    try {
      setLoading(true);
      
      const res = await fetch(`${API_BASE_URL}/api/demandes/${demandeToCancel.id}/cancel`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erreur lors de l\'annulation');
      }

      showMessage('✅ Demande annulée avec succès!', 'success');
      setShowCancelModal(false);
      setDemandeToCancel(null);
      
      // Refresh current page or go to previous if current page becomes empty
      const currentPage = pagination.currentPage;
      const newTotalCount = pagination.totalCount - 1;
      const newTotalPages = Math.ceil(newTotalCount / pagination.pageSize);
      
      if (currentPage > newTotalPages && newTotalPages > 0) {
        fetchDemandes(newTotalPages);
      } else {
        fetchDemandes(currentPage);
      }
    } catch (err) {
      console.error('Cancel error:', err);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update modal functions
  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (selectedCategory) {
      setAvailableItems(selectedCategory.items || []);
      
      const newUpdatedItems = {};
      selectedCategory.items.forEach(item => {
        newUpdatedItems[item.id] = updatedItems[item.id] || 0;
      });
      setUpdatedItems(newUpdatedItems);
    }
  };

  const handleUpdateClick = (demande) => {
    setSelectedDemande(demande);
    setSelectedCategoryId(demande.categorieId);
    
    const category = categories.find(c => c.id === demande.categorieId);
    if (category) {
      setAvailableItems(category.items || []);
      
      const itemsData = {};
      category.items.forEach(item => {
        itemsData[item.id] = 0;
      });
      
      demande.demandeItems.forEach(di => {
        itemsData[di.item.id] = di.quantite;
      });
      
      setUpdatedItems(itemsData);
    }
    
    setShowUpdateModal(true);
  };

  const handleQuantityChange = (itemId, quantity) => {
    const qty = parseInt(quantity) || 0;
    setUpdatedItems(prev => ({
      ...prev,
      [itemId]: qty >= 0 ? qty : 0
    }));
  };

  const handleUpdateSubmit = async () => {
    if (!selectedDemande || !selectedCategoryId) {
      showMessage('Données manquantes pour la mise à jour.', 'error');
      return;
    }

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

    try {
      setLoading(true);
      
      const requestBody = {
        categorieId: selectedCategoryId,
        items: filteredItems
      };
      
      const res = await fetch(`${API_BASE_URL}/api/demandes/${selectedDemande.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erreur lors de la mise à jour');
      }

      showMessage('✅ Demande mise à jour avec succès!', 'success');
      handleCloseModal();
      fetchDemandes(pagination.currentPage);
    } catch (err) {
      console.error('Update error:', err);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowUpdateModal(false);
    setSelectedDemande(null);
    setSelectedCategoryId('');
    setAvailableItems([]);
    setUpdatedItems({});
  };

  // Pagination component
  const PaginationComponent = () => {
    if (pagination.totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Affichage {((pagination.currentPage - 1) * pagination.pageSize) + 1} à {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} sur {pagination.totalCount} demandes
        </div>
        
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            onClick={handlePreviousPage}
            disabled={!pagination.hasPrevious || loading}
          >
            ← Précédent
          </button>
          
          {startPage > 1 && (
            <>
              <button 
                className="pagination-number"
                onClick={() => handlePageChange(1)}
                disabled={loading}
              >
                1
              </button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(pageNum => (
            <button
              key={pageNum}
              className={`pagination-number ${pagination.currentPage === pageNum ? 'active' : ''}`}
              onClick={() => handlePageChange(pageNum)}
              disabled={loading}
            >
              {pageNum}
            </button>
          ))}
          
          {endPage < pagination.totalPages && (
            <>
              {endPage < pagination.totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button 
                className="pagination-number"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={loading}
              >
                {pagination.totalPages}
              </button>
            </>
          )}
          
          <button 
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={!pagination.hasNext || loading}
          >
            Suivant →
          </button>
        </div>
      </div>
    );
  };

  if (loading && token) {
    return (
      <div className="history-container">
        <div className="loading-container">
          <div className="loading-text">🔄 Chargement de l'historique...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!token) {
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="history-title">Mon Historique de Demandes</h1>
        <p className="history-subtitle">Consultez et modifiez vos demandes</p>
        
        {pagination.totalCount > 0 && (
          <div className="history-stats">
            <span className="stats-item">
              📊 Total: <strong>{pagination.totalCount}</strong> demandes
            </span>
            <span className="stats-item">
              📄 Page: <strong>{pagination.currentPage}</strong> sur <strong>{pagination.totalPages}</strong>
            </span>
          </div>
        )}
      </div>

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
        <>
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

                  {/* ITEMS SECTION with description display */}
                  <div className="card-items">
                    <h4 className="items-title">Articles demandés:</h4>
                    <div className="items-list">
                      {(() => {
                        const { visibleItems, hasMore, totalCount } = formatItemsDisplay(demande.demandeItems);
                        return (
                          <>
                            {visibleItems && visibleItems.length > 0 ? (
                              <>
                                {visibleItems.map(di => (
                                  <div key={di.id} className="item-detail">
                                    <span className="item-name" title={di.item.nom}>
                                      {di.item.nom}
                                      {di.description && (
                                        <span className="item-description"> ({di.description})</span>
                                      )}
                                    </span>
                                    <span className="item-qty">×{di.quantite}</span>
                                    {(di.prixUnitaire || di.item?.prixUnitaire) && (
                                      <span className="item-price">
                                        {(di.prixUnitaire || di.item.prixUnitaire).toFixed(2)}DT
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {hasMore && (
                                  <div className="items-count">
                                    ... et {totalCount - visibleItems.length} autre{totalCount - visibleItems.length > 1 ? 's' : ''} article{totalCount - visibleItems.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="no-items">Aucun article</div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="card-total">
                    <strong>Total: {calculateTotal(demande.demandeItems).toFixed(2)}DT</strong>
                  </div>
                </div>

                <div className="card-actions">
                  {isStatusPending(demande.statut) ? (
                    <div className="action-buttons">
                      <button 
                        className="btn btn-update"
                        onClick={() => handleUpdateClick(demande)}
                        disabled={loading}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        className="btn btn-cancel"
                        onClick={() => handleCancelClick(demande)}
                        disabled={loading}
                      >
                        🗑️ Annuler
                      </button>
                    </div>
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

          <PaginationComponent />
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && demandeToCancel && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h3 className="modal-title">Confirmer l'annulation</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="cancel-warning">
                <div className="warning-icon">⚠️</div>
                <p>Êtes-vous sûr de vouloir annuler cette demande ?</p>
                <p><strong>Catégorie:</strong> {demandeToCancel.categorie?.nom}</p>
                <p><strong>Date:</strong> {formatDate(demandeToCancel.dateDemande)}</p>
                <p><strong>Total:</strong> {calculateTotal(demandeToCancel.demandeItems).toFixed(2)}DT</p>
                <div className="warning-text">
                  Cette action est irréversible. La demande sera définitivement supprimée.
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-danger"
                onClick={handleCancelConfirm}
                disabled={loading}
              >
                {loading ? '⏳ Annulation...' : '🗑️ Oui, annuler la demande'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={loading}
              >
                ❌ Non, garder la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
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

              {availableItems.length > 0 && (
                <div className="modal-section">
                  <h4>Sélectionner les articles:</h4>
                  <div className="modal-items-grid">
                    {availableItems.map(item => (
                      <div key={item.id} className={`modal-item-row ${updatedItems[item.id] > 0 ? 'item-selected' : ''}`}>
                        <div className="modal-item-info">
                          <div className="modal-item-name">{item.nom}</div>
                          {item.prixUnitaire && (
                            <div className="modal-item-price">Prix estimé: {item.prixUnitaire.toFixed(2)}DT</div>
                          )}
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
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={loading}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default DemandeHistoryPage;