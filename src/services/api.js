import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust port if needed
});

export default api;
