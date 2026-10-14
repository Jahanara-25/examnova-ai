import { useEffect, useState } from 'react';
import { PageHeader, EmptyState, ReusableCard, ReusableButton } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { formatExamDateTime } from '../../../lib/dateTime';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [threshold, setThreshold] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  useEffect(() => { api('/certificates').then((data) => { setCertificates(data.certificates); setThreshold(data.passPercentage); }).catch((e) => setError(e.message || 'Unable to load certificates.')); }, []);
  const printCertificates = () => {
    document.body.classList.add('printing-certificates');
    const cleanup = () => document.body.classList.remove('printing-certificates');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };
  return <div className="space-y-6"><PageHeader title="Certificates" subtitle="Issued for published results that meet the configured pass threshold" />{error && <p role="alert" className="text-rose-300">{error}</p>}{certificates.length ? <div className="certificate-print-list">{certificates.map((certificate) => <ReusableCard key={certificate._id} className="certificate-print-card" title={certificate.examId?.subject || 'Course'} subtitle="ExamNova.ai · Certificate of Completion"><article className="certificate-document mx-auto my-4 max-w-3xl border-4 border-cyan-700 p-8 text-center text-slate-900"><p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-800">ExamNova.ai</p><h2 className="my-5 text-3xl font-semibold">Certificate of Completion</h2><p>This certifies that</p><p className="my-3 text-2xl font-semibold">{user?.name || 'Student'}</p><p>has successfully completed the assessment in</p><p className="my-3 text-xl font-semibold">{certificate.examId?.subject}</p><p>Assessment: {certificate.examId?.title}</p><p className="mt-2">Result: {certificate.resultId?.obtainedMarks}/{certificate.resultId?.totalMarks} ({certificate.resultId?.percentage}%)</p><p className="mt-5">Issued {formatExamDateTime(certificate.issuedAt)} IST</p><p className="mt-3 text-xs">Certificate ID: {certificate.certificateId}</p></article><ReusableButton className="print:hidden" variant="secondary" onClick={printCertificates}>Print Certificate</ReusableButton></ReusableCard>)}</div> : <EmptyState title={error ? 'Certificates unavailable.' : 'No eligible certificates yet.'} message={error || (threshold === null ? 'Loading certificate eligibility…' : `A certificate is issued after a published result meets the configured ${threshold}% pass threshold. Assessments awaiting grading are not eligible.`)} />}</div>;
}
