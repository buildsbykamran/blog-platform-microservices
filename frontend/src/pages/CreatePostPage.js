import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPost, updatePost } from '../services/api';

const initialForm = { title: '', content: '', excerpt: '', tags: '', status: 'draft' };

const CreatePostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : ''), [image]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submitWithStatus = (status) => async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      if (editingPost) {
        const updated = await updatePost(editingPost.id || editingPost._id, { ...form, status }, image);
        navigate(`/blog/${updated.data.post.slug}`);
        return;
      }

      const result = await createPost(form.title, form.content, form.excerpt, form.tags, status, image);
      navigate(`/blog/${result.data.post.slug}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <h1>{editingPost ? 'Edit Post' : 'Create Post'}</h1>
      <form>
        <input value={form.title} onChange={update('title')} placeholder="Title" />
        <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0])} />
        <textarea value={form.content} onChange={update('content')} placeholder="Content" />
        <input value={form.excerpt} onChange={update('excerpt')} placeholder="Excerpt" />
        <input value={form.tags} onChange={update('tags')} placeholder="Tags, comma separated" />
        <select value={form.status} onChange={update('status')}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <div className="toolbar">
          <button type="button" onClick={() => setPreview((value) => !value)}>Preview</button>
          <button type="button" className="secondary" onClick={submitWithStatus('draft')}>Save as draft</button>
          <button type="button" onClick={submitWithStatus('published')}>Publish</button>
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

      {message && <p className="error">{message}</p>}
    </main>
  );
};

export default CreatePostPage;
