import { CheckCircle, X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function SuccessToast({ message, show, onClose }: Props) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-slideIn">
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-green-400/30 shadow-xl px-5 py-3 rounded-2xl text-white">
        <CheckCircle className="text-green-400" size={22} />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose}>
          <X size={18} className="opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
}