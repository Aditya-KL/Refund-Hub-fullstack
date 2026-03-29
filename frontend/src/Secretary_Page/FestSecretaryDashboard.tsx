import React, { useState, useEffect } from 'react';
import {
  Home, Users, CheckSquare, Archive, User,
  Plus, Trash2, Star, Music, Zap, Globe, Mic,
  TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle,
  Search, Filter, RefreshCw, ChevronDown, Eye,
  RotateCcw, DollarSign, Pencil, Save, X, KeyRound, Loader2,
} from 'lucide-react';
import {
  SecretaryLayout, ClaimReviewPanel, StudentSearchInput,
  StatCard, StatusBadge, deptConfig,
  type Claim, type SecretaryUser, type FestCoordinator, type StudentUser,
} from './SecretaryShared';
import { apiService } from '../services/db_service';

const API_BASE = '/api';

// ─── Types ─────────────────────────────────────────────────────────────────────
type FestName = 'Celesta' | 'Infinito' | 'Anwesha' | 'TedX';
const FESTS: FestName[] = ['Celesta', 'Infinito', 'Anwesha', 'TedX'];
const festIcons: Record<FestName, any> = { Celesta: Music, Infinito: Zap, Anwesha: Globe, TedX: Mic };
const festColors: Record<FestName, string> = {
  Celesta: 'from-violet-500 to-purple-600',
  Infinito: 'from-blue-500 to-cyan-600',
  Anwesha: 'from-rose-500 to-pink-600',
  TedX: 'from-red-500 to-orange-600',
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const mockUser: SecretaryUser = {
  _id: 'sec_fest_001', fullName: 'Prof. Vikram Nair', employeeId: 'EMP-F01',
  email: 'vikram.nair@nit.edu', phone: '9876500001', department: 'fest',
  designation: 'Cultural Secretary', institution: 'National Institute of Technology',
  joinDate: '2022-07-01', lastLogin: new Date().toISOString(),
  isVerified: true, isSecretary: true, isSuperAdmin: false,
};

const mockFCList: FestCoordinator[] = [
  { userId: 'u10', fullName: 'Arjun Mehta', studentRoll: '21BCS045', email: 'arjun@nit.edu', festName: 'Celesta', assignedAt: '2026-01-10', isActive: true },
  { userId: 'u11', fullName: 'Sneha Patel', studentRoll: '21BEE023', email: 'sneha@nit.edu', festName: 'Celesta', assignedAt: '2026-01-10', isActive: true },
  { userId: 'u12', fullName: 'Rahul Das', studentRoll: '21BME011', email: 'rahul@nit.edu', festName: 'Infinito', assignedAt: '2026-02-01', isActive: true },
];

const mockClaims: Claim[] = [
  { _id: 'c1', claimRefId: 'FEST-2026-001', studentId: 'u20', studentName: 'Priya Sharma', studentRoll: '22BCS001', studentEmail: 'priya@nit.edu', department: 'fest', title: 'Celesta Participation Rebate', description: 'Participated in cultural events during Celesta 2026. Submitting for reimbursement of travel and accommodation.', amount: 1800, submittedAt: '2026-03-10T09:00:00Z', attachments: [{ url: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800', filename: 'receipt_celesta.jpg' }], status: 'verified', festName: 'Celesta', fcVerifiedBy: 'Arjun Mehta', fcVerifiedAt: '2026-03-11T10:00:00Z', fcComment: 'Participation confirmed. Receipts valid.' },
  { _id: 'c2', claimRefId: 'FEST-2026-002', studentId: 'u21', studentName: 'Amit Roy', studentRoll: '22BEE045', studentEmail: 'amit@nit.edu', department: 'fest', title: 'TedX Volunteer Reimbursement', description: 'Volunteer at TedX NIT 2026. Claiming for logistics and travel expenses.', amount: 1200, submittedAt: '2026-03-12T10:00:00Z', attachments: [], status: 'verified', festName: 'TedX', fcComment: 'Verified volunteer participation.' },
  { _id: 'c3', claimRefId: 'FEST-2026-003', studentId: 'u22', studentName: 'Kavya Menon', studentRoll: '22BCH010', studentEmail: 'kavya@nit.edu', department: 'fest', title: 'Anwesha Cultural Performance', description: 'Classical dance performance at Anwesha. Costume and travel reimbursement.', amount: 3500, submittedAt: '2026-03-13T11:00:00Z', attachments: [], status: 'approved', festName: 'Anwesha' },
  { _id: 'c4', claimRefId: 'FEST-2026-004', studentId: 'u23', studentName: 'Dev Patel', studentRoll: '22BCS088', studentEmail: 'dev@nit.edu', department: 'fest', title: 'Infinito Tech Event Rebate', description: 'Won inter-college hackathon at Infinito. Travel and logistics claim.', amount: 2200, submittedAt: '2026-03-14T08:00:00Z', attachments: [], status: 'rejected', festName: 'Infinito', rejectionReason: 'Missing original receipts.' },
];

// ─── Dynamic Profile Page ──────────────────────────────────────────────────────
function DynamicProfilePage({
  user,
  setUser,
}: {
  user: SecretaryUser | null;
  setUser: React.Dispatch<React.SetStateAction<SecretaryUser | null>>;
}) {
  const cfg = deptConfig.fest;

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
      <div className="rounded-2xl p-5 flex items-center gap-4 bg-gradient-to-r from-violet-500 to-purple-600">
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg leading-tight">{user.fullName}</p>
          <p className="text-white/80 text-sm">{user.designation} · Cultural &amp; Fest Cell</p>
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
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  maxLength={10}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  placeholder="10-digit number"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Institution</label>
                <input
                  value={editForm.institution}
                  onChange={e => setEditForm(f => ({ ...f, institution: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
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
              {
                label: 'Member Since',
                value: user.joinDate
                  ? new Date(user.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—',
              },
              {
                label: 'Last Login',
                value: user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—',
              },
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
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
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

// ─── Overview ──────────────────────────────────────────────────────────────────
function OverviewPage({ claims, fcList }: { claims: Claim[]; fcList: FestCoordinator[] }) {
  const stats = {
    total: claims.length,
    verified: claims.filter(c => c.status === 'verified').length,
    approved: claims.filter(c => c.status === 'approved').length,
    totalAmount: claims.filter(c => c.status === 'approved' || c.status === 'disbursed').reduce((s, c) => s + c.amount, 0),
  };
  const festStats = FESTS.map(f => ({
    name: f, total: claims.filter(c => c.festName === f).length,
    approved: claims.filter(c => c.festName === f && (c.status === 'approved' || c.status === 'disbursed')).length,
    amount: claims.filter(c => c.festName === f && (c.status === 'approved' || c.status === 'disbursed')).reduce((s, c) => s + c.amount, 0),
  }));

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">Cultural &amp; Fest reimbursement summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Claims" value={stats.total} icon={TrendingUp} color="bg-violet-100 text-violet-600" />
        <StatCard label="Awaiting Action" value={stats.verified} icon={Clock} color="bg-amber-100 text-amber-600" sub="Ready for your approval" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Total Approved ₹" value={`₹${(stats.totalAmount / 1000).toFixed(1)}K`} icon={DollarSign} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Fest-wise breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Fest-wise Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {festStats.map(f => {
            const Icon = festIcons[f.name as FestName];
            const grad = festColors[f.name as FestName];
            return (
              <div key={f.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.total} claims · {f.approved} approved</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-700">₹{f.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400">disbursed</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FC Summary */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Active Fest Coordinators</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {fcList.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No FCs assigned yet</div>
          ) : fcList.map((fc, i) => {
            const Icon = festIcons[fc.festName as FestName];
            const grad = festColors[fc.festName as FestName];
            return (
              <div key={fc.userId} className={`flex items-center gap-4 px-5 py-3.5 ${i < fcList.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{fc.fullName}</p>
                  <p className="text-xs text-slate-400">{fc.studentRoll} · {fc.festName}</p>
                </div>
                <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold">Active</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Appoint FC ────────────────────────────────────────────────────────────────
function AppointFCPage({ fcList, setFcList }: { fcList: FestCoordinator[]; setFcList: React.Dispatch<React.SetStateAction<FestCoordinator[]>> }) {
  const [selectedFest, setSelectedFest] = useState<FestName>('Celesta');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const festFCs = (fest: FestName) => fcList.filter(fc => fc.festName === fest);
  const canAdd = (fest: FestName) => festFCs(fest).length < 2;

  const handleSelect = (user: StudentUser, fest: FestName) => {
    if (fcList.some(fc => fc.userId === user._id && fc.festName === fest)) return;
    if (!canAdd(fest)) return;
    const newFC: FestCoordinator = {
      userId: user._id, fullName: user.fullName, studentRoll: user.studentId,
      email: user.email, festName: fest, assignedAt: new Date().toISOString(), isActive: true,
    };
    setFcList(prev => [...prev, newFC]);
  };

  const handleRemove = (userId: string, fest: FestName) => {
    setFcList(prev => prev.filter(fc => !(fc.userId === userId && fc.festName === fest)));
    setConfirmRemove(null);
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Appoint Fest Coordinators</h2>
        <p className="text-slate-500 text-sm mt-0.5">Assign up to 2 FCs per fest. They can verify reimbursement claims.</p>
      </div>

      {/* Fest tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FESTS.map(fest => {
          const Icon = festIcons[fest];
          const grad = festColors[fest];
          const active = selectedFest === fest;
          return (
            <button key={fest} onClick={() => setSelectedFest(fest)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${active ? 'text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
              style={active ? { background: `linear-gradient(135deg, ${grad.includes('violet') ? '#8b5cf6,#7c3aed' : grad.includes('blue') ? '#3b82f6,#06b6d4' : grad.includes('rose') ? '#f43f5e,#ec4899' : '#ef4444,#f97316'})` } : {}}>
              <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
              {fest}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {festFCs(fest).length}/2
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Assigned FCs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">Assigned to {selectedFest}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{festFCs(selectedFest).length}/2 slots filled</p>
          </div>
          <div className="divide-y divide-slate-100">
            {festFCs(selectedFest).length === 0 ? (
              <div className="py-12 text-center">
                <Star size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No FCs assigned for {selectedFest}</p>
              </div>
            ) : festFCs(selectedFest).map(fc => (
              <div key={fc.userId} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${festColors[selectedFest]} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-xs">{fc.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{fc.fullName}</p>
                  <p className="text-xs text-slate-400">{fc.studentRoll} · {fc.email}</p>
                  <p className="text-xs text-slate-300 mt-0.5">Since {new Date(fc.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
                <button onClick={() => setConfirmRemove(`${fc.userId}:${fc.festName}`)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add FC */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-1">Add New FC for {selectedFest}</h3>
          <p className="text-xs text-slate-400 mb-4">Search by roll number or email</p>
          {canAdd(selectedFest) ? (
            <StudentSearchInput placeholder="Search student by roll no. or email..." onSelect={u => handleSelect(u, selectedFest)} />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-700">Maximum 2 FCs reached for {selectedFest}</p>
              <p className="text-xs text-amber-500 mt-1">Remove an existing FC to add a new one</p>
            </div>
          )}
          <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
            <p className="text-xs text-violet-700 leading-relaxed">
              <strong>Note:</strong> Assigned FCs receive the role <code className="bg-violet-100 px-1 rounded">{selectedFest}_FC</code> and can verify fest reimbursement claims. Removing them will revoke this role.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Remove Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Remove FC?</h4>
                <p className="text-slate-500 text-sm">Their {selectedFest}_FC role will be revoked.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
              <button onClick={() => { const [userId, fest] = confirmRemove.split(':'); handleRemove(userId, fest as FestName); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approve Reimbursements ────────────────────────────────────────────────────
function ApproveReimbursementsPage({ claims, setClaims }: { claims: Claim[]; setClaims: React.Dispatch<React.SetStateAction<Claim[]>> }) {
  const [selected, setSelected] = useState<Claim | null>(null);
  const [festFilter, setFestFilter] = useState<FestName | 'All'>('All');
  const [search, setSearch] = useState('');

  const queue = claims.filter(c => c.status === 'verified');
  const filtered = queue.filter(c => {
    const ms = search.toLowerCase();
    return (festFilter === 'All' || c.festName === festFilter) &&
      (c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms) || c.studentRoll.toLowerCase().includes(ms));
  });

  const handleApprove = (id: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'approved', approvedAt: new Date().toISOString() } : c));
  };
  const handleReject = (id: string, reason: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() } : c));
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Approve Reimbursements</h2>
          <p className="text-slate-500 text-sm mt-0.5">Claims verified by FCs — awaiting your final approval</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold self-start sm:self-auto">
          <Clock size={14} /> {queue.length} pending
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll no., ref ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['All', ...FESTS] as (FestName | 'All')[]).map(f => (
            <button key={f} onClick={() => setFestFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${festFilter === f ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-violet-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <CheckCircle size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No claims awaiting approval</p>
          <p className="text-slate-300 text-sm mt-1">All FC-verified claims have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Ref ID', 'Student', 'Fest', 'Amount', 'FC Note', 'Action'].map(h => (
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      {claim.festName && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">{claim.festName}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-violet-700">₹{claim.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="text-xs text-slate-500 truncate">{claim.fcComment ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button onClick={() => setSelected(claim)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors">
                        <Eye size={13} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <ClaimReviewPanel claim={selected} department="fest" onClose={() => setSelected(null)}
          onApprove={handleApprove} onReject={handleReject} mode="approve" />
      )}
    </div>
  );
}

// ─── Verified Reimbursements ───────────────────────────────────────────────────
function VerifiedPage({ claims, setClaims }: { claims: Claim[]; setClaims: React.Dispatch<React.SetStateAction<Claim[]>> }) {
  const [selected, setSelected] = useState<Claim | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'disbursed'>('all');

  const verified = claims.filter(c => ['approved', 'rejected', 'disbursed'].includes(c.status));
  const filtered = verified.filter(c => {
    const ms = search.toLowerCase();
    return (statusFilter === 'all' || c.status === statusFilter) &&
      (c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms));
  });

  const handleUnverify = (id: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'verified' } : c));
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Verified Reimbursements</h2>
        <p className="text-slate-500 text-sm mt-0.5">All processed claims — you can still revert approved ones</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claims..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'approved', 'rejected', 'disbursed'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-violet-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400"><p className="text-sm">No claims found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Ref ID', 'Student', 'Fest', 'Amount', 'Status', 'Date', 'Action'].map(h => (
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
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-violet-600">{claim.festName}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-violet-700">₹{claim.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(claim.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(claim)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye size={14} />
                        </button>
                        {claim.status === 'approved' && (
                          <button onClick={() => handleUnverify(claim._id)} className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Revert to Verified">
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
        <ClaimReviewPanel claim={selected} department="fest" onClose={() => setSelected(null)} mode="view" />
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function FestSecretaryDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState('overview');
  const [user, setUser] = useState<SecretaryUser | null>(null);
  const [claims, setClaims] = useState<Claim[]>(mockClaims);
  const [fcList, setFcList] = useState<FestCoordinator[]>(mockFCList);

  // ── Fetch real user from localStorage (set during login)
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed._id && !parsed._id.startsWith('sec_')) {
          setUser({
            _id: parsed._id,
            fullName: parsed.fullName,
            employeeId: parsed.studentId || mockUser.employeeId,
            email: parsed.email,
            phone: parsed.phone || '',
            department: parsed.department || 'fest',
            designation: parsed.isSecretary ? 'Cultural Secretary' : mockUser.designation,
            institution: parsed.institution || mockUser.institution,
            joinDate: mockUser.joinDate,
            lastLogin: parsed.lastLogin || new Date().toISOString(),
            isVerified: parsed.isVerified ?? true,
            isSecretary: parsed.isSecretary ?? true,
            isSuperAdmin: parsed.isSuperAdmin ?? false,
          });
          return;
        }
      } catch (_) {}
    }
    // Fallback to mock if no real session found
    setUser(mockUser);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appoint', label: 'Appoint FC', icon: Users },
    { id: 'approve', label: 'Approve Reimb.', icon: CheckSquare },
    { id: 'verified', label: 'Verified', icon: Archive },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <SecretaryLayout
      department="fest" navItems={navItems} activeView={activeView}
      setActiveView={setActiveView} onLogout={onLogout} user={user ?? mockUser}
      title="Cultural & Fest Cell" subtitle="Secretary Dashboard"
    >
      {activeView === 'overview' && <OverviewPage claims={claims} fcList={fcList} />}
      {activeView === 'appoint' && <AppointFCPage fcList={fcList} setFcList={setFcList} />}
      {activeView === 'approve' && <ApproveReimbursementsPage claims={claims} setClaims={setClaims} />}
      {activeView === 'verified' && <VerifiedPage claims={claims} setClaims={setClaims} />}
      {activeView === 'profile' && <DynamicProfilePage user={user} setUser={setUser} />}
    </SecretaryLayout>
  );
}
