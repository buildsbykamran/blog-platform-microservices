import React, { useEffect, useMemo, useState } from 'react';
import PostCard from '../components/PostCard';
import { getPosts, searchPosts } from '../services/api';

const PAGE_SIZE = 6;

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const tags = useMemo(
    () => [...new Set(posts.flatMap((post) => post.tags || []))],
    [posts]
  );

  const visiblePosts = tag ? posts.filter((post) => post.tags?.includes(tag)) : posts;

  const loadPosts = async (nextPage = page) => {
    setLoading(true);
    setMessage('');

    try {
      const result = query.trim().length >= 2
        ? await searchPosts(query)
        : await getPosts(nextPage, PAGE_SIZE, 'published');

      setPosts(result.data.posts || []);
      setPage(result.data.page || nextPage);
      setPages(result.data.pages || 1);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    loadPosts(1);
  };

  return (
    <main>
      <h1>Latest Posts</h1>
      <form className="toolbar" onSubmit={submitSearch}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts" />
        <button type="submit">Search</button>
      </form>

      {tags.length > 0 && (
        <select value={tag} onChange={(event) => setTag(event.target.value)}>
          <option value="">All tags</option>
          {tags.map((tagName) => (
            <option key={tagName} value={tagName}>{tagName}</option>
          ))}
        </select>
      )}

      {message && <p className="error">{message}</p>}
      {loading && <p className="message">Loading posts...</p>}
      <section className="post-grid">
        {!loading && visiblePosts.map((post) => <PostCard key={post.id || post._id} post={post} />)}
      </section>

      <div className="pagination">
        <button type="button" disabled={page <= 1} onClick={() => loadPosts(page - 1)}>Previous</button>
        <span> Page {page} of {pages} </span>
        <button type="button" disabled={page >= pages} onClick={() => loadPosts(page + 1)}>Next</button>
      </div>
    </main>
  );
};

export default HomePage;
