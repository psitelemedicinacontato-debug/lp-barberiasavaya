# demo-sistema de barbearia

Você é um engenheiro de frontend sênior e um diretor de design especializado em marcas premium masculinas. Vamos construir o **ecossistema digital completo da Savaya Barbearia**, uma barbearia de alto padrão em Brasília. O resultado precisa parecer produto de estúdio de design renomado — nada de template genérico de IA, nada de layout "SaaS" cheio de gradiente e ícone flutuante. Cada decisão visual precisa ter origem na identidade da marca Savaya.

## 1. A marca

- **Nome:** Savaya Barbearia
- **Logo (já existe, use como referência de identidade, não recrie do zero):** dois colchetes tipográficos `[ ]` emolduram um ícone de bigode desenhado em traço fino e contínuo; abaixo, a wordmark "savaya" em minúsculas, tipografia sem serifa, enxuta, sem peso excessivo. É um logo minimalista, quase um selo/carimbo.
- **Conceito central do design (use isso como fio condutor de tudo):** os colchetes do logo são um dispositivo de **enquadramento** — "aquilo que a Savaya toca, ela emoldura e eleva". Traga esse motivo de colchete `[` `]` como assinatura visual recorrente: abrindo e fechando seções, emoldurando números/labels editoriais, enquadrando fotos no hover, marcando o preço dos serviços, aparecendo como cursor/indicador ativo na navegação. Não é um ícone decorativo solto — é a gramática visual do site inteiro.
- **Personalidade:** masculina, contida, alfaiataria urbana, Brasília moderna (não confundir com estética "boteco de barbearia" nem com clichê industrial de Nova York). Precisão, silêncio, detalhe. Pense em alfaiate, não em oficina.

## 2. Sistema de design (siga à risca, não substitua por defaults genéricos)

**Paleta (nomeada, use estes tons como base e derive variações):**
- `--ink` #0E0E10 — preto levemente azulado, fundo principal das seções escuras
- `--bone` #F1ECE3 — osso/marfim, fundo das seções claras e textos sobre o ink
- `--graphite` #201F1D — superfícies elevadas (cards) sobre o ink
- `--brass` #A8813F — latão envelhecido, cor de assinatura para acentos, ícones ativos, hover, bordas de destaque — use com moderação, é o "ouro" da marca
- `--oxblood` #6E2A26 — vermelho terroso/couro, usado só em micro-detalhes (indicador de horário selecionado, ponto de status) — nunca como cor dominante
- `--mist` #8C877D — texto secundário, hairlines, divisores

Evite explicitamente: fundo creme com serifa alto-contraste + accent terracota (é o piloto automático de design gerado por IA); preto puro com verde-ácido; e o layout "jornal" genérico de colunas com hairlines e zero border-radius aplicado sem propósito. Se qualquer tela do site ficar parecida com esses três padrões, redesenhe.

**Tipografia:**
- Display (títulos grandes, hero, headers de seção): uma serifada de personalidade forte, com contraste alto entre traços finos e grossos e algum charme editorial — algo na linha de **Fraunces** ou **Canela** (use Fraunces do Google Fonts se precisar de algo livre). Use em peso Black/Bold para títulos, itálico para a segunda linha de destaque (como uma assinatura).
- Corpo/UI: uma sans geométrica limpa e humana — **General Sans** ou **Neue Montreal-like** (no Lovable, use "Inter" com tracking ajustado só se não tiver acesso a essas, mas priorize algo com mais caráter, como "Sora" ou "Manrope" em peso 400/500).
- Utilitária (labels, preços, horários, dados do painel admin): uma mono discreta (tipo "JetBrains Mono" ou "IBM Plex Mono") para reforçar precisão e "ficha técnica" — usada em letras pequenas, tracking aberto, versalete.

