import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = () => {
    const errors = {};
    if (form.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address';
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    return errors;
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      await register(form.username, form.email, form.password, form.fullName);
      toast.success('Account created! You can now log in.');
      navigate('/login');
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Create your account</h1>
      <form className="narrow" onSubmit={submit}>
        {message && <p className="error">{message}</p>}
        <div className="field">
          <label htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            className={fieldErrors.username ? 'input-error' : ''}
            value={form.username}
            onChange={update('username')}
            placeholder="janedoe"
            required
          />
          {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
        </div>
        <div className="field">
          <label htmlFor="reg-fullname">Full name</label>
          <input id="reg-fullname" value={form.fullName} onChange={update('fullName')} placeholder="Jane Doe" />
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            className={fieldErrors.email ? 'input-error' : ''}
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            type="email"
            required
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            className={fieldErrors.password ? 'input-error' : ''}
            value={form.password}
            onChange={update('password')}
            placeholder="At least 6 characters"
            type="password"
            required
          />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting && <span className="spinner" />}
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </main>
  );
};

export default RegisterPage;
