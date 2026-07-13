import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createComment, getPostBySlug } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const formatDate = (date) => (date ? new Date(date).toLocaleString() : '');

const BlogPostPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPostBySlug(slug)
      .then((result) => {
        setPost(result.data.post);
        setComments(result.data.comments || []);
      })
      .catch((error) => {
        setMessage(error.message);
        toast.error(error.message);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitComment = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      setCommentMessage('Comment cannot be empty.');
      return;
    }

    setCommentMessage('');
    setSubmittingComment(true);

    try {
      const result = await createComment(post.id, content);
      setComments((current) => [result.data.comment || result.data, ...current]);
      setContent('');
      toast.success('Comment posted.');
    } catch (error) {
      setCommentMessage(error.message);
      toast.error(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <main>
        <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 280, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 100 }} />
      </main>
    );
  }

  if (message) {
    return (
      <main>
        <div className="empty-state">
          <h2>Post not found</h2>
          <p className="error" style={{ display: 'inline-flex', marginTop: 8 }}>{message}</p>
          <p style={{ marginTop: 16 }}><Link to="/">← Back to all posts</Link></p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        {post.featuredImage && <img src={post.featuredImage} alt={post.title} />}
        <p className="meta">
          By <Link to={`/posts/author/${post.authorId}`}>{post.authorName}</Link>
          {' '}on {formatDate(post.publishedAt || post.createdAt)}
        </p>
        <p className="meta">{post.viewCount || 0} views</p>
        <div className="post-content">{post.content}</div>
      </article>

      <section className="comments">
        <h2>Comments ({comments.length})</h2>
        {isAuthenticated ? (
          <form onSubmit={submitComment}>
            {commentMessage && <p className="error">{commentMessage}</p>}
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength="1000"
              placeholder="Share your thoughts..."
            />
            <button type="submit" disabled={submittingComment} style={{ justifySelf: 'start' }}>
              {submittingComment && <span className="spinner" />}
              {submittingComment ? 'Posting...' : 'Add comment'}
            </button>
          </form>
        ) : (
          <p><Link to="/login">Login</Link> to join the conversation.</p>
        )}
        {comments.length === 0 && <p className="meta">No comments yet. Be the first to share your thoughts.</p>}
        {comments.map((comment) => (
          <article className="comment" key={comment.id || comment._id}>
            <p>{comment.content}</p>
            <small className="meta">{comment.authorName} on {formatDate(comment.createdAt)}</small>
          </article>
        ))}
      </section>
    </main>
  );
};

export default BlogPostPage;
