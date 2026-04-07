import axios from 'axios';

const client = axios.create({
  baseURL: 'https://nearcharge-backend.onrender.com',
  headers: { 'Content-Type': 'application/json' }
});

export default client;