**Motivo de assinatura:** o colchete tipográfico `[ ]`. Sempre que houver um número de seção, um rótulo editorial ("01 · Essência") ou um preço, ele aparece emoldurado por colchetes finos que se abrem em animação sutil ao entrar no viewport (scroll reveal) — como se o layout estivesse "capturando" aquele elemento. No hover de cards de serviço, os colchetes se expandem discretamente para fora dos cantos do card (efeito de mira/enquadramento de câmera), sem exagero.

**Movimento:** apenas o necessário — reveal de conteúdo ao scroll (fade + leve translate, nunca mais que 24px), abertura de colchetes como assinatura de entrada, transição suave entre steps do agendamento (slide horizontal tipo app nativo), sem parallax pesado nem partículas.

## 3. Dados reais do negócio (use estes dados, não invente outros)

- **Endereço:** CLS 315, Bloco B, Loja 29 — Asa Sul, Brasília - DF, 70384-520
- **Telefone / WhatsApp:** (61) 99974-6529
- **Instagram:** @barbeariasavaya (https://www.instagram.com/barbeariasavaya/)
- **Horário de funcionamento:** Segunda a sexta, 9h às 20h · Sábado, 9h às 18h
- **Reputação:** 5,0 de nota no Google com 139 avaliações — exiba isso como prova social no hero e antes do CTA final (ex.: "5,0 ★ · 139 avaliações no Google")

## 4. Estrutura da landing page (página única, navegação por âncoras + scroll)

1. **Header fixo estilo app:** logo Savaya à esquerda, menu com âncoras (Serviços, Sobre, Galeria, Localização, Avaliações), botão de destaque "Agendar horário" sempre visível (sticky), que abre o ecossistema de agendamento (não é WhatsApp — é o fluxo interno do site).
2. **Hero:** título editorial forte em duas linhas (ex.: "O corte que te [emoldura]." com a palavra emoldurada literalmente por colchetes animados), subtítulo curto sobre o posicionamento premium da Savaya em Brasília, CTA primário "Agendar horário" e CTA secundário "Ver serviços". Prova social discreta (nota 5,0 · 139 avaliações). Uma faixa inferior com marquee sutil dos serviços (Corte · Barba · Sobrancelha · Tratamentos · ...).
3. **[01] Sobre a Savaya:** bloco editorial curto sobre a proposta de valor (referência de tempo/precisão/ambiente, sem inventar histórico que não foi informado — mantenha genérico e verdadeiro ao tom, sem citar fundador fictício).
4. **[02] Serviços:** grid/cards de serviços agrupados por categoria (ver seção 6), cada card com nome, duração, preço (campo editável no admin) e o efeito de colchete no hover; botão "Agendar este serviço" que já leva pré-selecionado para o fluxo de agendamento.
5. **[03] Como funciona:** 3–4 passos curtos explicando o fluxo de agendamento (mostrando que é rápido, sem fricção, sem necessidade de criar conta).
6. **[04] Galeria:** grade de fotos do ambiente/cortes (usar placeholders de alta qualidade — cliente vai substituir depois pelas fotos reais da Savaya).
7. **[05] Avaliações:** carrossel/grid com 3–4 depoimentos (placeholder de texto neutro) reforçando a nota 5,0/139 avaliações do Google, com link direto para avaliar no Google.
8. **[06] Localização e horário:** mapa incorporado (endereço real), horário de funcionamento formatado, botão "Como chegar" (Google Maps) e botão de WhatsApp como canal alternativo de contato.
9. **Footer:** logo, endereço, telefone, Instagram, horário, links rápidos, e um link discreto de acesso ao painel administrativo (ex.: "/admin" — sem exibir isso como item de menu principal para o público).

Todo o conteúdo de copy deve soar como alguém falando direto com o cliente (voz ativa, frases curtas, sem enrolação corporativa) — nada de texto genérico de "lorem ipsum premium".

## 5. Ecossistema de agendamento (o coração do produto)

Ao clicar em "Agendar horário", abrir um **fluxo tipo app em tela cheia** (não um modal pequeno), com barra de progresso no estilo colchete (`[1/4]`, `[2/4]`...) no topo, transições horizontais suaves entre etapas, e botão de voltar sempre visível.

**Etapa 1 — Serviços:** o cliente escolhe um ou mais serviços (multi-seleção) organizados por categoria: Cabelo (Corte Masculino, Corte + Barba, Acabamento/Pezinho), Barba (Barba Completa, Barboterapia), Sobrancelha (Design de Sobrancelha), Tratamentos (Hidratação, Coloração/Disfarce de grisalhos). Mostrar duração total e valor total somado dinamicamente no rodapé fixo da tela.

**Etapa 2 — Profissional (opcional):** grade de barbeiros cadastrados (foto, nome, especialidade) + opção "Sem preferência". Isso deve ser gerenciável 100% pelo admin (cadastrar/editar/remover barbeiros).

**Etapa 3 — Data e horário:** calendário compacto estilo app (próximos 14–30 dias), destacando dias fechados (domingo, conforme horário informado) e dias sem vaga; ao selecionar o dia, mostrar grid de horários disponíveis calculado a partir da duração total dos serviços escolhidos, do horário de funcionamento e da agenda já ocupada daquele barbeiro (ou de todos, se "sem preferência"). Horários ocupados ficam desabilitados visualmente.

**Etapa 4 — Dados do cliente:** formulário simples e rápido — nome completo, telefone/WhatsApp (com máscara), e-mail (opcional, não obrigatório), observação opcional (ex.: alergias, preferências de corte). **Sem qualquer etapa de confirmação por e-mail, sem criação de senha, sem "verifique sua caixa de entrada"** — o agendamento é confirmado na hora, direto no navegador.

**Confirmação:** tela final com resumo do agendamento (serviços, profissional, data/hora, valor total), opção de adicionar ao calendário (.ics) e opção de enviar a confirmação via WhatsApp (deep link `wa.me` pré-preenchido). Se o cliente informou telefone antes, na próxima visita ao site oferecer reconhecimento simples (guardar localmente o telefone para autopreencher, sem exigir login).

**Regras de negócio a implementar:**
- Duração dos serviços soma para calcular o bloco de horário ocupado.
- Impedir overbooking: um horário some da lista assim que reservado por outro cliente.
- Respeitar o horário de funcionamento real (seg–sex 9h–20h, sáb 9h–18h, fechado domingo) e permitir que o admin bloqueie datas/horários específicos (feriados, folgas).
- Buffer configurável entre atendimentos (ex.: 5–10 min), editável no admin.

## 6. Serviços sugeridos para popular o catálogo inicial (editáveis no admin)

**Cabelo**
- Corte Masculino — 30 min
- Corte + Barba — 60 min
- Acabamento (contorno/pezinho) — 15 min

**Barba**
- Barba Completa — 30 min
- Barboterapia (toalha quente + hidratação) — 40 min

**Sobrancelha**
- Design de Sobrancelha — 15 min

**Tratamentos**
- Hidratação Capilar — 30 min
- Disfarce de Grisalhos — 40 min

Preços devem ficar como campo editável (placeholder de valor, o cliente/admin ajusta depois). Não invente preços fixos definitivos no copy institucional fora do painel.

## 7. Painel administrativo (`/admin`)

**Acesso — requisito crítico:** SEM fluxo de e-mail, SEM verificação de conta, SEM "esqueci minha senha" via e-mail. Implementar um **acesso simples por senha/PIN** (tela de login enxuta, campo único de senha numérica ou alfanumérica, verificada contra um valor armazenado com segurança no backend/Supabase — não hardcoded no frontend). Sessão persistente no navegador (o dono não deve precisar logar toda hora no celular da barbearia).

**Estrutura do painel (navegação lateral estilo app, mobile-first também):**

1. **Agenda (visão principal):** calendário do dia/semana com todos os agendamentos, cada card mostrando cliente, serviço(s), horário, profissional e status (confirmado / concluído / cancelado / faltou). Permitir criar agendamento manual (para quando o cliente liga ou chega sem marcar) e editar/cancelar agendamentos existentes.
2. **Clientes:** lista de todos os clientes que já agendaram, com histórico de visitas, telefone e observações — útil para reconhecer clientes recorrentes.
3. **Serviços:** CRUD completo — criar, editar, reordenar, ativar/desativar e definir preço/duração de cada serviço e categoria.
4. **Profissionais (barbeiros):** CRUD de barbeiros, com foto, nome, especialidade e horários de trabalho individuais (para não conflitar com o horário geral da loja).
5. **Horários e bloqueios:** editar horário de funcionamento padrão, bloquear datas específicas (feriados, folgas) e horários avulsos.
6. **Visão geral / métricas simples:** total de agendamentos no dia/semana/mês, serviço mais agendado, taxa de ocupação — em cards diretos, sem gráficos complexos desnecessários.
7. **Configurações:** dados públicos do site (endereço, telefone, Instagram, horário exibido) editáveis sem precisar mexer em código.

## 8. Requisitos técnicos e de experiência

- **Mobile-first e "app-like":** no celular, a navegação deve parecer um aplicativo nativo dentro do navegador — sem sensação de "site desktop encolhido". Usar bottom-navigation ou header compacto fixo, transições de tela suaves, áreas de toque generosas (mínimo 44px), sem scroll horizontal indesejado, sem zoom acidental em inputs (font-size mínimo 16px em campos de formulário).
- **Responsividade completa:** testar visualmente em breakpoints mobile, tablet e desktop — o desktop não deve ser apenas o mobile esticado; aproveite o espaço extra com layout editorial (colunas, grids maiores).
- **Performance:** imagens otimizadas/lazy-load, sem bibliotecas pesadas desnecessárias, fontes carregadas com `font-display: swap`.
- **Acessibilidade:** contraste adequado (especialmente texto sobre `--ink` e `--bone`), foco visível em navegação por teclado, `aria-label` nos botões de ícone.
- **Stack sugerida:** React + Tailwind CSS (design system acima como tokens/variáveis), Supabase como backend (tabelas de `services`, `barbers`, `appointments`, `clients`, `business_settings`, `admin_auth`) para persistir agenda e catálogo em tempo real. Nenhuma dependência de provedor de e-mail transacional.

## 9. SEO e aquisição

- Meta title/description focados em "Barbearia em Brasília", "Barbearia Asa Sul", "barbearia premium Brasília" — sem keyword stuffing, frases naturais.
- Marcação `LocalBusiness` (schema.org) com nome, endereço, telefone, horário de funcionamento e nota de avaliação (5,0 · 139 avaliações), para reforçar rich snippets no Google.
- Open Graph e Twitter Card com o logo/uma imagem do ambiente para preview correto ao compartilhar o link.
- URLs limpas, `sitemap.xml` e `robots.txt` básicos.
- Botão de agendamento como CTA único e repetido (hero, fim de cada seção de serviço, footer) para maximizar conversão de visita em agendamento.

## 10. Tom de voz do copy

Direto, confiante, sem gíria excessiva, sem "marketing genérico". Fala com um homem que valoriza tempo e imagem, mas sem soar arrogante. Frases curtas. Nunca usar textos de preenchimento — todo texto do site deve soar como algo que a Savaya realmente diria.

---

**Resumo do que construir:** uma landing page premium de página única com o motivo visual dos colchetes `[ ]` como assinatura, um fluxo de agendamento em tela cheia de 4 etapas sem qualquer verificação por e-mail, e um painel administrativo completo em `/admin` protegido por senha simples (sem fluxo de e-mail), 100% responsivo e com cara de aplicativo no mobile, usando os dados reais da Savaya Barbearia listados acima.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lp-barberiasavaya.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6aaf40a3-9276-4531-bfff-313273071c73).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
