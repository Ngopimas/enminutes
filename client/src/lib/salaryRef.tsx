import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SalaryRef } from './data';

interface SalaryRefContextType {
  salaryRef: SalaryRef;
  setSalaryRef: (ref: SalaryRef) => void;
}

const SalaryRefContext = createContext<SalaryRefContextType | null>(null);

export function SalaryRefProvider({ children }: { children: ReactNode }) {
  const [salaryRef, setSalaryRef] = useState<SalaryRef>(() => {
    return (localStorage.getItem('salaryRef') as SalaryRef) ?? 'smic';
  });

  useEffect(() => {
    localStorage.setItem('salaryRef', salaryRef);
  }, [salaryRef]);

  return (
    <SalaryRefContext.Provider value={{ salaryRef, setSalaryRef }}>
      {children}
    </SalaryRefContext.Provider>
  );
}

export function useSalaryRef() {
  const ctx = useContext(SalaryRefContext);
  if (!ctx) throw new Error('useSalaryRef must be used within SalaryRefProvider');
  return ctx;
}
