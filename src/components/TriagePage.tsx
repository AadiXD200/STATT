import { Phone, X } from 'lucide-react';

interface TriagePageProps {
  onClose: () => void;
  onShowUrgentCare: () => void;
}

const emergencySymptoms = [
  'Chest pain or pressure',
  'Difficulty breathing or shortness of breath',
  'Severe bleeding that won\'t stop',
  'Sudden severe headache or vision changes',
  'Loss of consciousness or fainting',
  'Severe allergic reaction',
  'Suspected stroke symptoms',
  'Major trauma or injury',
];

export function TriagePage({ onClose, onShowUrgentCare }: TriagePageProps) {
  const call911 = () => {
    window.location.href = 'tel:911';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>

          <div className="mb-12 text-center">
            <div className="inline-block mb-6 px-4 py-2 border border-accent-red">
              <span className="font-mono text-accent-red text-xs uppercase tracking-wider">
                Emergency Assessment
              </span>
            </div>
            <h1 className="font-sans font-bold text-text-primary text-4xl md:text-5xl tracking-tight">
              ARE YOU EXPERIENCING:
            </h1>
          </div>

          <div className="bg-surface border border-border p-8 mb-8">
            <ul className="space-y-3">
              {emergencySymptoms.map((symptom, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 font-mono text-text-primary text-sm"
                >
                  <span className="text-accent-red mt-1">▸</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <button
              onClick={call911}
              className="w-full bg-accent-red text-text-primary font-sans font-bold text-xl py-6 hover:bg-accent-red/90 transition-colors flex items-center justify-center gap-3"
            >
              <Phone size={24} />
              <span>YES - CALL 911 NOW</span>
            </button>

            <button
              onClick={onShowUrgentCare}
              className="w-full border-2 border-text-primary text-text-primary font-mono text-sm uppercase tracking-wider py-4 hover:bg-text-primary hover:text-background transition-colors"
            >
              NO - FIND URGENT CARE
            </button>
          </div>

          <div className="mt-8 p-4 border border-border-light">
            <p className="font-mono text-text-tertiary text-xs text-center">
              This tool is for informational purposes only and does not constitute medical advice.
              When in doubt, always call 911 or go to the nearest emergency room.
            </p>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 51, 51, 0.03) 20px, rgba(255, 51, 51, 0.03) 40px)',
        }}
      ></div>
    </div>
  );
}
