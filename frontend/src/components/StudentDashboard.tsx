import { useState, useEffect } from 'react';
import { Plus, DollarSign, Clock, CheckCircle } from 'lucide-react';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';

// Layout
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

// Dashboard Sections
import { ClaimStatusCard, Claim } from './ClaimStatusCard';
import { StatsCard } from './StatsCard';
import { MyClaimsView } from './MyClaimsView';
import { ClaimHistoryView } from './ClaimHistoryView';

// Forms & Modals
import { SelectCategoryModal } from './SelectCategoryModal';
import { MessRebateForm, MessRebateFormData } from './MessRebateForm';
import { FestReimbursementForm, FestReimbursementFormData } from './FestReimbursementForm';
import { MedicalRebateForm, MedicalRebateFormData } from './MedicalRebateForm';
import { SuccessConfirmation } from './SuccessConfirmation';
import { FestClaimSuccess } from './FestClaimSuccess';

// Profile
import { ProfileView } from '../Profile_Page/Profile_VIew_Page';
import { EditProfile } from '../Profile_Page/Edit_Profile_Page';

// ── New Fest Management Views ─────────────────────────────────────────────────
import { ManageTeamView } from './ManageTeamView';
import { ApproveReimbursementView } from './ApproveReimbursementView';

// ─── Types ────────────────────────────────────────────────────────────────────

type FestRole = 'FEST_COORDINATOR' | 'COORDINATOR' | 'SUB_COORDINATOR';

interface UserFest {
  festId: number;
  festName: string;
  academicYear: string;
  role: FestRole; // this user's role in that fest
}

interface StudentDashboardProps {
  onLogout: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  // ── Navigation ──
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Modals & Forms ──
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [showMessRebateForm, setShowMessRebateForm] = useState(false);
  const [showFestReimbursementForm, setShowFestReimbursementForm] = useState(false);
  const [showMedicalRebateForm, setShowMedicalRebateForm] = useState(false);
  const [showSuccessConfirmation, setShowSuccessConfirmation] = useState(false);
  const [showFestClaimSuccess, setShowFestClaimSuccess] = useState(false);
  const [successClaimData, setSuccessClaimData] = useState<any>(null);
  const [festClaimData, setFestClaimData] = useState<any>(null);

  // ── Dashboard Data ──
  const [dashboardClaims, setDashboardClaims] = useState<Claim[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRefunded: 0,
    pendingCount: 0,
    approvedThisMonth: 0,
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // ── Fest / Role Data ──
  // userFests: all fests this user belongs to, with their role per fest
  const [userFests, setUserFests] = useState<UserFest[]>([]);
  // const [userFests, setUserFests] = useState<UserFest[]>([
  //   { festId: 1, festName: 'Techfest 2026',  academicYear: '2025-26', role: 'FEST_COORDINATOR' },
  //   { festId: 2, festName: 'Culturals 2026', academicYear: '2025-26', role: 'COORDINATOR' },
  // ]);

  // The "highest" role this user holds across all fests
  // (used to decide what sidebar items to show)
  const effectiveRole: FestRole | null = (() => {
    if (userFests.some(f => f.role === 'FEST_COORDINATOR')) return 'FEST_COORDINATOR';
    if (userFests.some(f => f.role === 'COORDINATOR')) return 'COORDINATOR';
    if (userFests.some(f => f.role === 'SUB_COORDINATOR')) return 'SUB_COORDINATOR';
    return null;
  })();

  // Fests where user has management rights (FC or Coordinator)
  const managementFests: UserFest[] = userFests.filter(
    f => f.role === 'FEST_COORDINATOR' || f.role === 'COORDINATOR'
  );

  // ── Fetch Fest Memberships ────────────────────────────────────────────────

  useEffect(() => {
    if (!loggedInUser?.studentId) return;
    const loadFests = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/fest-members/my-fests/${loggedInUser.studentId}`
        );
        if (res.ok) setUserFests(await res.json());
      } catch {
        console.error('Could not load user fests');
      }
    };
    loadFests();
  }, []);

  // ─── Fetch Dashboard Data ─────────────────────────────────────────────────

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!loggedInUser?.studentId) return;

      try {
        setIsDashboardLoading(true);
        const response = await fetch(
          `${BASE_URL}/api/dashboard/${loggedInUser.studentId}`
        );

        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data.stats);

          const formatStatus = (dbStatus: string): string => {
            switch (dbStatus) {
              case 'PENDING_TEAM_COORD':   return 'Pending (Team Coord)';
              case 'PENDING_FEST_COORD':   return 'Pending (Fest Coord)';
              case 'PENDING_MESS_MANAGER': return 'Pending (Mess Mgr)';
              case 'PENDING_VP':           return 'Pending (VP)';
              case 'PENDING_ACADEMIC':     return 'Pending (Academic)';
              case 'APPROVED':             return 'Approved';
              case 'REFUNDED':             return 'Refunded';
              case 'REJECTED':             return 'Rejected';
              default:                     return dbStatus;
            }
          };

          const formattedClaims: Claim[] = data.recentClaims.map((claim: any) => ({
            id: claim.claimId,
            type:
              claim.requestType === 'FEST_REIMBURSEMENT'
                ? 'Fest Rebate'
                : claim.requestType === 'MESS_REBATE'
                ? 'Mess Rebate'
                : 'Medical Refund',
            amount: claim.amount,
            status: formatStatus(claim.status),
            date: new Date(claim.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            description: claim.description,
          }));

          setDashboardClaims(formattedClaims);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    if (activeMenuItem === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeMenuItem]);

  // ─── Category / Form Handlers ─────────────────────────────────────────────

  const handleCategorySelect = (category: string) => {
    setShowNewClaimModal(false);
    if (category === 'mess-rebate') {
      setShowMessRebateForm(true);
    } else if (category === 'fest-activity') {
      setShowFestReimbursementForm(true);
    } else if (category === 'medical-rebate') {
      setShowMedicalRebateForm(true);
    } else {
      alert(`${category} claim form coming soon!`);
    }
  };

  const handleBackToCategory = () => {
    setShowMessRebateForm(false);
    setShowFestReimbursementForm(false);
    setShowMedicalRebateForm(false);
    setShowNewClaimModal(true);
  };

  const handleTrackStatus = () => {
    setShowSuccessConfirmation(false);
    setShowFestClaimSuccess(false);
    setActiveMenuItem('claims');
  };

  // ─── Form Submit Handlers ─────────────────────────────────────────────────

  const handleMessRebateSubmit = (data: MessRebateFormData) => {
    setShowMessRebateForm(false);

    const days =
      data.fromDate && data.toDate
        ? Math.ceil(
            Math.abs(data.toDate.getTime() - data.fromDate.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : 0;

    setSuccessClaimData({
      claimId: `CLM-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      type: 'Mess Rebate',
      amount: days * 150,
      fromDate: data.fromDate,
      toDate: data.toDate,
      submissionDate: new Date(),
    });
    setShowSuccessConfirmation(true);
  };

