// src/components/NotFound.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Simulate user role (replace with real auth logic)
    const isAdmin = localStorage.getItem('role') === 'admin';

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [isAdmin, navigate]);

    return (
        <div style={{
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            {loading ? (
                <>
                    <div style={{
                        border: '8px solid #f3f3f3',
                        borderTop: '8px solid #3498db',
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                    <h2 style={{ marginTop: 20 }}>Redirecting...</h2>
                    <p>Please wait while we redirect you to the appropriate page.</p>
                </>
            ) : (
                <>
                    <h1>404 - Not Found</h1>
                    <p>The page you are looking for does not exist or you don't have permission to view it.</p>
                </>
            )}
        </div>
    );
}

export default NotFound;
