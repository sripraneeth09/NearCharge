import axios from 'axios';

const client = axios.create({
  baseURL: 'https://near-charge-api.onrender.com', // Updated to latest Render URL as requested
  headers: { 'Content-Type': 'application/json' }
});

export default client;
