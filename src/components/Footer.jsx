import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/Footer.css';

function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3 className="footer-title">Prelevements App</h3>
                        <p className="footer-description">
                            Votre solution complète pour la gestion des demandes de prélèvements.
                        </p>
                        <div className="footer-social">
                            <a 
                                href="mailto:chaher.dridi@esprit.tn" 
                                className="social-link"
                                title="Email"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                📧
                            </a>
                            <a 
                                href="https://www.linkedin.com/in/chaher-dridi-790b72219" 
                                className="social-link"
                                title="LinkedIn"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                💼
                            </a>
                            <a 
                                href="https://github.com/chahe-dridi" 
                                className="social-link"
                                title="GitHub"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                🌐
                            </a>
                        </div>
                    </div>
                    
                    <div className="footer-section">
                        <h4 className="footer-subtitle">Navigation</h4>
                        <div className="footer-links">
                            <Link to="/" className="footer-link">🏠 Accueil</Link>
                            <Link to="/demande" className="footer-link">📝 Nouvelle Demande</Link>
                            <Link to="/demande-history" className="footer-link">📊 Historique</Link>
                        </div>
                    </div>
                    
                    <div className="footer-section">
                        <h4 className="footer-subtitle">Support</h4>
                        <div className="footer-links">
                            <span className="footer-link">📞 +216 XX XXX XXX</span>
                            <a 
                                href="mailto:chaher.dridi@esprit.tn" 
                                className="footer-link"
                            >
                                📧 chaher.dridi@esprit.tn
                            </a>
                            <span className="footer-link">🕒 Lun-Ven: 8h-17h</span>
                        </div>
                    </div>
                    
                    <div className="footer-section">
                        <h4 className="footer-subtitle">Informations</h4>
                        <div className="footer-links">
                            <span className="footer-link">📋 Documentation</span>
                            <span className="footer-link">🔒 Politique de confidentialité</span>
                            <span className="footer-link">⚖️ Conditions d'utilisation</span>
                        </div>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <div className="footer-copyright">
                        <p>&copy; 2024 Prelevements App. Tous droits réservés.</p>
                    </div>
                    <div className="footer-version">
                        <span className="version-badge">v1.0.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;