import React, { useEffect, useMemo, useState } from 'react';
import PostCard from '../components/PostCard';
import { getPosts, searchPosts } from '../services/api';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 6;

const HomePage = () => {
  const toast = useToast();
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
      toast.error(error.message);
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts by title or content" style={{ flex: 1, minWidth: 220 }} />
        <button type="submit">Search</button>
      </form>

      {tags.length > 0 && (
        <select value={tag} onChange={(event) => setTag(event.target.value)} style={{ maxWidth: 220, marginBottom: 24 }}>
          <option value="">All tags</option>
          {tags.map((tagName) => (
            <option key={tagName} value={tagName}>{tagName}</option>
          ))}
        </select>
      )}

      {message && <p className="error">{message}</p>}

      {loading && (
        <section className="post-grid">
          {[1, 2, 3].map((key) => <div key={key} className="skeleton" style={{ height: 260 }} />)}
        </section>
      )}

      {!loading && visiblePosts.length === 0 && !message && (
        <div className="empty-state">
          <h2>No posts found</h2>
          <p>Try a different search term or check back later for new content.</p>
        </div>
      )}

      {!loading && visiblePosts.length > 0 && (
        <section className="post-grid">
          {visiblePosts.map((post) => <PostCard key={post.id || post._id} post={post} />)}
        </section>
      )}

      {!loading && pages > 1 && (
        <div className="pagination">
          <button type="button" className="secondary" disabled={page <= 1} onClick={() => loadPosts(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="secondary" disabled={page >= pages} onClick={() => loadPosts(page + 1)}>Next</button>
        </div>
      )}
    </main>
  );
};

export default HomePage;
