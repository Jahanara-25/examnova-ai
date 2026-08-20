import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';

const roles = [
  { role: 'student', title: 'Student', description: 'Access exams, reviews, and performance insights.', path: '/auth/login/student' },
  { role: 'teacher', title: 'Teacher', description: 'Create assessments, review progress, and guide learners.', path: '/auth/login/teacher' },
  { role: 'admin', title: 'Admin', description: 'Manage programs, oversight, and institution-wide operations.', path: '/auth/login/admin' },
];

export default function RoleSelectionPage() {
  return (
    <main className="page-shell">
      <div className="container auth-card">
        <img className="auth-logo" src={logo} alt="ExamNova AI" />
        <p className="eyebrow">Choose your role</p>
        <h1>Sign in as a student, teacher, or administrator</h1>
        <div className="card-grid">
          {roles.map((item) => (
            <Link to={item.path} key={item.role} className="info-card role-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
