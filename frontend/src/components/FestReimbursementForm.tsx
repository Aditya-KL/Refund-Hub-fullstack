import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Trash2, Star, Receipt, Calendar, Users, Hash } from 'lucide-react';

interface FestReimbursementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (data: FestReimbursementFormData) => void;
}

// ✅ NEW: Updated data structure with your new fields
export interface FestReimbursementFormData {
  festName: string;
  team: string;
  transactionId: string;
  expenseAmount: number;
  expenseDescription: string;
  receiptFiles: File[];
}

// Pre-defined list of teams for the dropdown
const TEAM_OPTIONS = [
  "MPR (Media & Public Relations)",
  "Sponsorship",
  "Events & Management",
  "Web & App Development",
  "Creatives & Design",
  "Logistics & Operations",
  "Hospitality",
  "Other"
];

export function FestReimbursementForm({ isOpen, onClose, onBack, onSubmit }: FestReimbursementFormProps) {
  // ✅ NEW: Added states for the new fields
  const [festName, setFestName] = useState('');
  const [team, setTeam] = useState('');
  const [transactionId, setTransactionId] = useState('');
  
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid file type. Please upload images or PDFs.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });

    setReceiptFiles((prev) => [...prev, ...newFiles]);
    setErrors((prev) => ({ ...prev, receipts: '' }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // ✅ NEW: Validations for the new fields
    if (!festName.trim()) newErrors.festName = 'Fest name is required';
    if (!team) newErrors.team = 'Please select a team';
    // ✅ NEW CODE
    const transactionRegex = /^[A-Za-z0-9._/-]{6,30}$/;
    if (!transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required';
    } else if (!transactionRegex.test(transactionId.trim())) {
      newErrors.transactionId = 'Enter a valid payment reference or bill number (6-30 letters/numbers)';
    }
    
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      newErrors.expenseAmount = 'Valid expense amount is required';
    }
    if (!expenseDescription.trim()) {
      newErrors.expenseDescription = 'Expense description is required';
    }
    if (receiptFiles.length === 0) {
      newErrors.receipts = 'At least one receipt/bill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // ✅ NEW: Sending the updated data payload
      onSubmit({
        festName,
        team,
        transactionId,
        expenseAmount: parseFloat(expenseAmount),
        expenseDescription,
        receiptFiles,
      });
      // Reset form
      handleClose();
    }
  };

  const handleClose = () => {
    setFestName('');
    setTeam('');
    setTransactionId('');
    setExpenseAmount('');
    setExpenseDescription('');
    setReceiptFiles([]);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">Fest/Activity Reimbursement</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 border border-purple-300 text-purple-800 text-xs font-semibold rounded-full">
                  <Star size={12} fill="currentColor" />
                  Volunteer Priority
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Submit claims for fest logistics, PR, sponsorship, and event expenses
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notice Box */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Important Notice</h4>
              <p className="text-sm text-green-800">
                Scan receipts for travel/logistics expenses. All claims must include valid proof of payment and be submitted within 30 days of expense.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ✅ NEW: Fest Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" />
                Fest Name *
              </label>
              <input
                type="text"
                value={festName}
                onChange={(e) => {
                  setFestName(e.target.value);
                  setErrors((prev) => ({ ...prev, festName: '' }));
                }}
                placeholder="e.g., Anwesha, Celesta"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  errors.festName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.festName && <p className="text-sm text-red-600 mt-1">{errors.festName}</p>}
            </div>

            {/* ✅ NEW: Team Dropdown */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="text-gray-400" />
                Your Team *
              </label>
              <select
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  setErrors((prev) => ({ ...prev, team: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white appearance-none cursor-pointer ${
                  errors.team ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="" disabled>Select your team</option>
                {TEAM_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.team && <p className="text-sm text-red-600 mt-1">{errors.team}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => {
                    setExpenseAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, expenseAmount: '' }));
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                    errors.expenseAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.expenseAmount && <p className="text-sm text-red-600 mt-1">{errors.expenseAmount}</p>}
            </div>

            {/* ✅ NEW: Transaction ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Hash size={16} className="text-gray-400" />
                Transaction ID / Ref No. *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setErrors((prev) => ({ ...prev, transactionId: '' }));
                }}
                placeholder="e.g., UPI Ref, bank ref, or bill no."
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  errors.transactionId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Accepted: 6-30 letters, numbers, `.`, `_`, `/`, `-`</p>
              {errors.transactionId && <p className="text-sm text-red-600 mt-1">{errors.transactionId}</p>}
            </div>
          </div>

          {/* Expense Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Description *
            </label>
            <textarea
              value={expenseDescription}
              onChange={(e) => {
                setExpenseDescription(e.target.value);
                setErrors((prev) => ({ ...prev, expenseDescription: '' }));
              }}
              placeholder="Provide a detailed description of expenses (e.g., printing posters for MPR, buying materials for events...)"
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                errors.expenseDescription ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.expenseDescription ? (
                <p className="text-sm text-red-600">{errors.expenseDescription}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-500">{expenseDescription.length} / 500 chars</p>
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Receipt size={16} /> Upload Receipts/Bills *
            </label>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging ? 'border-green-500 bg-green-50' : errors.receipts ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-green-100' : 'bg-white shadow-sm'}`}>
                  <Upload className={isDragging ? 'text-green-600' : 'text-gray-400'} size={32} />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">Drag & drop files here, or click to browse</p>
                  <p className="text-sm text-gray-500">Supported formats: JPG, PNG, PDF (max 5MB)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium cursor-pointer transition-colors shadow-sm mt-2"
                >
                  Select Files
                </label>
              </div>
            </div>
            {errors.receipts && <p className="text-sm text-red-600 mt-1">{errors.receipts}</p>}

            {/* Uploaded Files List */}
            {receiptFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Files ({receiptFiles.length})</p>
                {receiptFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-green-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile(index)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">
              📋 Reimbursement Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>All receipts must be clear and legible</li>
              <li>Original bills are preferred; photocopies must be verified</li>
              <li>Maximum reimbursement: ₹10,000 per claim</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4">
            <button onClick={onBack} className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors">
              ← Back
            </button>
            <button onClick={handleSubmit} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
