import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Instructor preferences and security controls" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Theme" subtitle="Appearance preferences">
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Enable dark mode</span><input type="checkbox" /></label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Compact layout</span><input type="checkbox" /></label>
          </div>
        </ReusableCard>
        <ReusableCard title="Notifications" subtitle="Communication preferences">
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>New submissions</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Grade reminders</span><input type="checkbox" defaultChecked /></label>
          </div>
        </ReusableCard>
      </div>
      <ReusableForm title="Security Settings">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Two-Factor Authentication"><input type="checkbox" /></FormField>
          <FormField label="Recovery Email"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
        </div>
        <ReusableButton>Save Preferences</ReusableButton>
      </ReusableForm>
    </div>
  );
}
