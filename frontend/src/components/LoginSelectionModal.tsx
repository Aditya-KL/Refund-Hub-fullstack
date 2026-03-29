import { X, User, Shield } from 'lucide-react';

interface LoginSelectionModalProps {
  onClose: () => void;
  onSelectStudent: () => void;
  onSelectAdmin: () => void;
}

export function LoginSelectionModal({ onClose, onSelectStudent, onSelectAdmin }: LoginSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Login Type</h2>
            <p className="text-gray-600 mt-1">Choose your account type to continue</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {/* Student Login Option */}
          <button
            onClick={onSelectStudent}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-100 group-hover:bg-green-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <User size={28} className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Login as Student</h3>
                <p className="text-sm text-gray-600">
                  Access your claims, track refunds, and submit new applications
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-green-600 group-hover:text-green-700">
                    Continue →
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Admin/Authority Login Option */}
          <button
            onClick={onSelectAdmin}
            className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                <Shield size={28} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Login as Admin/Authority</h3>
                <p className="text-sm text-gray-600">
                  Review applications, approve claims, and manage settlements
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    Continue →
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-semibold">Note:</span> Select the appropriate login type based on your role in the system
          </p>
        </div>
      </div>
    </div>
  );
}
