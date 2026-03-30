# Estratégia & Resultado — Plano de Desenvolvimento do Website

## Sobre a Empresa

- **Nome**: Estratégia & Resultado
- **Tipo**: Agência de Consultoria
- **Localização**: Guimarães, Portugal
- **Serviços**: Fiscalidade e Contabilidade, Jurídico, Consultoria de Empresas, Rendas, Crédito, Seguros, Apoio a Negócios, IRS
- **Facebook**: https://www.facebook.com/61588117696445/
- **Identidade visual**: Ouro/âmbar (primário), azul-marinho escuro/preto (secundário), tons de azul (destaque) — com imagens de montanha/ponte

---

## Stack Técnica

### Frontend
- **Framework**: Angular (versão mais recente) com SSR (Server-Side Rendering)
- **CSS**: Tailwind CSS, com tema personalizado baseado nas cores do logótipo
- **Package manager**: pnpm

### Backend
- **Linguagem**: PHP 8.2+
- **Email**: PHPMailer via SMTP
- **Autoloading**: PSR-4 com Composer
- Padrão idêntico ao projeto `feelathomehouse-v2`

### Hosting & Infraestrutura
- **Hosting**: Shared hosting com deploy via FTP (mesmo padrão do `feelathomehouse-v2`)
- **CDN / Proxy**: Cloudflare (plano gratuito)
- **IaC**: Terraform para configuração Cloudflare
- **CI/CD**: GitHub Actions — build Angular + deploy FTP ao fazer push para o branch `production`

### Segurança
- **CAPTCHA**: Cloudflare Turnstile (gratuito)
- **Headers de segurança**: Cloudflare Transform Rules ou Worker

---

## Arquitectura

```
GitHub Actions
  └─ Build Angular SSR → static files (dist/browser/)
  └─ Gera backend/config.php a partir de secrets
  └─ FTP deploy → shared hosting

Cloudflare (free plan)
  └─ DNS proxy + SSL/TLS Full
  └─ Cache rules para assets estáticos
  └─ Turnstile para protecção de formulários
  └─ WAF básico + security headers

Shared Hosting
  ├─ public_html/          ← Angular static files
  └─ public_html/api/
       ├─ contact.php       ← formulário de contacto completo
       └─ contact-request.php ← pedido rápido de callback
```

---

## Tema Tailwind CSS (baseado no logótipo)

```js
colors: {
  primary: {
    // Ouro/âmbar — cor principal do logótipo
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // tom base
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  secondary: {
    // Azul-marinho escuro/preto
    50:  '#f8fafc',
    100: '#f1f5f9',
    500: '#334155',
    700: '#1e293b',
    800: '#0f172a',
    900: '#020617',  // tom base
  },
  accent: {
    // Tons de azul
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
}
```

---

## Páginas / Secções (single-page landing)

### 1. Hero Section
- Logótipo + nome da empresa
- Tagline/slogan
- CTA principal: botão **"Pedir Contacto"** (abre modal de pedido rápido)
- Design imponente com cores primárias do logótipo

### 2. Serviços (8 cards)
Cada card inclui: ícone, título, breve descrição, botão **"Contactar sobre este serviço"**
O botão pré-preenche o serviço no formulário de contacto (ou abre o modal com o serviço seleccionado).

| Serviço | Ícone sugerido |
|---|---|
| Fiscalidade e Contabilidade | `calculator` / `document-chart-bar` |
| Consultoria Jurídica | `scale` / `briefcase` |
| Consultoria de Empresas | `building-office` / `chart-bar` |
| Gestão de Rendas | `home` / `key` |
| Crédito | `banknotes` / `credit-card` |
| Seguros | `shield-check` |
| Apoio a Negócios | `rocket-launch` / `light-bulb` |
| IRS | `document-text` / `clipboard-document-list` |

### 3. Sobre Nós
- Descrição da empresa e história
- Missão e valores
- Diferenciais competitivos
- Localização em Guimarães

### 4. Localização
- Morada completa em Guimarães
- Google Maps embed (iframe responsivo)

