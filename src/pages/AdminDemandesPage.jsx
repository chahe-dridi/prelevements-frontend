import React, { useEffect, useState } from 'react';

function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState({
    effectuePar: '',
    comptePaiement: '',
    montantTotal: '',
    montantEnLettres: ''
  });

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
  try {
    const res = await fetch('/api/admindemandes');

    if (!res.ok) {
      // Try to get error text to debug
      const text = await res.text();
      throw new Error(`Erreur serveur: ${res.status} ${res.statusText} - ${text}`);
    }

    // Check content type header to be json before parsing
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Réponse du serveur n\'est pas en JSON');
    }

    const data = await res.json();
    setDemandes(data);
  } catch (err) {
    setMessage(`Erreur chargement demandes: ${err.message}`);
  }
};


  const selectDemande = async (id) => {
    const res = await fetch(`/api/admindemandes/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedDemande(data);
      setPayment({
        effectuePar: '',
        comptePaiement: '',
        montantTotal: '',
        montantEnLettres: ''
      });
      setMessage('');
    }
  };

  const handleStatusChange = async (id, action) => {
    const res = await fetch(`/api/admindemandes/${action}/${id}`, { method: 'PUT' });
    if (res.ok) {
      setMessage(`Demande ${action}ée.`);
      fetchDemandes();
      setSelectedDemande(null);
    } else {
      setMessage('Erreur lors du changement de statut.');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedDemande) return;

    const payload = {
      demandeId: selectedDemande.id,
      effectuePar: payment.effectuePar,
      comptePaiement: payment.comptePaiement,
      montantTotal: parseFloat(payment.montantTotal),
      montantEnLettres: payment.montantEnLettres
    };

    const res = await fetch('/api/admindemandes/paiement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setMessage('Paiement enregistré.');
      fetchDemandes();
      setSelectedDemande(null);
    } else {
      const error = await res.text();
      setMessage('Erreur: ' + error);
    }
  };

  return (
    <div>
      <h2>Demandes en attente</h2>
      {message && <p>{message}</p>}

      <ul>
        {demandes.map(d => (
          <li key={d.id}>
            <button onClick={() => selectDemande(d.id)}>
              {d.utilisateur.nom} {d.utilisateur.prenom} - {d.categorie.nom} - Statut: {d.statut}
            </button>
          </li>
        ))}
      </ul>

      {selectedDemande && (
        <div>
          <h3>Détails de la demande</h3>
          <p><strong>Utilisateur:</strong> {selectedDemande.utilisateur.nom} {selectedDemande.utilisateur.prenom}</p>
          <p><strong>Catégorie:</strong> {selectedDemande.categorie.nom}</p>
          <p><strong>Statut:</strong> {selectedDemande.statut}</p>

          <h4>Items demandés</h4>
          <ul>
            {selectedDemande.demandeItems.map(di => (
              <li key={di.id}>
                {di.item.nom} - Quantité: {di.quantite} - Prix unitaire: {di.item.prixUnitaire}
              </li>
            ))}
          </ul>

          <button onClick={() => handleStatusChange(selectedDemande.id, 'valider')}>Valider</button>
          <button onClick={() => handleStatusChange(selectedDemande.id, 'refuser')}>Refuser</button>

          {selectedDemande.statut === 'Validee' && !selectedDemande.paiement && (
            <>
              <h4>Enregistrer un paiement</h4>
              <input
                type="text"
                placeholder="Effectué par"
                value={payment.effectuePar}
                onChange={e => setPayment({...payment, effectuePar: e.target.value})}
              />
              <input
                type="text"
                placeholder="Compte de paiement"
                value={payment.comptePaiement}
                onChange={e => setPayment({...payment, comptePaiement: e.target.value})}
              />
              <input
                type="number"
                placeholder="Montant total"
                value={payment.montantTotal}
                onChange={e => setPayment({...payment, montantTotal: e.target.value})}
              />
              <input
                type="text"
                placeholder="Montant en lettres"
                value={payment.montantEnLettres}
                onChange={e => setPayment({...payment, montantEnLettres: e.target.value})}
              />
              <button onClick={handlePaymentSubmit}>Enregistrer paiement</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDemandesPage;
