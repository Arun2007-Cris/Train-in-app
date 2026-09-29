import React, { useState } from 'react';
import {
  User as UserIcon,
  Users,
  CreditCard,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Passenger, User } from '../types';

interface PassengerPageProps {
  user: User | null;
  initialPassenger?: Passenger | null;
  initialPassengers?: Passenger[] | null;
  onSavePassenger?: (passenger: Passenger) => void;
  onSavePassengers?: (passengers: Passenger[]) => void;
}

interface PersonFormItem {
  id: string;
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other';
  berth_preference: 'No Preference' | 'Lower' | 'Middle' | 'Upper' | 'Side Lower' | 'Side Upper' | 'Window Seat';
  aadhaar_number: string;
  phone_number: string;
  email?: string;
}

export const PassengerPage: React.FC<PassengerPageProps> = ({
  user,
  initialPassenger,
  initialPassengers,
  onSavePassenger,
  onSavePassengers,
}) => {
  // Initialize passenger list with real details only (no hardcoded dummy personas)
  const defaultFirstPassenger: PersonFormItem = {
    id: 'p-1',
    name: initialPassengers?.[0]?.name || initialPassenger?.name || user?.name || '',
    age: initialPassengers?.[0]?.age || initialPassenger?.age || '',
    gender: initialPassengers?.[0]?.gender || initialPassenger?.gender || 'Male',
    berth_preference: initialPassengers?.[0]?.berth_preference || initialPassenger?.berth_preference || 'Lower',
    aadhaar_number: initialPassengers?.[0]?.aadhaar_number || initialPassenger?.aadhaar_number || '',
    phone_number: initialPassengers?.[0]?.phone_number || initialPassenger?.phone_number || '',
    email: initialPassengers?.[0]?.email || initialPassenger?.email || user?.email || '',
  };

  const initialList: PersonFormItem[] = initialPassengers && initialPassengers.length > 0
    ? initialPassengers.map((p, idx) => ({
        id: `p-${idx + 1}`,
        name: p.name || '',
        age: p.age || '',
        gender: p.gender || 'Male',
        berth_preference: p.berth_preference || 'No Preference',
        aadhaar_number: p.aadhaar_number || '',
        phone_number: p.phone_number || '',
        email: p.email || '',
      }))
    : [defaultFirstPassenger];

  const [passengersList, setPassengersList] = useState<PersonFormItem[]>(initialList);
  const [error, setError] = useState('');

  // Compute live masked Aadhaar
  const getMaskedAadhaar = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 4) {
      const last4 = clean.slice(-4);
      return `XXXX-XXXX-${last4}`;
    }
    return clean ? `XXXX-XXXX-${clean}` : 'XXXX-XXXX-XXXX';
  };

  // Change count directly
  const handleCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 6) return;
    setError('');

    if (newCount > passengersList.length) {
      const needed = newCount - passengersList.length;
      const additional: PersonFormItem[] = [];

      for (let i = 0; i < needed; i++) {
        const nextIdx = passengersList.length + i;
        additional.push({
          id: `p-${Date.now()}-${nextIdx}`,
          name: '',
          age: '',
          gender: 'Male',
          berth_preference: 'No Preference',
          aadhaar_number: '',
          phone_number: passengersList[0]?.phone_number || '',
          email: passengersList[0]?.email || '',
        });
      }
      setPassengersList([...passengersList, ...additional]);
    } else if (newCount < passengersList.length) {
      setPassengersList(passengersList.slice(0, newCount));
    }
  };

  // Update specific field for a person
  const updatePassenger = (index: number, field: keyof PersonFormItem, value: any) => {
    const updated = [...passengersList];
    updated[index] = { ...updated[index], [field]: value };
    setPassengersList(updated);
  };

  const addPassenger = () => {
    if (passengersList.length >= 6) {
      setError('Maximum 6 passengers allowed per ticket reservation.');
      return;
    }
    handleCountChange(passengersList.length + 1);
  };

  const removePassenger = (index: number) => {
    if (passengersList.length <= 1) {
      setError('At least 1 passenger is required for booking.');
      return;
    }
    const updated = passengersList.filter((_, i) => i !== index);
    setPassengersList(updated);
  };

  // Quick Presets set clean count slots
  const applyPreset = (count: number) => {
    setError('');
    handleCountChange(count);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < passengersList.length; i++) {
      const p = passengersList[i];
      if (!p.name.trim()) {
        setError(`Please enter full name for Person #${i + 1}`);
        return;
      }
      const ageNum = Number(p.age);
      if (!ageNum || ageNum < 1 || ageNum > 120) {
        setError(`Please enter a valid age (1-120) for ${p.name}`);
        return;
      }
      const cleanAadhaar = p.aadhaar_number.replace(/\D/g, '');
      if (cleanAadhaar.length < 12) {
        setError(`Please enter a valid 12-digit Aadhaar for Person #${i + 1} (${p.name})`);
        return;
      }
      if (i === 0) {
        const cleanPhone = p.phone_number.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setError('Please enter a valid 10-digit primary mobile contact number');
          return;
        }
      }
    }

    setError('');

    const formattedPassengers: Passenger[] = passengersList.map((p, idx) => ({
      passenger_id: idx + 1,
      user_id: user?.user_id || 1,
      name: p.name.trim(),
      age: Number(p.age),
      gender: p.gender,
      berth_preference: p.berth_preference,
      aadhaar_number: p.aadhaar_number.replace(/\D/g, '').slice(0, 12),
      masked_aadhaar: getMaskedAadhaar(p.aadhaar_number),
      phone_number: p.phone_number.replace(/\D/g, '').slice(0, 10),
      email: p.email?.trim() || (idx === 0 ? user?.email : undefined),
    }));

    if (onSavePassengers) {
      onSavePassengers(formattedPassengers);
    } else if (onSavePassenger) {
      onSavePassenger(formattedPassengers[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="text-amber-400 font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
              1
            </span>
            Passenger & Traveler Details
          </span>
          <span className="text-slate-600">Step 2 of 5</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-2/5 h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Passenger Details</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {passengersList.length} {passengersList.length === 1 ? 'Person' : 'Persons'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter identity, age, gender, and berth preferences for all travelers
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Number of Persons Selector Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-slate-200 block">
                Number of Persons Traveling:
              </label>
              <span className="text-[11px] text-slate-500">
                Choose passenger count (1 to 6 persons)
              </span>
            </div>

            {/* Counter Widget */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleCountChange(passengersList.length - 1)}
                disabled={passengersList.length <= 1}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base transition"
              >
                -
              </button>
              <span className="w-16 text-center font-mono font-black text-sm text-amber-400">
                {passengersList.length} {passengersList.length === 1 ? 'Person' : 'Persons'}
              </span>
              <button
                type="button"
                onClick={() => handleCountChange(passengersList.length + 1)}
                disabled={passengersList.length >= 6}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                passengersList.length === 1
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              1 Person
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                passengersList.length === 2
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              2 Persons
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                passengersList.length === 3
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              3 Persons
            </button>
            <button
              type="button"
              onClick={() => applyPreset(4)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                passengersList.length === 4
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              4 Persons
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List of Passenger Cards */}
          <div className="space-y-4">
            {passengersList.map((person, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={person.id}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 relative transition hover:border-slate-700"
                >
                  {/* Person Card Top */}
                  <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Passenger {index + 1}</span>
                          {isPrimary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wide">
                              Primary Contact
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => removePassenger(index)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remove Person"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Form fields for Person */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name (As per Govt ID)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                          placeholder="Enter full name"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={person.age}
                        onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                        placeholder="Age"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition font-mono"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={person.gender}
                        onChange={(e) => updatePassenger(index, 'gender', e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Berth Preference */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Berth / Seat Preference
                      </label>
                      <select
                        value={person.berth_preference}
                        onChange={(e) => updatePassenger(index, 'berth_preference', e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="Lower">Lower Berth</option>
                        <option value="Middle">Middle Berth</option>
                        <option value="Upper">Upper Berth</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                        <option value="Window Seat">Window Seat</option>
                      </select>
                    </div>

                    {/* Aadhaar Number with Privacy Masking */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Aadhaar Number (12 Digits)
                        </label>
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Masked on Ticket
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={person.aadhaar_number}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                            updatePassenger(index, 'aadhaar_number', raw);
                          }}
                          placeholder="1234 5678 9012"
                          maxLength={12}
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm tracking-wider focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Preview on Ticket:</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {getMaskedAadhaar(person.aadhaar_number)}
                        </span>
                      </div>
                    </div>

                    {/* Primary contact phone number */}
                    {isPrimary && (
                      <>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Mobile Phone (For PNR SMS & Approaching Alerts)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={person.phone_number}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                                updatePassenger(index, 'phone_number', raw);
                              }}
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              required
                              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400 transition"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Email Address (For Booking Confirmation & E-Ticket)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                              <Mail className="w-4 h-4" />
                            </div>
                            <input
                              type="email"
                              value={person.email || ''}
                              onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                              placeholder="passenger@example.com"
                              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another person button */}
          {passengersList.length < 6 && (
            <button
              type="button"
              onClick={addPassenger}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-dashed border-slate-600 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Another Person (+ Person {passengersList.length + 1})</span>
            </button>
          )}

          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                <strong>{passengersList.length} {passengersList.length === 1 ? 'Passenger' : 'Passengers'}</strong> configured for demo booking
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition transform active:scale-[0.99] cursor-pointer"
          >
            <span>Continue to Train Search & Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
