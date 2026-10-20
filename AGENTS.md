<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Contexto do projeto

**Scan Expense**: tela única em que o usuário envia a foto de um recibo, nota fiscal ou comprovante Pix, a IA extrai os dados (estabelecimento, data, categoria, valor total e itens), o usuário revisa e edita, e então copia como texto/JSON ou exporta CSV. O histórico fica no localStorage, sem backend nem login.

O planejamento e o status das tarefas ficam em `.docs/prd.md`. Ao concluir uma tarefa do PRD, marque-a com `[x]` e anote qualquer desvio do plano original.

### Stack

- Next.js 16 (App Router, código em `src/`, alias `@/*` → `src/*`) + React 19 + Tailwind CSS v4
- Vercel AI SDK 7 (`ai`) + `@ai-sdk/google`, modelo `gemini-flash-lite-latest`
- Zod 4 para validação e Zustand 5 (`persist`) para o estado
- Chave da API em `GOOGLE_GENERATIVE_AI_API_KEY` (arquivo `.env`, que não é versionado)

### Fluxo e arquivos principais

- `src/components/expense-extractor.tsx`: orquestra o fluxo. Comprime a imagem, chama a Server Action e salva o resultado no histórico.
- `src/app/actions/extract-expense.ts`: Server Action que valida a imagem e chama o Gemini. Retorna `{ ok: true, data } | { ok: false, error }` e nunca lança erro para o cliente.
- `src/lib/schemas/expense.ts`: o `expenseSchema` é a fonte única de verdade. Serve à IA (pelos `.describe()`), ao formulário (pelas mensagens de erro em pt-BR) e aos tipos.
- `src/store/expense-store.ts`: histórico com `persist` + `skipHydration`. Componentes que leem o store devem usar `useStoreHydration()` e só renderizar os dados depois que ele retornar `true`, para evitar erro de hidratação.
- `src/components/expense-card.tsx` + `expense-items-table.tsx`: formulário editável com um rascunho local. Só grava no store quando o rascunho inteiro é válido, e também controla se a exportação fica habilitada.
- `src/lib/export.ts`: `toText`, `toJson`, `toCsv` e `downloadFile`. `src/lib/image.ts`: compressão e miniatura via canvas.

### Decisões que não são óbvias

- **`generateObject` está descontinuado no AI SDK 7.** Use `generateText` + `Output.object({ schema })`.
- **Imagens que não são recibos:** a IA responde `{ isReceipt, expense | null }`, assim ela recusa a imagem em vez de inventar dados.
- **Limite de tamanho:** o Server Action aceita até `5mb` (`experimental.serverActions.bodySizeLimit`). A imagem é comprimida no cliente antes do envio (lado maior até 1600px, JPEG).
- **Campos numéricos do formulário:** ficam como texto no rascunho. `parseDecimal("")` retorna `NaN` para o Zod acusar o campo vazio.
- **Totais:** o total da linha só é recalculado quando a quantidade ou o valor unitário mudam, para preservar descontos lidos do recibo. O valor total acompanha a soma dos itens quando a lista é alterada.
- **CSV para Excel pt-BR:** separador `;`, BOM UTF-8, vírgula decimal e data em dd/mm/aaaa.
- **`<dialog>`:** precisa de `m-auto`, porque o reset do Tailwind remove a margem que o centraliza.

### Convenções

- Interface e mensagens em português. Valores em BRL.
- Não escreva comentários no código. As decisões não óbvias ficam registradas nesta seção e no PRD.
- Código simples e enxuto. Nomes por extenso, sem `_` em callbacks (`.map((item) => ...)`).
- Componentes em `src/components` (arquivos em kebab-case, props em `interface`).
- Classes Tailwind repetidas viram constante ou componente (`INPUT_CLASS_NAME`, `SECONDARY_BUTTON_CLASS_NAME`, `Panel`, `FormField`).
- Destaque de cor único: `emerald`. Textos auxiliares em `zinc-500` ou mais escuro, por contraste.
- Valide com `npx tsc --noEmit` e `npx eslint src`. Não rode `npm run dev`, `build` nem `start`, e não faça commit sem pedido explícito.
