import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'authToken';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Request failed';

    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    const normalizedError = new Error(message);
    normalizedError.status = status;
    normalizedError.data = error.response?.data;
    throw normalizedError;
  }
);

const unwrap = (response) => ({
  success: true,
  data: response.data?.data || response.data
});

const toFormData = (payload, image) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, Array.isArray(value) ? value.join(',') : value);
    }
  });

  if (image) {
    formData.append('featuredImage', image);
  }

  return formData;
};

export const register = async (username, email, password, fullName) =>
  unwrap(await api.post('/auth/register', { username, email, password, fullName }));

export const login = async (email, password) => {
  const result = unwrap(await api.post('/auth/login', { email, password }));
  const token = result.data?.token;

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  return result;
};

export const getProfile = async () => unwrap(await api.get('/auth/profile'));

export const updateProfile = async (fullName, bio, profileImage) =>
  unwrap(await api.put('/auth/profile', { fullName, bio, profileImage }));

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return { success: true, data: {} };
};

export const createPost = async (title, content, excerpt, tags, status, image) =>
  unwrap(
    await api.post('/posts', toFormData({ title, content, excerpt, tags, status }, image), {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  );

export const getPosts = async (page = 1, limit = 10, status = 'published') =>
  unwrap(await api.get('/posts', { params: { page, limit, status } }));

export const getPostBySlug = async (slug) => unwrap(await api.get(`/posts/${slug}`));

export const updatePost = async (postId, data, image) =>
  unwrap(
    await api.put(`/posts/${postId}`, toFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  );

export const deletePost = async (postId) => unwrap(await api.delete(`/posts/${postId}`));

export const searchPosts = async (query) => unwrap(await api.get('/posts/search', { params: { q: query } }));

export const getPostsByAuthor = async (authorId, page = 1, limit = 10, status) =>
  unwrap(await api.get(`/posts/author/${authorId}`, { params: { page, limit, status } }));

export const createComment = async (postId, content) =>
  unwrap(await api.post(`/posts/${postId}/comments`, { content }));

export const getCommentsByPost = async (postId, page = 1, limit = 10) =>
  unwrap(await api.get(`/posts/${postId}/comments`, { params: { page, limit } }));

export const updateComment = async (commentId, content) =>
  unwrap(await api.put(`/comments/${commentId}`, { content }));

export const deleteComment = async (commentId) => unwrap(await api.delete(`/comments/${commentId}`));

export { api, AUTH_TOKEN_KEY };
