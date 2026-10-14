import { useEffect, useState } from 'react';
import { PageHeader, ReusableCard, EmptyState, ReusableButton } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';
import { formatExamDateTime } from '../../../lib/dateTime';

export default function CertificateManagementPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [threshold, setThreshold] = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/certificates/eligible');
      setItems(Array.isArray(data.certificates) ? data.certificates : []); setThreshold(data.passPercentage);
    } catch (requestError) { setError(requestError.message || 'Unable to load certificate eligibility.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const prepare = async (item) => {
    setBusyId(item.id); setError('');
    try {
      const data = await api(`/certificates/${item.id}/prepare`, { method: 'POST' });
      const next = { ...item, certificateId: data.certificate.certificateId, certificateStatus: data.certificate.status || (data.alreadyPublished ? 'published' : 'draft'), issuedAt: data.certificate.issuedAt || data.certificate.createdAt || null };
      setItems((current) => current.map((entry) => entry.id === item.id ? next : entry)); setSelected(next);
    } catch (requestError) { setError(requestError.message || 'Unable to prepare certificate preview.'); }
    finally { setBusyId(''); }
  };
  const publish = async (item) => {
    setBusyId(item.id); setError('');
    try {
      const data = await api(`/certificates/${item.id}/publish`, { method: 'POST' });
      const next = { ...item, certificateId: data.certificate.certificateId, certificateStatus: 'published', issuedAt: data.certificate.issuedAt || new Date().toISOString() };
      setItems((current) => current.map((entry) => entry.id === item.id ? next : entry)); setSelected(next);
    } catch (requestError) { setError(requestError.message || 'Unable to publish certificate.'); }
    finally { setBusyId(''); }
  };

  return <div className="space-y-6">
    <PageHeader title="Certificate Management" subtitle="Prepare and publish certificates for eligible students" action={<ReusableButton variant="secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</ReusableButton>} />
    <p className="text-sm text-slate-400">Eligibility uses the configured {threshold ?? '…'}% pass threshold and published results only. Certificates are not visible in the student portal until published.</p>
    {error && <p role="alert" className="rounded-xl border border-rose-400/30 p-3 text-rose-200">{error}</p>}
    {loading ? <p role="status" className="p-5 text-slate-300">Loading eligible published results…</p> : <div className="grid gap-6 xl:grid-cols-2">
      <ReusableCard title="Eligible assessment results">{items.length ? <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl border border-blue-400/20 p-4 text-slate-200"><b>{item.student}</b><p>{item.rollNumber && `${item.rollNumber} · `}{item.department}</p><p>{item.exam} · {item.subject}</p><p>{item.marks}/{item.totalMarks} · {item.percentage}%</p><p className="mt-1 text-sm text-slate-400">Certificate: {item.certificateStatus === 'published' ? 'Published' : item.certificateStatus === 'draft' ? 'Prepared draft' : 'Not prepared'}</p><div className="mt-3 flex gap-2"><ReusableButton variant="secondary" disabled={busyId === item.id} onClick={() => prepare(item)}>{item.certificateStatus === 'not_prepared' ? 'Prepare & Preview' : 'Preview'}</ReusableButton></div></div>)}</div> : <EmptyState title="No eligible results." message="Only students with a published result at or above the configured threshold can receive a certificate." />}</ReusableCard>
      <ReusableCard title="Certificate preview" subtitle="Review the recipient, subject, score, and certificate identifier before publication.">{selected ? <article className="certificate-document rounded-xl border-4 border-cyan-700 bg-white p-8 text-center text-slate-900"><p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-800">ExamNova.ai</p><h2 className="my-5 text-3xl font-semibold">Certificate of Completion</h2><p>This certifies that</p><p className="my-3 text-2xl font-semibold">{selected.student}</p><p>has successfully completed the assessment in</p><p className="my-3 text-xl font-semibold">{selected.subject}</p><p>Assessment: {selected.exam}</p><p className="mt-2">Result: {selected.marks}/{selected.totalMarks} ({selected.percentage}%)</p><p className="mt-5">{selected.certificateStatus === 'published' ? `Issued ${formatExamDateTime(selected.issuedAt)} IST` : 'Issue date will be set when published'}</p><p className="mt-3 text-xs">Certificate ID: {selected.certificateId || 'Prepared when you choose Preview'}</p><p className="mt-5 text-xs uppercase tracking-widest">Issued by ExamNova.ai</p></article> : <EmptyState title="Select an eligible result." message="Prepare a certificate to see its real database-backed preview here." />}
        {selected?.certificateStatus === 'draft' && <ReusableButton className="mt-4" variant="success" disabled={busyId === selected.id} onClick={() => publish(selected)}>{busyId === selected.id ? 'Publishing…' : 'Publish to Student Portal'}</ReusableButton>}
        {selected?.certificateStatus === 'published' && <p role="status" className="mt-4 text-emerald-300">Published and visible in the corresponding student’s portal.</p>}
      </ReusableCard>
    </div>}
  </div>;
}
