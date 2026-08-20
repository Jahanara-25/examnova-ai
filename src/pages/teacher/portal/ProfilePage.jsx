import { FaEdit } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';
import { teacherProfile } from '../../../data/mockData';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your faculty profile" action={<ReusableButton variant="secondary"><FaEdit className="mr-2 inline" /> Edit Profile</ReusableButton>} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ReusableCard title="Faculty Overview" subtitle="Professional profile details">
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white">{teacherProfile.avatar}</div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{teacherProfile.name}</h3>
            <p className="text-sm text-slate-600">{teacherProfile.designation}</p>
          </div>
        </ReusableCard>
        <ReusableCard title="Account Details" subtitle="Current teaching profile">
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div><p className="text-sm text-slate-500">Email</p><p className="font-semibold text-slate-900">{teacherProfile.email}</p></div>
            <div><p className="text-sm text-slate-500">Department</p><p className="font-semibold text-slate-900">{teacherProfile.department}</p></div>
          </div>
        </ReusableCard>
      </div>
      <ReusableForm title="Change Password">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Current Password"><input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
          <FormField label="New Password"><input type="password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" /></FormField>
        </div>
        <ReusableButton>Update Password</ReusableButton>
      </ReusableForm>
    </div>
  );
}
