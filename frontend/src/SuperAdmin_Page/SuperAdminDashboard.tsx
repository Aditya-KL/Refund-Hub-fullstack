import React, { useState, useEffect } from 'react';
import {
  Home, ClipboardList, Settings, TrendingUp, AlertCircle,
  DollarSign, Activity, Crown, LogOut, UserPlus, Circle,
  Menu, X, User, Trash2, Plus, Eye, EyeOff, Search,
  Filter, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, MoreVertical,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortalSettingsView } from './PortalSettingsView';
import { ProfileView } from './ProfileView';
import { apiService } from '../services/db_service';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTimeAgo(dateString: string | null | undefined) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Never';
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

interface SuperAdminDashboardProps { onLogout: () => void; }

// ─── Types ────────────────────────────────────────────────────────────────────
interface Secretary {
  _id: string;
  fullName: string;
  studentId: string;   // used as employeeId for secretaries
  email: string;
  phone: string;
  department: 'fest' | 'mess' | 'hospital' | 'account' | string;
  isVerified: boolean;
  isSecretary: boolean;
  isSuperAdmin: boolean;
  createdAt?: string;
  lastLogin?: string | null;
}

interface AuditLog {
  _id: string; secretaryId: string; secretaryName: string; action: string;
  targetCollection: string; targetId?: string; details: string;
  ipAddress?: string; timestamp: string; status: 'success' | 'failed' | 'warning';
}

// ─── Static / Chart Data ──────────────────────────────────────────────────────
const mockAuditLogs: AuditLog[] = [
  { _id: 'a1', secretaryId: '1', secretaryName: 'Dr. Rajesh Kumar', action: 'APPROVE_CLAIM', targetCollection: 'claims', targetId: 'CLM-1041', details: 'Approved mess rebate claim for student Arjun Mehta (Roll: 21BCS045)', ipAddress: '192.168.1.12', timestamp: '2025-03-27T10:32:00Z', status: 'success' },
  { _id: 'a2', secretaryId: '3', secretaryName: 'Mr. Vikram Singh', action: 'REJECT_CLAIM', targetCollection: 'claims', targetId: 'CLM-1038', details: 'Rejected fest reimbursement — receipt mismatch', ipAddress: '192.168.1.34', timestamp: '2025-03-27T09:15:00Z', status: 'warning' },
  { _id: 'a3', secretaryId: '2', secretaryName: 'Prof. Anita Sharma', action: 'UPDATE_STUDENT', targetCollection: 'users', targetId: 'USR-0892', details: 'Updated medical records for student Sneha Patel', ipAddress: '192.168.1.55', timestamp: '2025-03-26T16:45:00Z', status: 'success' },
  { _id: 'a4', secretaryId: '1', secretaryName: 'Dr. Rajesh Kumar', action: 'LOGIN', targetCollection: 'auth', details: 'Successful login from IP 192.168.1.12', ipAddress: '192.168.1.12', timestamp: '2025-03-26T08:00:00Z', status: 'success' },
  { _id: 'a5', secretaryId: '4', secretaryName: 'Ms. Priya Gupta', action: 'FAILED_LOGIN', targetCollection: 'auth', details: 'Failed login attempt — invalid password (attempt 3/5)', ipAddress: '203.12.45.87', timestamp: '2025-03-25T22:11:00Z', status: 'failed' },
  { _id: 'a6', secretaryId: '3', secretaryName: 'Mr. Vikram Singh', action: 'EXPORT_REPORT', targetCollection: 'reports', details: 'Exported monthly fest claims summary (March 2025)', ipAddress: '192.168.1.34', timestamp: '2025-03-25T14:30:00Z', status: 'success' },
  { _id: 'a7', secretaryId: '2', secretaryName: 'Prof. Anita Sharma', action: 'APPROVE_CLAIM', targetCollection: 'claims', targetId: 'CLM-1022', details: 'Approved hospital bill reimbursement ₹4,500 for Ritu Das', ipAddress: '192.168.1.55', timestamp: '2025-03-24T11:20:00Z', status: 'success' },
  { _id: 'a8', secretaryId: '1', secretaryName: 'Dr. Rajesh Kumar', action: 'BULK_UPDATE', targetCollection: 'claims', details: 'Bulk status update — 12 mess claims marked as disbursed', ipAddress: '192.168.1.12', timestamp: '2025-03-23T09:05:00Z', status: 'success' },
];

const departmentalData = [
  { name: 'Mess', value: 145, color: '#10b981' },
  { name: 'Medical', value: 98, color: '#3b82f6' },
  { name: 'Cultural', value: 123, color: '#8b5cf6' },
  { name: 'Accounts', value: 54, color: '#f59e0b' },
];

