import axios from 'axios';

const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5001/api'
});

const blogApi = axios.create({
  baseURL: process.env.REACT_APP_BLOG_API_URL || 'http://localhost:5002/api'
});

const attachToken = (config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

authApi.interceptors.request.use(attachToken);
blogApi.interceptors.request.use(attachToken);

export { authApi, blogApi };
