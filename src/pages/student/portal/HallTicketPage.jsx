import { useEffect, useState } from 'react';
import { PageHeader, ReusableCard, EmptyState, ReusableButton } from '../../../components/ui/PortalUI';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { formatExamDateTime } from '../../../lib/dateTime';

export default function HallTicketPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const printTicket = (examId) => {
    document.querySelectorAll('.hall-ticket-document.print-active').forEach((ticket) => ticket.classList.remove('print-active'));
    document.getElementById(`hall-ticket-${examId}`)?.classList.add('print-active');
    document.body.classList.add('printing-hall-ticket');
    const cleanup = () => {
      document.body.classList.remove('printing-hall-ticket');
      document.querySelectorAll('.hall-ticket-document.print-active').forEach((ticket) => ticket.classList.remove('print-active'));
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };
  const printAllTickets = () => {
    document.body.classList.add('printing-hall-tickets');
    const cleanup = () => document.body.classList.remove('printing-hall-tickets');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };
  useEffect(() => { api('/exams/available').then((data) => setExams(data.exams)).catch(() => setError('Unable to load hall ticket details. Please try again.')).finally(() => setLoading(false)); }, []);
  return <div className="space-y-6"><PageHeader title="Hall Ticket" subtitle="Exam details issued for your authenticated student account" action={!loading && exams.length > 1 ? <ReusableButton variant="secondary" onClick={printAllTickets}>Print All Hall Tickets</ReusableButton> : undefined} />{error && <p role="alert" className="text-rose-300">{error}</p>}{loading ? <p className="text-cyan-300">Loading exam details…</p> : exams.length ? <div className="hall-ticket-print-list">{exams.map((exam) => <ReusableCard key={exam._id} className="hall-ticket-print-card" title={exam.title} subtitle={exam.subject}><article id={`hall-ticket-${exam._id}`} className="hall-ticket-document mx-auto max-w-3xl rounded border-2 border-slate-500 bg-white p-6 text-slate-900"><header className="border-b-2 border-slate-300 pb-4 text-center"><h2 className="text-xl font-bold">EXAMNOVA.AI</h2><p className="mt-1 text-sm">EXAMINATION ADMIT CARD</p></header><div className="grid gap-3 py-5 sm:grid-cols-2"><p><b>Student name:</b> {user?.name || 'Unavailable'}</p><p><b>Student identifier:</b> {user?.rollNumber || 'Not provided'}</p><p><b>Exam title:</b> {exam.title}</p><p><b>Subject / course:</b> {exam.subject}</p><p><b>Department:</b> {exam.department}</p><p><b>Duration:</b> {exam.duration} minutes</p><p><b>Exam starts:</b> {formatExamDateTime(exam.startDate)} IST</p><p><b>Exam ends:</b> {formatExamDateTime(exam.endDate)} IST</p></div><section className="border-t border-slate-300 pt-4"><h3 className="font-semibold">Instructions</h3><p className="mt-2 whitespace-pre-wrap text-sm">{exam.instructions || 'No additional instructions were provided.'}</p></section><p className="mt-5 border-t border-slate-300 pt-3 text-xs text-slate-600">ExamNova.ai · Exam ID {exam._id}</p></article><ReusableButton className="mt-4 print:hidden" variant="secondary" onClick={() => printTicket(exam._id)}>Print Hall Ticket</ReusableButton></ReusableCard>)}</div> : !error && <EmptyState title="No hall tickets available." message="A ticket is shown when a published exam is assigned to your department." />}</div>;
}
