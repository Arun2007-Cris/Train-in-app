import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Train,
  CreditCard,
  Ban
} from 'lucide-react';
import { Booking } from '../types';

interface CancelTicketModalProps {
  booking: Booking;
  onClose: () => void;
  onCancellationSuccess: (cancelledBooking: Booking) => void;
}

export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  booking,
  onClose,
  onCancellationSuccess,
}) => {
  const [denyReturnAmount, setDenyReturnAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const totalFare = Number(booking.total_fare || booking.fare || 0);
  const passCount = booking.passengers && booking.passengers.length > 0 ? booking.passengers.length : (booking.passenger_count || 1);
  const travelClass = (booking.travel_class || '').toUpperCase();

  // Calculate cancellation clerkage deduction based on class
  let perPassengerClerkage = 60; // 2S / Second class
  if (travelClass.includes('SL') || travelClass.includes('SLEEPER')) {
    perPassengerClerkage = 120;
  } else if (travelClass.includes('3A') || travelClass.includes('CC') || travelClass.includes('3 TIER')) {
    perPassengerClerkage = 180;
  } else if (travelClass.includes('2A') || travelClass.includes('2 TIER')) {
    perPassengerClerkage = 200;
  } else if (travelClass.includes('1A') || travelClass.includes('EC') || travelClass.includes('FIRST')) {
    perPassengerClerkage = 240;
  }

  const cancellationDeduction = Math.min(totalFare, Math.max(perPassengerClerkage * passCount, Math.round(totalFare * 0.25)));
  const partialRefundAmount = Math.max(0, totalFare - cancellationDeduction);

  const finalReturnAmount = denyReturnAmount ? 0 : partialRefundAmount;

  const handleFetchAiExplanation = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Why is the ticket cancellation not a full refund amount, and what does denying the return amount mean?',
          context: { booking },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.answer || data.text);
      } else {
        setAiExplanation('Under Indian Railways rules, clerkage and reservation maintenance charges are retained upon ticket cancellation. Passengers also have the option to deny the return amount.');
      }
    } catch (e) {
      setAiExplanation('Cancellation fees are mandated by railway commercial rules to cover seat holding and administrative costs. Thus, a full refund is not issued.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleConfirmCancellation = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/cancel-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pnr: booking.pnr,
          returnAction: denyReturnAmount ? 'DENY_RETURN_AMOUNT' : 'CLAIM_REFUND',
          reason: denyReturnAmount
            ? 'Passenger opted to deny return amount and waive refund.'
            : 'Passenger requested ticket cancellation with eligible partial refund.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.booking) {
        onCancellationSuccess(data.booking);
        onClose();
      } else {
        setErrorMessage(data.message || 'Failed to cancel ticket.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while processing cancellation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative text-slate-100 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Cancel Ticket & Refund Options
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                PNR #{booking.pnr} • {booking.train_name} (#{booking.train_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
          {/* Important Not Full Refund Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-200 block font-bold mb-0.5">
                NOT A FULL REFUND AMOUNT
              </strong>
              In accordance with railway passenger cancellation rules, standard clerkage and administrative deductions apply. You will receive a partial return amount, or you may choose to deny the return amount.
            </div>
          </div>

          {/* Refund Calculation Breakdown Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500 font-sans tracking-wider">
              Refund Assessment Breakdown
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="font-sans">Total Fare Paid ({passCount} Passenger{passCount > 1 ? 's' : ''}):</span>
              <span className="text-white font-bold">₹{totalFare}</span>
            </div>

            <div className="flex items-center justify-between text-rose-400">
              <span className="font-sans">Cancellation & Clerkage Deduction:</span>
              <span className="font-bold">-₹{cancellationDeduction}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="font-sans text-slate-200 font-bold">
                Eligible Return Amount:
              </span>
              <span className="text-base font-black text-amber-400">
                ₹{partialRefundAmount}
              </span>
            </div>
          </div>

          {/* DENY RETURN AMOUNT SELECTION */}
          <div
            onClick={() => setDenyReturnAmount(!denyReturnAmount)}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
              denyReturnAmount
                ? 'bg-rose-500/10 border-rose-500/60 shadow-lg shadow-rose-500/10'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="deny-return-checkbox"
                checked={denyReturnAmount}
                onChange={(e) => setDenyReturnAmount(e.target.checked)}
                className="mt-1 w-4 h-4 text-rose-500 bg-slate-900 border-slate-700 rounded focus:ring-rose-500 cursor-pointer"
              />
              <div className="flex-1">
                <label
                  htmlFor="deny-return-checkbox"
                  className="font-bold text-sm text-white block cursor-pointer"
                >
                  Deny Return Amount (Waive Refund)
                </label>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Check this if you wish to voluntarily forgo/deny the return amount (₹{partialRefundAmount}) upon cancellation.
                </p>

                {denyReturnAmount ? (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-500/20 text-rose-300 text-[11px] font-bold font-sans">
                    ✓ You have opted to deny the return amount. ₹0 will be refunded to your account.
                  </div>
                ) : (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-sans">
                    • A partial refund of <strong>₹{partialRefundAmount}</strong> will be credited to original payment method.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Policy Explanation */}
          <div>
            {!aiExplanation ? (
              <button
                type="button"
                onClick={handleFetchAiExplanation}
                disabled={loadingAi}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingAi ? 'Asking Gemini AI...' : 'Ask AI why this is not a full refund'}</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs leading-relaxed">
                <div className="font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini AI Policy Insight:</span>
                </div>
                <p className="whitespace-pre-line">{aiExplanation}</p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Keep Ticket
          </button>

          <button
            type="button"
            onClick={handleConfirmCancellation}
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
              denyReturnAmount
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Processing...'
                : denyReturnAmount
                ? 'Confirm Cancel (Deny Return Amount)'
                : `Confirm Cancel (Claim ₹${partialRefundAmount})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
