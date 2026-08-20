import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FaExclamationTriangle className="mx-auto text-5xl text-amber-500" />
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">Return home</Link>
      </div>
    </div>
  );
}
