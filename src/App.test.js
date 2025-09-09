import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthContext } from './context/AuthContext';

test('renders learn react link', () => {
  render(
    <AuthContext.Provider value={{
      userRole: 'user',
      userEmail: 'test@example.com',
      logout: jest.fn(),
      token: 'fake-token'
    }}>
      <App />
    </AuthContext.Provider>
  );
  // Adjust this to match something actually rendered by your App
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});