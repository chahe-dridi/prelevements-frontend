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
  const [paymentInfo, setPaymentInfo] = useState({
    comptePaiement: "00410562", // Auto-filled as requested
    montantEnLettres: "",
    effectuePar: "toufik" // Auto-filled as requested
  });

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

  // Calculate total amount
  const calculateTotal = () => {
    if (!demande?.demandeItems) return 0;
    return demande.demandeItems.reduce((total, item) => {
      return total + (item.quantite * item.item.prixUnitaire);
    }, 0);
  };

  // Auto-generate amount in letters when demande is loaded or updated
  useEffect(() => {
    if (demande) {
      const total = calculateTotal();
      const amountInFrench = convertAmountToFrench(total);
      
      setPaymentInfo(prev => ({
        ...prev,
        montantEnLettres: demande.paiement?.montantEnLettres || amountInFrench
      }));
    }
  }, [demande]);

  // PDF Export Function
  const exportToPDF = () => {
    if (!demande) {
      alert("Aucune donnée à exporter");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Helper function to add text with proper spacing
      const addText = (text, x, y, options = {}) => {
        doc.text(text, x, y, options);
        return y + (options.lineHeight || 10);
      };

      // Helper function to add a section separator
      const addSeparator = (y) => {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, pageWidth - 20, y);
        return y + 10;
      };

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      yPosition = addText('FACTURE DE DEMANDE', pageWidth / 2, yPosition, { 
        align: 'center', 
        lineHeight: 15 
      });

      yPosition = addSeparator(yPosition);

      // Company/Payment Account Info
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      yPosition = addText('COMPTE PAIEMENT:', 20, yPosition, { lineHeight: 12 });
      doc.setFont(undefined, 'normal');
      yPosition = addText(demande.paiement?.comptePaiement || paymentInfo.comptePaiement, 20, yPosition, { lineHeight: 10 });

      // Effectué Par
      doc.setFont(undefined, 'bold');
      yPosition = addText('EFFECTUE PAR:', 20, yPosition + 5, { lineHeight: 12 });
      doc.setFont(undefined, 'normal');
      yPosition = addText(demande.paiement?.effectuePar || paymentInfo.effectuePar, 20, yPosition, { lineHeight: 10 });

      yPosition = addSeparator(yPosition + 5);

      // Client Information
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      yPosition = addText('INFORMATIONS CLIENT', 20, yPosition, { lineHeight: 15 });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      yPosition = addText(`Client: ${demande.utilisateur?.prenom} ${demande.utilisateur?.nom}`, 20, yPosition, { lineHeight: 8 });
      
      if (demande.utilisateur?.email) {
        yPosition = addText(`Email: ${demande.utilisateur.email}`, 20, yPosition, { lineHeight: 8 });
      }
      
      if (demande.utilisateur?.telephone) {
        yPosition = addText(`Telephone: ${demande.utilisateur.telephone}`, 20, yPosition, { lineHeight: 8 });
      }

      yPosition = addText(`Categorie: ${demande.categorie?.nom}`, 20, yPosition, { lineHeight: 8 });
      yPosition = addText(`Date de demande: ${formatDate(demande.dateDemande)}`, 20, yPosition, { lineHeight: 10 });

      yPosition = addSeparator(yPosition + 5);

      // Items Table
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      yPosition = addText('ARTICLES DEMANDES', 20, yPosition, { lineHeight: 15 });

      if (demande.demandeItems && demande.demandeItems.length > 0) {
        const tableData = demande.demandeItems.map(item => [
          item.item.nom,
          item.quantite.toString(),
          `${item.item.prixUnitaire.toFixed(2)} DT`,
          `${(item.quantite * item.item.prixUnitaire).toFixed(2)} DT`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Article', 'Quantite', 'Prix Unitaire', 'Total']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [79, 140, 255],
            textColor: 255,
            fontStyle: 'bold'
          },
          margin: { left: 20, right: 20 },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Total Amount
      const totalAmount = calculateTotal();
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(22, 163, 74); // Green color
      yPosition = addText(`TOTAL GENERAL: ${totalAmount.toFixed(2)} DT`, pageWidth - 20, yPosition, { 
        align: 'right', 
        lineHeight: 15 
      });

      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition = addSeparator(yPosition + 5);

      // Amount in Letters
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      yPosition = addText('MONTANT EN LETTRES:', 20, yPosition, { lineHeight: 12 });
      doc.setFont(undefined, 'normal');
      const montantEnLettres = demande.paiement?.montantEnLettres || paymentInfo.montantEnLettres || convertAmountToFrench(totalAmount);
      
      // Handle long text for amount in letters
      const splitText = doc.splitTextToSize(montantEnLettres, pageWidth - 40);
      doc.text(splitText, 20, yPosition);
      yPosition += (splitText.length * 6) + 10;

      // Payment Date
      if (demande.paiement?.datePaiement) {
        yPosition = addSeparator(yPosition);
        doc.setFont(undefined, 'bold');
        yPosition = addText('DATE DE PAIEMENT:', 20, yPosition, { lineHeight: 12 });
        doc.setFont(undefined, 'normal');
        yPosition = addText(formatDate(demande.paiement.datePaiement), 20, yPosition, { lineHeight: 10 });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Document genere automatiquement', pageWidth / 2, pageHeight - 20, { align: 'center' });
      doc.text(`Genere le: ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
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
        
        // Calculate total and convert to French
        const total = data.demandeItems?.reduce((sum, item) => 
          sum + (item.quantite * item.item.prixUnitaire), 0) || 0;
        const amountInFrench = convertAmountToFrench(total);
        
        setPaymentInfo({
          comptePaiement: data.paiement?.comptePaiement || "00410562",
          montantEnLettres: data.paiement?.montantEnLettres || amountInFrench,
          effectuePar: data.paiement?.effectuePar || "toufik"
        });
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

  // Function to regenerate amount in letters
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
        alert(successMsg.success);
        navigate("/admin/demandes");
      })
      .catch(err => alert(err.message));
  };

  const handleAccept = () => {
    if (!paymentInfo.montantEnLettres.trim()) {
      alert("Veuillez remplir le montant en lettres");
      return;
    }
    sendRequest(
      `https://localhost:7101/api/admindemandes/valider/${id}`,
      "PUT",
      paymentInfo,
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
          navigate("/admin/demandes");
        })
        .catch(err => alert(err.message));
    }
  };

  const handleUpdate = () => {
    sendRequest(
      `https://localhost:7101/api/admindemandes/update/${id}`,
      "PUT",
      paymentInfo,
      { success: "✅ Demande mise à jour avec succès !", error: "Erreur lors de la mise à jour" }
    );
    setShowModal(false);
  };

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
        <button 
          className="btn btn-export"
          onClick={exportToPDF}
          disabled={!demande}
        >
          📄 Exporter en PDF
        </button>
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
          {demande.utilisateur?.telephone && (
            <div className="info-item">
              <span className="info-label">Téléphone</span>
              <span className="info-value">{demande.utilisateur.telephone}</span>
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
              {demande.demandeItems.map(di => (
                <tr key={di.id}>
                  <td>{di.item.nom}</td>
                  <td>{di.quantite}</td>
                  <td>{di.item.prixUnitaire}DT</td>
                  <td className="total-amount">
                    {(di.quantite * di.item.prixUnitaire).toFixed(2)}DT
                  </td>
                </tr>
              ))}
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
              <label className="form-label">Effectué Par</label>
              <input
                type="text"
                name="effectuePar"
                value={paymentInfo.effectuePar}
                onChange={handleChange}
                className="form-input prefilled"
                placeholder="Ex: toufik"
              />
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
              ✏️ Mettre à Jour les Informations
            </button>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Mettre à Jour le Paiement</h3>
            
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
              <input
                type="text"
                name="effectuePar"
                value={paymentInfo.effectuePar}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleUpdate} className="btn btn-save">
                💾 Enregistrer
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