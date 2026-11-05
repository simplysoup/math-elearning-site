import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
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

interface EnrolledCourse {
  course_id: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  enrolled_at?: string | null;
  last_accessed?: string | null;
}

const ProfilePage: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiFetch('/user');

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

        const coursesRes = await apiFetch('/me/courses');
        if (coursesRes.ok) {
          setCourses(await coursesRes.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pencil"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-paper rounded-sm border border-rule">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-pencil text-white rounded-sm hover:bg-pencil-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-paper rounded-sm border border-rule">
      <div className="flex items-center space-x-4 mb-6">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-rule flex items-center justify-center text-2xl font-bold text-ink">
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">My courses</h2>
        {courses.length === 0 ? (
          <p className="text-gray-600 text-sm">
            You're not enrolled in any courses yet. Finish a lesson and it
            will show up here with your progress.
          </p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="border border-rule rounded-sm p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/courses/${course.course_id}`)}
              >
                <div className="flex justify-between items-baseline gap-4">
                  <h3 className="font-medium">{course.title}</h3>
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {course.completed_lessons}/{course.total_lessons} lessons · {course.progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-rule overflow-hidden">
                  <div
                    className="h-full bg-pencil"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                {course.last_accessed && (
                  <p className="mt-1 text-xs text-gray-500">
                    Last studied {new Date(course.last_accessed).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex space-x-4">
        <button
          onClick={() => navigate('/edit-profile')}
          className="px-4 py-2 bg-pencil text-white rounded-sm hover:bg-pencil-dark"
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