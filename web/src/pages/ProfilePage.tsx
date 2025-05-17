import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { ApiError } from '../types/auth';

interface ExtendedUser {
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
}

const ProfilePage: React.FC = () => {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData: ApiError = await response.json();
          throw new Error(
            typeof errorData.detail === 'string' 
              ? errorData.detail 
              : errorData.detail[0]?.msg || 'Failed to fetch profile'
          );
        }

        const data: ExtendedUser = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-4 mb-6">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
            {profile?.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.username || profile?.email}
          </h1>
          <p className="text-gray-600">{profile?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {profile?.bio && (
          <div>
            <h2 className="text-lg font-semibold">About</h2>
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">First Name</h2>
            <p className="text-gray-700">{profile?.first_name || 'Not set'}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Last Name</h2>
            <p className="text-gray-700">{profile?.last_name || 'Not set'}</p>
          </div>
        </div>

        {profile?.username && (
          <div>
            <h2 className="text-lg font-semibold">Username</h2>
            <p className="text-gray-700">{profile.username}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex space-x-4">
        <button
          onClick={() => navigate('/edit-profile')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Edit Profile
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;