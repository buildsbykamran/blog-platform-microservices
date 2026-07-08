import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createComment, getPostBySlug } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatDate = (date) => (date ? new Date(date).toLocaleString() : '');

const BlogPostPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [commentMessage, setCommentMessage] = useState('');

  useEffect(() => {
    getPostBySlug(slug)
      .then((result) => {
        setPost(result.data.post);
        setComments(result.data.comments || []);
      })
      .catch((error) => setMessage(error.message));
  }, [slug]);

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentMessage('');

    try {
      const result = await createComment(post.id, content);
      setComments((current) => [result.data.comment || result.data, ...current]);
      setContent('');
    } catch (error) {
      setCommentMessage(error.message);
    }
  };

  if (message) return <main><p className="error">{message}</p></main>;
  if (!post) return <main><p className="message">Loading...</p></main>;

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
        <h2>Comments</h2>
        {isAuthenticated ? (
          <form onSubmit={submitComment}>
            <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength="1000" />
            <button type="submit">Add comment</button>
          </form>
        ) : (
          <p><Link to="/login">Login</Link> to comment.</p>
        )}
        {commentMessage && <p className="error">{commentMessage}</p>}
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
