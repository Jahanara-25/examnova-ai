import { FaDownload, FaEye } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard } from '../../../components/ui/PortalUI';
import { certificates } from '../../../data/mockData';

export default function CertificatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle="Recognitions and badges earned" action={<ReusableButton>Request New</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-2">
        {certificates.map((certificate) => (
          <ReusableCard key={certificate.id} title={certificate.title} subtitle={`Issued ${certificate.issued}`}>
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Certificate Preview</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{certificate.title}</p>
              <p className="mt-2 text-sm text-slate-600">Status: {certificate.status}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <ReusableButton variant="secondary"><FaEye className="mr-2 inline" /> Preview</ReusableButton>
              <ReusableButton><FaDownload className="mr-2 inline" /> Download</ReusableButton>
            </div>
          </ReusableCard>
        ))}
      </div>
    </div>
  );
}
