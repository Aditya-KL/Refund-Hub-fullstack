import { useState } from 'react';
import { X, Calendar, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface MessRebateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (data: MessRebateFormData) => void;
}

export interface MessRebateFormData {
  fromDate: Date | null;
  toDate: Date | null;
  reason: string;
}

export function MessRebateForm({ isOpen, onClose, onBack, onSubmit }: MessRebateFormProps) {
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDurationError, setShowDurationError] = useState(false);

  if (!isOpen) return null;

  const calculateDays = () => {
    if (fromDate && toDate) {
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1; // Include both start and end date
    }
    return 0;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fromDate) {
      newErrors.fromDate = 'From date is required';
    }
    if (!toDate) {
      newErrors.toDate = 'To date is required';
    }
    if (fromDate && toDate && fromDate > toDate) {
      newErrors.toDate = 'To date must be after from date';
    }
    
    const daysCount = calculateDays();
    if (daysCount > 0 && daysCount < 5) {
      setShowDurationError(true);
      return false;
    }
    
    if (!reason.trim()) {
      newErrors.reason = 'Reason for absence is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({ fromDate, toDate, reason });
      // Reset form
      setFromDate(null);
      setToDate(null);
      setReason('');
      setErrors({});
      setShowDurationError(false);
    }
  };

  const handleClose = () => {
    setFromDate(null);
    setToDate(null);
    setReason('');
    setErrors({});
    setShowDurationError(false);
    onClose();
  };

  const handleEditDates = () => {
    setShowDurationError(false);
    // Clear the dates to allow user to re-enter
    setFromDate(null);
    setToDate(null);
  };

  const days = calculateDays();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mess Rebate Application</h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the details for your mess rebate claim
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Duration Error State */}
          {showDurationError && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 shadow-md">
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 mb-1 text-lg">Invalid Duration</h4>
                  <p className="text-sm text-red-800">
                    Mess rebates are only available for absences longer than 5 days.
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    Current selection: <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditDates}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Edit Dates
              </button>
            </div>
          )}

          {/* Notice Box */}
          {!showDurationError && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Notice</h4>
                <p className="text-sm text-green-800">
                  Mess rebates are only applicable for absences longer than 5 days.
                </p>
              </div>
            </div>
          )}

          {/* Date Range Section */}
          <div className={showDurationError ? 'opacity-50 pointer-events-none' : ''}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar size={16} />
              Date Precision
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setFromDate(date);
                    setErrors((prev) => ({ ...prev, fromDate: '', dateRange: '' }));
                  }}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    ${errors.fromDate ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                {errors.fromDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.fromDate}</p>
                )}
              </div>

              {/* To Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setToDate(date);
                    setErrors((prev) => ({ ...prev, toDate: '', dateRange: '' }));
                  }}
                  min={fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    ${errors.toDate ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
                {errors.toDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.toDate}</p>
                )}
              </div>
            </div>

            {/* Date Range Error */}
            {errors.dateRange && (
              <p className="text-sm text-red-600 mt-2">{errors.dateRange}</p>
            )}

            {/* Duration Display */}
            {fromDate && toDate && days > 0 && !showDurationError && (
              <div className={`
                mt-3 p-3 rounded-lg flex items-center gap-2
                ${days >= 5 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
              `}>
                <Info size={16} className={days >= 5 ? 'text-green-600' : 'text-red-600'} />
                <p className={`text-sm font-medium ${days >= 5 ? 'text-green-700' : 'text-red-700'}`}>
                  Duration: {days} day{days !== 1 ? 's' : ''}
                  {days >= 5 ? ' ✓ Eligible' : ' ✗ Not eligible (minimum 5 days required)'}
                </p>
              </div>
            )}
          </div>

          {/* Reason for Absence */}
          <div className={showDurationError ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Absence *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              placeholder="Please provide a detailed reason for your absence from the mess..."
              rows={4}
              className={`
                w-full px-4 py-3 border rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-green-500
                ${errors.reason ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.reason && (
              <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {reason.length} / 500 characters
            </p>
          </div>

          {/* Additional Information */}
          {!showDurationError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                📋 Required Documents (to be uploaded after submission)
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>Leave application approved by hostel warden</li>
                <li>Travel tickets (if applicable)</li>
                <li>Any supporting documentation</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={showDurationError}
              className={`
                px-8 py-3 rounded-lg font-semibold transition-all shadow-sm
                ${showDurationError 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}