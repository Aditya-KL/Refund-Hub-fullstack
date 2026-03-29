import React, { useState } from 'react';
import {
  Home, CheckSquare, History, User, TrendingUp, Clock, CheckCircle, DollarSign,
  Search, Eye, Filter, ChevronDown, XCircle, Banknote, Users, BarChart3,
  Receipt, ArrowUpRight, Calendar,
} from 'lucide-react';
import {
  SecretaryLayout, SecretaryProfileView, StatCard, StatusBadge, deptConfig,
  type Claim, type SecretaryUser, type RefundRecord, type Department,
} from './SecretaryShared';

const API_BASE = '/api';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const mockUser: SecretaryUser = {
  _id: 'sec_acc_001', fullName: 'Ms. Priya Gupta', employeeId: 'EMP-A01',
  email: 'priya.gupta@nit.edu', phone: '9876500004', department: 'account',
  designation: 'Accounts Secretary', institution: 'National Institute of Technology',
  joinDate: '2019-04-01', lastLogin: new Date().toISOString(),
  isVerified: true, isSecretary: true, isSuperAdmin: false,
  bio: 'Processing final refunds and maintaining financial records for the student welfare portal.',
};

// Approved claims pushed from Super Admin (from all departments)
const mockApprovedClaims: Claim[] = [
  { _id: 'ap1', claimRefId: 'MESS-2026-002', studentId: 'u31', studentName: 'Neha Singh', studentRoll: '22BEE031', studentEmail: 'neha@nit.edu', department: 'mess', title: 'Mess Rebate — Medical Leave', description: 'Medical leave 5–20 Feb 2026', amount: 2100, submittedAt: '2026-03-08T10:00:00Z', attachments: [], status: 'approved', approvedAt: '2026-03-15T09:00:00Z', messAbsenceDays: 15 },
  { _id: 'ap2', claimRefId: 'MED-2026-002', studentId: 'u41', studentName: 'Sunita Das', studentRoll: '22BCS055', studentEmail: 'sunita@nit.edu', department: 'hospital', title: 'Prescription Medicine Reimbursement', description: '3 months medication claim', amount: 3200, submittedAt: '2026-03-05T10:00:00Z', attachments: [], status: 'approved', approvedAt: '2026-03-14T11:00:00Z' },
  { _id: 'ap3', claimRefId: 'FEST-2026-001', studentId: 'u20', studentName: 'Priya Sharma', studentRoll: '22BCS001', studentEmail: 'priya@nit.edu', department: 'fest', title: 'Celesta Participation Rebate', description: 'Celesta 2026 travel & accommodation', amount: 1800, submittedAt: '2026-03-10T09:00:00Z', attachments: [], status: 'approved', approvedAt: '2026-03-13T14:00:00Z', festName: 'Celesta' },
  { _id: 'ap4', claimRefId: 'MESS-2026-003', studentId: 'u32', studentName: 'Karan Mehta', studentRoll: '21BCE044', studentEmail: 'karan@nit.edu', department: 'mess', title: 'Mess Rebate — Internship', description: 'Internship period rebate Jan–Feb 2026', amount: 2800, submittedAt: '2026-02-20T09:30:00Z', attachments: [], status: 'approved', approvedAt: '2026-03-01T08:00:00Z', messAbsenceDays: 20 },
];

const mockRefundHistory: RefundRecord[] = [
  { _id: 'r1', claimId: 'ap5', claimRefId: 'MED-2026-003', studentId: 'u42', studentName: 'Rohan Verma', studentRoll: '21BEC010', department: 'hospital', amount: 5500, refundedAt: '2026-03-10T10:00:00Z', refundedBy: 'Priya Gupta', transactionRef: 'TXN-NIT-20260310-001', notes: 'Refund processed via bank transfer.' },
  { _id: 'r2', claimId: 'ap6', claimRefId: 'FEST-2026-003', studentId: 'u22', studentName: 'Kavya Menon', studentRoll: '22BCH010', department: 'fest', amount: 3500, refundedAt: '2026-03-08T14:00:00Z', refundedBy: 'Priya Gupta', transactionRef: 'TXN-NIT-20260308-002' },
  { _id: 'r3', claimId: 'ap7', claimRefId: 'MESS-2026-005', studentId: 'u35', studentName: 'Aditya Rao', studentRoll: '21BCS099', department: 'mess', amount: 1400, refundedAt: '2026-03-05T09:30:00Z', refundedBy: 'Priya Gupta', transactionRef: 'TXN-NIT-20260305-003' },
];

const deptBadge: Record<Department, string> = {
  fest: 'bg-violet-100 text-violet-700',
  mess: 'bg-emerald-100 text-emerald-700',
  hospital: 'bg-blue-100 text-blue-700',
  account: 'bg-amber-100 text-amber-700',
};
const deptLabel: Record<Department, string> = { fest: 'Fest', mess: 'Mess', hospital: 'Medical', account: 'Accounts' };

