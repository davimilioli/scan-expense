import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import type { PixDetails } from "@/lib/schemas/expense";

type PixPartyKey = "sender" | "receiver";

interface PixDetailsFieldsProps {
  pix: PixDetails;
  errors: Record<string, string>;
  onChange: (pix: PixDetails) => void;
}

const PIX_PARTIES: { key: PixPartyKey; title: string }[] = [
  { key: "sender", title: "Quem enviou" },
  { key: "receiver", title: "Quem recebeu" },
];

export function PixDetailsFields({ pix, errors, onChange }: PixDetailsFieldsProps) {
  function changeParty(partyKey: PixPartyKey, changes: Partial<PixDetails[PixPartyKey]>) {
    onChange({ ...pix, [partyKey]: { ...pix[partyKey], ...changes } });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {PIX_PARTIES.map((party) => (
          <div key={party.key} className="space-y-3">
            <h3 className="border-b border-gray-300 pb-2 text-sm font-medium">{party.title}</h3>
            <FormField label="Nome" error={errors[`pix.${party.key}.name`]}>
              <input
                type="text"
                value={pix[party.key].name}
                onChange={(event) => changeParty(party.key, { name: event.target.value })}
                className={INPUT_CLASS_NAME}
              />
            </FormField>
            <FormField label="CPF/CNPJ">
              <input
                type="text"
                value={pix[party.key].document}
                onChange={(event) => changeParty(party.key, { document: event.target.value })}
                className={INPUT_CLASS_NAME}
              />
            </FormField>
            <FormField label="Instituição">
              <input
                type="text"
                value={pix[party.key].institution}
                onChange={(event) => changeParty(party.key, { institution: event.target.value })}
                className={INPUT_CLASS_NAME}
              />
            </FormField>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Chave Pix">
          <input
            type="text"
            value={pix.pixKey}
            onChange={(event) => onChange({ ...pix, pixKey: event.target.value })}
            className={INPUT_CLASS_NAME}
          />
        </FormField>
        <FormField label="ID da transação">
          <input
            type="text"
            value={pix.transactionId}
            onChange={(event) => onChange({ ...pix, transactionId: event.target.value })}
            className={INPUT_CLASS_NAME}
          />
        </FormField>
      </div>
    </div>
  );
}
