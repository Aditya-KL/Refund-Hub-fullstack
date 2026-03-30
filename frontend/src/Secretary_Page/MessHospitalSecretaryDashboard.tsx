import React, { useState, useEffect } from 'react';
import {
  Home, ClipboardList, Archive, User,
  TrendingUp, Clock, CheckCircle, DollarSign,
  Search, Eye, RotateCcw, Pencil, Save, X,
  KeyRound, Loader2,
} from 'lucide-react';
import {
  SecretaryLayout, ClaimReviewPanel,
  StatCard, StatusBadge, deptConfig,
  type Claim, type SecretaryUser, type Department,
} from './SecretaryShared';
import { apiService } from '../services/db_service';

const API_BASE = '/api';

// ─── Mock Claims Data (unchanged) ─────────────────────────────────────────────
const mockMessClaims: Claim[] = [
  { _id: 'm1', claimRefId: 'MESS-2026-001', studentId: 'u30', studentName: 'Rahul Kumar', studentRoll: '22BCS020', studentEmail: 'rahul@nit.edu', department: 'mess', title: 'Mess Rebate — March 2026', description: 'Applied for mess rebate during home leave from 1st–10th March 2026. Total 10 days absence.', amount: 1500, submittedAt: '2026-03-12T08:00:00Z', attachments: [{ url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', filename: 'leave_card.jpg' }], status: 'pending', messAbsenceFrom: '2026-03-01', messAbsenceTo: '2026-03-10', messAbsenceDays: 10 },
  { _id: 'm2', claimRefId: 'MESS-2026-002', studentId: 'u31', studentName: 'Neha Singh', studentRoll: '22BEE031', studentEmail: 'neha@nit.edu', department: 'mess', title: 'Mess Rebate — Medical Leave', description: 'Medical leave for surgery recovery from 5th–20th February 2026.', amount: 2100, submittedAt: '2026-03-08T10:00:00Z', attachments: [], status: 'verified', messAbsenceFrom: '2026-02-05', messAbsenceTo: '2026-02-20', messAbsenceDays: 15, verifierComment: 'Medical documents verified. Leave card confirmed.' },
  { _id: 'm3', claimRefId: 'MESS-2026-003', studentId: 'u32', studentName: 'Karan Mehta', studentRoll: '21BCE044', studentEmail: 'karan@nit.edu', department: 'mess', title: 'Mess Rebate — Internship', description: 'Off-campus internship from January 20 to February 15, 2026.', amount: 2800, submittedAt: '2026-02-20T09:30:00Z', attachments: [], status: 'approved', messAbsenceDays: 20 },
  { _id: 'm4', claimRefId: 'MESS-2026-004', studentId: 'u33', studentName: 'Pooja Iyer', studentRoll: '22BCS077', studentEmail: 'pooja@nit.edu', department: 'mess', title: 'Mess Rebate — Home Leave', description: 'Leave during semester break, 25th Dec 2025 – 5th Jan 2026.', amount: 1750, submittedAt: '2026-01-10T07:00:00Z', attachments: [], status: 'rejected', rejectionReason: 'Leave form not stamped by warden.' },
];

const mockHospitalClaims: Claim[] = [
  { _id: 'h1', claimRefId: 'MED-2026-001', studentId: 'u40', studentName: 'Amit Patel', studentRoll: '22BME015', studentEmail: 'amit@nit.edu', department: 'hospital', title: 'Medical Treatment Reimbursement', description: 'Emergency appendix surgery at Apollo Hospital, Bhubaneswar on 2nd March 2026.', amount: 12500, submittedAt: '2026-03-10T08:00:00Z', attachments: [{ url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', filename: 'hospital_bill.jpg' }], status: 'pending' },
  { _id: 'h2', claimRefId: 'MED-2026-002', studentId: 'u41', studentName: 'Sunita Das', studentRoll: '22BCS055', studentEmail: 'sunita@nit.edu', department: 'hospital', title: 'Prescription Medicine Reimbursement', description: 'Prescribed medication for chronic condition — 3 months supply.', amount: 3200, submittedAt: '2026-03-05T10:00:00Z', attachments: [], status: 'verified', verifierComment: 'Doctor prescription verified. Campus health center confirmed.' },
  { _id: 'h3', claimRefId: 'MED-2026-003', studentId: 'u42', studentName: 'Rohan Verma', studentRoll: '21BEC010', studentEmail: 'rohan@nit.edu', department: 'hospital', title: 'Dental Treatment Claim', description: 'Dental surgery claim including consultation and procedure at empanelled hospital.', amount: 5500, submittedAt: '2026-02-28T11:00:00Z', attachments: [], status: 'approved' },
];

// ─── Dynamic Profile Page ──────────────────────────────────────────────────────
function DynamicProfilePage({
  user,
  setUser,
  department,
}: {
  user: SecretaryUser | null;
  setUser: React.Dispatch<React.SetStateAction<SecretaryUser | null>>;
  department: Department;
}) {
  const cfg = deptConfig[department];

  // ── Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', institution: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // ── Password state
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Seed edit form whenever user loads / changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName ?? '',
        phone: user.phone ?? '',
        institution: user.institution ?? '',
      });
    }
  }, [user]);

  // ── Save profile edits to DB
  const handleSaveProfile = async () => {
    if (!user) return;
    setEditError('');
    setEditSuccess('');

    const phoneRegex = /^\d{10}$/;
    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      setEditError('Phone number must be exactly 10 digits.');
      return;
    }

    setEditLoading(true);
    try {
      const result = await apiService.updateUserData(user._id, {
        fullName: editForm.fullName,
        phone: editForm.phone,
        institution: editForm.institution,
      });
      // Merge updated fields back into local state
      setUser(prev => prev ? { ...prev, ...result.user } : prev);
      setEditSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Change password via DB
  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (!user) return;

    setPwLoading(true);
    try {
      await apiService.changePassword(user._id, pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Loading skeleton
  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const initials = user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5 max-w-3xl mx-auto">

      {/* ── Header card */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: cfg.accent }}>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg leading-tight">{user.fullName}</p>
          <p className="text-white/80 text-sm">{user.designation} · {cfg.label}</p>
          <p className="text-white/60 text-xs mt-0.5">{user.employeeId}</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => { setIsEditing(true); setEditSuccess(''); setEditError(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      {/* ── Edit success banner */}
      {editSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle size={16} /> {editSuccess}
        </div>
      )}

      {/* ── Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        <h3 className="font-bold text-slate-700">Personal Information</h3>

        {isEditing ? (
          // ── Edit form (no bio / address)
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': cfg.accent } as any}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  maxLength={10}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': cfg.accent } as any}
                  placeholder="10-digit number"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Institution</label>
                <input
                  value={editForm.institution}
                  onChange={e => setEditForm(f => ({ ...f, institution: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': cfg.accent } as any}
                />
              </div>
            </div>

            {editError && (
              <p className="text-red-500 text-xs flex items-center gap-1"><X size={13} /> {editError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={editLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
                style={{ background: cfg.accent }}
              >
                {editLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editLoading ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditError(''); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // ── Read-only view
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: 'Full Name', value: user.fullName },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone || '—' },
              { label: 'Employee ID', value: user.employeeId },
              { label: 'Designation', value: user.designation || '—' },
              { label: 'Institution', value: user.institution || '—' },
              { label: 'Member Since', value: user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Last Login', value: user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' },
            ].map(field => (
              <div key={field.label}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{field.label}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{field.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <button
          onClick={() => { setShowPassword(v => !v); setPwError(''); setPwSuccess(''); }}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-500" />
            <span className="font-bold text-slate-700 text-sm">Change Password</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{showPassword ? '▲ Hide' : '▼ Show'}</span>
        </button>

        {showPassword && (
          <div className="mt-5 space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword' },
              { label: 'New Password', key: 'newPassword' },
              { label: 'Confirm New Password', key: 'confirmPassword' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</label>
                <input
                  type="password"
                  value={pwForm[field.key as keyof typeof pwForm]}
                  onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': cfg.accent } as any}
                  placeholder="••••••••"
                />
              </div>
            ))}

            {pwError && (
              <p className="text-red-500 text-xs flex items-center gap-1"><X size={13} /> {pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-green-600 text-xs flex items-center gap-1"><CheckCircle size={13} /> {pwSuccess}</p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
              style={{ background: cfg.accent }}
            >
              {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Page (unchanged logic) ──────────────────────────────────────────
function OverviewPage({ claims, dept }: { claims: Claim[]; dept: Department }) {
  const cfg = deptConfig[dept];
  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    verified: claims.filter(c => c.status === 'verified').length,
    approved: claims.filter(c => c.status === 'approved' || c.status === 'disbursed').length,
    totalAmt: claims.filter(c => c.status === 'approved' || c.status === 'disbursed').reduce((s, c) => s + c.amount, 0),
    rejectedAmt: claims.filter(c => c.status === 'rejected').length,
  };

  const recent = [...claims].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">{cfg.label} claim summary</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Claims" value={stats.total} icon={TrendingUp} color={`bg-${dept === 'mess' ? 'emerald' : 'blue'}-100 text-${dept === 'mess' ? 'emerald' : 'blue'}-600`} />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Approved Value" value={`₹${(stats.totalAmt / 1000).toFixed(1)}K`} icon={DollarSign} color="bg-teal-100 text-teal-600" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-4 text-sm">Status Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'Pending', count: stats.pending, color: 'bg-amber-400', max: stats.total },
            { label: 'Verified', count: stats.verified, color: 'bg-blue-400', max: stats.total },
            { label: 'Approved', count: stats.approved, color: 'bg-green-400', max: stats.total },
            { label: 'Rejected', count: stats.rejectedAmt, color: 'bg-red-400', max: stats.total },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-16 text-right font-medium">{row.label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${row.color} transition-all`}
                  style={{ width: row.max ? `${(row.count / row.max) * 100}%` : '0%' }} />
              </div>
              <span className="text-xs font-bold text-slate-700 w-6 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Recent Submissions</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {recent.length === 0
            ? <div className="py-10 text-center text-slate-400 text-sm">No claims yet</div>
            : recent.map(c => (
              <div key={c._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{c.studentName}</p>
                  <p className="text-xs text-slate-400">{c.claimRefId} · {new Date(c.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
                <span className="font-bold text-slate-700 text-sm whitespace-nowrap">₹{c.amount.toLocaleString('en-IN')}</span>
                <StatusBadge status={c.status} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Claims Page ───────────────────────────────────────────────────────────────
function ClaimsPage({ claims, setClaims, dept }: { claims: Claim[]; setClaims: React.Dispatch<React.SetStateAction<Claim[]>>; dept: Department }) {
  const [selected, setSelected] = useState<Claim | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const cfg = deptConfig[dept];

  const filtered = claims.filter(c => {
    const ms = search.toLowerCase();
    return (statusFilter === 'all' || c.status === statusFilter) &&
      (c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms) || c.studentRoll.toLowerCase().includes(ms));
  });

  const handleVerify = (id: string, comment: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'verified', verifierComment: comment, verifiedAt: new Date().toISOString() } : c));
  };
  const handleReject = (id: string, reason: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'rejected', rejectionReason: reason } : c));
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{dept === 'mess' ? 'Mess Rebate Claims' : 'Medical Claims'}</h2>
          <p className="text-slate-500 text-sm mt-0.5">Review, verify or reject incoming claims</p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold">
          <Clock size={14} /> {claims.filter(c => c.status === 'pending').length} pending
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll no., ref ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': cfg.accent } as any} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'pending', 'verified', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${statusFilter === s ? 'text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
              style={statusFilter === s ? { background: cfg.accent } : {}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0
          ? <div className="py-16 text-center text-slate-400"><p className="text-sm">No claims found</p></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Ref ID', 'Student', ...(dept === 'mess' ? ['Days'] : []), 'Amount', 'Date', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(claim => (
                    <tr key={claim._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{claim.claimRefId}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-700 text-sm">{claim.studentName}</p>
                        <p className="text-xs text-slate-400">{claim.studentRoll}</p>
                      </td>
                      {dept === 'mess' && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded-full">
                            {claim.messAbsenceDays ?? '—'} days
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold" style={{ color: cfg.accent }}>₹{claim.amount.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                        {new Date(claim.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={claim.status} /></td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button onClick={() => setSelected(claim)}
                          className="flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-bold transition-colors"
                          style={{ background: cfg.accent }}>
                          <Eye size={13} /> {claim.status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {selected && (
        <ClaimReviewPanel claim={selected} department={dept} onClose={() => setSelected(null)}
          onVerify={handleVerify} onReject={handleReject}
          mode={selected.status === 'pending' ? 'verify' : 'view'} />
      )}
    </div>
  );
}

// ─── Verified Rebates Page ─────────────────────────────────────────────────────
function VerifiedRebatesPage({ claims, setClaims, dept }: { claims: Claim[]; setClaims: React.Dispatch<React.SetStateAction<Claim[]>>; dept: Department }) {
  const [selected, setSelected] = useState<Claim | null>(null);
  const [search, setSearch] = useState('');
  const cfg = deptConfig[dept];

  const verified = claims.filter(c => c.status === 'verified' || c.status === 'approved' || c.status === 'disbursed');
  const filtered = verified.filter(c => {
    const ms = search.toLowerCase();
    return c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms);
  });

  const handleUnverify = (id: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'pending', verifierComment: undefined, verifiedAt: undefined } : c));
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Verified {dept === 'mess' ? 'Rebates' : 'Claims'}</h2>
        <p className="text-slate-500 text-sm mt-0.5">All verified records — you can unverify if needed</p>
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search verified claims..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': cfg.accent } as any} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Verified', count: claims.filter(c => c.status === 'verified').length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Approved', count: claims.filter(c => c.status === 'approved').length, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Disbursed', count: claims.filter(c => c.status === 'disbursed').length, color: 'bg-purple-50 text-purple-700 border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
            <p className="text-xl font-black">{s.count}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0
          ? <div className="py-16 text-center text-slate-400"><p className="text-sm">No verified claims found</p></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Ref ID', 'Student', 'Amount', 'Status', 'Verified Comment', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(claim => (
                    <tr key={claim._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{claim.claimRefId}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-700 text-sm">{claim.studentName}</p>
                        <p className="text-xs text-slate-400">{claim.studentRoll}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold" style={{ color: cfg.accent }}>₹{claim.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={claim.status} /></td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-slate-500 truncate">{claim.verifierComment ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelected(claim)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={14} /></button>
                          {claim.status === 'verified' && (
                            <button onClick={() => handleUnverify(claim._id)} className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Unverify">
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      {selected && (
        <ClaimReviewPanel claim={selected} department={dept} onClose={() => setSelected(null)} mode="view"
          onUnverify={selected.status === 'verified' ? (id) => { handleUnverify(id); setSelected(null); } : undefined} />
      )}
    </div>
  );
}

// ─── Shared Dashboard Shell ────────────────────────────────────────────────────
// Handles fetching the real user from DB on mount, with fallback to mock data
function SecretaryDashboardShell({
  department,
  fallbackUser,
  mockClaims,
  onLogout,
  navItems,
  title,
  subtitle,
}: {
  department: Department;
  fallbackUser: SecretaryUser;
  mockClaims: Claim[];
  onLogout: () => void;
  navItems: { id: string; label: string; icon: any }[];
  title: string;
  subtitle: string;
}) {
  const [activeView, setActiveView] = useState('overview');
  const [user, setUser] = useState<SecretaryUser | null>(null);
  const [claims, setClaims] = useState<Claim[]>(mockClaims);

  // ── Fetch real user profile from DB on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // If we have a real _id from login, fetch full profile from DB
        if (parsed._id && !parsed._id.startsWith('sec_')) {
          apiService.updateUserData(parsed._id, {}).catch(() => null); // warm-up optional
          // Use stored login data immediately, then enrich from DB if needed
          setUser({
            _id: parsed._id,
            fullName: parsed.fullName,
            employeeId: parsed.studentId || fallbackUser.employeeId,
            email: parsed.email,
            phone: parsed.phone || '',
            department: parsed.department || department,
            designation: parsed.isSecretary ? `${title.split(' ')[0]} Secretary` : fallbackUser.designation,
            institution: parsed.institution || fallbackUser.institution,
            joinDate: fallbackUser.joinDate,
            lastLogin: parsed.lastLogin || new Date().toISOString(),
            isVerified: parsed.isVerified ?? true,
            isSecretary: parsed.isSecretary ?? true,
            isSuperAdmin: parsed.isSuperAdmin ?? false,
          });
          return;
        }
      } catch (_) {}
    }
    // Fallback to mock if no real login session found
    setUser(fallbackUser);
  }, []);

  return (
    <SecretaryLayout
      department={department}
      navItems={navItems}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={onLogout}
      user={user ?? fallbackUser}
      title={title}
      subtitle={subtitle}
    >
      {activeView === 'overview' && <OverviewPage claims={claims} dept={department} />}
      {activeView === 'claims' && <ClaimsPage claims={claims} setClaims={setClaims} dept={department} />}
      {activeView === 'verified' && <VerifiedRebatesPage claims={claims} setClaims={setClaims} dept={department} />}
      {activeView === 'profile' && (
        <DynamicProfilePage user={user} setUser={setUser} department={department} />
      )}
    </SecretaryLayout>
  );
}

// ─── Mess Secretary Dashboard ──────────────────────────────────────────────────
const mockMessUser: SecretaryUser = {
  _id: 'sec_mess_001', fullName: 'Dr. Rajesh Kumar', employeeId: 'EMP-M01',
  email: 'rajesh.kumar@nit.edu', phone: '9876500002', department: 'mess',
  designation: 'Mess Secretary', institution: 'Indian Institute of Technology Patna',
  joinDate: '2021-08-01', lastLogin: new Date().toISOString(),
  isVerified: true, isSecretary: true, isSuperAdmin: false,
};

export function MessSecretaryDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <SecretaryDashboardShell
      department="mess"
      fallbackUser={mockMessUser}
      mockClaims={mockMessClaims}
      onLogout={onLogout}
      navItems={[
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'claims', label: 'Mess Claims', icon: ClipboardList },
        { id: 'verified', label: 'Verified Rebates', icon: Archive },
        { id: 'profile', label: 'Profile', icon: User },
      ]}
      title="Mess Department"
      subtitle="Secretary Dashboard"
    />
  );
}

// ─── Hospital Secretary Dashboard ─────────────────────────────────────────────
const mockHospitalUser: SecretaryUser = {
  _id: 'sec_hosp_001', fullName: 'Prof. Anita Sharma', employeeId: 'EMP-H01',
  email: 'anita.sharma@nit.edu', phone: '9876500003', department: 'hospital',
  designation: 'Medical Secretary', institution: 'Indian Institute of Technology Patna',
  joinDate: '2020-06-15', lastLogin: new Date().toISOString(),
  isVerified: true, isSecretary: true, isSuperAdmin: false,
};

export function HospitalSecretaryDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <SecretaryDashboardShell
      department="hospital"
      fallbackUser={mockHospitalUser}
      mockClaims={mockHospitalClaims}
      onLogout={onLogout}
      navItems={[
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'claims', label: 'Medical Claims', icon: ClipboardList },
        { id: 'verified', label: 'Verified Claims', icon: Archive },
        { id: 'profile', label: 'Profile', icon: User },
      ]}
      title="Medical Department"
      subtitle="Secretary Dashboard"
    />
  );
}
