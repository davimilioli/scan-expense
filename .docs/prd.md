# PRD — Scan Expense: Extrator Inteligente de Despesas

## 1. Visão geral

Aplicação web de tela única em que o usuário envia a imagem de um recibo, nota fiscal ou comprovante Pix e uma IA com visão extrai os dados estruturados na hora. O usuário revisa e edita os dados, copia o resultado como JSON ou exporta como CSV. As extrações ficam salvas num histórico local no navegador.

### Objetivos

- Extrair Estabelecimento, Data, Categoria, Valor Total e Itens a partir de uma imagem, em poucos segundos.
- Deixar o usuário corrigir qualquer campo antes de exportar.
- Guardar as extrações no navegador, sem backend nem login.
- Manter a interface limpa e direta.

### Fora de escopo (v1)

- Autenticação, contas de usuário e banco de dados.
- Upload de PDF e de várias imagens ao mesmo tempo.
- Exportação do histórico inteiro (só o recibo atual é exportado).
- Dashboards, gráficos e relatórios agregados.
- Sincronização entre dispositivos.

## 2. Decisões técnicas

| Tema | Decisão |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19, já configurado em `src/app` |
| Estilização | Tailwind CSS v4, já configurado |
| Componentes | Todos em `src/components` |
| IA | Vercel AI SDK (`ai`) + `@ai-sdk/google` (Gemini Flash, com visão) |
| Saída estruturada | `generateObject` com schema Zod. Se a versão instalada do AI SDK tiver descontinuado o `generateObject`, usar o equivalente indicado na documentação (`generateText` + `Output.object`) |
| Validação | `zod`: um único schema compartilhado entre a IA, o formulário e o store |
| Estado + persistência | `zustand` com o middleware `persist` (localStorage) |
| Comunicação com a IA | Server Action (`'use server'`). A chave da API fica só no servidor |
| Chave da API | `GOOGLE_GENERATIVE_AI_API_KEY` em `.env.local` |
| Idioma / moeda | Interface em pt-BR, valores em BRL (`Intl.NumberFormat('pt-BR', { currency: 'BRL' })`) |

> Antes de escrever código, ler o guia correspondente em `node_modules/next/dist/docs/` (ver `AGENTS.md`). Em especial: `01-app/02-guides/server-actions.md` e `01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`.

### Limite de tamanho do Server Action

Por padrão, o Next limita o corpo de um Server Action a **1MB**. Mitigação em duas camadas:

1. **No cliente**: redimensionar e comprimir a imagem antes do envio (lado maior de no máximo ~1600px, JPEG com qualidade ~0.85, via `<canvas>`).
2. **No `next.config.ts`**: `experimental.serverActions.bodySizeLimit: '5mb'`, como margem de segurança (confirmar a chave exata na documentação local).

## 3. Modelo de dados

### Categorias (enum fixo)

`Alimentação`, `Transporte`, `Saúde`, `Moradia`, `Lazer`, `Compras`, `Serviços`, `Educação`, `Outros`

### Schema Zod (`src/lib/schemas/expense.ts`)

```ts
export const categories = [
  'Alimentação', 'Transporte', 'Saúde', 'Moradia', 'Lazer',
  'Compras', 'Serviços', 'Educação', 'Outros',
] as const

export const expenseItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
})

export const expenseSchema = z.object({
  establishment: z.string().min(1),
  date: z.string(),            // ISO 8601: YYYY-MM-DD
  category: z.enum(categories),
  totalAmount: z.number().nonnegative(),
  items: z.array(expenseItemSchema), // pode ser vazio (ex: comprovante Pix)
})

export type Expense = z.infer<typeof expenseSchema>
```

Cada campo recebe um `.describe()` com instruções para a IA (por exemplo: "data no formato YYYY-MM-DD", "valor em reais, número decimal").

### Entrada do histórico

```ts
type HistoryEntry = {
  id: string            // crypto.randomUUID()
  createdAt: string     // ISO
  thumbnail: string     // data URL JPEG, lado maior de ~200px (~10–20KB)
  expense: Expense
}
```

## 4. Requisitos funcionais

### RF1: Upload de imagem
- Área de arrastar e soltar + `<input type="file" accept="image/jpeg,image/png,image/webp">`.
- Preview imediato da imagem selecionada (`URL.createObjectURL`).
- Validação no cliente: só imagens e tamanho máximo de 10MB no arquivo original. Arquivos inválidos mostram uma mensagem de erro inline.
- Botão para remover ou trocar a imagem.

