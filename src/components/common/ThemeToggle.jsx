import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      {isDark ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
      <span className="sr-only">Switch theme</span>
    </button>
  );
}
