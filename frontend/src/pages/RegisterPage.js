import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [message, setMessage] = useState('');

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = () => {
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      await register(form.username, form.email, form.password, form.fullName);
      navigate('/');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <h1>Register</h1>
      <form className="narrow" onSubmit={submit}>
        <input value={form.username} onChange={update('username')} placeholder="Username" />
        <input value={form.fullName} onChange={update('fullName')} placeholder="Full name" />
        <input value={form.email} onChange={update('email')} placeholder="Email" type="email" />
        <input value={form.password} onChange={update('password')} placeholder="Password" type="password" />
        <button type="submit">Create account</button>
      </form>
      {message && <p className="error">{message}</p>}
      <p>Already registered? <Link to="/login">Login</Link></p>
    </main>
  );
};

export default RegisterPage;
