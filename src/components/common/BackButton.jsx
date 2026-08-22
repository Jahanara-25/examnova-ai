import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate();
  return <button type="button" onClick={() => window.history.length > 1 ? navigate(-1) : navigate(fallback)} className={`portal-back-button ${className}`}><FaArrowLeft aria-hidden="true" /> Back</button>;
}
