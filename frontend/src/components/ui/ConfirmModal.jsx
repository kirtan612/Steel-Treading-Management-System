import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Confirmation modal dialog
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmLabel - Text for confirm button (default: "Confirm")
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {boolean} danger - If true, shows red confirm button (default: false)
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = false,
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-card shadow-xl max-w-md w-full mx-4 p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted hover:text-[#1A1F2E] transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="mb-6">
          <h3
            id="modal-title"
            className="text-xl font-heading font-bold text-[#1A1F2E] mb-2"
          >
            {title}
          </h3>
          <p id="modal-description" className="text-muted">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-btn text-sm font-medium text-white transition-colors ${
              danger
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
