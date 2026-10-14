import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatExamDateTime } from '../../lib/dateTime';
import { EmptyState, PageHeader, ReusableButton, ReusableCard } from '../ui/PortalUI';

export default function NotificationCenter({ role }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true); setError('');
    try { const data = await api('/notifications'); if (!Array.isArray(data.notifications)) throw new Error('Invalid notification response.'); setItems(data.notifications); }
    catch (requestError) { setError(requestError.message || 'Unable to load notifications.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const markOne = async (id) => {
    try { await api(`/notifications/${id}/read`, { method: 'PATCH' }); setItems((current) => current.map((item) => item._id === id ? { ...item, read: true } : item)); }
    catch (requestError) { setError(requestError.message || 'Unable to update the notification.'); }
  };
  const markAll = async () => {
    if (busy) return;
    setBusy(true);
    try { await api('/notifications/read-all', { method: 'PATCH' }); setItems((current) => current.map((item) => ({ ...item, read: true }))); }
    catch (requestError) { setError(requestError.message || 'Unable to mark notifications as read.'); }
    finally { setBusy(false); }
  };
  const unread = items.filter((item) => !item.read).length;

  return <div className="space-y-6"><PageHeader title="Notifications" subtitle={role === 'teacher' ? 'Exam submissions and assessment updates' : 'Your exam, result, and certificate updates'} action={<div className="flex gap-2"><ReusableButton variant="secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</ReusableButton><ReusableButton onClick={markAll} disabled={!unread || busy}>{busy ? 'Updating…' : `Mark all read${unread ? ` (${unread})` : ''}`}</ReusableButton></div>} />
    {error && <p role="alert" className="rounded-xl border border-rose-400/30 p-3 text-rose-200">{error}</p>}
    {loading ? <p role="status" className="p-5 text-slate-300">Loading notifications…</p> : items.length ? <div className="space-y-3">{items.map((item) => <ReusableCard key={item._id} title={item.title} subtitle={`${formatExamDateTime(item.createdAt)} IST${item.read ? '' : ' · Unread'}`}><p>{item.message}</p><div className="mt-3 flex gap-4">{item.link && <Link className="text-cyan-300" to={item.link}>Open</Link>}{!item.read && <button type="button" className="text-cyan-300" onClick={() => markOne(item._id)}>Mark as read</button>}</div></ReusableCard>)}</div> : <EmptyState title="No notifications yet." message="Updates for exams, submissions, results, and published certificates will appear here." />}
  </div>;
}
