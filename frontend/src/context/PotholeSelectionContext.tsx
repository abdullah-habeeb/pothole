import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Pothole } from '../services/potholeApi';

export interface SelectedPothole extends Pick<
  Pothole,
  '_id' | 'latitude' | 'longitude' | 'severity' | 'status'
> {
  segmentLabel?: string;
  description?: string;
}

export interface SelectionState {
  items: SelectedPothole[];
  summary?: string;
  source?: 'map' | 'list';
}

interface SelectionContextValue {
  selection: SelectionState | null;
  setSelection: (state: SelectionState) => void;
  clearSelection: () => void;
}

const PotholeSelectionContext = createContext<SelectionContextValue | undefined>(undefined);

export const PotholeSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selection, setSelectionState] = useState<SelectionState | null>(null);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selection,
      setSelection: (state) => setSelectionState(state),
      clearSelection: () => setSelectionState(null),
    }),
    [selection]
  );

  return (
    <PotholeSelectionContext.Provider value={value}>
      {children}
    </PotholeSelectionContext.Provider>
  );
};

export const usePotholeSelection = () => {
  const context = useContext(PotholeSelectionContext);
  if (!context) {
    throw new Error('usePotholeSelection must be used within a PotholeSelectionProvider');
  }
  return context;
};

