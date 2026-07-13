import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import BlogPostPage from './pages/BlogPostPage';
import CreatePostPage from './pages/CreatePostPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MyPostsPage from './pages/MyPostsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

const Footer = () => (
  <footer>
    <small>&copy; {new Date().getFullYear()} Blog Platform Microservices</small>
  </footer>
);

const AppRoutes = () => (
  <>
    <Header />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/profile"
        element={(
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/create-post"
        element={(
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/my-posts"
        element={(
          <ProtectedRoute>
            <MyPostsPage />
          </ProtectedRoute>
        )}
      />
    </Routes>
    <Footer />
  </>
);

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
