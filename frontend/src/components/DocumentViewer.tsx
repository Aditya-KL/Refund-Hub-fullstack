import { X, FileText, Download } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
}

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Viewer */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{document.name}</p>
              <p className="text-xs text-gray-300 uppercase">
                {document.type === 'pdf' ? 'PDF Document' : 'Image File'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-100 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 72px)' }}>
          {document.type === 'image' ? (
            <div className="flex items-center justify-center p-8">
              <img
                src={document.url}
                alt={document.name}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="text-red-600" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">PDF Document</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                {document.name}
              </p>
              <div className="bg-white rounded-lg p-6 border border-gray-300 max-w-md">
                <p className="text-sm text-gray-600 mb-4">
                  PDF preview is not available in this view. In a production environment, this would display the full PDF document.
                </p>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
