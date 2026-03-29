import { Calendar, DollarSign, FileText, Eye, UtensilsCrossed, Ticket, Heart } from 'lucide-react';
import { ProgressStepper, ClaimStage } from './ProgressStepper';

export interface ClaimTracking {
  id: string;
  type: 'mess-rebate' | 'fest-activity' | 'medical-rebate';
  title: string;
  amount: number;
  submissionDate: string;
  currentStage: ClaimStage;
  isRejected?: boolean;
  details?: string;
  receiptsCount?: number;
}

interface ClaimTrackingCardProps {
  claim: ClaimTracking;
  onViewRecords: (claimId: string) => void;
}

export function ClaimTrackingCard({ claim, onViewRecords }: ClaimTrackingCardProps) {
  const getTypeConfig = (type: ClaimTracking['type']) => {
    switch (type) {
      case 'mess-rebate':
        return {
          icon: UtensilsCrossed,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: 'Mess Rebate',
        };
      case 'fest-activity':
        return {
          icon: Ticket,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: 'Fest/Activity',
        };
      case 'medical-rebate':
        return {
          icon: Heart,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Medical Rebate',
        };
    }
  };

  const typeConfig = getTypeConfig(claim.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
              <TypeIcon className={typeConfig.color} size={18} />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeConfig.bg} ${typeConfig.border} border ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg">{claim.title}</h3>
          {claim.details && (
            <p className="text-sm text-gray-600 mt-1">{claim.details}</p>
          )}
        </div>
      </div>

      {/* Claim Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Claim ID</p>
            <p className="text-sm font-semibold text-gray-900 font-mono">{claim.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Submitted</p>
            <p className="text-sm font-semibold text-gray-900">{claim.submissionDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-sm font-semibold text-green-700">₹{claim.amount.toLocaleString()}</p>
          </div>
        </div>
        {claim.receiptsCount !== undefined && (
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Receipts</p>
              <p className="text-sm font-semibold text-gray-900">{claim.receiptsCount} file(s)</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="mb-5 p-4 bg-gray-50 rounded-lg">
        <ProgressStepper currentStage={claim.currentStage} isRejected={claim.isRejected} />
      </div>

      {/* Action Button */}
      <button
        onClick={() => onViewRecords(claim.id)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 rounded-lg font-semibold transition-colors"
      >
        <Eye size={18} />
        View Digital Records
      </button>
    </div>
  );
}