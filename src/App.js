import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UsersAdmin from './components/UsersAdmin';
import NotFound from './components/NotFound';

import ProfilePage from "./pages/ProfilePage";
import DemandePage from './pages/DemandePage';

import AdminDemandesPage from './pages/AdminDemandesPage';
import DemandeDetailsPage from './pages/DemandeDetailsPage';




function App() {
    return (
        <Router>
            <Navbar />
            <div style={{ padding: "20px" }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UsersAdmin />} />
                    <Route path="/profile" element={<ProfilePage />} />

                   <Route path="/admin/demandes" element={<AdminDemandesPage />} />
                   <Route path="/admin/demandes/:id" element={<DemandeDetailsPage />} />




                    <Route path="/demandes" element={<DemandePage />} />
                

                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
