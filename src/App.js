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



                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
