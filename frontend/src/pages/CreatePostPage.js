import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPost, updatePost } from '../services/api';
import { useToast } from '../context/ToastContext';

const initialForm = { title: '', content: '', excerpt: '', tags: '', status: 'draft' };

const CreatePostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const editingPost = location.state?.post;
  const [form, setForm] = useState(() => editingPost ? {
    title: editingPost.title || '',
    content: editingPost.content || '',
    excerpt: editingPost.excerpt || '',
    tags: (editingPost.tags || []).join(', '),
    status: editingPost.status || 'draft'
  } : initialForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submitWithStatus = (status) => async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setMessage('Title and content are required.');
      return;
    }

    setMessage('');
    setSubmitting(true);

    try {
      if (editingPost) {
        const updated = await updatePost(editingPost.id || editingPost._id, { ...form, status }, image);
        toast.success(status === 'published' ? 'Post updated and published.' : 'Post updated.');
        navigate(`/blog/${updated.data.post.slug}`);
        return;
      }

      const result = await createPost(form.title, form.content, form.excerpt, form.tags, status, image);
      toast.success(status === 'published' ? 'Post published!' : 'Draft saved.');
      navigate(`/blog/${result.data.post.slug}`);
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>{editingPost ? 'Edit Post' : 'Create Post'}</h1>
      <form>
        {message && <p className="error">{message}</p>}
        <div className="field">
          <label htmlFor="post-title">Title</label>
          <input id="post-title" value={form.title} onChange={update('title')} placeholder="Give your post a title" required />
        </div>
        <div className="field">
          <label htmlFor="post-image">Featured image</label>
          <input id="post-image" type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0])} />
        </div>
        <div className="field">
          <label htmlFor="post-content">Content</label>
          <textarea id="post-content" value={form.content} onChange={update('content')} placeholder="Write your post..." required />
        </div>
        <div className="field">
          <label htmlFor="post-excerpt">Excerpt</label>
          <input id="post-excerpt" value={form.excerpt} onChange={update('excerpt')} placeholder="Short summary shown on the post list" />
        </div>
        <div className="field">
          <label htmlFor="post-tags">Tags</label>
          <input id="post-tags" value={form.tags} onChange={update('tags')} placeholder="e.g. tech, travel, food" />
        </div>
        <div className="field">
          <label htmlFor="post-status">Status</label>
          <select id="post-status" value={form.status} onChange={update('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="toolbar">
          <button type="button" className="ghost" onClick={() => setPreview((value) => !value)}>
            {preview ? 'Hide preview' : 'Preview'}
          </button>
          <button type="button" className="secondary" onClick={submitWithStatus('draft')} disabled={submitting}>
            {submitting && <span className="spinner dark" />}
            Save as draft
          </button>
          <button type="button" onClick={submitWithStatus('published')} disabled={submitting}>
            {submitting && <span className="spinner" />}
            Publish
          </button>
        </div>
      </form>

      {preview && (
        <article className="post-card">
          {imagePreview && <img src={imagePreview} alt={form.title} />}
          <h2>{form.title || 'Untitled post'}</h2>
          <p>{form.excerpt}</p>
          <div className="post-content">{form.content}</div>
          <small className="tag-list">{form.tags}</small>
        </article>
      )}
    </main>
  );
};

export default CreatePostPage;