### 5. Contactos
- Email
- Telefone
- Morada
- Link Facebook

### 6. Formulário de Contacto (secção dedicada)
Campos:
- Nome (obrigatório)
- Email (obrigatório)
- Telefone
- Serviço pretendido (dropdown — pré-preenchível via URL param ou click)
- Mensagem (obrigatório)
- Cloudflare Turnstile widget
- Botão de envio

### 7. Modal de Pedido Rápido de Contacto
Campos:
- Nome (obrigatório)
- Telefone (obrigatório)
- Melhor horário para contacto
- Serviço pretendido (pré-preenchível)
- Cloudflare Turnstile widget
- Botão de envio

---

## Backend — Endpoints da API

### `POST /api/contact.php` — Formulário de contacto completo
**Campos**: `name`, `email`, `phone`, `service`, `message`, `cf-turnstile-response`

**Comportamento**:
1. Verificação Cloudflare Turnstile
2. Validação e sanitização dos campos
3. Rate limiting baseado em ficheiro (por IP)
4. PHPMailer envia:
   - **Notificação ao dono** (com todos os dados do formulário)
   - **Confirmação ao remetente** (email de confirmação de recepção)
5. Resposta JSON: `{ success: true }` ou `{ error: "mensagem" }`

### `POST /api/contact-request.php` — Pedido rápido de callback
**Campos**: `name`, `phone`, `preferred_time`, `service`, `cf-turnstile-response`

**Comportamento**:
1. Verificação Cloudflare Turnstile
2. Validação e sanitização
3. Rate limiting baseado em ficheiro (por IP)
4. PHPMailer envia notificação ao dono com detalhes do callback
5. Resposta JSON: `{ success: true }` ou `{ error: "mensagem" }`

---

## Pipeline de Deployment

```yaml
# .github/workflows/deploy.yml
# Trigger: push para branch 'production'

jobs:
  build-and-deploy:
    steps:
      - Checkout código
      - Setup Node.js + pnpm
      - pnpm install
      - pnpm build (Angular SSR → static)
      - Gerar backend/config.php a partir de GitHub Secrets
      - FTP deploy: dist/browser/ → public_html/
      - FTP deploy: backend/api/ → public_html/api/
      - Cloudflare cache purge via API
```

