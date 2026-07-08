import React from 'react';
import { Link } from 'react-router-dom';

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Unpublished');

const truncate = (value = '', length = 100) =>
  value.length > length ? `${value.slice(0, length).trim()}...` : value;

const PostCard = ({ post, actions }) => (
  <article className="post-card">
    {post.featuredImage && <img src={post.featuredImage} alt={post.title} />}
    <h2>
      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
    </h2>
    <p>{truncate(post.excerpt || post.content || '')}</p>
    <small className="meta">
      By {post.authorName || 'Unknown author'} on {formatDate(post.publishedAt || post.createdAt)}
    </small>
    {post.tags?.length > 0 && <p className="tag-list">{post.tags.map((tag) => `#${tag}`).join(' ')}</p>}
    {actions && <div className="actions">{actions}</div>}
  </article>
);

export default PostCard;
