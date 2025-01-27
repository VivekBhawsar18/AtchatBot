// src/axiosConfig.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://atchatbot.pythonanywhere.com', // Change this to your backend URL
    headers: {
        'Content-Type': 'application/json'
    }
});

export default instance;
