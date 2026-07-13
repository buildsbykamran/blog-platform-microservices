import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { deletePost, getPostsByAuthor } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 10;

const MyPostsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadPosts = async (nextPage = page) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const result = await getPostsByAuthor(user.id, nextPage, PAGE_SIZE, 'all');
      setPosts(result.data.posts || []);
      setTotal(result.data.total || 0);
      setPage(result.data.page || nextPage);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [user]);

  const removePost = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingId(postId);

    try {
      await deletePost(postId);
      toast.success('Post deleted.');
      loadPosts(page);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main>
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Posts</h1>
        <button type="button" onClick={() => navigate('/create-post')}>+ Create new post</button>
      </div>
      {message && <p className="error">{message}</p>}

      {loading && (
        <section className="post-grid">
          {[1, 2, 3].map((key) => <div key={key} className="skeleton" style={{ height: 260 }} />)}
        </section>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <h2>No posts yet</h2>
          <p>You haven&apos;t written anything yet. Start sharing your ideas with the world.</p>
          <button type="button" onClick={() => navigate('/create-post')}>Create your first post</button>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <>
          <section className="post-grid">
            {posts.map((post) => (
              <PostCard
                key={post.id || post._id}
                post={post}
                actions={(
                  <>
                    <span className={`status-badge status-${post.status || 'draft'}`}>{post.status || 'draft'}</span>
                    <Link className="button secondary" to="/create-post" state={{ post }}>Edit</Link>
                    <button
                      className="danger"
                      type="button"
                      disabled={deletingId === (post.id || post._id)}
                      onClick={() => removePost(post.id || post._id)}
                    >
                      {deletingId === (post.id || post._id) ? <span className="spinner" /> : 'Delete'}
                    </button>
                  </>
                )}
              />
            ))}
          </section>
          <div className="pagination">
            <button type="button" className="secondary" disabled={page <= 1} onClick={() => loadPosts(page - 1)}>Previous</button>
            <span>Page {page}</span>
            <button type="button" className="secondary" disabled={page * PAGE_SIZE >= total} onClick={() => loadPosts(page + 1)}>Next</button>
          </div>
        </>
      )}
    </main>
  );
};

export default MyPostsPage;
