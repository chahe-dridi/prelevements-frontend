import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertAmountToFrench } from '../utils/numberToFrench';
import '../assets/DemandeDetailsPage.css';

export default function DemandeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
  const [favoredUsers, setFavoredUsers] = useState([]); // New state for favored users
  const [filteredUsers, setFilteredUsers] = useState([]); // New state for filtered users
  const [userSearchTerm, setUserSearchTerm] = useState(""); // New state for search
  const [showUserDropdown, setShowUserDropdown] = useState(false); // New state for dropdown
  const [paymentInfo, setPaymentInfo] = useState({
    comptePaiement: "00410562",
    montantEnLettres: "",
    effectuePar: "",
    statut: ""
  });

  // Status options
  const statusOptions = [
    { value: "EnAttente", label: "En Attente", color: "#d97706" },
    { value: "Validee", label: "Validée", color: "#16a34a" },
    { value: "Refusee", label: "Refusée", color: "#dc2626" }
  ];

  // Load favored users on component mount
  useEffect(() => {
    const loadFavoredUsers = async () => {
      try {
        const response = await fetch('https://localhost:7101/api/Users/favored', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const users = await response.json();
          setFavoredUsers(users);
          setFilteredUsers(users);
          
          // Set default user if available and no existing value
          if (users.length > 0 && !paymentInfo.effectuePar) {
            const defaultUser = users.find(u => u.nom.toLowerCase() === 'toufik') || users[0];
            setPaymentInfo(prev => ({
              ...prev,
              effectuePar: defaultUser.fullName
            }));
          }
        }
      } catch (error) {
        console.error('Error loading favored users:', error);
      }
    };

    loadFavoredUsers();
  }, [token]);

  // Filter users based on search term
  useEffect(() => {
    if (userSearchTerm.trim() === "") {
      setFilteredUsers(favoredUsers);
    } else {
      const searchLower = userSearchTerm.toLowerCase();
      const filtered = favoredUsers.filter(user =>
        user.fullName.toLowerCase().includes(searchLower) ||
        user.nom.toLowerCase().includes(searchLower) ||
        user.prenom.toLowerCase().includes(searchLower)
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, favoredUsers]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setPaymentInfo(prev => ({
      ...prev,
      effectuePar: user.fullName
    }));
    setUserSearchTerm("");
    setShowUserDropdown(false);
  };

  // Handle search input change
  const handleUserSearchChange = (e) => {
    const value = e.target.value;
    setUserSearchTerm(value);
    setPaymentInfo(prev => ({
      ...prev,
      effectuePar: value
    }));
    setShowUserDropdown(true);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "Non renseignée";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Format de date invalide" : d.toLocaleString("fr-FR");
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

  // Calculate total amount using current prices
  const calculateTotal = () => {
    if (!demande?.demandeItems) return 0;
    return demande.demandeItems.reduce((total, item) => {
      const price = item.prixUnitaire || itemPrices[item.id] || 0;
      return total + (item.quantite * price);
    }, 0);
  };

  // Handle price changes for items
  const handlePriceChange = (itemId, price) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: parseFloat(price) || 0
    }));
  };

  // Check if payment fields should be shown in modal
  const shouldShowPaymentFields = () => {
    if (demande?.statut?.toLowerCase() !== 'refusee') {
      return true;
    }
    return paymentInfo.statut === 'Validee';
  };

  // Check if PDF export should be available
  const shouldShowPDFExport = () => {
    return demande?.statut?.toLowerCase() === 'validee';
  };

  // Auto-generate amount in letters when demande is loaded or prices change
  useEffect(() => {
    if (demande) {
      const total = calculateTotal();
      const amountInFrench = convertAmountToFrench(total);
      
      // Set default effectuePar if not already set
      let defaultEffectuePar = demande.paiement?.effectuePar || "";
      if (!defaultEffectuePar && favoredUsers.length > 0) {
        const defaultUser = favoredUsers.find(u => u.nom.toLowerCase() === 'toufik') || favoredUsers[0];
        defaultEffectuePar = defaultUser.fullName;
      }
      
      setPaymentInfo(prev => ({
        ...prev,
        montantEnLettres: demande.paiement?.montantEnLettres || amountInFrench,
        effectuePar: defaultEffectuePar,
        statut: demande.statut || ""
      }));
    }
  }, [demande, itemPrices, favoredUsers]);

  // Reset payment fields when status changes
  useEffect(() => {
    if (paymentInfo.statut === 'Validee') {
      const total = calculateTotal();
      const amountInFrench = convertAmountToFrench(total);
      
      setPaymentInfo(prev => ({
        ...prev,
        montantEnLettres: prev.montantEnLettres || amountInFrench
      }));
    }
  }, [paymentInfo.statut]);

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "Non renseignée";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Format de date invalide" : d.toLocaleDateString("fr-FR");
  };

  const formatDateOnlyShortYear = (dateStr) => {
    if (!dateStr) return "Non renseignée";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Format de date invalide";
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    
    return `${day}    ${month}    ${year}`;
  };

  // PDF Export Function
  const exportToPDF = () => {
    if (!demande) {
      alert("Aucune donnée à exporter");
      return;
    }

    if (demande.statut?.toLowerCase() !== 'validee') {
      alert("Seules les demandes validées peuvent être exportées en PDF");
      return;
    }

    try {
      const doc = new jsPDF();
      let yPosition = 50;

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');

      // COMPTE PAIEMENT
      yPosition += 10;
      const comptePaiementRaw = demande.paiement?.comptePaiement || paymentInfo.comptePaiement;
      const comptePaiementFormatted = comptePaiementRaw.length > 2
        ? `${comptePaiementRaw.slice(0, 2)}    ${comptePaiementRaw.slice(2)}`
        : comptePaiementRaw;
      doc.text(comptePaiementFormatted, 62, yPosition+1);

      // EFFECTUE PAR
      yPosition += 19;
      doc.setFont(undefined, 'bold');
      doc.text(demande.paiement?.effectuePar || paymentInfo.effectuePar, 73, yPosition);
      doc.setFont(undefined, 'normal');

      // Client name + Category + Items all on the same line
      yPosition += 13;
      const clientName = `${demande.utilisateur?.prenom || ''} ${demande.utilisateur?.nom || ''}`.trim();
      let completeLine = clientName;

      if (demande.categorie?.nom) {
        completeLine += ` ${demande.categorie.nom}`;
      }

      if (demande.demandeItems && demande.demandeItems.length > 0) {
        const itemsList = demande.demandeItems.map(item => `${item.item?.nom || 'Article'} ${item.quantite}`).join(' ');
        completeLine += ` ${itemsList}`;
      }

      const maxWidthf = 100;
      const splitTextf = doc.splitTextToSize(completeLine, maxWidthf);

      if (splitTextf.length > 0) {
        doc.text(splitTextf[0], 70, yPosition);
      }
      if (splitTextf.length > 1) {
        for (let i = 1; i < splitTextf.length; i++) {
          doc.text(splitTextf[i], 40, yPosition + (i * 7));
        }
      }

      // Total only
      yPosition += 25;
      const totalAmount = calculateTotal();
      const formattedAmount = totalAmount % 1 === 0 
        ? totalAmount.toString() 
        : totalAmount.toFixed(3);
      doc.setFont(undefined, 'bold');
      doc.text(`${formattedAmount}DT`, 100, yPosition);
      doc.setFont(undefined, 'normal');

      // Montant en Lettres
      yPosition += 14;
      const montantEnLettres = demande.paiement?.montantEnLettres || paymentInfo.montantEnLettres || convertAmountToFrench(totalAmount);

      const maxWidth = 100;
      const splitText = doc.splitTextToSize(montantEnLettres, maxWidth);
      const limitedText = splitText.slice(0, 2);

      if (limitedText.length > 0) {
        doc.text(limitedText[0], 70, yPosition);
      }
      if (limitedText.length > 1) {
        doc.text(limitedText[1], 40, yPosition + 7);
      }

      // Date at the end
      yPosition += 27;
      doc.text(formatDateOnlyShortYear(demande.dateDemande), 69, yPosition);

      const fileName = `Demande_${demande.utilisateur?.nom}_${demande.utilisateur?.prenom}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  useEffect(() => {
    fetch(`https://localhost:7101/api/admindemandes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setDemande(data);
        
        // Initialize item prices from existing data
        const initialPrices = {};
        if (data.demandeItems) {
          data.demandeItems.forEach(item => {
            if (item.prixUnitaire) {
              initialPrices[item.id] = item.prixUnitaire;
            }
          });
        }
        setItemPrices(initialPrices);
        
        const total = data.demandeItems?.reduce((sum, item) => 
          sum + (item.quantite * (item.prixUnitaire || 0)), 0) || 0;
        const amountInFrench = convertAmountToFrench(total);
        
        setPaymentInfo(prev => ({
          ...prev,
          comptePaiement: data.paiement?.comptePaiement || "00410562",
          montantEnLettres: data.paiement?.montantEnLettres || amountInFrench,
          effectuePar: data.paiement?.effectuePar || prev.effectuePar,
          statut: data.statut || ""
        }));
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement demande:", err);
        setLoading(false);
      });
  }, [id, token]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const regenerateAmountInLetters = () => {
    const total = calculateTotal();
    const amountInFrench = convertAmountToFrench(total);
    setPaymentInfo(prev => ({ ...prev, montantEnLettres: amountInFrench }));
  };

  const sendRequest = (url, method, body, successMsg) => {
    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (!res.ok) throw new Error(successMsg.error);
        return res.json();
      })
      .then(data => {
        alert(successMsg.success);
        window.location.reload();
      })
      .catch(err => alert(err.message));
  };

  const handleAccept = () => {
    if (!paymentInfo.montantEnLettres.trim()) {
      alert("Veuillez remplir le montant en lettres");
      return;
    }

    if (!paymentInfo.effectuePar.trim()) {
      alert("Veuillez sélectionner un utilisateur pour 'Effectué par'");
      return;
    }

    // Validate that all items have prices
    const missingPrices = demande.demandeItems.filter(item => 
      !item.prixUnitaire && !itemPrices[item.id]
    );
    
    if (missingPrices.length > 0) {
      alert("Veuillez remplir les prix pour tous les articles");
      return;
    }

    // Prepare the request body with item prices
    const requestBody = {
      ...paymentInfo,
      demandeItems: demande.demandeItems.map(item => ({
        id: item.id,
        prixUnitaire: item.prixUnitaire || itemPrices[item.id]
      }))
    };

    sendRequest(
      `https://localhost:7101/api/admindemandes/valider/${id}`,
      "PUT",
      requestBody,
      { success: "✅ Demande acceptée avec succès !", error: "Erreur lors de la validation" }
    );
  };

  const handleRefuse = () => {
    if (window.confirm("Êtes-vous sûr de vouloir refuser cette demande ?")) {
      fetch(`https://localhost:7101/api/admindemandes/refuser/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Erreur lors du refus");
          alert("❌ Demande refusée !");
          window.location.reload();
        })
        .catch(err => alert(err.message));
    }
  };

  const handleUpdate = () => {
    if (paymentInfo.statut === 'Validee') {
      if (!paymentInfo.montantEnLettres.trim()) {
        alert("Veuillez remplir le montant en lettres pour valider la demande");
        return;
      }
      if (!paymentInfo.comptePaiement.trim()) {
        alert("Veuillez remplir le compte paiement pour valider la demande");
        return;
      }
      if (!paymentInfo.effectuePar.trim()) {
        alert("Veuillez sélectionner un utilisateur pour 'Effectué par'");
        return;
      }

      // Validate prices for Validee status
      const missingPrices = demande.demandeItems.filter(item => 
        !item.prixUnitaire && !itemPrices[item.id]
      );
      
      if (missingPrices.length > 0) {
        alert("Veuillez remplir les prix pour tous les articles");
        return;
      }
    }

    // Prepare the request body with item prices
    const requestBody = {
      ...paymentInfo,
      demandeItems: demande.demandeItems.map(item => ({
        id: item.id,
        prixUnitaire: item.prixUnitaire || itemPrices[item.id]
      }))
    };

    sendRequest(
      `https://localhost:7101/api/admindemandes/update/${id}`,
      "PUT",
      requestBody,
      { success: "✅ Demande mise à jour avec succès !", error: "Erreur lors de la mise à jour" }
    );
    setShowModal(false);
  };

  const getModalTitle = () => {
    if (demande?.statut?.toLowerCase() === 'refusee') {
      return "Changer le Statut de la Demande";
    }
    return "Mettre à Jour le Paiement et Statut";
  };

  const getStatusOptionsForModal = () => {
    if (demande?.statut?.toLowerCase() === 'refusee') {
      return statusOptions.filter(option => option.value !== 'Refusee');
    }
    return statusOptions;
  };

  // User Search Component
  const UserSearchInput = ({ value, onChange, onSelect, placeholder, className }) => (
    <div className={`user-search-container ${className || ''}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setShowUserDropdown(true)}
        placeholder={placeholder}
        className="form-input user-search-input"
      />
      {showUserDropdown && (
        <div className="user-dropdown">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className="user-dropdown-item"
                onClick={() => onSelect(user)}
              >
                <div className="user-item-main">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-tag">⭐ Privilégié</span>
                </div>
                <div className="user-item-sub">
                  {user.email}
                </div>
              </div>
            ))
          ) : (
            <div className="user-dropdown-item no-results">
              <span>Aucun utilisateur privilégié trouvé</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="demande-details-container">
        <div className="loading-container">
          <div className="loading-text">
            🔄 Chargement des détails...
          </div>
        </div>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="demande-details-container">
        <div className="content-section text-center">
          <h2>Demande non trouvée</h2>
          <p>La demande demandée n'existe pas ou n'est plus accessible.</p>
          <button 
            className="btn btn-cancel"
            onClick={() => navigate("/admin/demandes")}
          >
            ← Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="demande-details-container">
      <div className="demande-header">
        <div>
          <button 
            className="back-button"
            onClick={() => navigate("/admin/demandes")}
          >
            ← Retour à la liste
          </button>
          <h1 className="demande-title">Détails de la Demande</h1>
        </div>
        {shouldShowPDFExport() && (
          <button 
            className="btn btn-export"
            onClick={exportToPDF}
            disabled={!demande}
          >
            📄 Exporter en PDF
          </button>
        )}
      </div>

      {/* Client Information */}
      <div className="content-section">
        <h2 className="section-title client">Informations Client</h2>
        <div className="client-info">
          <div className="info-item">
            <span className="info-label">Date de la demande</span>
            <span className="info-value">{formatDate(demande.dateDemande)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Client</span>
            <span className="info-value">
              {demande.utilisateur?.prenom} {demande.utilisateur?.nom}
            </span>
          </div>
          {demande.utilisateur?.email && (
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{demande.utilisateur.email}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Catégorie</span>
            <span className="info-value">{demande.categorie?.nom}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Statut</span>
            <span className={`status-badge ${getStatusClass(demande.statut)}`}>
              {getStatusText(demande.statut)}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="content-section">
        <h2 className="section-title items">Articles Demandés</h2>
        {demande.demandeItems && demande.demandeItems.length > 0 ? (
          <table className="items-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {demande.demandeItems.map(di => {
                const currentPrice = di.prixUnitaire || itemPrices[di.id] || 0;
                const totalPrice = di.quantite * currentPrice;
                
                return (
                  <tr key={di.id}>
                    <td>{di.item?.nom || 'Article non trouvé'}</td>
                    <td>{di.quantite}</td>
                    <td>
                      {demande.statut === "EnAttente" ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(di.id, e.target.value)}
                          className="price-input"
                          placeholder="0.00"
                        />
                      ) : (
                        <span>{currentPrice.toFixed(2)}DT</span>
                      )}
                    </td>
                    <td className="total-amount">
                      {totalPrice.toFixed(2)}DT
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                <td colSpan="3">Total Général</td>
                <td className="total-amount">{calculateTotal().toFixed(2)}DT</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="no-items">Aucun article trouvé pour cette demande</div>
        )}
      </div>

      {/* Payment Information */}
      <div className="content-section">
        <h2 className="section-title payment">Informations de Paiement</h2>
        {demande.paiement ? (
          <div className="payment-grid">
            <div className="info-item">
              <span className="info-label">Montant Total</span>
              <span className="info-value total-amount">{demande.paiement.montantTotal}DT</span>
            </div>
            <div className="info-item">
              <span className="info-label">Compte Paiement</span>
              <span className="info-value">{demande.paiement.comptePaiement}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Montant en Lettres</span>
              <span className="info-value">{demande.paiement.montantEnLettres}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Effectué par</span>
              <span className="info-value">{demande.paiement.effectuePar}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date de paiement</span>
              <span className="info-value">{formatDate(demande.paiement.datePaiement)}</span>
            </div>
          </div>
        ) : (
          <div className="no-payment">Aucun paiement enregistré</div>
        )}
      </div>

      {/* Actions */}
      <div className="content-section">
        <h2 className="section-title actions">Actions</h2>
        
        {demande.statut === "EnAttente" && (
          <div className="payment-form">
            <h3 className="form-title">Traitement de la Demande</h3>
            
            <div className="pricing-info">
              <p>💡 <strong>Remplissez les prix unitaires dans le tableau ci-dessus avant d'accepter la demande.</strong></p>
              <p>Le montant total sera calculé automatiquement: <strong>{calculateTotal().toFixed(2)}DT</strong></p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Compte Paiement</label>
              <input 
                type="text" 
                name="comptePaiement" 
                value={paymentInfo.comptePaiement} 
                onChange={handleChange}
                className="form-input prefilled"
                placeholder="Ex: 00410562"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Montant en Lettres *</label>
              <div className="input-with-button">
                <input 
                  type="text" 
                  name="montantEnLettres" 
                  value={paymentInfo.montantEnLettres} 
                  onChange={handleChange}
                  className="form-input prefilled"
                  placeholder="Ex: Deux cent cinquante dinars"
                  required
                />
                <button 
                  type="button"
                  className="btn-regenerate"
                  onClick={regenerateAmountInLetters}
                  title="Régénérer automatiquement"
                >
                  🔄
                </button>
              </div>
              <small className="form-hint">
                Le montant est généré automatiquement. Cliquez sur 🔄 pour régénérer.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Effectué Par *</label>
              <UserSearchInput
                value={paymentInfo.effectuePar}
                onChange={handleUserSearchChange}
                onSelect={handleUserSelect}
                placeholder="Rechercher un utilisateur privilégié..."
                className="prefilled"
              />
              <small className="form-hint">
                Sélectionnez un utilisateur privilégié ou tapez pour rechercher.
              </small>
            </div>

            <div className="actions-container">
              <button onClick={handleAccept} className="btn btn-accept">
                ✅ Accepter la Demande
              </button>
              <button onClick={handleRefuse} className="btn btn-reject">
                ❌ Refuser la Demande
              </button>
            </div>
          </div>
        )}

        {(demande.statut === "Validee" || demande.statut === "Refusee") && (
          <div className="actions-container">
            <button onClick={() => setShowModal(true)} className="btn btn-update">
              {demande.statut === "Refusee" ? "🔄 Changer le Statut" : "✏️ Mettre à Jour les Informations"}
            </button>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{getModalTitle()}</h3>
            
            <div className="form-group">
              <label className="form-label">Statut de la Demande</label>
              <select 
                name="statut" 
                value={paymentInfo.statut} 
                onChange={handleChange}
                className="form-input form-select"
              >
                <option value="">-- Garder le statut actuel --</option>
                {getStatusOptionsForModal().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                {demande.statut === "Refusee" 
                  ? "Sélectionnez un nouveau statut pour cette demande refusée"
                  : `Laissez vide pour conserver le statut actuel: ${getStatusText(demande.statut)}`
                }
              </small>
            </div>

            {/* Show item prices table in modal if changing to Validee */}
            {paymentInfo.statut === 'Validee' && (
              <div className="form-group">
                <label className="form-label">Prix des Articles</label>
                <div className="modal-items-table">
                  {demande.demandeItems.map(di => {
                    const currentPrice = di.prixUnitaire || itemPrices[di.id] || 0;
                    return (
                      <div key={di.id} className="modal-item-row">
                        <span className="modal-item-name">{di.item?.nom || 'Article'} x{di.quantite}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(di.id, e.target.value)}
                          className="price-input-small"
                          placeholder="0.00"
                        />
                        <span className="modal-item-total">
                          = {(di.quantite * currentPrice).toFixed(2)}DT
                        </span>
                      </div>
                    );
                  })}
                  <div className="modal-total">
                    <strong>Total: {calculateTotal().toFixed(2)}DT</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Payment fields - only show based on conditions */}
            {shouldShowPaymentFields() && (
              <>
                <div className="form-group">
                  <label className="form-label">Compte Paiement</label>
                  <input 
                    type="text" 
                    name="comptePaiement" 
                    value={paymentInfo.comptePaiement} 
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Montant en Lettres</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      name="montantEnLettres" 
                      value={paymentInfo.montantEnLettres} 
                      onChange={handleChange}
                      className="form-input"
                    />
                    <button 
                      type="button"
                      className="btn-regenerate"
                      onClick={regenerateAmountInLetters}
                      title="Régénérer automatiquement"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Effectué Par</label>
                  <UserSearchInput
                    value={paymentInfo.effectuePar}
                    onChange={handleUserSearchChange}
                    onSelect={handleUserSelect}
                    placeholder="Rechercher un utilisateur privilégié..."
                  />
                </div>
              </>
            )}

            {/* Show hint when status is Refusee and user selects Validee */}
            {demande?.statut?.toLowerCase() === 'refusee' && paymentInfo.statut === 'Validee' && (
              <div className="form-hint status-change-hint">
                💡 En changeant le statut vers "Validée", vous devez remplir les prix et informations de paiement ci-dessus.
              </div>
            )}

            <div className="modal-actions">
              <button onClick={handleUpdate} className="btn btn-save">
                💾 Enregistrer les Modifications
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-cancel">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}