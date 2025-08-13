import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DemandeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    comptePaiement: "",
    montantEnLettres: ""
  });

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
        setPaymentInfo({
          comptePaiement: data.paiement?.comptePaiement || "",
          montantEnLettres: data.paiement?.montantEnLettres || ""
        });
        setLoading(false);
      })
      .catch(err => console.error("Erreur chargement demande:", err));
  }, [id, token]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAccept = () => {
    fetch(`https://localhost:7101/api/admindemandes/valider/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentInfo)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la validation");
        alert("Demande acceptée !");
        navigate("/admin/demandes");
      })
      .catch(err => alert(err.message));
  };

  const handleRefuse = () => {
    fetch(`https://localhost:7101/api/admindemandes/refuser/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors du refus");
        alert("Demande refusée !");
        navigate("/admin/demandes");
      })
      .catch(err => alert(err.message));
  };

  const handleUpdate = () => {
    fetch(`https://localhost:7101/api/admindemandes/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(paymentInfo)
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la mise à jour");
        alert("Demande mise à jour !");
        setShowModal(false);
        navigate("/admin/demandes");
      })
      .catch(err => alert(err.message));
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Détails de la Demande</h2>
      <p><strong>Statut :</strong> {demande.statut}</p>
      <p><strong>Catégorie :</strong> {demande.categorie?.nom}</p>
      <p><strong>Client :</strong> {demande.utilisateur?.prenom} {demande.utilisateur?.nom}</p>
      <p><strong>Items :</strong></p>
      <ul>
        {demande.demandeItems?.map(di => (
          <li key={di.id}>
            {di.item.nom} — {di.quantite} × {di.item.prixUnitaire}€
          </li>
        ))}
      </ul>

      <h3>Paiement</h3>
      {demande.paiement ? (
        <>
          <p><strong>Montant Total :</strong> {demande.paiement.montantTotal}€</p>
          <p><strong>Compte Paiement :</strong> {demande.paiement.comptePaiement}</p>
          <p><strong>Montant en Lettres :</strong> {demande.paiement.montantEnLettres}</p>
          <p><strong>Effectué par :</strong> {demande.paiement.effectuePar}</p>
          <p><strong>Date :</strong> {new Date(demande.paiement.datePaiement).toLocaleString()}</p>
        </>
      ) : <p>Aucun paiement enregistré</p>}

      {demande.statut === "EnAttente" && (
        <>
          <label>Compte Paiement:</label>
          <input type="text" name="comptePaiement" value={paymentInfo.comptePaiement} onChange={handleChange} />
          <br />
          <label>Montant en Lettres:</label>
          <input type="text" name="montantEnLettres" value={paymentInfo.montantEnLettres} onChange={handleChange} />
          <br />
          <button onClick={handleAccept} style={{ marginRight: "10px", background: "green", color: "white" }}>✅ Accepter</button>
          <button onClick={handleRefuse} style={{ background: "red", color: "white" }}>❌ Refuser</button>
        </>
      )}

      {(demande.statut === "Validee" || demande.statut === "Refusee") && (
        <button onClick={() => setShowModal(true)} style={{ background: "orange", color: "white" }}>✏️ Mettre à jour</button>
      )}

      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
            <h3>Mettre à jour le paiement</h3>
            <label>Compte Paiement:</label>
            <input type="text" name="comptePaiement" value={paymentInfo.comptePaiement} onChange={handleChange} />
            <br />
            <label>Montant en Lettres:</label>
            <input type="text" name="montantEnLettres" value={paymentInfo.montantEnLettres} onChange={handleChange} />
            <br />
            <button onClick={handleUpdate} style={{ background: "green", color: "white", marginRight: "10px" }}>💾 Enregistrer</button>
            <button onClick={() => setShowModal(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
