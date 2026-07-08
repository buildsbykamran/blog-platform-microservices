import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { authApi, blogApi } from './services/api';

const Home = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    blogApi.get('/posts').then((response) => setPosts(response.data.posts || []));
  }, []);

  return (
    <main>
      <h1>Blog Platform</h1>
      <p>Latest posts from the blog service.</p>
      {posts.map((post) => (
        <article key={post._id}>
          <h2>{post.title}</h2>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} />}
          <p>{post.content}</p>
          <small>By {post.author?.name}</small>
        </article>
      ))}
    </main>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const response = await authApi.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setMessage('Signed in successfully');
  };

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
        />
        <button type="submit">Sign in</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
};

const App = () => (
  <BrowserRouter>
    <nav>
      <Link to="/">Posts</Link>
      <Link to="/login">Login</Link>
    </nav>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </BrowserRouter>
);

export default App;
