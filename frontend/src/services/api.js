import axios from 'axios';

const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';
const BLOG_API_URL = process.env.REACT_APP_BLOG_URL || 'http://localhost:3002';
const AUTH_TOKEN_KEY = 'authToken';

const createApiClient = (baseURL) => axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const authApi = createApiClient(AUTH_API_URL);
const blogApi = createApiClient(BLOG_API_URL);

const attachRequestInterceptor = (client) => client.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

attachRequestInterceptor(authApi);
attachRequestInterceptor(blogApi);

const handleResponse = (response) => response;
const handleResponseError = (error) => {
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
};

authApi.interceptors.response.use(handleResponse, handleResponseError);
blogApi.interceptors.response.use(handleResponse, handleResponseError);

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
  unwrap(await authApi.post('/auth/register', { username, email, password, fullName }));

export const login = async (email, password) => {
  const result = unwrap(await authApi.post('/auth/login', { email, password }));
  const token = result.data?.token;

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  return result;
};

export const getProfile = async () => unwrap(await authApi.get('/auth/profile'));

export const updateProfile = async (fullName, bio, profileImage) =>
  unwrap(await authApi.put('/auth/profile', { fullName, bio, profileImage }));

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return { success: true, data: {} };
};

export const createPost = async (title, content, excerpt, tags, status, image) =>
  unwrap(
    await blogApi.post('/api/posts', toFormData({ title, content, excerpt, tags, status }, image), {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  );

export const getPosts = async (page = 1, limit = 10, status = 'published') =>
  unwrap(await blogApi.get('/api/posts', { params: { page, limit, status } }));

export const getPostBySlug = async (slug) => unwrap(await blogApi.get(`/api/posts/${slug}`));

export const updatePost = async (postId, data, image) =>
  unwrap(
    await blogApi.put(`/api/posts/${postId}`, toFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  );

export const deletePost = async (postId) => unwrap(await blogApi.delete(`/api/posts/${postId}`));

export const searchPosts = async (query) => unwrap(await blogApi.get('/api/posts/search', { params: { q: query } }));

export const getPostsByAuthor = async (authorId, page = 1, limit = 10, status) =>
  unwrap(await blogApi.get(`/api/posts/author/${authorId}`, { params: { page, limit, status } }));

export const createComment = async (postId, content) =>
  unwrap(await blogApi.post(`/api/posts/${postId}/comments`, { content }));

export const getCommentsByPost = async (postId, page = 1, limit = 10) =>
  unwrap(await blogApi.get(`/api/posts/${postId}/comments`, { params: { page, limit } }));

export const updateComment = async (commentId, content) =>
  unwrap(await blogApi.put(`/api/comments/${commentId}`, { content }));

export const deleteComment = async (commentId) => unwrap(await blogApi.delete(`/api/comments/${commentId}`));

export { authApi, blogApi, AUTH_TOKEN_KEY };
