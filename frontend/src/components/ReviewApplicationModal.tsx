import { useState } from 'react';
import { X, FileText, Eye, Calendar, DollarSign, Tag, MessageSquare, UtensilsCrossed, Ticket, Heart } from 'lucide-react';
import { ClaimTracking } from './ClaimTrackingCard';
import { DocumentViewer } from './DocumentViewer';

interface ReviewApplicationModalProps {
  claim: ClaimTracking;
  onClose: () => void;
}

interface Document {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
}

export function ReviewApplicationModal({ claim, onClose }: ReviewApplicationModalProps) {
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // Mock documents based on claim type
  const getDocuments = (): Document[] => {
    switch (claim.type) {
      case 'mess-rebate':
        return [
          { id: '1', name: 'Leave_Application_Form.pdf', type: 'pdf', url: '/placeholder-doc.pdf' },
          { id: '2', name: 'Student_ID_Card.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=800' },
        ];
      case 'fest-activity':
        return [
          { id: '1', name: 'Travel_Receipt_1.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1554224311-beee4ced647b?w=800' },
          { id: '2', name: 'Travel_Receipt_2.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1554224311-94640f2b0b5e?w=800' },
          { id: '3', name: 'Materials_Invoice.pdf', type: 'pdf', url: '/placeholder-doc.pdf' },
          { id: '4', name: 'Event_Authorization_Letter.pdf', type: 'pdf', url: '/placeholder-doc.pdf' },
        ];
      case 'medical-rebate':
        return [
          { id: '1', name: 'Medical_Bill.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800' },
          { id: '2', name: 'Prescription.jpg', type: 'image', url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800' },
          { id: '3', name: 'Doctor_Certificate.pdf', type: 'pdf', url: '/placeholder-doc.pdf' },
        ];
    }
  };

  const documents = getDocuments();

  const getTypeConfig = (type: ClaimTracking['type']) => {
    switch (type) {
      case 'mess-rebate':
        return {
          icon: UtensilsCrossed,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: 'Mess Rebate',
        };
      case 'fest-activity':
        return {
          icon: Ticket,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          label: 'Fest/Activity Reimbursement',
        };
      case 'medical-rebate':
        return {
          icon: Heart,
          color: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Medical Rebate',
        };
    }
  };

  const typeConfig = getTypeConfig(claim.type);
  const TypeIcon = typeConfig.icon;

  // Format reason based on claim type
  const getReason = () => {
    switch (claim.type) {
      case 'mess-rebate':
        return 'Going home for spring break - attending family function';
      case 'fest-activity':
        return 'Organized logistics and travel arrangements for annual tech fest. Required transportation for equipment and team members.';
      case 'medical-rebate':
        return 'Emergency medical treatment required. Visited City Hospital for consultation and prescribed medication.';
    }
  };

  if (viewingDocument) {
    return (
      <DocumentViewer
        document={viewingDocument}
        onClose={() => setViewingDocument(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 rounded-t-2xl z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Application</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${typeConfig.bg} ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                <span className="text-sm text-gray-500 font-mono">{claim.id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Application Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-600" />
              Application Summary
            </h3>
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              {/* Category */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={typeConfig.color} size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Category</p>
                  <p className="font-semibold text-gray-900">{typeConfig.label}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Submission Date</p>
                  <p className="font-semibold text-gray-900">{claim.submissionDate}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Claim Amount</p>
                  <p className="font-bold text-green-700 text-lg">₹{claim.amount.toLocaleString()}</p>
                </div>
              </div>

              {/* Details/Reason */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="text-purple-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Reason / Details</p>
                  <p className="text-gray-700 leading-relaxed">{getReason()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={20} className="text-green-600" />
              Uploaded Documents
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                      <FileText className="text-gray-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 uppercase mt-0.5">
                        {doc.type === 'pdf' ? 'PDF Document' : 'Image File'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingDocument(doc)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm opacity-0 group-hover:opacity-100"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Current Status:</span> This claim is currently at the <span className="font-bold uppercase">{claim.currentStage}</span> stage. You will be notified of any updates via email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
