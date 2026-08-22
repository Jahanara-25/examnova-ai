import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';
import { useTheme } from '../../../hooks/useTheme.jsx';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Preferences and account controls" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ReusableCard title="Theme Preferences" subtitle="Light and dark mode ready">
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Enable dark theme</span><input type="checkbox" checked={theme === 'dark'} onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')} /></label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Reduce motion</span><input type="checkbox" /></label>
          </div>
        </ReusableCard>
        <ReusableCard title="Notifications" subtitle="Control your updates">
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Exam reminders</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><span>Weekly reports</span><input type="checkbox" defaultChecked /></label>
          </div>
        </ReusableCard>
      </div>
      <ReusableForm title="Security Settings">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Current Password"><input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          <FormField label="New Password"><input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
        </div>
        <ReusableButton>Update Security</ReusableButton>
      </ReusableForm>
    </div>
  );
}
