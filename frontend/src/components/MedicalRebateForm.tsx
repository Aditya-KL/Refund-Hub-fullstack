import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Trash2, Heart, Calendar, Hospital } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRebateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (data: MedicalRebateFormData) => void;
}

export interface MedicalRebateFormData {
  hospitalName: string;
  treatmentDate: Date | null;
  amount: number;
  description: string;
  billFiles: File[];
}

export function MedicalRebateForm({ isOpen, onClose, onBack, onSubmit }: MedicalRebateFormProps) {
  const [hospitalName, setHospitalName] = useState('');
  const [treatmentDate, setTreatmentDate] = useState<Date | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billFiles, setBillFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) => {
      // Validate file type (images and PDFs)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid file type. Please upload images or PDFs.`);
        return false;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });

    setBillFiles((prev) => [...prev, ...newFiles]);
    setErrors((prev) => ({ ...prev, bills: '' }));
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
    setBillFiles((prev) => prev.filter((_, i) => i !== index));
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

    if (!hospitalName.trim()) {
      newErrors.hospitalName = 'Hospital/Clinic name is required';
    }
    if (!treatmentDate) {
      newErrors.treatmentDate = 'Treatment date is required';
    }
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (billFiles.length === 0) {
      newErrors.bills = 'At least one medical bill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        hospitalName,
        treatmentDate,
        amount: parseFloat(amount),
        description,
        billFiles,
      });
      // Reset form
      setHospitalName('');
      setTreatmentDate(null);
      setAmount('');
      setDescription('');
      setBillFiles([]);
      setErrors({});
    }
  };

  const handleClose = () => {
    setHospitalName('');
    setTreatmentDate(null);
    setAmount('');
    setDescription('');
    setBillFiles([]);
    setErrors({});
    onClose();
  };

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
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart size={28} className="text-red-500" />
                Medical Rebate
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Submit claims for medical expenses and hospital bills
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
          {/* Notice Box */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Medical Verification Process</h4>
              <p className="text-sm text-red-800">
                All medical claims are verified by the Health Center before Finance settlement. 
                Ensure all bills are genuine and in your name.
              </p>
            </div>
          </div>

          {/* Hospital Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Hospital size={16} />
              Hospital/Clinic Name *
            </label>
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => {
                setHospitalName(e.target.value);
                setErrors((prev) => ({ ...prev, hospitalName: '' }));
              }}
              placeholder="e.g., City General Hospital"
              className={`
                w-full px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-green-500
                ${errors.hospitalName ? 'border-red-500' : 'border-gray-300'}
              `}
            />
            {errors.hospitalName && (
              <p className="text-sm text-red-600 mt-1">{errors.hospitalName}</p>
            )}
          </div>

          {/* Treatment Date & Amount - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Treatment Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                Treatment Date *
              </label>
              <input
                type="date"
                value={treatmentDate ? format(treatmentDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setTreatmentDate(date);
                  setErrors((prev) => ({ ...prev, treatmentDate: '' }));
                }}
                max={format(new Date(), 'yyyy-MM-dd')}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-green-500
                  ${errors.treatmentDate ? 'border-red-500' : 'border-gray-300'}
                `}
              />
              {errors.treatmentDate && (
                <p className="text-sm text-red-600 mt-1">{errors.treatmentDate}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    ${errors.amount ? 'border-red-500' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Additional Notes/Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the treatment or medical condition..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {description.length} / 300 characters
            </p>
          </div>

          {/* Bill Upload Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} />
              Upload Medical Bill *
            </label>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-green-500 bg-green-50' : errors.bills ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Upload className={isDragging ? 'text-green-600' : 'text-gray-400'} size={32} />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">
                    Drag & drop medical bill here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPG, PNG, GIF, PDF (max 5MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="bill-upload"
                />
                <label
                  htmlFor="bill-upload"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
                >
                  Select Files
                </label>
              </div>
            </div>
            {errors.bills && (
              <p className="text-sm text-red-600 mt-1">{errors.bills}</p>
            )}

            {/* Uploaded Files List */}
            {billFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Uploaded Files ({billFiles.length})
                </p>
                {billFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-red-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 text-sm">
              ⚕️ Medical Reimbursement Guidelines
            </h4>
            <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
              <li>Original bills with hospital stamp and doctor's signature required</li>
              <li>Emergency and planned medical treatments covered</li>
              <li>Maximum reimbursement: ₹10,000 per semester</li>
              <li>Prescription and medication bills must be included</li>
              <li>Claims must be submitted within 30 days of treatment</li>
              <li>Insurance-covered treatments require claim settlement proof</li>
            </ul>
          </div>
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
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-sm"
            >
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
