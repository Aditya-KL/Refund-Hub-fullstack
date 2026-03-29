import React from 'react';
import { X, Building2, CreditCard, User, CheckCircle } from 'lucide-react';

interface Claim {
  id: string;
  studentName: string;
  rollNo: string;
  bankAccount: string;
  fullBankAccount: string;
  ifscCode: string;
  accountHolderName: string;
  amount: number;
  department: string;
}

interface ConfirmSettlementModalProps {
  claim: Claim;
  onClose: () => void;
  onConfirm: (claimId: string) => void;
}

export function ConfirmSettlementModal({ claim, onClose, onConfirm }: ConfirmSettlementModalProps) {
  const handleConfirm = () => {
    onConfirm(claim.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Confirm Settlement</h2>
              <p className="text-emerald-100 text-sm mt-1">Verify bank details before processing payment</p>
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
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <User className="text-emerald-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Student Information</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Submission ID:</span>
                <span className="text-sm font-bold text-gray-900">{claim.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Student Name:</span>
                <span className="text-sm font-semibold text-gray-900">{claim.studentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Roll Number:</span>
                <span className="text-sm font-bold text-blue-600">{claim.rollNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{claim.department}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="text-sm text-gray-600">Settlement Amount:</span>
                <span className="text-2xl font-bold text-emerald-600">₹{claim.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Bank Details - CRITICAL SECTION */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Building2 className="text-amber-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Bank Account Details</h3>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-300 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Account Holder Name:</span>
                <span className="text-sm font-bold text-gray-900">{claim.accountHolderName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Account Number:</span>
                <span className="text-lg font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded border border-amber-400">
                  {claim.fullBankAccount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">IFSC Code:</span>
                <span className="text-lg font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded border border-amber-400">
                  {claim.ifscCode}
                </span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600 mt-0.5 flex-shrink-0">
                  <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Please verify carefully</p>
                  <p className="text-xs text-red-700 mt-0.5">Double-check all bank details before confirming. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 rounded-b-2xl">
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-base transition-colors border-2 border-gray-300"
          >
            Cancel
          </button>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base transition-colors shadow-sm"
          >
            <CheckCircle size={24} />
            <span>Confirm & Notify Student</span>
          </button>
        </div>
      </div>
    </div>
  );
}