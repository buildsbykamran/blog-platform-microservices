import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    navigate('/');
  };

  return (
    <header>
      <nav>
        <Link to="/" className="brand">📝 Blog Platform</Link>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/?focus=search" className="nav-link">Search</Link>
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="nav-link nav-user">{user?.username || 'Profile'}</Link>
            <Link to="/my-posts" className="nav-link">My Posts</Link>
            <Link to="/create-post" className="button">Create Post</Link>
            <button type="button" className="secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="button">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
