import axios from 'axios';

  // Change to your backend URL
const API_URL = "https://localhost:7101/api/Auth";

export const registerUser = async (nom, prenom, email, password) => {
    return await axios.post(`${API_URL}/register`, { nom, prenom, email, password });
};

export const loginUser = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    if (res.data.token) {
        localStorage.setItem("token", res.data.token);
    }
    return res.data;
};

export const logoutUser = () => {
    localStorage.removeItem("token");
};
