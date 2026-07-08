import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header>
      <nav>
        <Link to="/">Blog Platform</Link>
        <Link to="/">Home</Link>
        <Link to="/?focus=search">Search</Link>
        {isAuthenticated ? (
          <>
            <Link to="/profile">{user?.username || 'Profile'}</Link>
            <Link to="/my-posts">My Posts</Link>
            <Link to="/create-post">Create Post</Link>
            <button type="button" className="secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
