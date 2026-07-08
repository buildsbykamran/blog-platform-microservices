import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { deletePost, getPostsByAuthor } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

const MyPostsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');

  const loadPosts = async (nextPage = page) => {
    if (!user?.id) return;

    try {
      const result = await getPostsByAuthor(user.id, nextPage, PAGE_SIZE, 'all');
      setPosts(result.data.posts || []);
      setTotal(result.data.total || 0);
      setPage(result.data.page || nextPage);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [user]);

  const removePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      await deletePost(postId);
      loadPosts(page);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <h1>My Posts</h1>
      <button type="button" onClick={() => navigate('/create-post')}>Create new post</button>
      {message && <p className="error">{message}</p>}
      <section className="post-grid">
        {posts.map((post) => (
          <PostCard
            key={post.id || post._id}
            post={post}
            actions={(
              <>
                <span className="meta">{post.status}</span>
                <Link className="button secondary" to="/create-post" state={{ post }}>Edit</Link>
                <button className="danger" type="button" onClick={() => removePost(post.id || post._id)}>Delete</button>
              </>
            )}
          />
        ))}
      </section>
      <div className="pagination">
        <button type="button" disabled={page <= 1} onClick={() => loadPosts(page - 1)}>Previous</button>
        <span> Page {page} </span>
        <button type="button" disabled={page * PAGE_SIZE >= total} onClick={() => loadPosts(page + 1)}>Next</button>
      </div>
    </main>
  );
};

export default MyPostsPage;
