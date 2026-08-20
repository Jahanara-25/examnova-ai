import { FaDownload, FaPrint, FaQrcode } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard } from '../../../components/ui/PortalUI';
import { hallTicketData } from '../../../data/mockData';

export default function HallTicketPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Hall Ticket" subtitle="Your entry pass and examination details" action={<ReusableButton>Download PDF</ReusableButton>} />
      <ReusableCard title="Examination Admittance" subtitle="Present this at the exam center">
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Student</p>
                <h3 className="text-xl font-semibold text-slate-900">{hallTicketData.studentName}</h3>
              </div>
              <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{hallTicketData.rollNumber}</div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><p className="text-sm text-slate-500">Exam</p><p className="font-semibold text-slate-900">{hallTicketData.examTitle}</p></div>
              <div><p className="text-sm text-slate-500">Date</p><p className="font-semibold text-slate-900">{hallTicketData.examDate}</p></div>
              <div><p className="text-sm text-slate-500">Reporting Time</p><p className="font-semibold text-slate-900">{hallTicketData.reportingTime}</p></div>
              <div><p className="text-sm text-slate-500">Venue</p><p className="font-semibold text-slate-900">{hallTicketData.venue}</p></div>
              <div><p className="text-sm text-slate-500">Seat Number</p><p className="font-semibold text-slate-900">{hallTicketData.seatNumber}</p></div>
            </div>
            <div className="mt-6 flex gap-3">
              <ReusableButton variant="secondary"><FaDownload className="mr-2 inline" /> Download</ReusableButton>
              <ReusableButton variant="secondary"><FaPrint className="mr-2 inline" /> Print</ReusableButton>
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <FaQrcode className="mx-auto text-6xl text-slate-400" />
            <p className="mt-4 text-sm text-slate-500">QR code placeholder</p>
            <p className="mt-2 text-xs text-slate-400">This will be replaced by a generated ticket QR once the backend is connected.</p>
          </div>
        </div>
      </ReusableCard>
    </div>
  );
}
