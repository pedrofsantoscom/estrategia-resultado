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

### Fase 5 — Launch
- [ ] Deploy para production
- [ ] Configuração DNS em Cloudflare
- [ ] Verificação SSL
- [ ] Smoke testing (formulários, links, mapa)
- [ ] Verificação de emails SMTP

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
