import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { ApiError } from '../types/auth';

const EditProfilePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const res = await apiFetch('/user');
        if (!res.ok) throw new Error('Could not load your profile');
        const data = await res.json();
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setBio(data.bio ?? '');
        setUsername(data.username ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await apiFetch('/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          username: username.trim(),
        }),
      });
      if (!res.ok) {
        const errorData: ApiError = await res.json().catch(() => ({ detail: 'Could not save your profile' }));
        throw new Error(
          typeof errorData.detail === 'string'
            ? errorData.detail
            : errorData.detail[0]?.msg || 'Could not save your profile'
        );
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-paper rounded-sm border border-rule">
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <p className="mt-2 text-sm text-gray-600">
        This is the name and bio other people see on your comments and courses.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}
      {saved && (
        <p className="mt-4 text-sm text-pencil">Saved.</p>
      )}

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            First name
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Last name
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper"
            />
          </label>
        </div>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper"
          />
        </label>

        <label className="flex flex-col text-sm font-medium text-gray-700">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 px-3 py-2 border border-rule rounded-sm bg-paper"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-pencil hover:bg-pencil-dark text-white rounded-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
        <Link to="/profile" className="text-sm text-pencil hover:underline">
          Back to profile
        </Link>
      </div>
    </div>
  );
};

export default EditProfilePage;
