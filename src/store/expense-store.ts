import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Expense, HistoryEntry } from "@/lib/schemas/expense";

interface ExpenseState {
  entries: HistoryEntry[];
  activeId: string | null;
  hasHydrated: boolean;
  hasStorageError: boolean;
  historyOpenCount: number;
  addEntry: (entry: HistoryEntry) => void;
  openEntry: (id: string) => void;
  updateExpense: (id: string, expense: Expense) => void;
  setActive: (id: string | null) => void;
}

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

function migrateEntry(entry: HistoryEntry): HistoryEntry {
  const { expense } = entry;
  return {
    ...entry,
    expense: {
      ...expense,
      documentType: expense.documentType ?? "receipt",
      pix: expense.pix ?? null,
      items: expense.items.map((item) => ({
        ...item,
        unit: item.unit ?? (Number.isInteger(item.quantity) ? "un" : "kg"),
      })),
    },
  };
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      entries: [],
      activeId: null,
      hasHydrated: false,
      hasStorageError: false,
      historyOpenCount: 0,
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries], activeId: entry.id })),
      openEntry: (id) =>
        set((state) => ({ activeId: id, historyOpenCount: state.historyOpenCount + 1 })),
      updateExpense: (id, expense) =>
        set((state) => ({
          entries: state.entries.map((entry) => (entry.id === id ? { ...entry, expense } : entry)),
        })),
      setActive: (id) => set({ activeId: id }),
    }),
    {
      name: "scan-expense-history",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Pick<ExpenseState, "entries" | "activeId">;
        return { ...state, entries: state.entries.map(migrateEntry) } as ExpenseState;
      },
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ entries: state.entries, activeId: state.activeId }),
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
