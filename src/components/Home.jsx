import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Footer from './Footer';
import '../assets/Home.css';

function Home() {
    const { token, userEmail } = useContext(AuthContext);

    return (
        <div className="home-container">
            {/* Header */}
            <div className="home-header">
                <h1 className="home-title">
                    🏠 Système de Gestion des Prélèvements
                </h1>
                <p className="home-subtitle">
                    Plateforme moderne pour la gestion efficace de vos demandes de prélèvements
                </p>
            </div>

            {/* Main Content */}
            <div className="home-content">
                {/* Welcome Section */}
                <div className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            {!token ? (
                                <>🎯 Bienvenue sur Prelevements App</>
                            ) : (
                                <>👋 Bonjour, {userEmail}</>
                            )}
                        </h2>
                        <p className="section-description">
                            {!token ? (
                                "Découvrez notre plateforme intuitive pour gérer vos demandes de prélèvements en toute simplicité"
                            ) : (
                                "Gérez vos demandes de prélèvements efficacement avec notre interface moderne"
                            )}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        {!token ? (
                            <>
                                <Link to="/register" className="action-card primary">
                                    <div className="action-icon">🚀</div>
                                    <div className="action-content">
                                        <h3>Créer un Compte</h3>
                                        <p>Rejoignez notre plateforme en quelques clics</p>
                                    </div>
                                </Link>
                                <Link to="/login" className="action-card secondary">
                                    <div className="action-icon">🔑</div>
                                    <div className="action-content">
                                        <h3>Se Connecter</h3>
                                        <p>Accédez à votre espace personnel</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/demandes" className="action-card primary">
                                    <div className="action-icon">📝</div>
                                    <div className="action-content">
                                        <h3>Nouvelle Demande</h3>
                                        <p>Créer une nouvelle demande de prélèvement</p>
                                    </div>
                                </Link>
                                <Link to="/demandes/historique" className="action-card secondary">
                                    <div className="action-icon">📊</div>
                                    <div className="action-content">
                                        <h3>Mon Historique</h3>
                                        <p>Consulter l'historique de mes demandes</p>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">⭐ Fonctionnalités Principales</h2>
                        <p className="section-description">
                            Découvrez toutes les fonctionnalités qui facilitent la gestion de vos demandes
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-header">
                                <div className="feature-icon">📝</div>
                                <h3 className="feature-title">Création Intuitive</h3>
                            </div>
                            <div className="feature-content">
                                <p className="feature-description">
                                    Interface moderne pour créer facilement vos demandes de prélèvements
                                </p>
                                <div className="feature-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Formulaire simplifié</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Validation en temps réel</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-header">
                                <div className="feature-icon">👁️</div>
                                <h3 className="feature-title">Suivi en Temps Réel</h3>
                            </div>
                            <div className="feature-content">
                                <p className="feature-description">
                                    Suivez l'état de vos demandes : en attente, validée ou refusée
                                </p>
                                <div className="feature-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Notifications</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Statuts visuels</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-header">
                                <div className="feature-icon">✏️</div>
                                <h3 className="feature-title">Gestion Flexible</h3>
                            </div>
                            <div className="feature-content">
                                <p className="feature-description">
                                    Modifiez ou annulez vos demandes en attente selon vos besoins
                                </p>
                                <div className="feature-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Modification</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Annulation</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-header">
                                <div className="feature-icon">📊</div>
                                <h3 className="feature-title">Historique Complet</h3>
                            </div>
                            <div className="feature-content">
                                <p className="feature-description">
                                    Consultez l'historique complet de toutes vos demandes avec pagination
                                </p>
                                <div className="feature-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Recherche avancée</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Export des données</span>
                                        <span className="stat-value">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section - Only show if logged in */}
                {token && (
                    <div className="home-section">
                        <div className="section-header">
                            <h2 className="section-title">📈 Aperçu Rapide</h2>
                            <p className="section-description">
                                Vue d'ensemble de votre activité sur la plateforme
                            </p>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <h3>Demandes Actives</h3>
                                    <p className="stat-number">-</p>
                                    <p className="stat-description">En cours de traitement</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <h3>Demandes Validées</h3>
                                    <p className="stat-number">-</p>
                                    <p className="stat-description">Ce mois-ci</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">⏱️</div>
                                <div className="stat-info">
                                    <h3>Temps Moyen</h3>
                                    <p className="stat-number">-</p>
                                    <p className="stat-description">De traitement</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">🎯</div>
                                <div className="stat-info">
                                    <h3>Taux de Succès</h3>
                                    <p className="stat-number">-</p>
                                    <p className="stat-description">Sur 30 jours</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Section */}
                <div className="home-section">
                    <div className="section-header">
                        <h2 className="section-title">❓ Besoin d'Aide ?</h2>
                        <p className="section-description">
                            Ressources et guides pour vous accompagner dans l'utilisation de la plateforme
                        </p>
                    </div>

                    <div className="help-grid">
                        <div className="help-card">
                            <div className="help-icon">📚</div>
                            <h4>Guide d'Utilisation</h4>
                            <p>Apprenez à utiliser toutes les fonctionnalités de la plateforme</p>
                        </div>

                        <div className="help-card">
                            <div className="help-icon">🔧</div>
                            <h4>Support Technique</h4>
                            <p>Contactez notre équipe pour résoudre vos problèmes techniques</p>
                        </div>

                        <div className="help-card">
                            <div className="help-icon">💡</div>
                            <h4>Conseils & Astuces</h4>
                            <p>Découvrez des conseils pour optimiser votre utilisation</p>
                        </div>

                        <div className="help-card">
                            <div className="help-icon">📞</div>
                            <h4>Nous Contacter</h4>
                            <p>Une question ? Notre équipe est là pour vous aider</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Use the reusable Footer component */}
            <Footer />
        </div>
    );
}

export default Home;