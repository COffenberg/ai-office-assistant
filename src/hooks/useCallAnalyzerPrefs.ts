import { useCallback, useEffect, useState } from 'react';

const LS_KEY = 'callAnalyzer.startingDepartmentId';

export function useCallAnalyzerPrefs() {
  const [startingDepartmentId, setStartingDepartmentIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      setStartingDepartmentIdState(v);
    } catch {}
  }, []);

  const setStartingDepartmentId = useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(LS_KEY, id);
      else localStorage.removeItem(LS_KEY);
      setStartingDepartmentIdState(id);
    } catch {}
  }, []);

  return { startingDepartmentId, setStartingDepartmentId } as const;
}
