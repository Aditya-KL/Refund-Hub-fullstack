import React, { useEffect, useMemo, useState } from 'react';
import {
  Home, CheckSquare, History, User, Download, Eye, XCircle,
  Clock, CheckCircle2, Loader2, RefreshCw, Users, BarChart3,
} from 'lucide-react';
import {
  SecretaryLayout, SecretaryProfileView, StatCard,
  type SecretaryUser, type Department,
} from './SecretaryShared';
import { apiService } from '../services/db_service';

const BASE = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const deptBadge: Record<string, string> = {
  fest: 'bg-violet-100 text-violet-700',
  mess: 'bg-emerald-100 text-emerald-700',
  hospital: 'bg-blue-100 text-blue-700',
  account: 'bg-amber-100 text-amber-700',
};

const deptLabel: Record<string, string> = {
  fest: 'Fest',
  mess: 'Mess',
  hospital: 'Medical',
  account: 'Accounts',
};

type AccountClaim = {
  _id: string;
  claimId: string;
  requestType: string;
  department: Department;
  studentName: string;
  studentRoll: string;
  studentEmail: string;
  amount: number;
  approvedAt: string;
  submittedAt: string;
  status: string;
  festName?: string;
  description?: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  accountsBatchId?: string;
  accountsExportedAt?: string;
  accountsBatchStatus?: string;
  accountsHoldFlaggedAt?: string;
  accountsHoldFlaggedByName?: string;
  accountsHoldReason?: string;
};

type RefundRecord = {
  _id: string;
  claimId: string;
  studentName: string;
  studentRoll: string;
  department: Department;
  amount: number;
  refundedAt: string;
  refundedBy: string;
  transactionRef: string;
  notes?: string;
};

type UnderProcessBatch = {
  batchId: string;
  exportedAt: string;
  totalAmount: number;
  claimCount: number;
  studentCount: number;
  claims: AccountClaim[];
};

function inferDept(type: string): Department {
  if (type === 'FEST_REIMBURSEMENT') return 'fest';
  if (type === 'MESS_REBATE') return 'mess';
  if (type === 'MEDICAL_REBATE') return 'hospital';
  return 'account';
}

function mapAccountClaim(doc: any): AccountClaim {
  const bank = doc.student?.studentProfile?.bankDetails || doc.student?.bankDetails || {};
  return {
    _id: doc._id,
    claimId: doc.claimId || String(doc._id).slice(-8).toUpperCase(),
    requestType: doc.requestType || '',
    department: inferDept(doc.requestType || ''),
    studentName: doc.student?.fullName || 'Unknown',
    studentRoll: doc.student?.studentId || '',
    studentEmail: doc.student?.email || '',
    amount: Number(doc.disbursedAmount || doc.effectiveAmount || doc.amount || 0),
    approvedAt: doc.approvedAt || doc.updatedAt || '',
    submittedAt: doc.createdAt || '',
    status: doc.status || '',
    festName: doc.festName || '',
    description: doc.description || '',
    accountNumber: bank.accountNumber || '',
    ifscCode: bank.ifscCode || '',
    accountHolderName: bank.accountHolderName || '',
    accountsBatchId: doc.accountsBatchId || '',
    accountsExportedAt: doc.accountsExportedAt || '',
    accountsBatchStatus: doc.accountsBatchStatus || '',
    accountsHoldFlaggedAt: doc.accountsHoldFlaggedAt || '',
    accountsHoldFlaggedByName: doc.accountsHoldFlaggedByName || '',
    accountsHoldReason: doc.accountsHoldReason || '',
  };
}

function mapRefundRecord(doc: any): RefundRecord {
  return {
    _id: doc._id,
    claimId: doc.claimId || String(doc._id).slice(-8).toUpperCase(),
    studentName: doc.student?.fullName || 'Unknown',
    studentRoll: doc.student?.studentId || '',
    department: inferDept(doc.requestType || ''),
    amount: Number(doc.disbursedAmount || doc.effectiveAmount || doc.amount || 0),
    refundedAt: doc.refundedAt || doc.updatedAt || new Date().toISOString(),
    refundedBy: doc.refundedByName || '—',
    transactionRef: doc.accountsBatchId || doc.disbursementRef || '—',
    notes: doc.disbursementNotes || '',
  };
}

