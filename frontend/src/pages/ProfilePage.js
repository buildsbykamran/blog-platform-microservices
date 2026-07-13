import React, { useState } from 'react';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const nextProfileImage = selectedFile ? profileImage : profileImage;
      await updateProfile(fullName, bio, nextProfileImage);
      toast.success('Profile updated successfully.');
    } catch (error) {
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Profile</h1>
      <section className="profile-summary card">
        {profileImage ? (
          <img src={profileImage} alt={user?.username || 'Profile'} />
        ) : (
          <div className="profile-avatar-fallback">{(user?.username || '?').charAt(0).toUpperCase()}</div>
        )}
        <div>
          <p className="profile-name">{user?.username}</p>
          <p className="meta">{user?.email}</p>
        </div>
      </section>
      <form className="narrow" onSubmit={submit}>
        {message && <p className="error">{message}</p>}
        <div className="field">
          <label htmlFor="profile-fullname">Full name</label>
          <input id="profile-fullname" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
        </div>
        <div className="field">
          <label htmlFor="profile-bio">Bio</label>
          <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell readers about yourself" />
        </div>
        <div className="field">
          <label htmlFor="profile-image-url">Profile image URL</label>
          <input id="profile-image-url" value={profileImage} onChange={(event) => setProfileImage(event.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label htmlFor="profile-image-file">Upload a photo</label>
          <input id="profile-image-file" type="file" accept="image/*" onChange={(event) => setSelectedFile(event.target.files[0])} />
          {selectedFile && <small className="meta">Selected: {selectedFile.name}. Add an S3 upload endpoint to persist this file.</small>}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting && <span className="spinner" />}
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </main>
  );
};

export default ProfilePage;
