import StudentLayout from '../../components/layouts/StudentLayout';
import StudentDashboardPage from './portal/StudentDashboardPage';

export default function StudentDashboard() {
  return (
    <StudentLayout>
      <StudentDashboardPage />
    </StudentLayout>
  );
}
