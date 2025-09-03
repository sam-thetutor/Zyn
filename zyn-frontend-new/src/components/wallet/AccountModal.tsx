import { useState } from 'react';
import { X } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
  loading?: boolean;
}

export default function AccountModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialName = '', 
  loading = false 
}: AccountModalProps) {
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    onSave(name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create your profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="mb-4 text-sm text-gray-600">
          Set a display name. You can use emojis. You can change it later.
        </p>
        
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name ✨"
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
          disabled={loading}
        />
        
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
