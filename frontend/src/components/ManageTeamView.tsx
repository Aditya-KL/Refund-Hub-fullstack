import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Trash2, Search, ChevronDown, Crown, Shield, User,
  X, Check, AlertCircle, Loader2, Building2
} from 'lucide-react';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';
// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'FEST_COORDINATOR' | 'COORDINATOR' | 'SUB_COORDINATOR';

interface FestMember {
  memberId: number;
  festId: number;
  studentId: string;
  fullName: string;
  email: string;
  rollNo: string;
  role: Role;
  committee: string;
  addedAt: string;
}

interface Fest {
  festId: number;
  festName: string;
  academicYear: string;
}

interface StudentSearchResult {
  studentId: string;
  fullName: string;
  email: string;
  rollNo: string;
  department: string;
}

interface ManageTeamViewProps {
  userRole: Role;        // current user's role in the selected fest
  userFests: Fest[];     // fests the current user belongs to
  currentStudentId: string;
}

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; border: string; icon: typeof Crown; rank: number }> = {
  FEST_COORDINATOR: {
    label: 'Fest Coordinator',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Crown,
    rank: 3,
  },
  COORDINATOR: {
    label: 'Coordinator',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: Shield,
    rank: 2,
  },
  SUB_COORDINATOR: {
    label: 'Sub Coordinator',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: User,
    rank: 1,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function MemberCard({
  member,
  canRemove,
  onRemove,
}: {
  member: FestMember;
  canRemove: boolean;
  onRemove: (m: FestMember) => void;
}) {
  return (
    <div className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ROLE_CONFIG[member.role].bg} ${ROLE_CONFIG[member.role].color}`}>
        {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{member.fullName}</p>
        <p className="text-xs text-gray-500 truncate">{member.rollNo} · {member.email}</p>
        {member.committee && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Building2 size={10} />{member.committee}
          </p>
        )}
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          onClick={() => onRemove(member)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
          title="Remove member"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  onClose,
  onAdd,
  festId,
  currentUserRole,
}: {
  onClose: () => void;
  onAdd: (data: { studentId: string; role: Role; committee: string }) => Promise<void>;
  festId: number;
  currentUserRole: Role;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [selected, setSelected] = useState<StudentSearchResult | null>(null);
  const [role, setRole] = useState<Role>('SUB_COORDINATOR');
  const [committee, setCommittee] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Roles the current user is allowed to assign (strictly lower than their own)
  const assignableRoles: Role[] = (() => {
    if (currentUserRole === 'FEST_COORDINATOR') return ['COORDINATOR', 'SUB_COORDINATOR'];
    if (currentUserRole === 'COORDINATOR') return ['SUB_COORDINATOR'];
    return [];
  })();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BASE_URL}/api/students/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query]);

  const handleAdd = async () => {
    if (!selected || !committee.trim()) { setError('Please fill all fields.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onAdd({ studentId: selected.studentId, role, committee });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add Team Member</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 1 ? (
            <>
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Search by Email, Roll No, or Name
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. 2401CS01 or vivek@..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                  />
                  {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                </div>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {results.map(s => (
                    <button
                      key={s.studentId}
                      onClick={() => { setSelected(s); setStep(2); }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${selected?.studentId === s.studentId ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{s.rollNo} · {s.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length > 1 && !searching && results.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">No students found</p>
              )}
            </>
          ) : (
            <>
              {/* Selected student */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
                  {selected!.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selected!.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{selected!.rollNo} · {selected!.email}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-green-600 hover:underline shrink-0">Change</button>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assign Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {assignableRoles.map(r => {
                    const cfg = ROLE_CONFIG[r];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${role === r ? `${cfg.border} ${cfg.bg}` : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <Icon size={16} className={role === r ? cfg.color : 'text-gray-400'} />
                        <span className={`text-sm font-medium ${role === r ? cfg.color : 'text-gray-600'}`}>{cfg.label}</span>
                        {role === r && <Check size={14} className={`ml-auto ${cfg.color}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Committee */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Committee</label>
                <input
                  value={committee}
                  onChange={e => setCommittee(e.target.value)}
                  placeholder="e.g. Finance, Logistics, PR..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManageTeamView({ userRole, userFests, currentStudentId }: ManageTeamViewProps) {
  const [selectedFest, setSelectedFest] = useState<Fest | null>(userFests[0] || null);
  const [members, setMembers] = useState<FestMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [festDropdownOpen, setFestDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<FestMember | null>(null);

  // Fetch members when fest changes
  useEffect(() => {
    if (!selectedFest) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/fest-members/${selectedFest.festId}`);
        if (res.ok) setMembers(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedFest]);

  const canAddRole = (targetRole: Role): boolean => {
    const myRank = ROLE_CONFIG[userRole].rank;
    const targetRank = ROLE_CONFIG[targetRole].rank;
    return myRank > targetRank;
  };

  const canRemoveMember = (member: FestMember): boolean => {
    if (member.studentId === currentStudentId) return false;
    return ROLE_CONFIG[userRole].rank > ROLE_CONFIG[member.role].rank;
  };

  const handleAdd = async (data: { studentId: string; role: Role; committee: string }) => {
    if (!selectedFest) return;
    const res = await fetch(`${BASE_URL}/api/fest-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        festId: selectedFest.festId,
        studentId: data.studentId,
        role: data.role,
        committee: data.committee,
        addedBy: currentStudentId,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add member');
    }
    const newMember = await res.json();
    setMembers(prev => [...prev, newMember]);
  };

  const handleRemove = async (member: FestMember) => {
    if (!selectedFest) return;
    const res = await fetch(`${BASE_URL}/api/fest-members/${member.memberId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removedBy: currentStudentId }),
    });
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.memberId !== member.memberId));
      setRemoveTarget(null);
    }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q || m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) ||
      m.rollNo.toLowerCase().includes(q) || m.committee?.toLowerCase().includes(q);
  });

  const grouped: Record<Role, FestMember[]> = {
    FEST_COORDINATOR: filtered.filter(m => m.role === 'FEST_COORDINATOR'),
    COORDINATOR: filtered.filter(m => m.role === 'COORDINATOR'),
    SUB_COORDINATOR: filtered.filter(m => m.role === 'SUB_COORDINATOR'),
  };

  const totalMembers = members.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalMembers} member{totalMembers !== 1 ? 's' : ''} · {selectedFest?.academicYear}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Fest Selector */}
          {userFests.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setFestDropdownOpen(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
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

          {/* Add button — visible only if user can add at least one role */}
          {(userRole === 'FEST_COORDINATOR' || userRole === 'COORDINATOR') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by name, roll no, email or committee..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 shadow-sm"
        />
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-green-500" />
        </div>
      ) : (
        /* ── Hierarchy Columns ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(grouped) as [Role, FestMember[]][]).map(([role, roleMembers]) => {
            const cfg = ROLE_CONFIG[role];
            const Icon = cfg.icon;
            return (
              <div key={role} className={`rounded-2xl border-2 ${cfg.border} overflow-hidden`}>
                {/* Column header */}
                <div className={`${cfg.bg} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={cfg.color} />
                    <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    {roleMembers.length}
                  </span>
                </div>

                {/* Members */}
                <div className="p-3 space-y-2 min-h-[120px] bg-gray-50/50">
                  {roleMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No members</p>
                  ) : (
                    roleMembers.map(m => (
                      <MemberCard
                        key={m.memberId}
                        member={m}
                        canRemove={canRemoveMember(m)}
                        onRemove={setRemoveTarget}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && selectedFest && (
        <AddMemberModal
          festId={selectedFest.festId}
          currentUserRole={userRole}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* ── Remove Confirm ── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Remove Member</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Remove <span className="font-semibold text-gray-700">{removeTarget.fullName}</span> from the fest team?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemove(removeTarget)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
