import { FaDownload, FaMagic } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard } from '../../../components/ui/PortalUI';

export default function CertificateManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Certificate Management" subtitle="Create and publish certificates" action={<ReusableButton><FaMagic className="mr-2 inline" /> Generate</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Generate Certificate" subtitle="Prepare award documents">
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Bulk generation for top-performing students</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Custom template for excellence and participation</div>
          </div>
        </ReusableCard>
        <ReusableCard title="Preview and Publish" subtitle="Review before sending">
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">Certificate preview will appear here.</p>
            <div className="mt-4 flex gap-3 justify-center">
              <ReusableButton variant="secondary"><FaDownload className="mr-2 inline" /> Download</ReusableButton>
              <ReusableButton>Publish</ReusableButton>
            </div>
          </div>
        </ReusableCard>
      </div>
    </div>
  );
}
