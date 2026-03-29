import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, ChevronDown, Filter, Loader2,
  Clock, ArrowUpRight, FileText, Crown, Shield, User,
  AlertTriangle, Send, SortAsc
} from 'lucide-react';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'FEST_COORDINATOR' | 'COORDINATOR' | 'SUB_COORDINATOR';
type ApprovalStatus =
  | 'PENDING_COORD'
  | 'PENDING_FC'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUSHED_TO_SECRETARY';

interface ReimbursementClaim {
  approvalId: number;
  claimId: string;
  claimantId: string;
  claimantName: string;
  claimantRole: Role;
  committee: string;
  festName: string;
  festId: number;
  amount: number;
  description: string;
  receiptUrls: string[];
  status: ApprovalStatus;
  coordApprovedBy?: string;
  coordApprovedAt?: string;
  fcApprovedBy?: string;
  fcApprovedAt?: string;
  createdAt: string;
}

interface Fest {
  festId: number;
  festName: string;
  academicYear: string;
}

interface ApproveReimbursementViewProps {
  userRole: Role;
  userFests: Fest[];
  currentStudentId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: typeof Crown }> = {
  FEST_COORDINATOR: { label: 'Fest Coordinator', color: 'text-amber-700', bg: 'bg-amber-50', icon: Crown },
  COORDINATOR:      { label: 'Coordinator',       color: 'text-violet-700', bg: 'bg-violet-50', icon: Shield },
  SUB_COORDINATOR:  { label: 'Sub Coordinator',   color: 'text-teal-700',   bg: 'bg-teal-50',   icon: User },
};

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  PENDING_COORD:        { label: 'Pending (Coordinator)', color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-400' },
  PENDING_FC:           { label: 'Pending (Fest Coord)',  color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', dot: 'bg-violet-400' },
  APPROVED:             { label: 'Approved',              color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500'  },
  REJECTED:             { label: 'Rejected',              color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'    },
  PUSHED_TO_SECRETARY:  { label: 'Pushed to Secretary',   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-500'   },
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon size={10} />{cfg.label}
    </span>
  );
}

// ─── Claim Card ───────────────────────────────────────────────────────────────

function ClaimCard({
  claim,
  userRole,
  onApprove,
  onReject,
}: {
  claim: ReimbursementClaim;
  userRole: Role;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const canAct =
    (userRole === 'COORDINATOR' && claim.claimantRole === 'SUB_COORDINATOR' && claim.status === 'PENDING_COORD') ||
    (userRole === 'FEST_COORDINATOR' && claim.status === 'PENDING_FC') ||
    (userRole === 'FEST_COORDINATOR' && claim.claimantRole === 'COORDINATOR' && claim.status === 'PENDING_COORD');

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ROLE_CONFIG[claim.claimantRole].bg} ${ROLE_CONFIG[claim.claimantRole].color}`}>
            {claim.claimantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900 truncate">{claim.claimantName}</p>
              <RoleBadge role={claim.claimantRole} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{claim.committee} · {claim.claimId}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted {new Date(claim.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Amount + Status */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-base font-bold text-gray-900">₹{claim.amount.toLocaleString()}</p>
            <StatusBadge status={claim.status} />
          </div>
        </div>

        {/* Description preview */}
        <p className="text-xs text-gray-600 mt-3 line-clamp-2">{claim.description}</p>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <FileText size={12} />
            {claim.receiptUrls.length} receipt{claim.receiptUrls.length !== 1 ? 's' : ''}
            <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {canAct && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onReject(claim.approvalId)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => onApprove(claim.approvalId)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded receipts */}
      {expanded && claim.receiptUrls.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 mb-2">Receipts</p>
          <div className="flex flex-wrap gap-2">
            {claim.receiptUrls.map((url, i) => (
              <a
                key={i}
                href={`http://127.0.0.1:8000${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-colors"
              >
                <FileText size={11} />
                Receipt {i + 1}
                <ArrowUpRight size={10} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApproveReimbursementView({ userRole, userFests, currentStudentId }: ApproveReimbursementViewProps) {
  const [selectedFest, setSelectedFest] = useState<Fest | null>(userFests[0] || null);
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [festDropdownOpen, setFestDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'role'>('date');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'ALL'>('ALL');
  const [pushing, setPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!selectedFest) return;
    const load = async () => {
      setLoading(true);
      setPushSuccess(false);
      try {
        const res = await fetch(
          `${BASE_URL}/api/reimbursements/approvals?festId=${selectedFest.festId}&approverId=${currentStudentId}`
        );
        if (res.ok) setClaims(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedFest]);

  const handleApprove = async (approvalId: number) => {
    const res = await fetch(`${BASE_URL}/api/reimbursements/approvals/${approvalId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId: currentStudentId, remarks: remarks[approvalId] || '' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClaims(prev => prev.map(c => c.approvalId === approvalId ? updated : c));
    }
  };

  const handleReject = async (approvalId: number) => {
    const res = await fetch(`${BASE_URL}/api/reimbursements/approvals/${approvalId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId: currentStudentId, remarks: remarks[approvalId] || '' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setClaims(prev => prev.map(c => c.approvalId === approvalId ? updated : c));
    }
  };

  const handlePushToSecretary = async () => {
    if (!selectedFest) return;
    setPushing(true);
    try {
      const res = await fetch(`${BASE_URL}/api/reimbursements/push-to-secretary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festId: selectedFest.festId, pushedBy: currentStudentId }),
      });
      if (res.ok) {
        setClaims(prev => prev.map(c => ({ ...c, status: 'PUSHED_TO_SECRETARY' as ApprovalStatus })));
        setPushSuccess(true);
      }
    } finally {
      setPushing(false);
    }
  };

  // Filtering + sorting
  let displayed = claims
    .filter(c => filterRole === 'ALL' || c.claimantRole === filterRole)
    .filter(c => filterStatus === 'ALL' || c.status === filterStatus);

  if (sortBy === 'amount') displayed = [...displayed].sort((a, b) => b.amount - a.amount);
  else if (sortBy === 'role') {
    const order: Record<Role, number> = { FEST_COORDINATOR: 0, COORDINATOR: 1, SUB_COORDINATOR: 2 };
    displayed = [...displayed].sort((a, b) => order[a.claimantRole] - order[b.claimantRole]);
  } else {
    displayed = [...displayed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const pendingCount = claims.filter(c => c.status === 'PENDING_COORD' || c.status === 'PENDING_FC').length;
  const approvedCount = claims.filter(c => c.status === 'APPROVED').length;
  const totalAmount = claims.filter(c => c.status === 'APPROVED').reduce((s, c) => s + c.amount, 0);
  const allApproved = claims.length > 0 && claims.every(c => c.status === 'APPROVED' || c.status === 'PUSHED_TO_SECRETARY');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approve Reimbursements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{selectedFest?.festName} · {selectedFest?.academicYear}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Fest selector */}
          {userFests.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setFestDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 shadow-sm transition-colors"
              >
                {selectedFest?.festName || 'Select Fest'}
                <ChevronDown size={14} className={`transition-transform ${festDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {festDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[180px] overflow-hidden">
                  {userFests.map(f => (
                    <button
                      key={f.festId}
                      onClick={() => { setSelectedFest(f); setFestDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedFest?.festId === f.festId ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {f.festName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Push to Secretary (FC only, all approved) */}
          {userRole === 'FEST_COORDINATOR' && allApproved && !pushSuccess && (
            <button
              onClick={handlePushToSecretary}
              disabled={pushing}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
            >
              {pushing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Push to Secretary
            </button>
          )}
        </div>
      </div>

      {/* ── Push success banner ── */}
      {pushSuccess && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <CheckCircle2 size={20} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Successfully pushed to Fest Secretary!</p>
            <p className="text-xs text-blue-600 mt-0.5">All approved claims have been archived. Team data will be cleared on 1 June.</p>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Approved ₹', value: `₹${totalAmount.toLocaleString()}`, icon: null, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── All-approved notice ── */}
      {allApproved && !pushSuccess && userRole === 'FEST_COORDINATOR' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">All reimbursements are approved!</p>
            <p className="text-xs text-green-600 mt-0.5">You can now push all claims to the Fest Secretary for final archival.</p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Filter size={12} /> Filter:
        </div>

        {/* Role filter */}
        {(['ALL', 'COORDINATOR', 'SUB_COORDINATOR'] as const).map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${filterRole === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {r === 'ALL' ? 'All Roles' : ROLE_CONFIG[r as Role].label}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Status filter */}
        {(['ALL', 'PENDING_COORD', 'PENDING_FC', 'APPROVED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {s === 'ALL' ? 'All Status' : STATUS_CONFIG[s as ApprovalStatus].label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <SortAsc size={12} />
          {(['date', 'amount', 'role'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${sortBy === s ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Claims list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-green-500" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
          <AlertTriangle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No reimbursements found</p>
          <p className="text-xs text-gray-400 mt-1">Try changing the filters above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(claim => (
            <ClaimCard
              key={claim.approvalId}
              claim={claim}
              userRole={userRole}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
