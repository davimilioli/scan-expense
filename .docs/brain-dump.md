# Projeto: Extrator Inteligente de Despesas / Recibos (Multimodal + JSON Mode)

Uma tela limpa onde o usuário arrasta uma imagem de recibo/nota (ou comprovante Pix) e a IA extrai os dados estruturados instantaneamente.


## Aspectos Técnicos

Projeto feito em Next.js + React + TailwindCSS
Terá validação do zod
Todos os components salvos na pasta src/components
O histórico dos dados deve estar em local storage (usar o zustand)

## Aspectos Visuais
- Precisa ser um layout clean
- Estilização com Tailwind

## O fluxo

1. Input de upload de imagem (<input type="file"> com preview imediato).

2. Server Action envia a imagem para o modelo com visão (ex: generateObject do Vercel AI SDK com schema Zod).

3. A interface renderiza uma tabela/card editável com os campos extraídos: Estabelecimento, Data, Categoria, Valor Total e Itens discriminados.

4. Botão "Copiar JSON" ou "Exportar CSV".