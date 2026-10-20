# ScanExpense

Extrator inteligente de despesas. Você envia a foto de um recibo, nota fiscal ou cupom fiscal com os itens da compra e uma IA com visão lê a imagem e devolve os dados estruturados: estabelecimento, data, categoria, valor total e itens. Depois é só revisar, corrigir o que for preciso e exportar.

Tudo acontece em uma única tela, sem cadastro nem login. O histórico das extrações fica salvo no próprio navegador.

## Funcionalidades

- **Upload de imagem**: arraste e solte ou selecione um arquivo JPG, PNG ou WEBP de até 10MB, com pré-visualização imediata.
- **Extração com IA**: a imagem é comprimida no navegador e enviada para o Gemini, que retorna os dados em JSON validado por um schema. Imagens que não são recibos são recusadas com uma mensagem amigável.
- **Card editável**: os campos estabelecimento, data, categoria e valor total podem ser corrigidos, e cada campo é validado enquanto você digita.
- **Tabela de itens**: adicione, edite ou remova itens. O total da linha e o valor total são recalculados sozinhos, e um aviso aparece quando a soma dos itens não bate com o total.
- **Exportação**:
  - copie o resultado em texto ou JSON por um modal com abas;
  - baixe um CSV pronto para o Excel em português, com separador `;`, acentos corretos e vírgula decimal.
- **Histórico local**: as extrações ficam salvas no navegador, com miniatura. Dá para reabrir, editar, excluir ou limpar tudo.
- **Limite de uso**: cada usuário pode fazer até 3 extrações, para evitar abuso da API de IA.

## Tecnologias e bibliotecas

| Tecnologia | Uso |
| --- | --- |
| Next.js 16 (App Router) | Framework e Server Actions |
| React 19 | Interface |
| TypeScript | Tipagem |
| Tailwind CSS v4 | Estilização |
| Vercel AI SDK (`ai` + `@ai-sdk/google`) | Integração com o modelo de IA e saída estruturada |
| Zod 4 | Schema único para a IA, o formulário e os tipos |
| Zustand 5 | Estado global e persistência do histórico no `localStorage` |

## API utilizada

A extração usa a **API do Google Gemini**, acessada pelo Vercel AI SDK, com o modelo `gemini-flash-lite-latest`. Esse modelo é rápido, lê imagens e tem uma faixa de uso gratuita.

A chamada roda em uma Server Action, então a chave da API fica só no servidor e nunca chega ao navegador. A IA recebe a imagem com um prompt em português e responde no formato definido pelo schema Zod. Valores que fogem desse formato são rejeitados antes de chegar à interface.

Chave obtida no [Google AI Studio](https://aistudio.google.com/apikey).

## Como rodar o projeto

**Pré-requisitos:** [Node.js](https://nodejs.org) 20.9 ou superior e uma chave da API do Gemini.

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/davimilioli/scan-expense.git
   cd scan-expense
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

3. Preencha as variáveis no `.env`:

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=chave-do-gemini
   RATE_LIMIT_SECRET=chave-aleatoria
   ```

   O `RATE_LIMIT_SECRET` assina o cookie que conta as extrações de cada usuário. Para gerar um valor aleatório:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run start` | Inicia a versão de produção |
| `npm run lint` | Executa o ESLint |

## Autor

Desenvolvido por **Davi Milioli**: [github.com/davimilioli](https://github.com/davimilioli)
