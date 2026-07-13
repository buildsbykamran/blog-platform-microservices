import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/');
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Login</h1>
      <form className="narrow" onSubmit={submit}>
        {message && <p className="error">{message}</p>}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting && <span className="spinner" />}
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Need an account? <Link to="/register">Register</Link></p>
    </main>
  );
};

export default LoginPage;
