// ─── SecretaryDashboard.tsx ────────────────────────────────────────────────────
// Routes to the correct department dashboard based on user.department
// import React from 'react';
import { FestSecretaryDashboard } from './FestSecretaryDashboard';
import { MessSecretaryDashboard, HospitalSecretaryDashboard } from './MessHospitalSecretaryDashboard';
import { AccountsSecretaryDashboard } from './AccountsSecretaryDashboard';
import { StudentDashboard } from '../components/StudentDashboard';
// import type { Department } from './SecretaryShared';

interface SecretaryDashboardProps {
  department: Department;
  onLogout: () => void;
}

export function SecretaryDashboard({ department, onLogout }: SecretaryDashboardProps) {
  switch (department) {
    case 'fest':     return <FestSecretaryDashboard onLogout={onLogout} />;
    case 'mess':     return <MessSecretaryDashboard onLogout={onLogout} />;
    case 'hospital': return <HospitalSecretaryDashboard onLogout={onLogout} />;
    case 'account':  return <AccountsSecretaryDashboard onLogout={onLogout} />;
    default:         return <StudentDashboard onLogout={onLogout} />;
  }
}


// ─── AllClaimsView.tsx ─────────────────────────────────────────────────────────
// Super Admin omnibus page — view ALL claims across all departments, take any action
import React, { useState } from 'react';
import {
  Search, Filter, RefreshCw, Eye, CheckCircle,
  XCircle, ChevronDown, RotateCcw, ArrowUpRight,
  TrendingUp, Clock, DollarSign, BarChart3,
  Banknote, AlertTriangle, X,
} from 'lucide-react';
import { ClaimReviewPanel, StatusBadge, StatCard, deptConfig, type Claim, type Department } from './SecretaryShared';

const deptBadge: Record<Department, string> = {
  fest: 'bg-violet-100 text-violet-700', mess: 'bg-emerald-100 text-emerald-700',
  hospital: 'bg-blue-100 text-blue-700', account: 'bg-amber-100 text-amber-700',
};
const deptLabel: Record<Department, string> = { fest: 'Fest', mess: 'Mess', hospital: 'Medical', account: 'Accounts' };

// Mock — replace with fetch(`/api/claims/all`)
const mockAllClaims: Claim[] = [
  { _id: 'c1', claimRefId: 'FEST-2026-001', studentId: 'u20', studentName: 'Priya Sharma', studentRoll: '22BCS001', studentEmail: 'priya@nit.edu', department: 'fest', title: 'Celesta Participation Rebate', description: 'Travel and accommodation during Celesta 2026', amount: 1800, submittedAt: '2026-03-10T09:00:00Z', attachments: [], status: 'verified', festName: 'Celesta', fcComment: 'Verified' },
  { _id: 'c2', claimRefId: 'MESS-2026-001', studentId: 'u30', studentName: 'Rahul Kumar', studentRoll: '22BCS020', studentEmail: 'rahul@nit.edu', department: 'mess', title: 'Mess Rebate — March 2026', description: 'Home leave 1–10 March 2026', amount: 1500, submittedAt: '2026-03-12T08:00:00Z', attachments: [], status: 'pending', messAbsenceDays: 10 },
  { _id: 'c3', claimRefId: 'MED-2026-001', studentId: 'u40', studentName: 'Amit Patel', studentRoll: '22BME015', studentEmail: 'amit@nit.edu', department: 'hospital', title: 'Emergency Surgery Reimbursement', description: 'Apollo Hospital 2nd March 2026', amount: 12500, submittedAt: '2026-03-10T08:00:00Z', attachments: [], status: 'pending' },
  { _id: 'c4', claimRefId: 'MESS-2026-002', studentId: 'u31', studentName: 'Neha Singh', studentRoll: '22BEE031', studentEmail: 'neha@nit.edu', department: 'mess', title: 'Mess Rebate — Medical Leave', description: 'Medical leave 5–20 Feb 2026', amount: 2100, submittedAt: '2026-03-08T10:00:00Z', attachments: [], status: 'verified', verifierComment: 'Verified by mess secretary', messAbsenceDays: 15 },
  { _id: 'c5', claimRefId: 'FEST-2026-002', studentId: 'u21', studentName: 'Amit Roy', studentRoll: '22BEE045', studentEmail: 'amit@nit.edu', department: 'fest', title: 'TedX Volunteer Reimbursement', description: 'Volunteer logistics', amount: 1200, submittedAt: '2026-03-12T10:00:00Z', attachments: [], status: 'approved', festName: 'TedX' },
  { _id: 'c6', claimRefId: 'MED-2026-002', studentId: 'u41', studentName: 'Sunita Das', studentRoll: '22BCS055', studentEmail: 'sunita@nit.edu', department: 'hospital', title: 'Prescription Medicine Reimbursement', description: '3 months medication', amount: 3200, submittedAt: '2026-03-05T10:00:00Z', attachments: [], status: 'disbursed' },
  { _id: 'c7', claimRefId: 'FEST-2026-004', studentId: 'u23', studentName: 'Dev Patel', studentRoll: '22BCS088', studentEmail: 'dev@nit.edu', department: 'fest', title: 'Infinito Tech Event Rebate', description: 'Hackathon travel claim', amount: 2200, submittedAt: '2026-03-14T08:00:00Z', attachments: [], status: 'rejected', rejectionReason: 'Missing receipts', festName: 'Infinito' },
  { _id: 'c8', claimRefId: 'MESS-2026-003', studentId: 'u32', studentName: 'Karan Mehta', studentRoll: '21BCE044', studentEmail: 'karan@nit.edu', department: 'mess', title: 'Mess Rebate — Internship', description: 'Off-campus internship Jan–Feb 2026', amount: 2800, submittedAt: '2026-02-20T09:30:00Z', attachments: [], status: 'approved', messAbsenceDays: 20 },
];

