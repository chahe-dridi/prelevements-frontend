import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Footer from './Footer';
import '../assets/Home.css';

function Home() {
    const { token, userEmail } = useContext(AuthContext);

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            Bienvenue sur <span className="brand-name">Prelevements App</span>
                        </h1>
                        <p className="hero-subtitle">
                            Gérez vos demandes de prélèvements en toute simplicité
                        </p>
                        <p className="hero-description">
                            Notre plateforme vous permet de créer, suivre et gérer vos demandes 
                            de prélèvements de manière efficace et intuitive.
                        </p>
                        
                        {!token ? (
                            <div className="hero-actions">
                                <Link to="/register" className="btn btn-primary">
                                    🚀 Commencer
                                </Link>
                                <Link to="/login" className="btn btn-secondary">
                                    🔑 Se connecter
                                </Link>
                            </div>
                        ) : (
                            <div className="hero-actions">
                                <p className="welcome-message">
                                    👋 Bonjour, <strong>{userEmail}</strong>!
                                </p>
                                <Link to="/demandes" className="btn btn-primary">
                                    📝 Nouvelle Demande
                                </Link>
                                <Link to="/demandes/historique" className="btn btn-secondary">
                                    📊 Mon Historique
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="hero-image">
                        <div className="hero-graphic">
                            <div className="graphic-element element-1">📋</div>
                            <div className="graphic-element element-2">✅</div>
                            <div className="graphic-element element-3">🔄</div>
                            <div className="graphic-element element-4">📊</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Fonctionnalités Principales</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📝</div>
                            <h3 className="feature-title">Créer des Demandes</h3>
                            <p className="feature-description">
                                Créez facilement vos demandes de prélèvements avec une interface intuitive
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">👁️</div>
                            <h3 className="feature-title">Suivre l'État</h3>
                            <p className="feature-description">
                                Suivez en temps réel l'état de vos demandes : en attente, validée ou refusée
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">✏️</div>
                            <h3 className="feature-title">Modifier & Annuler</h3>
                            <p className="feature-description">
                                Modifiez ou annulez vos demandes en attente selon vos besoins
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">Historique Complet</h3>
                            <p className="feature-description">
                                Consultez l'historique complet de toutes vos demandes avec pagination
                            </p>
                        </div>
                    </div>
                </div>
            </section>
 

            {/* CTA Section - Only show if not logged in */}
            {!token && (
                <section className="cta-section">
                    <div className="container">
                        <div className="cta-content">
                            <h2 className="cta-title">Prêt à Commencer?</h2>
                            <p className="cta-description">
                                Rejoignez-nous dès aujourd'hui et simplifiez la gestion de vos demandes
                            </p>
                            <div className="cta-actions">
                                <Link to="/register" className="btn btn-primary btn-large">
                                    🎯 Créer un Compte
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Use the reusable Footer component */}
            <Footer />
        </div>
    );
}

export default Home;