import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <h1>Login</h1>
      <form className="narrow" onSubmit={submit}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        <button type="submit">Login</button>
      </form>
      {message && <p className="error">{message}</p>}
      <p>Need an account? <Link to="/register">Register</Link></p>
    </main>
  );
};

export default LoginPage;
