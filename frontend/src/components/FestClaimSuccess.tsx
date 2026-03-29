import { CheckCircle, Star, Users, DollarSign, FileText, Clock, Eye } from 'lucide-react';

interface FestClaimSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackStatus: () => void;
  onViewRecords: () => void;
  claimData: {
    claimId: string;
    teamName: string;
    amount: number;
    receiptsCount: number;
    submissionDate: Date;
  };
}

export function FestClaimSuccess({ 
  isOpen, 
  onClose, 
  onTrackStatus, 
  onViewRecords,
  claimData 
}: FestClaimSuccessProps) {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getEstimatedSettlementDate = () => {
    const date = new Date(claimData.submissionDate);
    date.setDate(date.getDate() + 3); // Add 3 days
    return date;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Full screen overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - Centered with scroll */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        {/* Success Icon & Message */}
        <div className="text-center pt-12 pb-6 px-6">
          {/* Animated Checkmark */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="text-green-600" size={64} strokeWidth={2} />
              </div>
              {/* Ripple effect */}
              <div className="absolute inset-0 w-24 h-24 bg-green-200 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Volunteer Priority Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 border-2 border-yellow-600 text-yellow-900 rounded-full shadow-lg">
              <Star size={18} fill="currentColor" />
              <span className="font-bold text-sm">VOLUNTEER PRIORITY</span>
              <Star size={18} fill="currentColor" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Fest Claim Submitted!
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Your claim has been sent to the Lead for verification.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Clock size={16} className="text-blue-600" />
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Estimated Settlement:</span> 2-3 business days
            </p>
          </div>
        </div>

        {/* Claim Summary */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Claim Summary
            </h3>

            {/* Claim ID - Prominent */}
            <div className="bg-white border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Claim ID</p>
              <p className="text-2xl font-bold text-green-700 font-mono tracking-wide">
                {claimData.claimId}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Save this ID for future reference
              </p>
            </div>

            {/* Team Name */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="text-purple-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Team Name</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {claimData.teamName}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount & Receipts Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Amount */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                    <DollarSign className="text-green-600" size={20} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-green-700">
                    ₹{claimData.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Receipts Uploaded */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Receipts Uploaded</p>
                  <p className="text-xl font-bold text-blue-700">
                    {claimData.receiptsCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Date */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Clock size={14} />
                Submitted On
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatDate(claimData.submissionDate)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <span className="text-sm text-gray-600">Expected Settlement By</span>
              <span className="text-sm font-semibold text-green-700">
                {formatDate(getEstimatedSettlementDate())}
              </span>
            </div>
          </div>

          {/* Verification Process */}
          <div className="mt-5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
              <Star size={16} className="text-purple-600" />
              Volunteer Priority Verification Process
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-900 font-medium">Lead Verification</p>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Team lead reviews claim and receipts (24 hours)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-900 font-medium">Admin Approval</p>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Final approval and amount verification (24 hours)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-900 font-medium">Payment Processing</p>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Amount transferred to your account (24 hours)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              📌 What you can do now
            </h4>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>View your digital receipts anytime using "View Digital Records"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Track real-time status updates in your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Receive email notifications at each verification stage</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions - Added extra padding bottom */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-5 rounded-b-2xl space-y-3 pb-6">
          <button
            onClick={onViewRecords}
            className="w-full bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <Eye size={20} />
            View Digital Records
          </button>
          <button
            onClick={onTrackStatus}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Track Status
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}