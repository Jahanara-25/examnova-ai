import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <main className="page-shell">
      <div className="container dashboard-card">
        <p className="eyebrow">Admin portal</p>
        <h1>Welcome, {user?.name}</h1>
        <p>Oversee exam integrity, monitor performance trends, and manage institutional programs.</p>
      </div>
    </main>
  );
}
