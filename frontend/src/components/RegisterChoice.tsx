import { ArrowLeft, User, Shield } from 'lucide-react';

interface RegisterChoiceProps {
  onBack: () => void;
  onSelectStudent: () => void;
  onSelectAdmin: () => void;
}

export function RegisterChoice({ onBack, onSelectStudent, onSelectAdmin }: RegisterChoiceProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Gateway</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Account</h2>
            <p className="text-gray-600 text-lg">
              Choose your registration type to get started
            </p>
          </div>

          {/* Registration Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Registration */}
            <button
              onClick={onSelectStudent}
              className="p-8 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all group text-center"
            >
              <div className="w-20 h-20 bg-green-100 group-hover:bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <User size={40} className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Register as Student</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your student account to submit and track refund claims
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-semibold text-green-600 group-hover:text-green-700">
                  Continue →
                </span>
              </div>
            </button>

            {/* Admin/Authority Registration */}
            <button
              onClick={onSelectAdmin}
              className="p-8 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-center"
            >
              <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <Shield size={40} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Register as Admin</h3>
              <p className="text-sm text-gray-600 mb-4">
                Set up your admin account to review and approve claims
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  Continue →
                </span>
              </div>
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-700 text-center">
              <span className="font-semibold">Note:</span> Your registration details will be verified by campus administration before account activation
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={onBack} className="text-green-600 hover:text-green-700 font-semibold transition-colors">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
