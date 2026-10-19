import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import { formatCurrency, parseDecimal } from "@/lib/format";

// Quantidade e valor ficam como texto enquanto o usuário digita; o total é calculado
export interface ItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
  total: number;
}

interface ExpenseItemsTableProps {
  items: ItemDraft[];
  errors: Record<string, string>;
  onItemsChange: (items: ItemDraft[]) => void;
}

const NEW_ITEM: ItemDraft = { description: "", quantity: "1", unitPrice: "0", total: 0 };
const ROW_GRID_CLASS_NAME = "md:grid-cols-[1fr_4.5rem_6.5rem_6rem_4.5rem]";

function calculateTotal(quantity: string, unitPrice: string): number {
  return Math.round(parseDecimal(quantity) * parseDecimal(unitPrice) * 100) / 100;
}

export function ExpenseItemsTable({ items, errors, onItemsChange }: ExpenseItemsTableProps) {
  // O total só é recalculado quando quantidade ou valor mudam, para preservar descontos lidos do recibo
  function changeItem(index: number, changes: Partial<ItemDraft>) {
    onItemsChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextItem = { ...item, ...changes };
        return { ...nextItem, total: calculateTotal(nextItem.quantity, nextItem.unitPrice) };
      }),
    );
  }

  function changeDescription(index: number, description: string) {
    onItemsChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, description } : item)),
    );
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((item, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-500">Itens</h3>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">Sem itens discriminados.</p>
      ) : (
        <div className="space-y-3 md:space-y-2">
          <div
            aria-hidden
            className={`hidden gap-2 text-xs text-zinc-500 md:grid ${ROW_GRID_CLASS_NAME}`}
          >
            <span>Descrição</span>
            <span>Qtd.</span>
            <span>Valor unit.</span>
            <span>Total</span>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className={`grid grid-cols-2 items-start gap-2 rounded-lg border border-zinc-200 p-3 md:border-0 md:p-0 ${ROW_GRID_CLASS_NAME}`}
            >
              <FormField
                label="Descrição"
                error={errors[`items.${index}.description`]}
                isLabelHiddenOnDesktop
                className="col-span-2 md:col-span-1"
              >
                <input
                  type="text"
                  value={item.description}
                  onChange={(event) => changeDescription(index, event.target.value)}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
              <FormField
                label="Quantidade"
                error={errors[`items.${index}.quantity`]}
                isLabelHiddenOnDesktop
              >
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={item.quantity}
                  onChange={(event) => changeItem(index, { quantity: event.target.value })}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
              <FormField
                label="Valor unitário (R$)"
                error={errors[`items.${index}.unitPrice`]}
                isLabelHiddenOnDesktop
              >
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={item.unitPrice}
                  onChange={(event) => changeItem(index, { unitPrice: event.target.value })}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
              <div className="space-y-1">
                <span className="block text-xs text-zinc-500 md:sr-only">Total</span>
                <p className="py-2 text-sm font-medium">
                  {Number.isFinite(item.total) ? formatCurrency(item.total) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remover item ${index + 1}`}
                className="self-end rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onItemsChange([...items, NEW_ITEM])}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        + Adicionar item
      </button>
    </div>
  );
}