**GitHub Secrets necessários**:
- `FTP_HOST`, `FTP_USER`, `FTP_PASS`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`
- `MAIL_TO` (email do dono)
- `TURNSTILE_SECRET_KEY`
- `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`

---

## Configuração Cloudflare (plano gratuito)

- **DNS**: Proxy activado (laranja)
- **SSL/TLS**: Full (não Full Strict — shared hosting)
- **Cache Rules**: assets estáticos com TTL longo
- **Transform Rules / Worker**: security headers (CSP, X-Frame-Options, etc.)
- **Turnstile**: widget gratuito para protecção de formulários
- **WAF**: regras básicas gratuitas
- **IaC**: Terraform (`terraform/cloudflare/`)

---

## Fases de Desenvolvimento

### Fase 1 — Setup do Projecto
- [ ] Scaffold Angular com SSR e Tailwind CSS
- [ ] Configurar tema de cores baseado no logótipo
- [ ] Estrutura do backend PHP com Composer e PHPMailer
- [ ] Repositório GitHub com branch `production`
- [ ] GitHub Actions CI/CD pipeline (build + FTP deploy)
- [ ] Terraform para Cloudflare (DNS, SSL, cache rules, Turnstile)

### Fase 2 — Desenvolvimento Frontend
- [ ] Layout base responsivo (mobile-first)
- [ ] Hero Section com CTA
- [ ] Secção Serviços com 8 cards e lógica de pré-preenchimento
- [ ] Secção Sobre Nós
- [ ] Secção Localização com Google Maps embed
- [ ] Secção Contactos
- [ ] Formulário de Contacto com Turnstile
- [ ] Modal de Pedido Rápido de Contacto
- [ ] Footer com links e redes sociais

### Fase 3 — Desenvolvimento Backend
- [ ] `api/contact.php` — formulário completo
- [ ] `api/contact-request.php` — pedido rápido
- [ ] PHPMailer: templates de email (PT) para dono e remetente
- [ ] Rate limiting baseado em ficheiro
- [ ] Verificação Cloudflare Turnstile
- [ ] Validação e sanitização de inputs
- [ ] `backend/config.php` gerado por CI/CD a partir de secrets

### Fase 4 — Integração e Polimento
- [ ] Ligar formulários frontend aos endpoints backend
- [ ] Feedback visual (loading, sucesso, erro) nos formulários
- [ ] SEO: meta tags, Open Graph, canonical URL
- [ ] Testes responsivos (mobile, tablet, desktop)
- [ ] Optimização de performance (lazy loading, compressão)
- [ ] Cloudflare security headers

### Fase 5 — Testes E2E

> Padrão de referência: setup Playwright do projecto `feelathomehouse-v2`

#### Setup e Configuração
- [ ] Instalar Playwright (`pnpm dlx playwright install --with-deps`)
- [ ] Configurar `playwright.config.ts` (baseURL, browsers: chromium/firefox/webkit, reporters)
- [ ] Script `pnpm test:e2e` no `package.json`
- [ ] Configurar servidor de desenvolvimento para testes (`webServer` no config)

#### Testes de Navegação e Scroll
- [ ] Verifica que todas as secções existem no DOM (hero, serviços, sobre, localização, contactos, formulário)
- [ ] Navegar via links do navbar/menu ancoras e verificar scroll para a secção correcta
- [ ] Verificar que o botão CTA do hero faz scroll para o formulário ou abre o modal

#### Testes de Cards de Serviços
- [ ] Verifica que os 8 cards de serviços são renderizados
- [ ] Click em "Contactar sobre este serviço" pré-preenche o dropdown do formulário com o serviço correcto
- [ ] Click no card abre o modal de pedido rápido com o serviço correcto pré-seleccionado

#### Testes do Formulário de Contacto
- [ ] Submissão com campos vazios mostra erros de validação em todos os campos obrigatórios
- [ ] Email inválido mostra erro de validação
- [ ] Pré-preenchimento via query param (`?service=irs`) funciona correctamente
- [ ] Submissão com dados válidos (mock da API) mostra mensagem de sucesso
- [ ] Submissão com erro da API mostra mensagem de erro

#### Testes do Modal de Pedido Rápido
- [ ] Botão "Pedir Contacto" abre o modal
- [ ] Click fora do modal ou no botão "Fechar" fecha o modal
- [ ] Tecla Escape fecha o modal
- [ ] Submissão com campos vazios mostra erros de validação
- [ ] Submissão com dados válidos (mock da API) mostra sucesso e fecha o modal

#### Testes de Design Responsivo
- [ ] Mobile (375×667): navbar, hero, cards em coluna, formulário full-width
- [ ] Tablet (768×1024): layout de 2 colunas nos cards
- [ ] Desktop (1280×800): layout completo, navbar horizontal

#### Verificação de SEO e Meta Tags
- [ ] `<title>` contém o nome da empresa
- [ ] `<meta name="description">` presente e não vazio
- [ ] Open Graph tags (`og:title`, `og:description`, `og:url`) presentes
- [ ] `<link rel="canonical">` presente

#### Verificação de Acessibilidade
- [ ] Imagens têm atributo `alt`
- [ ] Inputs do formulário têm `label` associado
- [ ] Botões têm texto acessível (ou `aria-label`)
- [ ] Contraste de cores adequado nos elementos principais (verificação manual / axe)
- [ ] Navegação por teclado (Tab) funciona nos formulários e modal

### Fase 6 — Launch
- [ ] Deploy para production
- [ ] Configuração DNS em Cloudflare
- [ ] Verificação SSL
- [ ] Smoke testing (formulários, links, mapa)
- [ ] Verificação de emails SMTP

### Fase 7 — Internacionalização (i18n)

> Padrão de referência: setup `@angular/localize` do projecto `feelathomehouse-v2`

#### Setup Angular i18n
- [ ] Instalar `@angular/localize` e configurar `angular.json` com `i18nLocales`
- [ ] Português (PT-PT) como língua principal/padrão (`pt-PT`)
- [ ] Inglês (EN) como língua secundária (`en`)
- [ ] Configurar build separado por locale: `pnpm build --localize`
- [ ] Adaptar CI/CD (GitHub Actions) para gerar artefactos para ambos os locales e fazer deploy nas pastas correctas

#### Language Switcher
- [ ] Componente de seleção de idioma na navbar (botão PT / EN)
- [ ] Persiste a preferência do utilizador (localStorage)
- [ ] Detecta o idioma do browser no primeiro acesso (`navigator.language`)
- [ ] Redireciona para o prefixo de URL correcto (`/pt/` ou `/en/`)

#### Tradução de Conteúdo Estático (Frontend)
- [ ] Hero section: tagline, CTA
- [ ] Descrições dos 8 cards de serviços
- [ ] Secção Sobre Nós: texto completo, missão e valores
- [ ] Secção Localização: textos auxiliares
- [ ] Secção Contactos: labels e textos
- [ ] Formulário de Contacto: labels, placeholders, mensagens de validação, mensagens de sucesso/erro
- [ ] Modal de Pedido Rápido: labels, placeholders, mensagens
- [ ] Footer: links, textos legais, copyright

#### Tradução de Templates de Email (Backend PHP)
- [ ] Detectar idioma preferido a partir do campo enviado pelo frontend (`lang`)
- [ ] Email de notificação ao dono: manter em PT (ou adicionar indicador do idioma do contacto)
- [ ] Email de confirmação ao remetente: enviar no idioma do utilizador (PT ou EN)
- [ ] Separar templates PHP em `email-pt.php` e `email-en.php` (ou estrutura de arrays por locale)

#### SEO Multilingue
- [ ] Tags `hreflang` no `<head>`: `<link rel="alternate" hreflang="pt" href="/pt/">` e `<link rel="alternate" hreflang="en" href="/en/">`
- [ ] `hreflang="x-default"` apontando para PT-PT
- [ ] Meta descriptions separadas por idioma (`<meta name="description">`)
- [ ] Open Graph tags por idioma (`og:locale`, `og:locale:alternate`)
- [ ] Canonical URL correcta por locale

#### Estratégia de URLs
- [ ] Prefixos de URL: `/pt/` para Português e `/en/` para Inglês
- [ ] Redireccionamento automático de `/` para o locale detectado
- [ ] Configurar `angular.json` com `baseHref` por locale (`/pt/` e `/en/`)
- [ ] Configurar rewrite rules no `.htaccess` (shared hosting) para servir os artefactos correctos

#### Testes E2E (Playwright)
- [ ] Testar language switcher: click PT → URL `/pt/`, click EN → URL `/en/`
- [ ] Verificar que o conteúdo muda de idioma após troca
- [ ] Cobrir os testes existentes da Fase 5 em ambos os locales
- [ ] Verificar tags `hreflang` presentes no HTML de cada locale
- [ ] Verificar que meta descriptions diferem entre locales
- [ ] Testar formulário de contacto em EN (labels, validação, mensagem de sucesso)

---

## Estrutura de Directórios (prevista)

```
estrategia-resultado/
├── src/                          # Angular app
│   ├── app/
│   │   ├── components/
│   │   │   ├── hero/
│   │   │   ├── services-section/
│   │   │   ├── about/
│   │   │   ├── location/
│   │   │   ├── contacts/
│   │   │   ├── contact-form/
│   │   │   └── contact-modal/
│   │   └── app.component.ts
│   └── styles.css                # Tailwind imports
├── backend/
│   ├── api/
│   │   ├── contact.php
│   │   └── contact-request.php
│   ├── src/
│   │   ├── Mailer/
│   │   └── RateLimiter/
│   ├── composer.json
│   └── config.php.example
├── terraform/
│   └── cloudflare/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── .github/
│   └── workflows/
│       └── deploy.yml
├── tailwind.config.js
└── PLAN.md
```

---

## Estado: Pré-desenvolvimento
