import React, { useState, useEffect, useRef } from 'react';
import {
  Home, LogOut, User, Menu, X, ChevronRight,
  CheckCircle, XCircle, Clock, AlertTriangle, Eye,
  Search, RefreshCw,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Department = 'fest' | 'mess' | 'hospital' | 'account';

export interface SecretaryUser {
  _id: string;
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  institution: string;
  joinDate: string;
  lastLogin: string;
  isVerified: boolean;
  isSecretary: boolean;
  isSuperAdmin: boolean;
  bio?: string;
  address?: string;
}

export interface Claim {
  _id: string;
  claimRefId: string;           // human-readable e.g. CLM-2026-001
  studentId: string;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  department: Department;
  title: string;
  description: string;
  amount: number;
  submittedAt: string;
  attachments: { url: string; filename: string }[];
  status: 'pending' | 'verified' | 'approved' | 'rejected' | 'disbursed';
  verifiedBy?: string;
  verifiedAt?: string;
  verifierComment?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  disbursedAmount?: number;
  disbursementRef?: string;
  // Mess-specific
  messAbsenceFrom?: string;
  messAbsenceTo?: string;
  messAbsenceDays?: number;
  // Fest-specific
  festName?: 'Celesta' | 'Infinito' | 'Anwesha' | 'TedX';
  fcVerifiedBy?: string;
  fcVerifiedAt?: string;
  fcComment?: string;
}

export interface StudentUser {
  _id: string;
  fullName: string;
  studentId: string;   // roll no
  email: string;
  phone?: string;
  role: string;
  department?: string;
}

export interface FestCoordinator {
  userId: string;
  fullName: string;
  studentRoll: string;
  email: string;
  festName: 'Celesta' | 'Infinito' | 'Anwesha' | 'TedX';
  assignedAt: string;
  isActive: boolean;
}

export interface RefundRecord {
  _id: string;
  claimId: string;
  claimRefId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  department: Department;
  amount: number;
  refundedAt: string;
  refundedBy: string;
  transactionRef: string;
  notes?: string;
}

// ─── API Base ──────────────────────────────────────────────────────────────────
export const API_BASE = '/api';

// ─── Department Config ─────────────────────────────────────────────────────────
export const deptConfig = {
  fest: {
    label: 'Cultural & Fest Cell',
    shortLabel: 'Fest',
    accent: '#8b5cf6',
    accentLight: '#ede9fe',
    accentDark: '#6d28d9',
    gradient: 'from-violet-700 via-purple-700 to-indigo-700',
    headerBg: 'bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700',
    sidebarBg: 'bg-[#1e1332]',
    activeNav: 'bg-violet-600 text-white',
    hoverNav: 'hover:bg-violet-900/40',
    badge: 'bg-violet-100 text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-700',
    ring: 'ring-violet-500',
    tag: 'text-violet-600',
  },
  mess: {
    label: 'Mess Department',
    shortLabel: 'Mess',
    accent: '#10b981',
    accentLight: '#d1fae5',
    accentDark: '#047857',
    gradient: 'from-emerald-700 via-teal-700 to-green-700',
    headerBg: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700',
    sidebarBg: 'bg-[#0d1f1a]',
    activeNav: 'bg-emerald-600 text-white',
    hoverNav: 'hover:bg-emerald-900/40',
    badge: 'bg-emerald-100 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-500',
    tag: 'text-emerald-600',
  },
  hospital: {
    label: 'Medical Department',
    shortLabel: 'Medical',
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    accentDark: '#1d4ed8',
    gradient: 'from-blue-700 via-sky-700 to-cyan-700',
    headerBg: 'bg-gradient-to-r from-blue-700 via-sky-700 to-cyan-700',
    sidebarBg: 'bg-[#0b1a2e]',
    activeNav: 'bg-blue-600 text-white',
    hoverNav: 'hover:bg-blue-900/40',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    tag: 'text-blue-600',
  },
  account: {
    label: 'Accounts Department',
    shortLabel: 'Accounts',
    accent: '#f59e0b',
    accentLight: '#fef3c7',
    accentDark: '#b45309',
    gradient: 'from-amber-600 via-orange-600 to-yellow-600',
    headerBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600',
    sidebarBg: 'bg-[#1e1505]',
    activeNav: 'bg-amber-600 text-white',
    hoverNav: 'hover:bg-amber-900/40',
    badge: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-500 hover:bg-amber-600',
    ring: 'ring-amber-500',
    tag: 'text-amber-600',
  },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: Claim['status'] }) {
  const map = {
    pending:   { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    verified:  { label: 'Verified',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    approved:  { label: 'Approved',  cls: 'bg-green-100 text-green-700 border-green-200' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-100 text-red-700 border-red-200' },
    disbursed: { label: 'Disbursed', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">{value}</p>
        <p className="text-sm font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Shared Secretary Layout (Sidebar + Topbar) ────────────────────────────────
interface SecretaryLayoutProps {
  department: Department;
  navItems: { id: string; label: string; icon: any }[];
  activeView: string;
  setActiveView: (v: string) => void;
  onLogout: () => void;
  user?: SecretaryUser | null;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function SecretaryLayout({
  department, navItems, activeView, setActiveView,
  onLogout, user, title, subtitle, children,
}: SecretaryLayoutProps) {
  const cfg = deptConfig[department];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarInner = ({ onClose }: { onClose?: () => void }) => (
    <div className={`flex flex-col h-full ${cfg.sidebarBg}`}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.accent }}>
            <span className="text-white font-black text-sm">{cfg.shortLabel[0]}</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{cfg.shortLabel}</p>
            <p className="text-white/40 text-xs">Secretary Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User chip */}
      {user && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
              style={{ background: cfg.accent }}>
              {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{user.fullName}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id}
              onClick={() => { setActiveView(item.id); onClose?.(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${active ? cfg.activeNav + ' shadow-lg' : 'text-white/60 ' + cfg.hoverNav + ' hover:text-white'}`}>
              <Icon size={18} className={active ? 'text-white' : 'text-white/50 group-hover:text-white'} />
              <span className="font-medium text-sm">{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 shadow-xl">
        <SidebarInner />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 shadow-2xl flex flex-col">
            <SidebarInner onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className={`${cfg.headerBg} px-4 sm:px-6 py-4 flex-shrink-0 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white leading-tight">{title}</h1>
                <p className="text-xs text-white/70 hidden sm:block">{subtitle}</p>
              </div>
            </div>
            {/* Top right corner cleared to match Admin layout */}
            <div className="flex items-center gap-2"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
+
        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
          style={{ background: cfg.sidebarBg, borderTop: `1px solid rgba(255,255,255,0.1)` }}>
          <div className="flex items-stretch h-16">
            {navItems.slice(0, 4).map(item => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button key={item.id} onClick={() => setActiveView(item.id)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'text-white' : 'text-white/40'}`}>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: cfg.accent }} />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="text-[10px] font-medium truncate px-1">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

// ─── Claim Review Side Panel (shared across all depts) ────────────────────────
interface ClaimPanelProps {
  claim: Claim;
  department: Department;
  onClose: () => void;
  onVerify?: (id: string, comment: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onUnverify?: (id: string) => void;
  mode: 'verify' | 'approve' | 'view';
}

export function ClaimReviewPanel({ claim, department, onClose, onVerify, onApprove, onReject, onUnverify, mode }: ClaimPanelProps) {
  const cfg = deptConfig[department];
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [tab, setTab] = useState<'details' | 'docs'>('details');

  const handleVerify = () => {
    if (!comment.trim()) return;
    onVerify?.(claim._id, comment);
    onClose();
  };

  const handleApprove = () => {
    onApprove?.(claim._id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject?.(claim._id, rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-end z-50">
      <div className="bg-white w-full sm:w-[580px] h-full sm:h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`${cfg.headerBg} p-5 flex-shrink-0`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-mono mb-1">{claim.claimRefId}</p>
              <h3 className="text-xl font-bold text-white">{claim.title}</h3>
              <p className="text-white/80 text-sm mt-1">{claim.studentName} · {claim.studentRoll}</p>
            </div>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-colors flex-shrink-0">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-black text-white">₹{claim.amount.toLocaleString('en-IN')}</span>
            <StatusBadge status={claim.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          {(['details', 'docs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'border-b-2 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              style={{ borderColor: tab === t ? cfg.accent : 'transparent' }}>
              {t === 'details' ? 'Claim Details' : 'Documents'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'details' && (
            <div className="space-y-5">
              {/* Basic info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Student', value: claim.studentName },
                  { label: 'Roll No', value: claim.studentRoll },
                  { label: 'Email', value: claim.studentEmail },
                  { label: 'Submitted', value: new Date(claim.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  ...(claim.messAbsenceFrom ? [{ label: 'Leave From', value: claim.messAbsenceFrom }, { label: 'Leave To', value: claim.messAbsenceTo ?? '-' }, { label: 'Days', value: String(claim.messAbsenceDays ?? '-') }] : []),
                  ...(claim.festName ? [{ label: 'Fest', value: claim.festName }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">{claim.description}</p>
              </div>

              {/* FC comment if any */}
              {claim.fcComment && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">FC Verification Note</p>
                  <p className="text-sm text-violet-800">{claim.fcComment}</p>
                  {claim.fcVerifiedAt && <p className="text-xs text-violet-400 mt-2">{new Date(claim.fcVerifiedAt).toLocaleDateString('en-IN')}</p>}
                </div>
              )}

              {/* Verifier comment if any */}
              {claim.verifierComment && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Verification Note</p>
                  <p className="text-sm text-blue-800">{claim.verifierComment}</p>
                </div>
              )}

              {/* Rejection reason if any */}
              {claim.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Rejection Reason</p>
                  <p className="text-sm text-red-800">{claim.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'docs' && (
            <div className="space-y-4">
              {claim.attachments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">No documents attached</p>
                </div>
              ) : claim.attachments.map((att, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                  <img src={att.url} alt={att.filename} className="w-full object-contain max-h-96 bg-slate-100" />
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                    <p className="text-xs text-slate-500 font-mono truncate">{att.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-slate-200 space-y-3 flex-shrink-0 bg-white">
          {mode === 'verify' && (
            <>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder="Add verification comment (required)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': cfg.accent } as any} />
              <button onClick={handleVerify} disabled={!comment.trim()}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: cfg.accent }}>
                <CheckCircle size={16} className="inline mr-2" />
                Verify & Forward
              </button>
              {onUnverify && (
                <button onClick={() => { onUnverify(claim._id); onClose(); }} className="w-full py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm transition-all">
                  Unverify
                </button>
              )}
              {!showReject ? (
                <button onClick={() => setShowReject(true)} className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 text-sm transition-all">
                  <XCircle size={16} className="inline mr-2" />
                  Reject
                </button>
              ) : (
                <>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                    placeholder="Rejection reason (required)..."
                    className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReject(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold">Cancel</button>
                    <button onClick={handleReject} disabled={!rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">Confirm Reject</button>
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'approve' && (
            <>
              <button onClick={handleApprove} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="inline mr-2" />
                Approve & Process
              </button>
              {!showReject ? (
                <button onClick={() => setShowReject(true)} className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 text-sm">
                  <XCircle size={16} className="inline mr-2" />
                  Reject Claim
                </button>
              ) : (
                <>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                    placeholder="Rejection reason (required)..."
                    className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReject(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Cancel</button>
                    <button onClick={handleReject} disabled={!rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">Confirm Reject</button>
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'view' && (
            <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile View (shared, parameterized) ─────────────────────────────────────
export function SecretaryProfileView({ user, department, onSave }: { user: SecretaryUser; department: Department; onSave: (data: Partial<SecretaryUser>, newPassword?: string) => void }) {
  const cfg = deptConfig[department];
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ fullName: user.fullName, email: user.email, phone: user.phone, designation: user.designation, bio: user.bio ?? '', address: user.address ?? '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    onSave(editData);
    setSaving(false);
    setEditMode(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">My Profile</h2><p className="text-slate-500 text-sm mt-0.5">View and edit your account details</p></div>
        {success && <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><CheckCircle size={14} /> Saved</span>}
      </div>

      {/* Avatar + name card */}
      <div className={`rounded-2xl p-6 text-white bg-gradient-to-r ${cfg.gradient} flex items-center gap-5`}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black bg-white/20 flex-shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold truncate">{user.fullName}</p>
          <p className="text-white/80 text-sm">{user.designation} · {cfg.label}</p>
          <p className="text-white/60 text-xs mt-0.5">{user.employeeId}</p>
        </div>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex-shrink-0">Edit</button>
        )}
      </div>

      {/* Info / Edit */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm">Personal Information</h3>
          {editMode && (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs text-white rounded-lg font-semibold disabled:opacity-60" style={{ background: cfg.accent }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editMode ? (
            <>
              {[['fullName', 'Full Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['designation', 'Designation', 'text'], ['address', 'Address', 'text']].map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type={type} value={(editData as any)[key]} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': cfg.accent } as any} />
                </div>
              ))}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Bio</label>
                <textarea value={editData.bio} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 resize-none" style={{ '--tw-ring-color': cfg.accent } as any} />
              </div>
            </>
          ) : (
            [['Full Name', user.fullName], ['Email', user.email], ['Phone', user.phone], ['Employee ID', user.employeeId], ['Designation', user.designation], ['Institution', user.institution], ['Member Since', new Date(user.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })], ['Last Login', new Date(user.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })]].map(([label, value]) => (
              <div key={label} className="py-1">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5 break-words">{value}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowPwd(v => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
          <h3 className="font-bold text-slate-700 text-sm">Change Password</h3>
          <span className="text-xs text-slate-400">{showPwd ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showPwd && (
          <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
            {[['current', 'Current Password'], ['newPwd', 'New Password'], ['confirm', 'Confirm New Password']].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
                <input type="password" value={(pwdForm as any)[key]} onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': cfg.accent } as any} />
              </div>
            ))}
            <button onClick={() => { if (pwdForm.newPwd === pwdForm.confirm && pwdForm.newPwd.length >= 8) { onSave({}, pwdForm.newPwd); setShowPwd(false); setPwdForm({ current: '', newPwd: '', confirm: '' }); } }}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-bold" style={{ background: cfg.accent }}>
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Search & Lookup component ─────────────────────────────────────────────────
export function StudentSearchInput({ placeholder, onSelect, className }: { placeholder: string; onSelect: (user: StudentUser) => void; className?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Replace with real API call: GET /api/users/search?q={query}
  const mockSearch = async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setResults([
      { _id: 'u1', fullName: 'Arjun Mehta', studentId: '21BCS045', email: 'arjun@nit.edu', role: 'STUDENT' },
      { _id: 'u2', fullName: 'Sneha Patel', studentId: '21BEE023', email: 'sneha@nit.edu', role: 'STUDENT' },
    ].filter(u => u.fullName.toLowerCase().includes(q.toLowerCase()) || u.studentId.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));
    setLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={query} onChange={e => { setQuery(e.target.value); mockSearch(e.target.value); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        {loading && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20">
          {results.map(u => (
            <button key={u._id} onClick={() => { onSelect(u); setQuery(''); setResults([]); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 first:rounded-t-xl last:rounded-b-xl">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{u.fullName}</p>
                <p className="text-xs text-slate-400">{u.studentId} · {u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
