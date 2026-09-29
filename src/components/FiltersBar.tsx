import React from 'react';
import { Filter, Sparkles, X, RefreshCw, Bed, Train } from 'lucide-react';
import { UserPreference } from '../types';

interface FiltersBarProps {
  selectedPreference: UserPreference;
  onSelectPreference: (pref: UserPreference) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  onResetFilters: () => void;
  totalAvailable: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  selectedPreference,
  onSelectPreference,
  selectedCategory,
  onSelectCategory,
  selectedClass,
  onSelectClass,
  onResetFilters,
  totalAvailable,
}) => {
  const preferences: { id: UserPreference; label: string; icon: string }[] = [
    { id: 'Best overall', label: 'Best Overall', icon: '🌟' },
    { id: 'Cheapest', label: 'Cheapest', icon: '💰' },
    { id: 'Fastest', label: 'Fastest', icon: '⚡' },
    { id: 'Earliest departure', label: 'Earliest', icon: '⏰' },
    { id: 'Comfortable journey', label: 'Comfortable', icon: '🛋️' },
  ];

  const categories = [
    'All',
    'Vande Bharat',
    'Superfast',
    'Express',
    'Rajdhani',
    'Jan Shatabdi',
    'Tejas',
    'MEMU',
  ];

  const travelClasses = [
    'All',
    'Sleeper',
    'AC Compartment',
    'Chair Car',
    'Executive Chair Car',
    'Second Class',
  ];

  const hasActiveFilters =
    selectedCategory !== 'All' || selectedClass !== 'All' || selectedPreference !== 'Best overall';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl">
      {/* Top row: Section title & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
            Train Filters & AI Preferences
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
            {totalAvailable} Available
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Row 1: AI Preference Buttons */}
      <div className="mb-3">
        <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Sort by AI Recommendation Priority:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {preferences.map((p) => {
            const isSelected = selectedPreference === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreference(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Train Type Categories */}
      <div className="mb-3 pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 mb-2">
          <Train className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filter by Train Type:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Travel Classes Filter with Sleeper */}
      <div className="pt-2.5 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 mb-2">
          <Bed className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filter by Travel Class / Sleeper:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {travelClasses.map((cls) => {
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => onSelectClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                    : cls === 'Sleeper'
                    ? 'bg-slate-950 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cls === 'Sleeper' && <Bed className="w-3 h-3" />}
                <span>{cls === 'Sleeper' ? 'Sleeper (SL)' : cls}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