### RF2: Extração via IA
- Um botão "Extrair dados" (ou o próprio envio da imagem) dispara o Server Action com a imagem comprimida.
- O Server Action valida a entrada (tipo e tamanho), chama o Gemini com o schema Zod e um prompt de sistema em pt-BR e retorna `{ ok: true, data }` ou `{ ok: false, error }`. O Server Action nunca lança erro bruto para o cliente.
- Estado de carregamento visível (skeleton ou spinner) e botão desabilitado durante a extração.
- Se a imagem não for um recibo/comprovante, retornar um erro amigável.

### RF3: Card editável
- Campos editáveis: Estabelecimento (texto), Data (`<input type="date">`), Categoria (`<select>` com o enum), Valor Total (número, exibido em BRL).
- Tabela de itens editável: descrição, quantidade, valor unitário e total. Permite adicionar e remover linhas.
- Aviso discreto quando a soma dos itens for diferente do Valor Total (não bloqueia o usuário).
- Validação com Zod ao editar, com mensagens de erro por campo.
- As edições atualizam a entrada correspondente no histórico.

### RF4: Exportação (recibo atual)
- **Copiar JSON**: `JSON.stringify(expense, null, 2)` para a área de transferência, com feedback "Copiado!".
- **Exportar CSV**: download de um `.csv` com uma linha por item (colunas: estabelecimento, data, categoria, valor_total, item_descricao, item_quantidade, item_valor_unitario, item_total). Sem itens, gerar uma única linha com as colunas de item vazias. Separador `;` e BOM UTF-8, para abrir corretamente no Excel pt-BR.
- Exportar só é permitido se os dados forem válidos pelo schema.

### RF5: Histórico local
- Cada extração bem-sucedida é salva no store (zustand + persist), com miniatura.
- Lista lateral (desktop) ou em uma seção abaixo (mobile), com miniatura, estabelecimento, data e valor.
- Clicar em uma entrada reabre o card para visualização e edição.
- Excluir uma entrada (com confirmação) e "Limpar histórico".
- Se a gravação falhar por cota do localStorage (`QuotaExceededError`), avisar o usuário sugerindo remover entradas antigas.
- Evitar erro de hidratação: renderizar o histórico só depois de o store reidratar.

## 5. Requisitos não funcionais

- **Layout limpo**: fundo neutro, um único destaque de cor, bastante espaço em branco e tipografia legível. Responsivo de 360px em diante.
- **Acessibilidade**: labels em todos os inputs, área de upload acessível por teclado e foco visível.
- **Segurança**: chave da API só no servidor e validação da entrada dentro do Server Action.
- **Desempenho**: compressão da imagem no cliente. Meta de extração abaixo de ~5s em condições normais.

## 6. Estrutura de pastas proposta

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    actions/
      extract-expense.ts      # Server Action
  components/
    image-uploader.tsx
    expense-card.tsx
    expense-items-table.tsx
    export-actions.tsx
    history-list.tsx
    history-item.tsx
  lib/
    schemas/expense.ts
    image.ts                  # compressão + miniatura (canvas)
    export.ts                 # toJson, toCsv, download
    format.ts                 # formatação BRL/data
  store/
    expense-store.ts          # zustand + persist
