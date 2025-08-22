import React, { useEffect, useState, useContext } from 'react'; 
import { AuthContext } from '../context/AuthContext';
import '../assets/DemandePage.css';

const DemandePage = () => {
  const { token, userRole } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }

  const [newCategory, setNewCategory] = useState({ nom: '', description: '' });
  const [newItem, setNewItem] = useState({ nom: '', categorieId: '' });

  // Edit states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '', name: '' });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'https://localhost:7101'; // backend URL

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Load categories with their items
  const fetchCategories = async () => {
    if (!token) {
      console.log('No token found');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetch response status:', res.status);
      if (!res.ok) throw new Error(`Failed to load categories: ${res.statusText}`);
      const data = await res.json();
      console.log('Categories data:', data);
      setCategories(data || []);
    } catch (err) {
      showMessage(`Erreur chargement catégories: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setItems([]);
      setSelectedItems({});
      return;
    }
    const category = categories.find(c => c.id === selectedCategoryId);
    setItems(category?.items || []);
    setSelectedItems({});
  }, [selectedCategoryId, categories]);

  const handleQuantityChange = (itemId, qty) => {
    const q = parseInt(qty);
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: q > 0 ? q : 0
    }));
  };

  const handleSubmitDemande = async () => {
    if (!selectedCategoryId) {
      showMessage('⚠️ Veuillez choisir une catégorie.', 'error');
      return;
    }
    
    const filteredItems = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantite]) => ({
        itemId,
        quantite,
      }));

    if (filteredItems.length === 0) {
      showMessage('⚠️ Veuillez sélectionner au moins un item avec quantité.', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        categorieId: selectedCategoryId,
        items: filteredItems
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(`${API_BASE_URL}/api/demandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        
        let errorMessage = 'Erreur lors de la création de la demande';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.Message || errorText;
        } catch {
          errorMessage = errorText || `Erreur HTTP ${res.status}: ${res.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log('Success response:', result);
      
      showMessage('✅ Demande créée avec succès!', 'success');
      setSelectedCategoryId('');
      setSelectedItems({});
    } catch (err) {
      console.error('Submit error:', err);
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Category CRUD operations
  const handleAddCategory = async () => {
    if (!newCategory.nom.trim()) {
      showMessage('Le nom de la catégorie est requis.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCategory)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de l\'ajout de la catégorie');
      }
      showMessage('✅ Catégorie ajoutée avec succès!', 'success');
      setNewCategory({ nom: '', description: '' });
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory.nom.trim()) {
      showMessage('Le nom de la catégorie est requis.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: editingCategory.nom,
          description: editingCategory.description
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de la mise à jour de la catégorie');
      }
      showMessage('✅ Catégorie mise à jour avec succès!', 'success');
      setShowCategoryModal(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de la suppression de la catégorie');
      }
      showMessage('✅ Catégorie supprimée avec succès!', 'success');
      setShowDeleteModal(false);
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Item CRUD operations
  const handleAddItem = async () => {
    if (!newItem.nom.trim() || !newItem.categorieId) {
      showMessage('Veuillez remplir tous les champs pour ajouter un item.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: newItem.nom,
       
          categorieId: newItem.categorieId,
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de l\'ajout de l\'item');
      }
      showMessage('✅ Item ajouté avec succès!', 'success');
      setNewItem({ nom: '' , categorieId: '' });
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem({ ...item, categorieId: item.categorieId });
    setShowItemModal(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem.nom.trim() ||   !editingItem.categorieId) {
      showMessage('Veuillez remplir tous les champs.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: editingItem.nom,
         
          categorieId: editingItem.categorieId
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de la mise à jour de l\'item');
      }
      showMessage('✅ Item mis à jour avec succès!', 'success');
      setShowItemModal(false);
      setEditingItem(null);
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de la suppression de l\'item');
      }
      showMessage('✅ Item supprimé avec succès!', 'success');
      setShowDeleteModal(false);
      await fetchCategories();
    } catch (err) {
      showMessage(`❌ Erreur: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTarget.type === 'category') {
      handleDeleteCategory(deleteTarget.id);
    } else if (deleteTarget.type === 'item') {
      handleDeleteItem(deleteTarget.id);
    }
  };

  return (
    <div className="demande-container">
      <div className="demande-header">
        <h1 className="demande-title">Créer une nouvelle demande</h1>
        <p className="demande-subtitle">Sélectionnez une catégorie et les items souhaités</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {loading && <div className="loading-message">🔄 Chargement...</div>}

      <div className={`form-section ${loading ? 'loading-overlay' : ''}`}>
        <h2 className="section-title">Sélection de catégorie</h2>
        
        <div className="form-group">
          <label className="form-label">Choisir une catégorie:</label>
          <select
            className="form-select"
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Sélectionner une catégorie --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
        </div>

        {items.length > 0 && (
          <div className="items-container">
            <h3 className="items-title">Items disponibles</h3>
            {items.map(item => (
              <div key={item.id} className="item-row">
                <div className="item-info">
                  <div className="item-name">{item.nom}</div>
                 
                </div>
                <div className="item-quantity">
                  <label className="quantity-label">Quantité:</label>
                  <input
                    type="number"
                    min="0"
                    className="quantity-input"
                    value={selectedItems[item.id] || ''}
                    onChange={e => handleQuantityChange(item.id, e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          className="btn btn-primary submit-button" 
          onClick={handleSubmitDemande} 
          disabled={loading || !selectedCategoryId}
        >
          {loading ? '⏳ Traitement...' : '📤 Soumettre la demande'}
        </button>
      </div>

      {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
        <>
          <hr className="divider" />
          
          {/* Add Category Section */}
          <div className="form-section admin-section">
            <h2 className="section-title">Ajouter une nouvelle catégorie</h2>
            <div className="admin-form">
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Nom de la catégorie</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Fournitures de bureau"
                    value={newCategory.nom}
                    onChange={e => setNewCategory({ ...newCategory, nom: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Description optionnelle"
                    value={newCategory.description}
                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              <button 
                className="btn btn-success" 
                onClick={handleAddCategory} 
                disabled={loading || !newCategory.nom.trim()}
              >
                {loading ? '⏳ Ajout...' : '➕ Ajouter Catégorie'}
              </button>
            </div>

            {/* Categories List */}
            <div className="admin-list">
              <h3 className="subsection-title">Catégories existantes</h3>
              <div className="items-grid">
                {categories.map(category => (
                  <div key={category.id} className="admin-item-card">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{category.nom}</div>
                      {category.description && (
                        <div className="admin-item-description">{category.description}</div>
                      )}
                      <div className="admin-item-count">
                        {category.items?.length || 0} item(s)
                      </div>
                    </div>
                    <div className="admin-item-actions">
                      <button
                        className="btn-edit-small"
                        onClick={() => handleEditCategory(category)}
                        disabled={loading}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete-small"
                        onClick={() => openDeleteModal('category', category.id, category.nom)}
                        disabled={loading}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Item Section */}
          <div className="form-section admin-section">
            <h2 className="section-title">Ajouter un nouvel item</h2>
            <div className="admin-form">
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Nom de l'item</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Stylo bleu"
                    value={newItem.nom}
                    onChange={e => setNewItem({ ...newItem, nom: e.target.value })}
                    disabled={loading}
                  />
                </div>
                 
              </div>
              <div className="admin-form-row single">
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select
                    className="form-select"
                    value={newItem.categorieId}
                    onChange={e => setNewItem({ ...newItem, categorieId: e.target.value })}
                    disabled={loading}
                  >
                    <option value="">-- Choisir une catégorie --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                className="btn btn-success" 
                onClick={handleAddItem} 
                disabled={loading || !newItem.nom.trim()   || !newItem.categorieId}
              >
                {loading ? '⏳ Ajout...' : '➕ Ajouter Item'}
              </button>
            </div>

            {/* Items List */}
            <div className="admin-list">
              <h3 className="subsection-title">Items existants</h3>
              <div className="items-grid">
                {categories.flatMap(category => 
                  category.items?.map(item => (
                    <div key={item.id} className="admin-item-card">
                      <div className="admin-item-info">
                        <div className="admin-item-name">{item.nom}</div>
                        <div className="admin-item-description">
                          Catégorie: {category.nom}
                        </div>
                         
                      </div>
                      <div className="admin-item-actions">
                        <button
                          className="btn-edit-small"
                          onClick={() => handleEditItem(item)}
                          disabled={loading}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={() => openDeleteModal('item', item.id, item.nom)}
                          disabled={loading}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Category Modal */}
      {showCategoryModal && editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Modifier la catégorie</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nom de la catégorie</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCategory.nom}
                  onChange={e => setEditingCategory({ ...editingCategory, nom: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={handleUpdateCategory}
                disabled={loading || !editingCategory.nom.trim()}
              >
                {loading ? '⏳ Mise à jour...' : '💾 Enregistrer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showItemModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Modifier l'item</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nom de l'item</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.nom}
                  onChange={e => setEditingItem({ ...editingItem, nom: e.target.value })}
                  disabled={loading}
                />
              </div>
            
              
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select
                  className="form-select"
                  value={editingItem.categorieId}
                  onChange={e => setEditingItem({ ...editingItem, categorieId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">-- Choisir une catégorie --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={handleUpdateItem}
                disabled={loading || !editingItem.nom.trim()   || !editingItem.categorieId}
              >
                {loading ? '⏳ Mise à jour...' : '💾 Enregistrer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowItemModal(false);
                  setEditingItem(null);
                }}
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h3 className="modal-title">Confirmer la suppression</h3>
              <button 
                className="close-button"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-confirmation-text">
                Êtes-vous sûr de vouloir supprimer {deleteTarget.type === 'category' ? 'la catégorie' : 'l\'item'} 
                <strong> "{deleteTarget.name}"</strong> ?
              </div>
              {deleteTarget.type === 'category' && (
                <div className="warning-text">
                  ⚠️ Attention: Supprimer une catégorie supprimera également tous ses items associés.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? '⏳ Suppression...' : '🗑️ Supprimer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandePage;