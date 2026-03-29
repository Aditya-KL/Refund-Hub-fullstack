import { UtensilsCrossed, Ticket, Heart, X } from 'lucide-react';
import { useState } from 'react';

interface SelectCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (category: string) => void;
}

interface CategoryCardProps {
  id: string;
  icon: React.ElementType;
  title: string;
  note: string;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryCard({ icon: Icon, title, note, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-xl border-2 transition-all duration-200
        text-left hover:shadow-lg
        ${
          isSelected
            ? 'border-green-600 bg-green-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-green-300'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`
          w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0
          ${isSelected ? 'bg-green-600' : 'bg-green-50'}
        `}
        >
          <Icon className={isSelected ? 'text-white' : 'text-green-600'} size={32} />
        </div>

        <div className="flex-1 pt-2">
          <h3
            className={`text-lg font-semibold mb-2 ${
              isSelected ? 'text-green-900' : 'text-gray-900'
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${
              isSelected ? 'text-green-700' : 'text-gray-600'
            }`}
          >
            {note}
          </p>
        </div>
      </div>
    </button>
  );
}

export function SelectCategoryModal({ isOpen, onClose, onNext }: SelectCategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    {
      id: 'mess-rebate',
      icon: UtensilsCrossed,
      title: 'Mess Rebate',
      note: 'Minimum 5 days absence required',
    },
    {
      id: 'fest-activity',
      icon: Ticket,
      title: 'Fest/Activity Reimbursement',
      note: 'Scan receipts for travel/logistics',
    },
    {
      id: 'medical-rebate',
      icon: Heart,
      title: 'Medical Rebate',
      note: 'Hospital bills and medical expenses',
    },
  ];

  const handleNext = () => {
    if (selectedCategory) {
      onNext(selectedCategory);
      setSelectedCategory(null);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
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
              <h2 className="text-2xl font-bold text-gray-900">Select Category</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose the type of refund or rebate you want to claim
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
        <div className="p-6 space-y-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              icon={category.icon}
              title={category.title}
              note={category.note}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedCategory}
              className={`
                px-8 py-3 rounded-lg font-semibold transition-all
                ${
                  selectedCategory
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}