```

## 7. Fluxo principal

1. O usuário arrasta ou seleciona uma imagem → preview imediato.
2. O cliente comprime a imagem e gera a miniatura.
3. O cliente chama o Server Action `extractExpense(formData)` → carregamento visível.
4. O servidor valida a entrada, chama o Gemini (`generateObject` + `expenseSchema`) e retorna os dados.
5. O cliente cria uma entrada no histórico (`id`, miniatura, dados), que passa a ser a entrada ativa.
6. O card editável é renderizado. As edições atualizam a entrada no store.
7. O usuário clica em "Copiar JSON" ou "Exportar CSV".

## 8. Tarefas de implementação (ordem progressiva)

Cada tarefa entrega algo verificável e depende só das anteriores.

### Fase 0: Fundação

**[x] T1. Dependências e configuração**
- Instalar `ai`, `@ai-sdk/google`, `zod` e `zustand`.
- Criar `.env.example` com `GOOGLE_GENERATIVE_AI_API_KEY=` e garantir que `.env*.local` esteja no `.gitignore`.
- Configurar `serverActions.bodySizeLimit` no `next.config.ts` (conferir na documentação local).
- ✅ Critério: o projeto sobe sem erros e as dependências constam no `package.json`.

**[x] T2. Layout base**
- Limpar o `page.tsx` e o `globals.css` do template, definir fonte, cores neutras e metadata (título "Scan Expense").
- Estrutura da página: cabeçalho simples, área principal (upload + resultado) e área de histórico.
- ✅ Critério: página limpa e responsiva com os blocos vazios posicionados.

**[x] T3. Schema Zod e tipos**
- Criar `src/lib/schemas/expense.ts` com o enum de categorias, `expenseItemSchema`, `expenseSchema` (com `.describe()`), os tipos inferidos e `HistoryEntry`.
- Criar `src/lib/format.ts` (BRL e data ISO → pt-BR; o `<input type="date">` já trabalha em ISO, então não é preciso converter de volta).
- ✅ Critério: tipos exportados sem erros de TypeScript.

### Fase 1: Upload

**[x] T4. Componente `ImageUploader`**
- Arrastar e soltar + input de arquivo, preview, remover/trocar e validação de tipo e tamanho.
- Estados visuais: vazio, arrastando por cima, com imagem e erro.
- ✅ Critério: ao selecionar ou soltar uma imagem válida, o preview aparece. Arquivos inválidos mostram erro.

**[x] T5. Utilitários de imagem (`src/lib/image.ts`)**
- `compressImage(file) → Blob/File` (lado maior ≤ 1600px, JPEG 0.85).
- `createThumbnail(file) → dataURL` (lado maior ≈ 200px, JPEG 0.7).
- ✅ Critério: uma foto de celular (~4MB) vira um arquivo menor que 1MB e uma miniatura de ~20KB.

### Fase 2: Extração com IA

**[x] T6. Server Action `extractExpense`**
- Implementado com `generateText` + `Output.object` (o `generateObject` está descontinuado no AI SDK 7) e o modelo `gemini-flash-lite-latest` (o `gemini-flash-latest` estava sobrecarregado). A IA também retorna `isReceipt` para sinalizar imagens que não são recibos.
- `'use server'`. Recebe um `FormData` com a imagem, valida o tipo e o tamanho e chama o Gemini Flash via `generateObject` com o `expenseSchema` e um prompt de sistema em pt-BR (regras: data ISO, valores numéricos em reais, escolher a categoria mais próxima, itens vazios para comprovante Pix, erro quando não for recibo).
- Retorna um resultado discriminado `{ ok, data | error }` e trata falhas da API e da validação.
- ✅ Critério: com uma imagem de recibo real, retorna um objeto válido pelo schema. Com uma imagem aleatória, retorna um erro amigável.

**T7. Integrar upload e extração**
- Botão "Extrair dados", estado de carregamento (`useTransition` ou `useActionState`, conforme a documentação local) e exibição do erro.
- ✅ Critério: o fluxo ponta a ponta mostra o JSON extraído (ainda sem o card) na tela.

### Fase 3: Estado e histórico

**[x] T8. Store Zustand (`src/store/expense-store.ts`)**
- Implementado com `skipHydration` + o hook `useStoreHydration()`, que lê o localStorage só depois de montar no cliente. Só `entries` e `activeId` são persistidos.
- Estado: `entries: HistoryEntry[]` e `activeId: string | null`.
- Ações: `addEntry`, `updateExpense(id, expense)`, `removeEntry`, `clearHistory` e `setActive`.
- `persist` com a chave `scan-expense-history`, tratamento de `QuotaExceededError` e controle de reidratação (`hasHydrated`).
- ✅ Critério: as entradas sobrevivem a um reload da página e não há erro de hidratação.

**[x] T9. Salvar a extração no histórico**
- Depois de uma extração bem-sucedida, chamar `addEntry` (com a miniatura) e definir a entrada como ativa. O próprio `addEntry` já define a entrada nova como ativa.
- ✅ Critério: cada extração gera uma nova entrada persistida.

### Fase 4: Card editável

**[x] T10. Componente `ExpenseCard`**
- Campos Estabelecimento, Data, Categoria e Valor Total ligados à entrada ativa do store, com validação Zod por campo.
- Implementado como conteúdo da aba "Texto". O formulário mantém um rascunho local e só grava no store quando o rascunho inteiro é válido pelo `expenseSchema`. As mensagens de erro em pt-BR ficam no próprio schema.
- ✅ Critério: editar um campo atualiza o store e o valor persiste após o reload.

**[x] T11. Componente `ExpenseItemsTable`**
- Tabela editável de itens: adicionar e remover linhas, total da linha e aviso de divergência entre a soma dos itens e o Valor Total.
- O total da linha é recalculado (quantidade × valor unitário) só quando um desses dois campos muda, para não apagar descontos lidos do recibo.
- Ao adicionar, remover ou editar um item, o Valor Total passa a ser a soma dos itens. Quando a lista fica vazia, o valor atual é mantido.
- Versão mobile: linhas empilhadas em cards.
- ✅ Critério: é possível editar, adicionar e remover itens, e o aviso aparece quando os valores não batem.

### Fase 5: Exportação

**[x] T12. Utilitários de exportação (`src/lib/export.ts`)**
- `toJson(expense)` e `toCsv(expense)` (`;`, BOM UTF-8, escape de aspas, uma linha por item) e `downloadFile(content, filename, mime)`.
- Também tem `toText(expense)` e `getCsvFileName(expense)`. No CSV, números usam vírgula decimal e a data sai em dd/mm/aaaa, para o Excel pt-BR reconhecer os tipos.
- ✅ Critério: o CSV gerado abre corretamente no Excel pt-BR, com acentos intactos.

**[x] T13. Componente `ExportActions`**
- Botões "Copiar JSON" (com feedback) e "Exportar CSV" (nome do arquivo: `despesa-<estabelecimento>-<data>.csv`), desabilitados quando os dados forem inválidos.
- A cópia fica no modal do `ExportDialog` (botão "Ver e copiar resultado", com abas Texto/JSON). O `ExportActions` fica no fim do `ExpenseCard`, que é quem sabe se o formulário está válido.
- ✅ Critério: as duas ações funcionam com os dados editados.

### Fase 6: Histórico na interface

**[x] T14. Componentes `HistoryList` e `HistoryItem`**
- Lista com miniatura, estabelecimento, data e valor (BRL). Destaque da entrada ativa.
- Clicar reabre a entrada no card. Excluir com confirmação. "Limpar histórico".
- Estado vazio amigável.
- ✅ Critério: é possível navegar entre as extrações salvas, editar, excluir e limpar.

**[x] T15. Fluxo "Nova extração"**
- Botão para voltar ao estado inicial (limpa o upload e desmarca a entrada ativa) sem perder o histórico.
- O botão aparece no painel "Imagem" quando há uma entrada aberta. O upload é limpo recriando o `ImageUploader` via `key`.
- ✅ Critério: é possível fazer várias extrações seguidas.

### Fase 7: Acabamento

**[x] T16. Polimento de UX e acessibilidade**
- Skeleton durante a extração, foco e navegação por teclado, labels, contraste e mensagens de erro consistentes.
- Revisar a responsividade (360px, tablet, desktop).
- Feito: `ExtractionSkeleton` com `role="status"`, contorno de foco global em `:focus-visible` (`globals.css`) e textos auxiliares de `zinc-400` para `zinc-500`, para atingir o contraste AA.
- ✅ Critério: o fluxo completo funciona só com o teclado e o layout fica íntegro em todos os tamanhos.

**[x] T17. Validação final com casos reais**
- Testar com: cupom fiscal de supermercado (muitos itens), recibo manuscrito, comprovante Pix (sem itens), foto torta ou com pouca luz e uma imagem que não é recibo.
- Ajustar o prompt e as `.describe()` do schema conforme os resultados.
- Validado com imagens **sintéticas** de cada cenário, com o mesmo schema, prompt e modelo da action. Todos os cenários extraíram os dados corretos (ou recusaram a imagem que não é recibo) entre 0,9s e 3,7s, sem precisar ajustar o prompt. Falta repetir com fotos reais.
- ✅ Critério: extrações corretas ou falhas tratadas de forma amigável em todos os casos.

## 9. Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Imagem maior que o limite do Server Action | Compressão no cliente + `bodySizeLimit` |
| localStorage cheio (~5MB) | Só miniaturas pequenas e tratamento de `QuotaExceededError` com aviso |
| A IA erra a data ou o valor | Card totalmente editável + aviso de divergência dos itens |
| Erro de hidratação com o zustand persist | Renderizar o histórico só depois da reidratação |
| Mudanças de API no Next 16 / AI SDK | Consultar `node_modules/next/dist/docs/` e a documentação do AI SDK antes de implementar |

## 10. Premissas

- Interface em português e valores em reais (BRL).
- Uma imagem por vez. Formatos JPG, PNG e WEBP.
- Sem backend próprio além do Server Action. Nenhum dado é salvo no servidor.