export function AllClaimsView() {
  const [claims, setClaims] = useState<Claim[]>(mockAllClaims);
  const [selected, setSelected] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Claim['status'] | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Replace: useEffect(() => { setLoading(true); fetch('/api/claims/all').then(r=>r.json()).then(d => { setClaims(d); setLoading(false); }); }, []);

  const filtered = claims
    .filter(c => {
      const ms = search.toLowerCase();
      return (statusFilter === 'all' || c.status === statusFilter) &&
        (deptFilter === 'all' || c.department === deptFilter) &&
        (c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms) || c.studentRoll.toLowerCase().includes(ms));
    })
    .sort((a, b) => sortBy === 'date'
      ? new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      : b.amount - a.amount);

  // Super admin can force-push any claim to any status
  const handleForceApprove = (id: string) => {
    // Replace: await fetch(`/api/admin/claims/${id}/force-approve`, { method:'PATCH' });
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'approved', approvedAt: new Date().toISOString() } : c));
  };
  const handleForceReject = (id: string, reason: string) => {
    // Replace: await fetch(`/api/admin/claims/${id}/force-reject`, { method:'PATCH', body:JSON.stringify({ reason }) });
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'rejected', rejectionReason: reason } : c));
  };
  const handleForceVerify = (id: string, comment: string) => {
    // Replace: await fetch(`/api/admin/claims/${id}/force-verify`, { method:'PATCH', body:JSON.stringify({ comment }) });
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'verified', verifierComment: comment } : c));
  };
  const handleForceDisbursed = (id: string) => {
    // Replace: await fetch(`/api/admin/claims/${id}/force-disburse`, { method:'PATCH' });
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'disbursed', disbursedAt: new Date().toISOString() } : c));
  };
  const handleReset = (id: string) => {
    setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'pending', verifierComment: undefined, approvedAt: undefined, rejectionReason: undefined } : c));
  };

  // Stats
  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    verified: claims.filter(c => c.status === 'verified').length,
    approved: claims.filter(c => c.status === 'approved').length,
    disbursed: claims.filter(c => c.status === 'disbursed').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    totalAmt: claims.filter(c => ['approved', 'disbursed'].includes(c.status)).reduce((s, c) => s + c.amount, 0),
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">All Claims — Global View</h2>
          <p className="text-slate-500 text-sm mt-0.5">Super Admin omnibus: view and override any claim across all departments</p>
        </div>
        <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 700); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold self-start sm:self-auto transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-700' },
          { label: 'Verified', value: stats.verified, color: 'bg-blue-100 text-blue-700' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-100 text-green-700' },
          { label: 'Disbursed', value: stats.disbursed, color: 'bg-purple-100 text-purple-700' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, roll no., ref ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto flex-wrap">
          <span className="text-xs text-slate-400 font-semibold flex-shrink-0">Status:</span>
          {(['all', 'pending', 'verified', 'approved', 'disbursed', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'}`}>
              {s}
            </button>
          ))}
          <span className="text-xs text-slate-400 font-semibold flex-shrink-0 ml-2">Dept:</span>
          {(['all', 'fest', 'mess', 'hospital', 'account'] as const).map(d => (
            <button key={d} onClick={() => setDeptFilter(d as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${deptFilter === d ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'}`}>
              {d}
            </button>
          ))}
          <span className="text-xs text-slate-400 font-semibold flex-shrink-0 ml-2">Sort:</span>
          <button onClick={() => setSortBy(s => s === 'date' ? 'amount' : 'date')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:border-slate-400 whitespace-nowrap flex-shrink-0">
            {sortBy === 'date' ? '📅 Date' : '💰 Amount'}
          </button>
        </div>
      </div>

      {/* Showing count */}
      <p className="text-xs text-slate-400 font-medium">{filtered.length} claims shown</p>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400"><p className="text-sm">No claims match your filters</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Ref ID', 'Student', 'Dept.', 'Amount', 'Status', 'Submitted', 'Actions'].map(h => (
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
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptBadge[claim.department]}`}>{deptLabel[claim.department]}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-black text-slate-700">₹{claim.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(claim.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* View */}
                        <button onClick={() => setSelected(claim)} title="View / Override"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={15} />
                        </button>
                        {/* Force approve */}
                        {!['approved', 'disbursed'].includes(claim.status) && (
                          <button onClick={() => handleForceApprove(claim._id)} title="Force Approve"
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {/* Force disburse */}
                        {claim.status === 'approved' && (
                          <button onClick={() => handleForceDisbursed(claim._id)} title="Force Disburse"
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                            <Banknote size={15} />
                          </button>
                        )}
                        {/* Reset to pending */}
                        {claim.status !== 'pending' && (
                          <button onClick={() => handleReset(claim._id)} title="Reset to Pending"
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
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

      {/* Total row */}
      <div className="bg-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold">Total Approved + Disbursed Value</p>
          <p className="text-2xl font-black text-white">₹{stats.totalAmt.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">{stats.approved + stats.disbursed} claims</p>
          <p className="text-slate-300 text-xs mt-0.5">{stats.rejected} rejected</p>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ClaimReviewPanel claim={selected} department={selected.department} onClose={() => setSelected(null)}
          onVerify={handleForceVerify} onApprove={handleForceApprove} onReject={handleForceReject}
          mode={selected.status === 'pending' ? 'verify' : selected.status === 'verified' ? 'approve' : 'view'} />
      )}
    </div>
  );
}
