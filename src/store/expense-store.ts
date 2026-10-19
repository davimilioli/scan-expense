import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Expense, HistoryEntry } from "@/lib/schemas/expense";

interface ExpenseState {
  entries: HistoryEntry[];
  activeId: string | null;
  hasHydrated: boolean;
  hasStorageError: boolean;
  addEntry: (entry: HistoryEntry) => void;
  updateExpense: (id: string, expense: Expense) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setActive: (id: string | null) => void;
}

// Se o localStorage encher (QuotaExceededError), sinaliza no estado em vez de quebrar a página.
// Só altera a flag quando ela muda, porque cada setState dispara uma nova gravação do persist.
const safeLocalStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    const { hasStorageError } = useExpenseStore.getState();
    try {
      localStorage.setItem(name, value);
      if (hasStorageError) useExpenseStore.setState({ hasStorageError: false });
    } catch (error) {
      console.error("Falha ao salvar o histórico:", error);
      if (!hasStorageError) useExpenseStore.setState({ hasStorageError: true });
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
};

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      entries: [],
      activeId: null,
      hasHydrated: false,
      hasStorageError: false,
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries], activeId: entry.id })),
      updateExpense: (id, expense) =>
        set((state) => ({
          entries: state.entries.map((entry) => (entry.id === id ? { ...entry, expense } : entry)),
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),
      clearHistory: () => set({ entries: [], activeId: null }),
      setActive: (id) => set({ activeId: id }),
    }),
    {
      name: "scan-expense-history",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ entries: state.entries, activeId: state.activeId }),
      // A leitura do localStorage é feita só no cliente (useStoreHydration) para evitar erro de hidratação
      skipHydration: true,
      onRehydrateStorage: () => () => useExpenseStore.setState({ hasHydrated: true }),
    },
  ),
);

export function useStoreHydration(): boolean {
  const hasHydrated = useExpenseStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!useExpenseStore.persist.hasHydrated()) useExpenseStore.persist.rehydrate();
  }, []);

  return hasHydrated;
}
