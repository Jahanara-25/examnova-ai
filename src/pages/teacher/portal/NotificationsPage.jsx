import { PageHeader, ReusableCard } from '../../../components/ui/PortalUI';
import { notificationsData } from '../../../data/mockData';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Announcements and reminders for your faculty and students" />
      <div className="grid gap-4">
        {notificationsData.map((item) => (
          <ReusableCard key={item.id} title={item.title} subtitle={item.time}>
            <p className="text-sm text-slate-600">{item.detail}</p>
          </ReusableCard>
        ))}
      </div>
    </div>
  );
}
