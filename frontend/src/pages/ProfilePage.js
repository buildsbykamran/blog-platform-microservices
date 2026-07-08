import React, { useState } from 'react';
import { updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const nextProfileImage = selectedFile ? profileImage : profileImage;
      await updateProfile(fullName, bio, nextProfileImage);
      setMessage('Profile updated');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <h1>Profile</h1>
      <section className="profile-summary card">
        {profileImage && <img src={profileImage} alt={user?.username || 'Profile'} />}
        <p>{user?.username}</p>
        <p>{user?.email}</p>
      </section>
      <form className="narrow" onSubmit={submit}>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Bio" />
        <input value={profileImage} onChange={(event) => setProfileImage(event.target.value)} placeholder="Profile image URL" />
        <input type="file" accept="image/*" onChange={(event) => setSelectedFile(event.target.files[0])} />
        {selectedFile && <small className="meta">Selected: {selectedFile.name}. Add an S3 upload endpoint to persist this file.</small>}
        <button type="submit">Save</button>
      </form>
      {message && <p className="message">{message}</p>}
    </main>
  );
};

export default ProfilePage;
