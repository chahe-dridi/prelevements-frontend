import React, { useEffect, useState, useContext } from 'react'; 
import { AuthContext } from '../context/AuthContext';

function DemandePage() {
  const { token, userRole } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }

  const [newCategory, setNewCategory] = useState({ nom: '', description: '' });
  const [newItem, setNewItem] = useState({ nom: '', prixUnitaire: '', categorieId: '' });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'https://localhost:7101'; // backend URL

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
      setMessage(`Erreur chargement catégories: ${err.message}`);
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
      setMessage('Veuillez choisir une catégorie.');
      return;
    }
    const filteredItems = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantite]) => ({
        itemId,
        quantite,
      }));

    if (filteredItems.length === 0) {
      setMessage('Veuillez sélectionner au moins un item avec quantité.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/demandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categorieId: selectedCategoryId, // No utilisateurId here
          items: filteredItems,
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erreur lors de la création de la demande');
      }
      setMessage('Demande créée avec succès.');
      setSelectedCategoryId('');
      setSelectedItems({});
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.nom.trim()) {
      setMessage('Le nom de la catégorie est requis.');
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
      setMessage('Catégorie ajoutée.');
      setNewCategory({ nom: '', description: '' });
      await fetchCategories();
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.nom.trim() || !newItem.prixUnitaire || !newItem.categorieId) {
      setMessage('Veuillez remplir tous les champs pour ajouter un item.');
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
          prixUnitaire: parseFloat(newItem.prixUnitaire),
          categorieId: newItem.categorieId,  // GUID string, no parseInt
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erreur lors de l\'ajout de l\'item');
      }
      setMessage('Item ajouté.');
      setNewItem({ nom: '', prixUnitaire: '', categorieId: '' });
      await fetchCategories();
    } catch (err) {
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Créer une nouvelle demande</h2>
      {message && <p>{message}</p>}
      {loading && <p>Chargement...</p>}

      <label>Choisir une catégorie:</label>
      <select
        value={selectedCategoryId}
        onChange={e => setSelectedCategoryId(e.target.value)}
      >
        <option value="">-- Sélectionner --</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.nom}</option>
        ))}
      </select>

      {items.length > 0 && (
        <>
          <h3>Items de la catégorie</h3>
          {items.map(item => (
            <div key={item.id}>
              <label>
                {item.nom} (Prix: {item.prixUnitaire}):
                <input
                  type="number"
                  min="0"
                  value={selectedItems[item.id] || ''}
                  onChange={e => handleQuantityChange(item.id, e.target.value)}
                />
              </label>
            </div>
          ))}
        </>
      )}

      <button onClick={handleSubmitDemande} disabled={loading}>
        Soumettre la demande
      </button>

      {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
        <>
          <hr />
          <h3>Ajouter une nouvelle catégorie</h3>
          <input
            type="text"
            placeholder="Nom de la catégorie"
            value={newCategory.nom}
            onChange={e => setNewCategory({ ...newCategory, nom: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            value={newCategory.description}
            onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
          />
          <button onClick={handleAddCategory} disabled={loading}>
            Ajouter Catégorie
          </button>

          <hr />
          <h3>Ajouter un nouvel item</h3>
          <input
            type="text"
            placeholder="Nom de l'item"
            value={newItem.nom}
            onChange={e => setNewItem({ ...newItem, nom: e.target.value })}
          />
          <input
            type="number"
            placeholder="Prix unitaire"
            value={newItem.prixUnitaire}
            onChange={e => setNewItem({ ...newItem, prixUnitaire: e.target.value })}
          />
          <select
            value={newItem.categorieId}
            onChange={e => setNewItem({ ...newItem, categorieId: e.target.value })}
          >
            <option value="">-- Choisir catégorie --</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </select>
          <button onClick={handleAddItem} disabled={loading}>
            Ajouter Item
          </button>
        </>
      )}
    </div>
  );
}

export default DemandePage;
