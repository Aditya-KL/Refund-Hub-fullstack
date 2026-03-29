import { CheckCircle, FileText, Calendar, Clock } from 'lucide-react';

interface SuccessConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackStatus: () => void;
  claimData: {
    claimId: string;
    type: string;
    amount?: number;
    fromDate?: Date | null;
    toDate?: Date | null;
    submissionDate: Date;
  };
}

export function SuccessConfirmation({ isOpen, onClose, onTrackStatus, claimData }: SuccessConfirmationProps) {
  if (!isOpen) return null;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calculateDays = () => {
    if (claimData.fromDate && claimData.toDate) {
      const diffTime = Math.abs(claimData.toDate.getTime() - claimData.fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="text-center pt-12 pb-8 px-6">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="text-green-600" size={64} strokeWidth={2} />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-green-200 rounded-full animate-ping opacity-20" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Claim Submitted Successfully!</h2>
          <p className="text-gray-600 text-lg">
            Your rebate claim has been received and is being processed.
          </p>
        </div>

        {/* Claim Summary */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Claim Summary
            </h3>

            {/* Claim ID */}
            <div className="bg-white border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Claim ID</p>
              <p className="text-2xl font-bold text-green-700 font-mono tracking-wide">
                {claimData.claimId}
              </p>
              <p className="text-xs text-gray-500 mt-2">Save this ID for future reference</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Claim Type</span>
                <span className="text-sm font-semibold text-gray-900">{claimData.type}</span>
              </div>

              {claimData.fromDate && claimData.toDate && (
                <div className="flex items-start justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar size={14} />
                    Duration
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-right">
                    {formatDate(claimData.fromDate)} - {formatDate(claimData.toDate)}
                    <span className="block text-xs text-gray-500 mt-0.5">
                      ({calculateDays()} days)
                    </span>
                  </span>
                </div>
              )}

              {/* ✅ FIX: Guard against amount being 0 which is falsy */}
              {claimData.amount != null && (
                <div className="flex items-start justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Estimated Amount</span>
                  <span className="text-sm font-semibold text-green-700">
                    ₹{claimData.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock size={14} />
                  Submitted On
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(claimData.submissionDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📌 What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Your claim will be reviewed by the admin team within 2–3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>You'll receive updates via email and in your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Upload supporting documents from the "My Claims" section</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-5 rounded-b-2xl space-y-3">
          <button
            onClick={onTrackStatus}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 text-lg"
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