// ─── Mark Refund Modal ─────────────────────────────────────────────────────────
function MarkRefundModal({ claim, onConfirm, onClose }: { claim: Claim; onConfirm: (ref: string, notes: string) => void; onClose: () => void }) {
  const [txnRef, setTxnRef] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Mark as Refunded</h3>
        <p className="text-slate-500 text-sm mb-5">{claim.studentName} · {claim.claimRefId} · <span className="font-bold text-amber-600">₹{claim.amount.toLocaleString('en-IN')}</span></p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Transaction Reference <span className="text-red-400">*</span></label>
            <input value={txnRef} onChange={e => setTxnRef(e.target.value)} placeholder="e.g. TXN-NIT-20260327-001"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Additional notes for this refund..." />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={() => { if (txnRef.trim()) { onConfirm(txnRef, notes); } }}
            disabled={!txnRef.trim()}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
            <CheckCircle size={15} className="inline mr-1.5" /> Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────────
function OverviewPage({ pendingClaims, history }: { pendingClaims: Claim[]; history: RefundRecord[] }) {
  const totalDisbursed = history.reduce((s, r) => s + r.amount, 0);
  const byDept = (['fest', 'mess', 'hospital'] as Department[]).map(d => ({
    dept: d, count: history.filter(r => r.department === d).length,
    amount: history.filter(r => r.department === d).reduce((s, r) => s + r.amount, 0),
  }));

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Accounts Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">Financial disbursement summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Pending Refunds" value={pendingClaims.length} icon={Clock} color="bg-amber-100 text-amber-600" sub="Awaiting processing" />
        <StatCard label="Total Disbursed" value={`₹${(totalDisbursed / 1000).toFixed(1)}K`} icon={Banknote} color="bg-green-100 text-green-600" />
        <StatCard label="Students Refunded" value={new Set(history.map(r => r.studentId)).size} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard label="This Month" value={`₹${(history.filter(r => new Date(r.refundedAt).getMonth() === new Date().getMonth()).reduce((s, r) => s + r.amount, 0) / 1000).toFixed(1)}K`} icon={BarChart3} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Dept-wise breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Department-wise Disbursements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {byDept.map(d => (
            <div key={d.dept} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${deptBadge[d.dept]}`}>{deptLabel[d.dept]}</span>
                <ArrowUpRight size={16} className="text-slate-300" />
              </div>
              <p className="text-2xl font-black text-slate-800">₹{d.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">{d.count} refunds processed</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending queue */}
      {pendingClaims.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Pending Refund Queue</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="divide-y divide-amber-100">
              {pendingClaims.slice(0, 4).map(c => (
                <div key={c._id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${deptBadge[c.department]}`}>{deptLabel[c.department]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{c.studentName}</p>
                    <p className="text-xs text-slate-400">{c.claimRefId}</p>
                  </div>
                  <span className="font-bold text-amber-700">₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            {pendingClaims.length > 4 && (
              <div className="px-5 py-3 bg-amber-100/50 text-center">
                <p className="text-xs text-amber-700 font-semibold">+{pendingClaims.length - 4} more pending</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approve Refund Page ───────────────────────────────────────────────────────
function ApproveRefundPage({ claims, setClaims, history, setHistory }: {
  claims: Claim[]; setClaims: React.Dispatch<React.SetStateAction<Claim[]>>;
  history: RefundRecord[]; setHistory: React.Dispatch<React.SetStateAction<RefundRecord[]>>;
}) {
  const [selected, setSelected] = useState<Claim | null>(null);
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewClaim, setViewClaim] = useState<Claim | null>(null);

  const filtered = claims.filter(c => {
    const ms = search.toLowerCase();
    return (deptFilter === 'all' || c.department === deptFilter) &&
      (c.studentName.toLowerCase().includes(ms) || c.claimRefId.toLowerCase().includes(ms) || c.studentRoll.toLowerCase().includes(ms));
  });

  const handleMarkRefunded = (txnRef: string, notes: string) => {
    if (!selected) return;
    // Replace: await fetch(`${API_BASE}/claims/${selected._id}/disburse`, { method:'PATCH', body:JSON.stringify({ txnRef, notes }) });
    const newRecord: RefundRecord = {
      _id: Date.now().toString(), claimId: selected._id, claimRefId: selected.claimRefId,
      studentId: selected.studentId, studentName: selected.studentName, studentRoll: selected.studentRoll,
      department: selected.department, amount: selected.amount, refundedAt: new Date().toISOString(),
      refundedBy: mockUser.fullName, transactionRef: txnRef, notes,
    };
    setClaims(prev => prev.filter(c => c._id !== selected._id));
    setHistory(prev => [newRecord, ...prev]);
    setSelected(null);
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Approve Refunds</h2>
          <p className="text-slate-500 text-sm mt-0.5">Claims approved by Super Admin — process refund to students</p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold">
          <Clock size={14} /> {claims.length} pending
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, ref ID, roll no..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'fest', 'mess', 'hospital'] as const).map(d => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${deptFilter === d ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-amber-300'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
          <CheckCircle size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No pending refunds</p>
          <p className="text-slate-300 text-sm mt-1">All approved claims have been processed</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Ref ID', 'Student', 'Dept.', 'Amount', 'Approved On', 'Action'].map(h => (
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
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptBadge[claim.department]}`}>{deptLabel[claim.department]}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-black text-amber-700 text-base">₹{claim.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                      {claim.approvedAt ? new Date(claim.approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewClaim(claim)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={15} /></button>
                        <button onClick={() => setSelected(claim)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors">
                          <Receipt size={13} /> Mark Refunded
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View detail side drawer */}
      {viewClaim && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center sm:justify-end z-50">
          <div className="bg-white w-full sm:w-[500px] h-auto sm:h-full overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-xs font-mono mb-1">{viewClaim.claimRefId}</p>
                  <h3 className="text-lg font-bold text-white">{viewClaim.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{viewClaim.studentName} · {viewClaim.studentRoll}</p>
                </div>
                <button onClick={() => setViewClaim(null)} className="p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl">
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-3xl font-black text-white mt-3">₹{viewClaim.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Department', value: deptLabel[viewClaim.department] },
                  { label: 'Student Email', value: viewClaim.studentEmail },
                  { label: 'Submitted', value: new Date(viewClaim.submittedAt).toLocaleDateString('en-IN') },
                  { label: 'Approved', value: viewClaim.approvedAt ? new Date(viewClaim.approvedAt).toLocaleDateString('en-IN') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">{viewClaim.description}</p>
              </div>
              <button onClick={() => { setSelected(viewClaim); setViewClaim(null); }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm">
                <Receipt size={15} className="inline mr-2" /> Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <MarkRefundModal claim={selected} onConfirm={handleMarkRefunded} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Refund History Page ───────────────────────────────────────────────────────
function RefundHistoryPage({ history }: { history: RefundRecord[] }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [selected, setSelected] = useState<RefundRecord | null>(null);

  const filtered = history.filter(r => {
    const ms = search.toLowerCase();
    return (deptFilter === 'all' || r.department === deptFilter) &&
      (r.studentName.toLowerCase().includes(ms) || r.claimRefId.toLowerCase().includes(ms) || r.studentRoll.toLowerCase().includes(ms) || r.transactionRef.toLowerCase().includes(ms));
  });

  const totalFiltered = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Refund History</h2>
        <p className="text-slate-500 text-sm mt-0.5">All processed refunds — search by student, ref, or transaction ID</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, roll no., ref ID, transaction..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'fest', 'mess', 'hospital'] as const).map(d => (
            <button key={d} onClick={() => setDeptFilter(d)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 transition-colors ${deptFilter === d ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-amber-300'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Filtered Total</p>
          <p className="text-2xl font-black text-amber-800">₹{totalFiltered.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-amber-600 font-semibold">{filtered.length} records</p>
          <p className="text-xs text-amber-500 mt-0.5">{history.length} total</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400"><p className="text-sm">No refund records found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Claim Ref', 'Student', 'Dept.', 'Amount', 'Txn Ref', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{r.claimRefId}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700 text-sm">{r.studentName}</p>
                      <p className="text-xs text-slate-400">{r.studentRoll}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptBadge[r.department]}`}>{deptLabel[r.department]}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-black text-green-700">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{r.transactionRef}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(r.refundedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => setSelected(r)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">Refund Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><XCircle size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Claim Ref', value: selected.claimRefId },
                { label: 'Student Name', value: selected.studentName },
                { label: 'Roll Number', value: selected.studentRoll },
                { label: 'Department', value: deptLabel[selected.department] },
                { label: 'Amount', value: `₹${selected.amount.toLocaleString('en-IN')}` },
                { label: 'Transaction Ref', value: selected.transactionRef },
                { label: 'Processed By', value: selected.refundedBy },
                { label: 'Refunded On', value: new Date(selected.refundedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                ...(selected.notes ? [{ label: 'Notes', value: selected.notes }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex-shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AccountsSecretaryDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState('overview');
  const [user, setUser] = useState<SecretaryUser>(mockUser);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>(mockApprovedClaims);
  const [history, setHistory] = useState<RefundRecord[]>(mockRefundHistory);

  // Replace: useEffect(() => { fetch(`${API_BASE}/accounts/pending-refunds`).then(r=>r.json()).then(setPendingClaims); fetch(`${API_BASE}/accounts/history`).then(r=>r.json()).then(setHistory); }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'approve', label: 'Approve Refunds', icon: CheckSquare },
    { id: 'history', label: 'Refund History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <SecretaryLayout department="account" navItems={navItems} activeView={activeView}
      setActiveView={setActiveView} onLogout={onLogout} user={user}
      title="Accounts Department" subtitle="Secretary Dashboard">
      {activeView === 'overview' && <OverviewPage pendingClaims={pendingClaims} history={history} />}
      {activeView === 'approve' && <ApproveRefundPage claims={pendingClaims} setClaims={setPendingClaims} history={history} setHistory={setHistory} />}
      {activeView === 'history' && <RefundHistoryPage history={history} />}
      {activeView === 'profile' && <SecretaryProfileView user={user} department="account" onSave={(data) => setUser(u => ({ ...u, ...data }))} />}
    </SecretaryLayout>
  );
}
