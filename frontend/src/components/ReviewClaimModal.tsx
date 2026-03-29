import { X, CheckCircle, XCircle } from 'lucide-react';

interface Claim {
  id: string;
  rollNo: string;
  studentName: string;
  category: string;
  amount: number;
  dateApplied: string;
  attachment: string;
  details: string;
}

interface ReviewClaimModalProps {
  claim: Claim;
  onClose: () => void;
  onVerify: (claimId: string) => void;
  onReject: (claimId: string) => void;
}

export function ReviewClaimModal({ claim, onClose, onVerify, onReject }: ReviewClaimModalProps) {
  const handleVerify = () => {
    onVerify(claim.id);
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this claim? This action cannot be undone.')) {
      onReject(claim.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Claim Verification</h2>
              <p className="text-blue-100 text-sm mt-1">{claim.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Student Information</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-semibold text-gray-900">{claim.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Roll Number:</span>
                <span className="text-sm font-bold text-blue-600">{claim.rollNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Claim Amount:</span>
                <span className="text-lg font-bold text-red-600">₹{claim.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Submitted On:</span>
                <span className="text-sm font-medium text-gray-900">{claim.dateApplied}</span>
              </div>
            </div>
          </div>

          {/* Claim Description */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Claim Description</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700">{claim.details}</p>
            </div>
          </div>

          {/* Supporting Documents */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Supporting Documents</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <img
                src={claim.attachment}
                alt="Supporting Document"
                className="w-full h-auto rounded-lg border-2 border-gray-300 shadow-md"
              />
            </div>
          </div>

          {/* Verification Note (Optional - can be added for context) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600 mt-0.5">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Sub-Admin Verification</p>
                <p className="text-sm text-blue-700 mt-1">Documents look genuine. All dates verified. Recommended for approval.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-3 rounded-b-2xl">
          {/* Verify & Forward Button */}
          <button
            onClick={handleVerify}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base transition-colors shadow-sm"
          >
            <CheckCircle size={24} />
            <span>Verify & Forward</span>
          </button>

          {/* Reject Claim Button */}
          <button
            onClick={handleReject}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-base transition-colors shadow-sm"
          >
            <XCircle size={24} />
            <span>Reject Claim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