function buildUnderProcessBatches(claims: AccountClaim[]): UnderProcessBatch[] {
  const map = new Map<string, UnderProcessBatch>();
  for (const claim of claims) {
    const key = claim.accountsBatchId || 'UNBATCHED';
    const existing = map.get(key) || {
      batchId: key,
      exportedAt: claim.accountsExportedAt || '',
      totalAmount: 0,
      claimCount: 0,
      studentCount: 0,
      claims: [],
    };
    existing.totalAmount += claim.amount;
    existing.claimCount += 1;
    existing.claims.push(claim);
    map.set(key, existing);
  }
  for (const batch of map.values()) {
    batch.studentCount = new Set(batch.claims.map((claim) => claim.studentRoll || claim.studentName)).size;
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.exportedAt || 0).getTime() - new Date(a.exportedAt || 0).getTime());
}

function downloadCsvFile(csv: string, batchId: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${batchId || 'accounts-batch'}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 size={28} className="animate-spin text-amber-400" />
      <p className="text-slate-400 text-sm">Loading data…</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-64">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 max-w-md text-center">
        <XCircle size={28} className="text-red-400 mx-auto mb-2" />
        <p className="text-red-700 font-semibold text-sm">{message}</p>
        <button onClick={onRetry} className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold mx-auto">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    </div>
  );
}