const deptLabelFull: Record<string, string> = {
  fest: 'Cultural & Fest Cell',
  mess: 'Mess Department',
  hospital: 'Medical Department',
  account: 'Accounts Department',
};
const deptLabelShort: Record<string, string> = {
  fest: 'Cultural', mess: 'Mess', hospital: 'Medical', account: 'Accounts',
};
const deptColor: Record<string, string> = {
  fest: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  mess: 'text-green-400 bg-green-400/10 border-green-400/20',
  hospital: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  account: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};
const deptTextColor: Record<string, string> = {
  fest: 'text-purple-400', mess: 'text-green-400',
  hospital: 'text-blue-400', account: 'text-amber-400',
};

// ─── Add Secretary Modal ──────────────────────────────────────────────────────
function AddSecretaryModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: any) => Promise<void> }) {
  const [form, setForm] = useState({
    fullName: '', employeeId: '', email: '', phone: '', password: '',
    department: 'mess' as Secretary['department'],
    isVerified: true, isSecretary: true, isSuperAdmin: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.employeeId.trim()) e.employeeId = 'Required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.phone.length < 10) e.phone = 'Min 10 digits';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      await onAdd(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
      <div className="bg-slate-800 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-white">Register Secretary</h3>
            <p className="text-xs text-slate-400 mt-0.5">Create a department head account</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([['fullName', 'Full Name', 'text', 'Dr. John Doe'], ['employeeId', 'Employee ID', 'text', 'EMP005']] as const).map(([key, label, type, ph]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors[key] ? 'border-red-500' : 'border-slate-600'}`}
                />
                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="secretary@institution.edu"
              className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.phone ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 chars"
                  className={`w-full px-3.5 py-2.5 pr-10 bg-slate-900 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value as any }))}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="mess">Mess Department</option>
              <option value="hospital">Medical Department</option>
              <option value="fest">Cultural & Fest Cell</option>
              <option value="account">Accounts Department</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={15} />}
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Secretaries Modal ─────────────────────────────────────────────────
function ManageSecretariesModal({ onClose }: { onClose: () => void }) {
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // ── Fetch from DB on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSecretaries();
        setSecretaries(data);
      } catch (err) {
        console.error("Failed to load secretaries:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = secretaries.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Add: use real DB response ─────────────────────────────────────────────────
  const handleAdd = async (data: any) => {
    try {
      const response = await apiService.createSecretary(data);
      setSecretaries(prev => [...prev, { ...response.secretary, lastLogin: null }]);
      setShowAdd(false);
    } catch (error: any) {
      alert(error.message || "Failed to create secretary.");
      throw error; // re-throw so the modal keeps spinner state correctly
    }
  };

  // ── Delete: call backend then remove from local state ─────────────────────────
  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await apiService.deleteSecretary(id);
      setSecretaries(prev => prev.filter(s => s._id !== id));
      setDeleteConfirm(null);
    } catch (error: any) {
      alert(error.message || "Failed to remove secretary.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
            <div className="w-10 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-white">Manage Secretaries</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading...' : `${secretaries.length} registered`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-medium text-sm transition-colors"
              >
                <Plus size={15} /> Add
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-slate-700 flex-shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Table / Cards */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Desktop Table ── */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-800/95">
                  <tr className="border-b border-slate-700">
                    {['Name & ID', 'Department', 'Contact', 'Last Login', 'Status', ''].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw size={22} className="animate-spin text-blue-500" />
                          <p className="text-slate-500 text-sm">Fetching secretaries...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                        {search ? 'No results match your search.' : 'No secretaries registered yet.'}
                      </td>
                    </tr>
                  ) : filtered.map(s => (
                    <tr key={s._id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-white text-sm">{s.fullName}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{s.studentId}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${deptColor[s.department] || deptColor.mess}`}>
                          {deptLabelFull[s.department] || s.department}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-300 text-xs">{s.email}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{s.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-400 text-xs">{getTimeAgo(s.lastLogin)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs flex items-center gap-1.5 ${s.isVerified ? 'text-green-400' : 'text-slate-500'}`}>
                          <Circle size={6} className={s.isVerified ? 'fill-green-400' : 'fill-slate-500'} />
                          {s.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setDeleteConfirm(s._id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="sm:hidden p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <RefreshCw size={22} className="animate-spin text-blue-500" />
                  <p className="text-slate-500 text-sm">Loading...</p>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">
                  {search ? 'No results match your search.' : 'No secretaries registered yet.'}
                </p>
              ) : filtered.map(s => (
                <div key={s._id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{s.fullName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.studentId}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${deptColor[s.department] || deptColor.mess}`}>
                          {deptLabelFull[s.department] || s.department}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${s.isVerified ? 'text-green-400' : 'text-slate-500'}`}>
                          <Circle size={5} className={s.isVerified ? 'fill-green-400' : 'fill-slate-500'} />
                          {s.isVerified ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1.5">{s.email}</p>
                      <p className="text-slate-600 text-xs mt-0.5">Last login: {getTimeAgo(s.lastLogin)}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === s._id ? null : s._id)}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === s._id && (
                        <div className="absolute right-0 top-9 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 min-w-[130px]">
                          <button
                            onClick={() => { setDeleteConfirm(s._id); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-400/10 rounded-xl text-sm"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">Remove Secretary?</h4>
                <p className="text-slate-400 text-sm">This will permanently delete the account.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddSecretaryModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </>
  );
}

// ─── Audit Logs View ──────────────────────────────────────────────────────────
function AuditLogsView() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'warning'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 5;

  const filtered = logs.filter(l =>
    (l.secretaryName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || l.status === filterStatus)
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const statusCfg = {
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    failed: { icon: X, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  };
  const actionColor: Record<string, string> = {
    APPROVE_CLAIM: 'text-green-400 bg-green-400/10', REJECT_CLAIM: 'text-red-400 bg-red-400/10',
    LOGIN: 'text-blue-400 bg-blue-400/10', FAILED_LOGIN: 'text-red-400 bg-red-400/10',
    UPDATE_STUDENT: 'text-purple-400 bg-purple-400/10', EXPORT_REPORT: 'text-cyan-400 bg-cyan-400/10',
    BULK_UPDATE: 'text-amber-400 bg-amber-400/10',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">System Audit Logs</h2>
          <p className="text-sm text-slate-400 mt-0.5">Full activity trail of all secretary operations</p>
        </div>
        <button
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 700); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {(['success', 'warning', 'failed'] as const).map(s => {
          const cfg = statusCfg[s];
          return (
            <div key={s} className={`flex items-center gap-2 sm:gap-3 p-3 rounded-xl border ${cfg.bg}`}>
              <cfg.icon size={15} className={`${cfg.color} flex-shrink-0`} />
              <div className="min-w-0">
                <p className={`text-lg font-bold ${cfg.color}`}>{logs.filter(l => l.status === s).length}</p>
                <p className="text-slate-500 text-xs capitalize">{s}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search secretary, action, details..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Filter size={13} className="text-slate-500 flex-shrink-0" />
        {(['all', 'success', 'failed', 'warning'] as const).map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No audit logs found</div>
        ) : paginated.map((log, i) => {
          const cfg = statusCfg[log.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={log._id} className={`p-4 sm:p-5 hover:bg-slate-700/20 transition-colors ${i < paginated.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} border`}>
                  <StatusIcon size={13} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start flex-wrap gap-1.5 mb-1">
                    <span className="text-white font-semibold text-sm">{log.secretaryName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${actionColor[log.action] || 'text-slate-400 bg-slate-700'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{log.details}</p>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-2">
                    <span className="text-slate-600 text-xs flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {log.targetId && <span className="text-slate-600 text-xs font-mono">{log.targetId}</span>}
                    {log.ipAddress && <span className="text-slate-600 text-xs font-mono hidden sm:inline">{log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-slate-500 text-xs">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-40 hover:text-white transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-slate-400 text-sm">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 disabled:opacity-40 hover:text-white transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ activeView, setActiveView }: { activeView: string; setActiveView: (v: string) => void }) {
  const items = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'audit', label: 'Audit', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 z-40 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-b-full" />}
              <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  const [activeView, setActiveView] = useState('overview');
  const [portalActive, setPortalActive] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Overview table: live secretaries from DB
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [loadingSecretaries, setLoadingSecretaries] = useState(true);

  useEffect(() => {
    const fetchSecretaries = async () => {
      try {
        setLoadingSecretaries(true);
        const data = await apiService.getSecretaries();
        setSecretaries(data);
      } catch (error) {
        console.error("Error fetching secretaries:", error);
      } finally {
        setLoadingSecretaries(false);
      }
    };
    fetchSecretaries();
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'audit', label: 'System Audit Logs', icon: ClipboardList },
    { id: 'settings', label: 'Portal Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const pageTitles: Record<string, { title: string; sub: string }> = {
    overview: { title: 'Global Dashboard', sub: 'Central Administration Control Panel' },
    audit: { title: 'Audit Logs', sub: 'Secretary activity trail' },
    settings: { title: 'Portal Settings', sub: 'System-wide configuration' },
    profile: { title: 'My Profile', sub: 'Account information & preferences' },
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 border-r border-slate-700 flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Crown className="text-yellow-300" size={21} />
            </div>
            <div>
              <h2 className="font-bold text-white leading-tight">Admin Portal</h2>
              <p className="text-xs text-slate-400">Central Oversight</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'}`}>
                <Icon size={18} /><span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700/60 hover:text-white rounded-xl transition-all">
            <LogOut size={18} /><span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <Crown className="text-yellow-300" size={19} />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm">Admin Portal</h2>
                  <p className="text-xs text-slate-400">Central Oversight</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => { setActiveView(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left ${activeView === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'}`}>
                    <Icon size={19} /><span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-700">
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700/60 hover:text-white rounded-xl transition-all">
                <LogOut size={19} /><span className="font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-3.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-400 hover:text-white p-1.5 -ml-1 rounded-xl hover:bg-slate-700 transition-colors">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white leading-tight">{pageTitles[activeView]?.title}</h1>
                <p className="text-xs text-slate-400 hidden sm:block">{pageTitles[activeView]?.sub}</p>
              </div>
            </div>
            {/* <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Portal Status</p>
                <p className={`text-xs font-bold ${portalActive ? 'text-green-400' : 'text-red-400'}`}>{portalActive ? 'ACTIVE' : 'DISABLED'}</p>
              </div>
              <button onClick={() => setPortalActive(v => !v)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${portalActive ? 'bg-green-600' : 'bg-red-600'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${portalActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div> */}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {activeView === 'overview' && (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                {[
                  { label: 'Total Claims', value: '1,250', sub: 'All-time submissions', icon: TrendingUp, color: 'text-white', accent: 'text-green-400' },
                  { label: 'Pending', value: '420', sub: 'Awaiting review', icon: AlertCircle, color: 'text-orange-400', accent: 'text-orange-400' },
                  { label: 'Disbursed', value: '₹12.5L', sub: 'This fiscal year', icon: DollarSign, color: 'text-green-400', accent: 'text-green-400' },
                  { label: 'Uptime', value: '99.9%', sub: 'Last 30 days', icon: Activity, color: 'text-blue-400', accent: 'text-blue-400' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs text-slate-400 leading-tight">{m.label}</p>
                      <m.icon size={14} className={m.accent} />
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold mb-0.5 ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-slate-500 leading-tight">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Secretary Panel + Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">Active Department Heads</h2>
                      <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Manage secretary access and permissions</p>
                    </div>
                    <button onClick={() => setShowManageModal(true)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-sm transition-colors">
                      <UserPlus size={15} />
                      <span className="hidden sm:inline">Manage</span>
                    </button>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {['Admin Name', 'Department', 'Status', 'Last Login'].map(h => (
                            <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loadingSecretaries ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <RefreshCw size={24} className="animate-spin text-blue-500" />
                                <p className="text-slate-500 text-sm italic font-medium">Fetching department heads...</p>
                              </div>
                            </td>
                          </tr>
                        ) : secretaries.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                              No secretaries found. Click Manage to add one.
                            </td>
                          </tr>
                        ) : secretaries.map(s => (
                          <tr key={s._id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                            <td className="py-3.5 px-3">
                              <p className="font-semibold text-white text-sm">{s.fullName}</p>
                              <p className="text-slate-500 text-xs">{s.studentId}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${deptColor[s.department] || deptColor.mess}`}>
                                {deptLabelFull[s.department] || s.department}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`text-xs flex items-center gap-1.5 ${s.isVerified ? 'text-green-400' : 'text-slate-500'}`}>
                                <Circle size={6} className={s.isVerified ? 'fill-green-400' : 'fill-slate-500'} />
                                {s.isVerified ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="text-slate-400 text-xs">{getTimeAgo(s.lastLogin)}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-2.5">
                    {loadingSecretaries ? (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <RefreshCw size={20} className="animate-spin text-blue-500" />
                        <p className="text-slate-500 text-sm">Loading...</p>
                      </div>
                    ) : secretaries.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-6">No secretaries found.</p>
                    ) : secretaries.map(s => (
                      <div key={s._id} className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/40">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{s.fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs font-medium ${deptTextColor[s.department] || 'text-slate-400'}`}>{deptLabelShort[s.department] || s.department}</span>
                            <span className={`text-xs ${s.isVerified ? 'text-green-400' : 'text-slate-500'}`}>· {s.isVerified ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs flex-shrink-0">{getTimeAgo(s.lastLogin)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-bold text-white mb-0.5">Dept. Breakdown</h2>
                  <p className="text-xs text-slate-400 mb-3">Pending claims by department</p>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={departmentalData} cx="50%" cy="50%" outerRadius={70} dataKey="value" labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {departmentalData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                    {departmentalData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-slate-300">{d.name}</span>
                        </div>
                        <span className="text-xs font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'audit' && <AuditLogsView />}
          {activeView === 'settings' && <PortalSettingsView />}
          {activeView === 'profile' && <ProfileView onLogout={onLogout} />}
        </div>

        <BottomNav activeView={activeView} setActiveView={setActiveView} />
      </main>

      {showManageModal && <ManageSecretariesModal onClose={() => setShowManageModal(false)} />}
    </div>
  );
}
