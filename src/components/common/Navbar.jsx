import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.svg';

const links = [
  { to: '#features', label: 'Features' },
  { to: '#modules', label: 'Modules' },
  { to: '#about', label: 'About' },
  { to: '#contact', label: 'Contact' },
  { to: '#faq', label: 'FAQ' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container nav-shell">
        <Link to="/" className="brand-block">
          <img className="brand-logo" src={logo} alt="ExamNova AI" />
          <span className="brand-copy">
            <span className="brand-name">examnova.ai</span>
            <span className="brand-tagline">(ai powered intelligent examination platform)</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link.to} href={link.to} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        {isAuthenticated ? (
          <div className="nav-actions">
            <span className="user-badge">{user?.name}</span>
            <button className="button button-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth/role-selection" className="button button-primary">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
