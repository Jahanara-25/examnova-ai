import { FaCamera, FaEdit, FaGraduationCap, FaUser } from 'react-icons/fa';
import { PageHeader, ReusableButton, ReusableCard, ReusableForm, FormField } from '../../../components/ui/PortalUI';
import { studentProfile } from '../../../data/mockData';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Personal and academic details" action={<ReusableButton variant="secondary"><FaEdit className="mr-2 inline" /> Edit Profile</ReusableButton>} />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <ReusableCard title="Student Overview" subtitle="Identity and contact section">
          <div className="mt-4 flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white">{studentProfile.avatar}</div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{studentProfile.name}</h3>
            <p className="text-sm text-slate-600">{studentProfile.role}</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
              <FaCamera /> Upload photo
            </div>
          </div>
        </ReusableCard>
        <div className="space-y-6">
          <ReusableCard title="Personal Details" subtitle="Current account information">
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><p className="text-sm text-slate-500">Email</p><p className="font-semibold text-slate-900">{studentProfile.email}</p></div>
              <div><p className="text-sm text-slate-500">Roll Number</p><p className="font-semibold text-slate-900">{studentProfile.rollNumber}</p></div>
              <div><p className="text-sm text-slate-500">Branch</p><p className="font-semibold text-slate-900">{studentProfile.branch}</p></div>
              <div><p className="text-sm text-slate-500">Semester</p><p className="font-semibold text-slate-900">{studentProfile.semester}</p></div>
            </div>
          </ReusableCard>
          <ReusableCard title="Academic Details" subtitle="Current learning standing">
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
              <FaGraduationCap className="text-2xl text-slate-900" />
              <div>
                <p className="font-semibold text-slate-900">CGPA: {studentProfile.cgpa}</p>
                <p className="text-sm text-slate-600">Consistently strong performance across the semester.</p>
              </div>
            </div>
          </ReusableCard>
        </div>
      </div>
      <ReusableForm title="Edit Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full Name"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" defaultValue={studentProfile.name} /></FormField>
          <FormField label="Email"><input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none" defaultValue={studentProfile.email} /></FormField>
        </div>
        <ReusableButton>Save Changes</ReusableButton>
      </ReusableForm>
    </div>
  );
}
