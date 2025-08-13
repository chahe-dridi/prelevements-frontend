import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDemandesPage() {
  const [demandes, setDemandes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const res = await fetch("https://localhost:7101/api/admindemandes", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setDemandes(data);
    } catch (err) {
      setError("Erreur chargement demandes: " + err.message);
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Liste des demandes</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Date Demande</th>
            <th>Destination</th>
            <th>Mission</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((d) => (
            <tr key={d.id}>
              <td>{d.utilisateur.nom}</td>
              <td>{d.utilisateur.prenom}</td>
              <td>{d.categorie.nom}</td>
              <td>{d.statut}</td>
              <td>{new Date(d.dateDemande).toLocaleDateString()}</td>
              <td>{d.destination || "—"}</td>
              <td>{d.mission || "—"}</td>
              <td>
                <button onClick={() => navigate(`/admin/demandes/${d.id}`)}>
                  Voir détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

 

      
    </div>




  );
}
