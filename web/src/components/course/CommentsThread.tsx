import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api';
import { useAuth } from '../auth/AuthContext';
import type { Comment } from '../../types/course';

interface CommentsThreadProps {
  /** 'course' or 'lesson'; decides which endpoint is used. */
  kind: 'course' | 'lesson';
  /** The course id (for course comments) or lesson id (for lesson comments). */
  targetId: number;
  /** True when the viewer owns the course: they may delete any comment. */
  isCourseOwner: boolean;
}

/**
 * Chronological comment thread for a course or a lesson. Anyone can
 * read; only logged-in users can post. A comment's author, or the
 * course owner, can delete it.
 */
const CommentsThread = ({ kind, targetId, isCourseOwner }: CommentsThreadProps) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const path = kind === 'course'
    ? `/courses/${targetId}/comments`
    : `/lessons/${targetId}/comments`;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(path);
      if (!res.ok) throw new Error('Could not load comments');
      setComments(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setPostError('');
    try {
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Could not post the comment');
      setDraft('');
      await load();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not post the comment');
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      const res = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete the comment');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the comment');
    }
  };

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold">Discussion</h2>
      {loading && <p className="mt-3 text-sm">Loading comments...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!loading && !error && comments.length === 0 && (
        <p className="mt-3 text-sm leading-relaxed">
          No comments yet. Be the first to ask a question or share a thought.
        </p>
      )}
      {!loading && comments.length > 0 && (
        <ol className="mt-4 border-t border-rule">
          {comments.map((comment) => (
            <li key={comment.id} className="py-4 border-b border-rule">
              <p className="text-sm">
                <span className="font-semibold">{comment.author_name}</span>
                {' '}
                <span className="text-gray-500">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </p>
              <p className="mt-1 leading-relaxed">{comment.text}</p>
              {(isCourseOwner || user?.id === comment.author_id) && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="mt-1 text-xs text-pencil hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {isAuthenticated ? (
        <div className="mt-4">
          <label htmlFor={`comment-${kind}-${targetId}`} className="sr-only">
            Write a comment
          </label>
          <textarea
            id={`comment-${kind}-${targetId}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment"
            rows={3}
            className="w-full px-3 py-2 border border-rule rounded-sm bg-paper focus:outline-none focus:ring-2 focus:ring-pencil"
          />
          {postError && <p className="mt-1 text-sm text-red-600">{postError}</p>}
          <button
            onClick={postComment}
            disabled={posting || !draft.trim()}
            className="mt-2 px-4 py-2 bg-pencil hover:bg-pencil-dark text-white text-sm font-medium rounded-sm disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm">
          Log in to join the discussion.
        </p>
      )}
    </section>
  );
};

export default CommentsThread;
