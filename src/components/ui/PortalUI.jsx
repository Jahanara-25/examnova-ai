import { createContext, useContext, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const value = useMemo(() => ({ addToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <motion.div key={toast.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-950/60 text-emerald-300' : toast.type === 'error' ? 'border-rose-500/30 bg-rose-950/60 text-rose-300' : 'border-cyan-500/30 bg-cyan-950/60 text-cyan-300'}`}>
            <div className="flex items-start gap-2">
              {toast.type === 'success' ? <FaCheckCircle className="mt-0.5" /> : toast.type === 'error' ? <FaExclamationTriangle className="mt-0.5" /> : <FaInfoCircle className="mt-0.5" />}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-900/20 p-6 shadow-lg backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {action}
    </motion.div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="mb-4 text-sm text-slate-500">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            {index > 0 && <span className="text-slate-600">/</span>}
            <span className={index === items.length - 1 ? 'font-semibold text-cyan-400' : 'text-slate-400'}>{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.02 }} className="group rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-900/20 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/20">
      <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${accent} p-3 text-white shadow-lg`}>
        <Icon className="text-lg" />
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </motion.div>
  );
}

export function ReusableCard({ title, subtitle, children, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-900/20 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 shadow-md backdrop-blur-md transition-all duration-300 focus-within:border-cyan-500/50 focus-within:bg-slate-900/50">
      <FaSearch />
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full border-none bg-transparent text-slate-100 outline-none placeholder-slate-500" />
    </label>
  );
}

export function ReusableButton({ children, variant = 'primary', className = '', onClick, type = 'button', disabled = false }) {
  const base = 'rounded-xl px-4 py-2.5 font-medium transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/50 hover:-translate-y-1 active:translate-y-0',
    secondary: 'border border-blue-500/30 bg-slate-900/30 text-cyan-400 shadow-md hover:border-purple-500/50 hover:bg-slate-900/50 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/50 hover:-translate-y-1',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:shadow-rose-500/50 hover:-translate-y-1',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${variants[variant]} ${className}`}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function ReusableTable({ columns, data }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-blue-500/20 shadow-lg">
      <table className="min-w-full divide-y divide-blue-500/10 bg-gradient-to-b from-slate-900/40 to-slate-900/20 backdrop-blur-xl">
        <thead className="bg-slate-900/60 backdrop-blur-sm">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cyan-400">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-500/10">
          {data.map((row, index) => (
            <tr key={row.id || index} className="transition-colors duration-200 hover:bg-slate-900/40">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm text-slate-300">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReusableForm({ title, children, onSubmit }) {
  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/40 to-slate-900/20 p-5 shadow-lg backdrop-blur-xl">
      {title && <h3 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">{title}</h3>}
      {children}
    </motion.form>
  );
}

export function FormField({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-800/50 hover:text-cyan-400">
            <FaTimes />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mb-6 text-sm text-slate-400">{message}</p>
      <div className="flex justify-end gap-3">
        <ReusableButton variant="secondary" onClick={onCancel}>Cancel</ReusableButton>
        <ReusableButton variant="danger" onClick={onConfirm}>Confirm</ReusableButton>
      </div>
    </Modal>
  );
}

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl border border-blue-500/20 bg-gradient-to-r from-slate-900/30 to-slate-900/20 backdrop-blur-sm" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-blue-500/30 bg-gradient-to-br from-slate-900/30 to-slate-900/10 p-8 text-center backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
