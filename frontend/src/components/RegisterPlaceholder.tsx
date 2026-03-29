import { ArrowLeft, UserPlus, Construction } from 'lucide-react';

interface RegisterPlaceholderProps {
  onBack: () => void;
}

export function RegisterPlaceholder({ onBack }: RegisterPlaceholderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
              <Construction size={32} className="text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Coming Soon</h2>
            <p className="text-gray-600">
              We're building a seamless registration experience
            </p>
          </div>

          {/* Info Content */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <UserPlus size={18} className="text-green-600" />
                What You'll Be Able To Do:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Create your student account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Link your university roll number</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Add your bank details securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Start claiming refunds immediately</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 text-center">
                <span className="font-semibold">For Now:</span> Please contact your campus administration to create an account
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              Need immediate assistance?
            </p>
            <a
              href="mailto:support@refundhub.edu"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Contact Support Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