  const handleFestReimbursementSubmit = async (data: FestReimbursementFormData) => {
    try {
      const formData = new FormData();
      formData.append('studentId', loggedInUser.studentId);
      formData.append('festName', data.festName);
      formData.append('team', data.team);
      formData.append('transactionId', data.transactionId);
      formData.append('expenseAmount', data.expenseAmount.toString());
      formData.append('expenseDescription', data.expenseDescription);
      data.receiptFiles.forEach((file) => formData.append('receiptFiles', file));

      const response = await fetch(`${BASE_URL}/api/claims/fest`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setShowFestReimbursementForm(false);
        setFestClaimData({
          claimId: result.claim.claimId,
          teamName: `${data.festName} - ${data.team}`,
          amount: data.expenseAmount,
          receiptsCount: data.receiptFiles.length,
          submissionDate: new Date(result.claim.createdAt),
        });
        setShowFestClaimSuccess(true);
      } else {
        alert('Submission failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Could not connect to the server.');
    }
  };

  const handleMedicalRebateSubmit = (data: MedicalRebateFormData) => {
    setShowMedicalRebateForm(false);
    setSuccessClaimData({
      claimId: `CLM-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      type: 'Medical Rebate',
      amount: data.amount,
      submissionDate: new Date(),
    });
    setShowSuccessConfirmation(true);
  };

  // ─── Page Title ───────────────────────────────────────────────────────────

  const pageTitle =
    activeMenuItem === 'dashboard'             ? 'Dashboard' :
    activeMenuItem === 'claims'                ? 'My Claims' :
    activeMenuItem === 'refunds'               ? 'Refunds & Settlements' :
    activeMenuItem === 'history'               ? 'Claim History' :
    activeMenuItem === 'manage-team'           ? 'Manage Team' :
    activeMenuItem === 'approve-reimbursement' ? 'Approve Reimbursements' :
    activeMenuItem === 'settings'              ? 'Settings' :
    'Refund Hub';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        userRole={effectiveRole}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(v => !v)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <MobileHeader
          title={pageTitle}
          onMenuToggle={() => setMobileMenuOpen(v => !v)}
        />

        <div className="p-6 lg:p-8 max-w-7xl mx-auto pt-20 lg:pt-6">

          {/* ── Dashboard ── */}
          {activeMenuItem === 'dashboard' && (
            <>
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="hidden lg:block">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {loggedInUser.fullName || 'Student'}! 👋
                    </h1>
                    <p className="text-gray-600">
                      Track your refunds and submit new claims easily
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewClaimModal(true)}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm w-full sm:w-auto"
                  >
                    <Plus size={20} />
                    New Mess/Fest Rebate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatsCard title="Total Refunded" value={`₹${dashboardStats.totalRefunded.toLocaleString()}`} icon={DollarSign} colorScheme="green" />
                <StatsCard title="Pending Claims" value={dashboardStats.pendingCount.toString()} icon={Clock} colorScheme="yellow" />
                <StatsCard title="Approved This Month" value={dashboardStats.approvedThisMonth.toString()} icon={CheckCircle} colorScheme="blue" />
              </div>

              <div className="mb-8" id="live-claim-status">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Claims</h2>
                    <p className="text-sm text-gray-600 mt-1">Quick overview of your latest claims</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {isDashboardLoading ? (
                    <div className="col-span-1 lg:col-span-2 text-center py-8 text-gray-500">
                      Loading your claims...
                    </div>
                  ) : dashboardClaims.length === 0 ? (
                    <div className="col-span-1 lg:col-span-2 text-center py-8 bg-white rounded-xl border border-gray-200 text-gray-500">
                      You haven't submitted any claims yet.
                    </div>
                  ) : (
                    dashboardClaims.map((claim) => (
                      <ClaimStatusCard key={claim.id} claim={claim} onClick={() => setActiveMenuItem('claims')} />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  Need help? Contact support at{' '}
                  <a href="mailto:support@refundhub.edu" className="text-green-600 hover:text-green-700 font-medium">
                    support@refundhub.edu
                  </a>{' '}
                  or visit the admin office
                </p>
              </div>
            </>
          )}

          {/* ── My Claims ── */}
          {activeMenuItem === 'claims' && (
            <MyClaimsView onViewRecords={(claimId) => alert(`Viewing digital records for claim ${claimId}`)} />
          )}

          {/* ── Claim History ── */}
          {activeMenuItem === 'history' && <ClaimHistoryView />}

          {/* ── Manage Team ── */}
          {activeMenuItem === 'manage-team' && effectiveRole && (
            <ManageTeamView
              userRole={effectiveRole}
              userFests={managementFests.map(f => ({
                festId: f.festId,
                festName: f.festName,
                academicYear: f.academicYear,
              }))}
              currentStudentId={loggedInUser.studentId}
            />
          )}

          {/* ── Approve Reimbursements ── */}
          {activeMenuItem === 'approve-reimbursement' && effectiveRole && (
            <ApproveReimbursementView
              userRole={effectiveRole}
              userFests={managementFests.map(f => ({
                festId: f.festId,
                festName: f.festName,
                academicYear: f.academicYear,
              }))}
              currentStudentId={loggedInUser.studentId}
            />
          )}

          {/* ── Profile ── */}
          {activeMenuItem === 'profile' && (
            <ProfileView onEditClick={() => setActiveMenuItem('settings')} onLogout={onLogout} />
          )}

          {/* ── Settings ── */}
          {activeMenuItem === 'settings' && (
            <EditProfile onBack={() => setActiveMenuItem('profile')} onLogout={onLogout} />
          )}

          {/* ── Fallback ── */}
          {!['dashboard', 'claims', 'history', 'manage-team', 'approve-reimbursement', 'profile', 'settings'].includes(activeMenuItem) && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeMenuItem.charAt(0).toUpperCase() + activeMenuItem.slice(1)}
              </h2>
              <p className="text-gray-600">This section is coming soon!</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}

      <SelectCategoryModal isOpen={showNewClaimModal} onClose={() => setShowNewClaimModal(false)} onNext={handleCategorySelect} />
      <MessRebateForm isOpen={showMessRebateForm} onClose={() => setShowMessRebateForm(false)} onBack={handleBackToCategory} onSubmit={handleMessRebateSubmit} />
      <FestReimbursementForm isOpen={showFestReimbursementForm} onClose={() => setShowFestReimbursementForm(false)} onBack={handleBackToCategory} onSubmit={handleFestReimbursementSubmit} />
      <MedicalRebateForm isOpen={showMedicalRebateForm} onClose={() => setShowMedicalRebateForm(false)} onBack={handleBackToCategory} onSubmit={handleMedicalRebateSubmit} />

      {successClaimData && (
        <SuccessConfirmation
          isOpen={showSuccessConfirmation}
          onClose={() => { setShowSuccessConfirmation(false); setSuccessClaimData(null); }}
          onTrackStatus={handleTrackStatus}
          claimData={successClaimData}
        />
      )}

      {festClaimData && (
        <FestClaimSuccess
          isOpen={showFestClaimSuccess}
          onClose={() => { setShowFestClaimSuccess(false); setFestClaimData(null); }}
          onTrackStatus={handleTrackStatus}
          onViewRecords={() => alert('Digital Records viewer would open here with all uploaded receipts!')}
          claimData={festClaimData}
        />
      )}
    </div>
  );
}