function ClaimDetailModal({ claim, onClose }: { claim: AccountClaim; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs font-mono">{claim.claimId}</p>
            <h3 className="text-xl font-bold text-white mt-1">{claim.studentName}</h3>
            <p className="text-white/85 text-sm mt-1">{claim.studentRoll} · {claim.studentEmail}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Department', value: deptLabel[claim.department] ?? claim.department },
              { label: 'Amount', value: `₹${claim.amount.toLocaleString('en-IN')}` },
              { label: 'Account Holder', value: claim.accountHolderName || '—' },
              { label: 'Account Number', value: claim.accountNumber || '—' },
              { label: 'IFSC Code', value: claim.ifscCode || '—' },
              { label: 'Approved On', value: claim.approvedAt ? new Date(claim.approvedAt).toLocaleDateString('en-IN') : '—' },
              ...(claim.festName ? [{ label: 'Fest', value: claim.festName }] : []),
              ...(claim.accountsBatchId ? [{ label: 'Batch ID', value: claim.accountsBatchId }] : []),
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700 break-words">{item.value}</p>
              </div>
            ))}
          </div>
          {claim.description && (
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Description</p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700">{claim.description}</div>
            </div>
          )}
          <button onClick={onClose} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewPage({
  pendingClaims,
  underProcessBatches,
  history,
}: {
  pendingClaims: AccountClaim[];
  underProcessBatches: UnderProcessBatch[];
  history: RefundRecord[];
}) {
  const totalDisbursed = history.reduce((sum, row) => sum + row.amount, 0);
  const thisMonth = history
    .filter((row) => {
      const d = new Date(row.refundedAt);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    })
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Accounts Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">Batch export and refund processing summary</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Ready To Export" value={pendingClaims.length} icon={Download} color="bg-amber-100 text-amber-600" sub="Fresh claims" />
        <StatCard label="Under Process" value={underProcessBatches.length} icon={Clock} color="bg-blue-100 text-blue-600" sub="Open bank batches" />
        <StatCard label="Students Refunded" value={new Set(history.map((row) => row.studentRoll)).size} icon={Users} color="bg-green-100 text-green-600" />
        <StatCard label="This Month" value={`₹${(thisMonth / 1000).toFixed(1)}K`} icon={BarChart3} color="bg-purple-100 text-purple-600" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Queue Snapshot</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700">Fresh Claims</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{pendingClaims.length}</p>
            <p className="text-xs text-amber-600 mt-1">Available for new CSV export</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold text-sky-700">Open Batches</p>
            <p className="text-2xl font-black text-sky-900 mt-1">{underProcessBatches.length}</p>
            <p className="text-xs text-sky-600 mt-1">Still under bank process</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700">Total Refunded</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">₹{totalDisbursed.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-1">Completed payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApproveRefundPage(props: {
  pendingClaims: AccountClaim[];
  underProcessBatches: UnderProcessBatch[];
  onExportBatch: () => void;
  onMarkBatchRefunded: (batchId: string, holdClaimIds: string[]) => void;
  onMarkClaimRefunded: (claimId: string) => void;
  onRejectClaim: (claimId: string) => void;
  onRejectUnderProcessClaim: (claim: AccountClaim, reason: string) => void;
  exportLoading: boolean;
  refundingBatchId: string;
  actionError: string;
  processingId: string | null;
  setProcessingId: (id: string | null) => void;
}) {
  const { pendingClaims, underProcessBatches, onExportBatch, onMarkBatchRefunded, onMarkClaimRefunded, onRejectClaim, onRejectUnderProcessClaim, exportLoading, refundingBatchId, actionError, processingId, setProcessingId } = props;
  const [selectedClaim, setSelectedClaim] = useState<AccountClaim | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [underProcessSearch, setUnderProcessSearch] = useState('');
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredPending = useMemo(() => {
    const q = search.toLowerCase();
    return pendingClaims.filter((claim) => (
      (deptFilter === 'all' || claim.department === deptFilter) &&
      (
        claim.studentName.toLowerCase().includes(q) ||
        claim.studentRoll.toLowerCase().includes(q) ||
        claim.studentEmail.toLowerCase().includes(q) ||
        claim.claimId.toLowerCase().includes(q) ||
        claim.accountNumber.toLowerCase().includes(q) ||
        claim.ifscCode.toLowerCase().includes(q)
      )
    ));
  }, [deptFilter, pendingClaims, search]);

  const normalizedUnderProcessSearch = underProcessSearch.trim().toLowerCase();

  const visibleUnderProcessBatches = useMemo(() => (
    underProcessBatches
      .map((batch) => ({
        ...batch,
        claims: batch.claims.filter((claim) => {
          if (!normalizedUnderProcessSearch) return true;
          return (
            claim.studentName.toLowerCase().includes(normalizedUnderProcessSearch) ||
            claim.studentRoll.toLowerCase().includes(normalizedUnderProcessSearch) ||
            claim.studentEmail.toLowerCase().includes(normalizedUnderProcessSearch) ||
            claim.claimId.toLowerCase().includes(normalizedUnderProcessSearch) ||
            claim.accountNumber.toLowerCase().includes(normalizedUnderProcessSearch) ||
            claim.ifscCode.toLowerCase().includes(normalizedUnderProcessSearch)
          );
        }),
      }))
      .filter((batch) => batch.claims.length > 0)
  ), [normalizedUnderProcessSearch, underProcessBatches]);

  const openRejectBox = (claim: AccountClaim) => {
    setRejectingClaimId(claim._id);
    setRejectReason(claim.accountsHoldReason || '');
  };

  const closeRejectBox = () => {
    setRejectingClaimId(null);
    setRejectReason('');
  };

  const submitReject = async (claim: AccountClaim) => {
    const reason = rejectReason.trim();
    if (!reason) return;
    await onRejectUnderProcessClaim(claim, reason);
    closeRejectBox();
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      {selectedClaim && <ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Approve Refunds</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Export fresh claims to bank CSV, keep exported ones under process, then close the full batch as refunded.
          </p>
        </div>
        <button
          onClick={onExportBatch}
          disabled={exportLoading || pendingClaims.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {exportLoading ? 'Exporting…' : `Download CSV (${pendingClaims.length})`}
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <XCircle size={16} className="flex-shrink-0" /> {actionError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, roll no, email, account no, IFSC…"
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'fest', 'mess', 'hospital'] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 ${
                deptFilter === dept ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-500'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile cards ── */}
      {filteredPending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 text-center text-slate-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="font-semibold">No fresh claims waiting for export</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {filteredPending.map((claim) => (
              <div key={claim._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {claim.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{claim.studentName}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deptBadge[claim.department] ?? ''}`}>
                        {deptLabel[claim.department] ?? claim.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{claim.studentRoll}</p>
                    <p className="text-xs text-slate-400 truncate">{claim.studentEmail}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-black text-emerald-700">₹{claim.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{claim.claimId}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Account No.</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5 break-all">{claim.accountNumber || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">IFSC</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{claim.ifscCode || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedClaim(claim)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200"
                  >
                    <Eye size={13} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Claim ID', 'Student', 'Dept', 'Account Number', 'IFSC', 'Amount', 'Action'].map((head) => (
                    <th key={head} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{claim.claimId}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700 text-sm">{claim.studentName}</p>
                      <p className="text-xs text-slate-400">{claim.studentRoll} · {claim.studentEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptBadge[claim.department] ?? ''}`}>
                        {deptLabel[claim.department] ?? claim.department}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">{claim.accountNumber || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">{claim.ifscCode || '—'}</td>
                    <td className="px-4 py-4 font-black text-emerald-700 whitespace-nowrap">₹{claim.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedClaim(claim)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Under Process Batches ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Under Process</h3>
            <p className="text-slate-500 text-sm">Search a student here, flag payment issues on hold, then refund the rest of the batch.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-xl text-sm font-bold">
            <Clock size={14} /> {underProcessBatches.length} batches
          </span>
        </div>

        <input
          value={underProcessSearch}
          onChange={(e) => setUnderProcessSearch(e.target.value)}
          placeholder="Search under-process student, roll no, claim ID, account no, IFSC…"
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        {underProcessBatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
            No batches are under process right now.
          </div>
        ) : visibleUnderProcessBatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-12 text-center text-slate-400">
            No under-process claims match this search.
          </div>
        ) : (
          visibleUnderProcessBatches.map((batch) => (
            <div key={batch.batchId} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-slate-400">{batch.batchId}</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">₹{batch.totalAmount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {batch.claimCount} claims · {batch.studentCount} students · Exported {batch.exportedAt ? new Date(batch.exportedAt).toLocaleString('en-IN') : '—'}
                  </p>
                  {batch.claims.filter((claim) => claim.accountsBatchStatus === 'ON_HOLD').length > 0 && (
                    <p className="text-xs font-semibold text-amber-700 mt-2">
                      {batch.claims.filter((claim) => claim.accountsBatchStatus === 'ON_HOLD').length} claim(s) will remain on hold.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onMarkBatchRefunded(batch.batchId, batch.claims.filter((claim) => claim.accountsBatchStatus === 'ON_HOLD').map((claim) => claim._id))}
                  disabled={refundingBatchId === batch.batchId}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {refundingBatchId === batch.batchId ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {refundingBatchId === batch.batchId ? 'Updating…' : 'Mark Refunded'}
                </button>
              </div>

              {/* Batch claims — mobile cards */}
              <div className="mt-4 space-y-2 lg:hidden">
                {batch.claims.map((claim) => (
                  <div
                    key={claim._id}
                    className={`rounded-xl p-3 border ${
                      claim.accountsBatchStatus === 'ON_HOLD'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-700">{claim.studentName}</p>
                          {claim.accountsBatchStatus === 'ON_HOLD' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              On Hold
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{claim.studentRoll}</p>
                      </div>
                      <p className="font-bold text-slate-700 flex-shrink-0 ml-2">₹{claim.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-slate-400">Account</p>
                        <p className="text-xs font-mono text-slate-600">{claim.accountNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">IFSC</p>
                        <p className="text-xs font-mono text-slate-600">{claim.ifscCode || '—'}</p>
                      </div>
                    </div>
                    {(claim.accountsHoldFlaggedByName || claim.accountsHoldReason) && (
                      <p className="text-xs text-amber-700 mt-2">
                        {claim.accountsHoldReason || `Held by ${claim.accountsHoldFlaggedByName}`}
                      </p>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={() => openRejectBox(claim)}
                        className="w-full py-2 rounded-xl text-xs font-bold border bg-red-50 border-red-200 text-red-700"
                      >
                        Reject
                      </button>
                    </div>
                    {rejectingClaimId === claim._id && (
                      <div className="mt-2 rounded-xl border border-red-200 bg-white p-3 space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Type the rejection reason for the student..."
                          className="w-full min-h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReject(claim)}
                            disabled={!rejectReason.trim() || processingId === claim._id}
                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            onClick={closeRejectBox}
                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Batch claims — desktop table */}
              <div className="mt-4 hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Student', 'Account Number', 'IFSC', 'Amount', 'Action'].map((head) => (
                        <th key={head} className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batch.claims.map((claim) => (
                      <React.Fragment key={claim._id}>
                      <tr className={claim.accountsBatchStatus === 'ON_HOLD' ? 'bg-amber-50' : ''}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-700">{claim.studentName}</p>
                            {claim.accountsBatchStatus === 'ON_HOLD' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                On Hold
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{claim.studentRoll}</p>
                          {(claim.accountsHoldFlaggedByName || claim.accountsHoldReason) && (
                            <p className="text-xs text-amber-700 mt-1">
                              {claim.accountsHoldReason || `Held by ${claim.accountsHoldFlaggedByName}`}
                            </p>
                          )}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-600">{claim.accountNumber || '—'}</td>
                        <td className="py-3 font-mono text-xs text-slate-600">{claim.ifscCode || '—'}</td>
                        <td className="py-3 font-bold text-slate-700">₹{claim.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <button
                            onClick={() => openRejectBox(claim)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-red-50 border-red-200 text-red-700"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                      {rejectingClaimId === claim._id && (
                      <tr>
                        <td colSpan={5} className="pb-3">
                          <div className="rounded-xl border border-red-200 bg-white p-3 space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Type the rejection reason for the student..."
                              className="w-full min-h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => submitReject(claim)}
                                disabled={!rejectReason.trim() || processingId === claim._id}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 text-white disabled:opacity-50"
                              >
                                Submit
                              </button>
                              <button
                                onClick={closeRejectBox}
                                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RefundHistoryPage({ history }: { history: RefundRecord[] }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter((row) => (
      (deptFilter === 'all' || row.department === deptFilter) &&
      (
        row.studentName.toLowerCase().includes(q) ||
        row.studentRoll.toLowerCase().includes(q) ||
        row.claimId.toLowerCase().includes(q) ||
        row.transactionRef.toLowerCase().includes(q)
      )
    ));
  }, [deptFilter, history, search]);

  const totalFiltered = filtered.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Refund History</h2>
        <p className="text-slate-500 text-sm mt-0.5">Completed claims and refunded batches</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, roll no, claim ID, batch ID…"
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'fest', 'mess', 'hospital'] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 ${
                deptFilter === dept ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-500'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Filtered Total</p>
          <p className="text-2xl font-black text-amber-800">₹{totalFiltered.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-amber-600 font-semibold">{filtered.length} claims</p>
          <p className="text-xs text-amber-500 mt-0.5">{history.length} total</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 text-center text-slate-400">
          No refund records found.
        </div>
      ) : (
        <>
          {/* ── Mobile cards ── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((row) => (
              <div key={row._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {row.studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">{row.studentName}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deptBadge[row.department] ?? ''}`}>
                        {deptLabel[row.department] ?? row.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{row.studentRoll}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{row.claimId}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-black text-emerald-700">₹{row.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(row.refundedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Batch / Ref</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{row.transactionRef}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Claim ID', 'Student', 'Dept', 'Amount', 'Batch/Ref', 'Refunded On'].map((head) => (
                    <th key={head} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{row.claimId}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700 text-sm">{row.studentName}</p>
                      <p className="text-xs text-slate-400">{row.studentRoll}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${deptBadge[row.department] ?? ''}`}>
                        {deptLabel[row.department] ?? row.department}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-black text-emerald-700 whitespace-nowrap">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{row.transactionRef}</td>
                    <td className="px-4 py-4 text-xs text-slate-400 whitespace-nowrap">{new Date(row.refundedAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function AccountsSecretaryDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState('overview');
  const [user, setUser] = useState<SecretaryUser | null>(null);
  const [pendingClaims, setPendingClaims] = useState<AccountClaim[]>([]);
  const [underProcessClaims, setUnderProcessClaims] = useState<AccountClaim[]>([]);
  const [history, setHistory] = useState<RefundRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [claimsError, setClaimsError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [refundingBatchId, setRefundingBatchId] = useState('');
  const [actionError, setActionError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (!parsed._id) return;
      setUser({
        _id: parsed._id,
        fullName: parsed.fullName || 'Unknown',
        employeeId: parsed.studentId || parsed.employeeId || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        department: parsed.department || 'account',
        designation: parsed.isSecretary ? 'Accounts Secretary' : 'Staff',
        institution: parsed.institution || '',
        joinDate: parsed.joinDate || new Date().toISOString(),
        lastLogin: parsed.lastLogin || new Date().toISOString(),
        isVerified: parsed.isVerified ?? true,
        isSecretary: parsed.isSecretary ?? true,
        isSuperAdmin: parsed.isSuperAdmin ?? false,
      });
    } catch (_) {}
  }, []);

  const loadClaims = async () => {
    setClaimsLoading(true);
    setClaimsError('');
    try {
      const [pendingRes, underProcessRes] = await Promise.all([
        fetch(`${BASE}/api/verify/accounts/claims?status=PUSHED_TO_ACCOUNTS`),
        fetch(`${BASE}/api/verify/accounts/claims?status=UNDER_PROCESS`),
      ]);
      if (!pendingRes.ok) throw new Error('Failed to load claims ready for export.');
      if (!underProcessRes.ok) throw new Error('Failed to load under-process claims.');
      const pendingData = await pendingRes.json();
      const underProcessData = await underProcessRes.json();
      setPendingClaims(pendingData.map(mapAccountClaim));
      setUnderProcessClaims(underProcessData.map(mapAccountClaim));
    } catch (err: any) {
      setClaimsError(err.message || 'Could not load accounts claims.');
    } finally {
      setClaimsLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await fetch(`${BASE}/api/verify/accounts/claims?status=REFUNDED`);
      if (!res.ok) throw new Error('Failed to load refund history.');
      const data = await res.json();
      setHistory(data.map(mapRefundRecord));
    } catch (err: any) {
      setHistoryError(err.message || 'Could not load refund history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadClaims(); }, []);
  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    if (!user?._id) return;
    const sendHeartbeat = async () => {
      try {
        await fetch(`${BASE}/api/heartbeat/${user._id}`, { method: 'POST' });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const underProcessBatches = useMemo(() => buildUnderProcessBatches(underProcessClaims), [underProcessClaims]);

  const handleExportBatch = async () => {
    if (!user?._id) return;
    setExportLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${BASE}/api/verify/accounts/export-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportedBy: user._id, exportedByName: user.fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to export batch.');
      if (data.csv) downloadCsvFile(data.csv, data.batchId);
      await loadClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to export batch.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleMarkBatchRefunded = async (batchId: string, holdClaimIds: string[]) => {
    if (!user?._id) return;
    setRefundingBatchId(batchId);
    setActionError('');
    try {
      const res = await fetch(`${BASE}/api/verify/accounts/batches/${batchId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundedBy: user._id, refundedByName: user.fullName, notes: '', holdClaimIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark batch refunded.');
      await Promise.all([loadClaims(), loadHistory()]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark batch refunded.');
    } finally {
      setRefundingBatchId('');
    }
  };

  const handleMarkClaimRefunded = async (claimId: string) => {
    if (!user?._id) return;
    setActionError('');
    try {
      const res = await fetch(`${BASE}/api/verify/claims/${claimId}/mark-refunded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundedBy: user._id, refundedByName: user.fullName, notes: 'Marked as refunded by accounts secretary' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark refunded.');
      await Promise.all([loadClaims(), loadHistory()]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark claim refunded.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (!user?._id) return;
    setActionError('');
    try {
      const res = await fetch(`${BASE}/api/verify/claims/${claimId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: user._id,
          rejectedByName: user.fullName,
          rejectionReason: 'Rejected by accounts secretary during processing',
          stage: 'ACCOUNTS_PROCESSING',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject claim.');
      await loadClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject claim.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUnderProcessClaim = async (claim: AccountClaim, reason: string) => {
    if (!user?._id) return;
    setProcessingId(claim._id);
    setActionError('');
    try {
      const res = await fetch(`${BASE}/api/verify/claims/${claim._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: user._id,
          rejectedByName: user.fullName,
          rejectionReason: reason.trim(),
          stage: 'ACCOUNTS_PROCESSING',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject claim.');
      await loadClaims();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject claim.');
    } finally {
      setProcessingId(null);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview',        icon: Home },
    { id: 'approve',  label: 'Approve Refunds', icon: CheckSquare },
    { id: 'history',  label: 'Refund History',  icon: History },
    { id: 'profile',  label: 'Profile',         icon: User },
  ];

  return (
    <SecretaryLayout
      department="account"
      navItems={navItems}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={onLogout}
      user={user}
      title="Accounts Department"
      subtitle=""
    >
      {activeView === 'overview' && (
        claimsLoading || historyLoading
          ? <LoadingSpinner />
          : <OverviewPage pendingClaims={pendingClaims} underProcessBatches={underProcessBatches} history={history} />
      )}
      {activeView === 'approve' && (
        claimsLoading
          ? <LoadingSpinner />
          : claimsError
          ? <ErrorBlock message={claimsError} onRetry={loadClaims} />
          : <ApproveRefundPage
              pendingClaims={pendingClaims}
              underProcessBatches={underProcessBatches}
              onExportBatch={handleExportBatch}
              onMarkBatchRefunded={handleMarkBatchRefunded}
              onMarkClaimRefunded={handleMarkClaimRefunded}
              onRejectClaim={handleRejectClaim}
              onRejectUnderProcessClaim={handleRejectUnderProcessClaim}
              exportLoading={exportLoading}
              refundingBatchId={refundingBatchId}
              actionError={actionError}
              processingId={processingId}
              setProcessingId={setProcessingId}
            />
      )}
      {activeView === 'history' && (
        historyLoading
          ? <LoadingSpinner />
          : historyError
          ? <ErrorBlock message={historyError} onRetry={loadHistory} />
          : <RefundHistoryPage history={history} />
      )}
      {activeView === 'profile' && user && (
        <SecretaryProfileView
          user={user}
          department="account"
          onSave={async (data, passwordData) => {
            if (!user) return;

            if (passwordData) {
              await apiService.changePassword(
                user._id,
                passwordData.currentPassword,
                passwordData.newPassword,
              );
              return;
            }

            const payload = {
              fullName: data.fullName ?? user.fullName,
              email: data.email ?? user.email,
              phone: data.phone ?? user.phone,
              designation: data.designation ?? user.designation,
            };
            const result = await apiService.updateUserData(user._id, payload);
            setUser((prev) => (prev ? { ...prev, ...result.user } : prev));
          }}
        />
      )}
    </SecretaryLayout>
  );
}
