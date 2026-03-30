# Estratégia & Resultado — Website

Website institucional para a **Estratégia & Resultado**, agência de consultoria em Guimarães, Portugal. Oferece serviços de fiscalidade, contabilidade, consultoria jurídica, gestão de rendas, crédito, seguros, apoio a negócios e IRS.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 21 com SSR, Tailwind CSS 4 |
| Backend | PHP 8.2+, PHPMailer, Composer |
| Hosting | Shared hosting via FTP |
| CDN / Proxy | Cloudflare (plano gratuito) — DNS, SSL, cache, WAF |
| CAPTCHA | Cloudflare Turnstile |
| CI/CD | GitHub Actions — build + deploy FTP ao push para `production` |
| IaC | Terraform (`terraform/cloudflare/`) para configuração Cloudflare |
| Package manager | pnpm |

---

## Correr Localmente

### Pré-requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PHP 8.2+ com Composer (para o backend)

### Frontend (Angular)

```bash
pnpm install
pnpm start
```

A aplicação fica disponível em `http://localhost:4200`.

### Backend (PHP)

```bash
cd backend
composer install
cp config.example.php config.php
# Preencher config.php com as credenciais SMTP, Turnstile, etc.
```

Para servir a API localmente, usar PHP built-in server ou configurar um virtual host:

```bash
cd backend
php -S localhost:8080
```

Garantir que o Angular aponta para `http://localhost:8080/api` em desenvolvimento (ver `src/environments/`).

---

## Deploy

O deploy é acionado automaticamente ao fazer push para o branch `production`.

```bash
# A partir de main (ou qualquer branch estável):
git checkout production
git merge main
git push origin production
```

O workflow GitHub Actions (`.github/workflows/deploy.yml`) irá:

1. Instalar dependências e fazer build Angular SSR → ficheiros estáticos em `dist/`
2. Gerar `backend/config.php` a partir dos GitHub Secrets
3. Fazer deploy dos ficheiros frontend via FTP para `public_html/`
4. Fazer deploy do backend via FTP para `public_html/api/`
5. Purgar a cache do Cloudflare

> **Nota:** O workflow também pode ser acionado manualmente via _Actions → Deploy to Production → Run workflow_.

---

## GitHub Secrets Necessários

Configurar em **Settings → Secrets and variables → Actions** do repositório.

### FTP

| Secret | Descrição |
|--------|-----------|
| `FTP_HOST` | Hostname do servidor FTP do shared hosting |
| `FTP_USER` | Utilizador FTP |
| `FTP_PASS` | Password FTP |
| `FTP_SERVER_DIR` | Directório de destino para os ficheiros frontend (ex: `public_html/`) |
| `FTP_BACKEND_SERVER_DIR` | Directório de destino para o backend (ex: `public_html/api/`) |

### SMTP (email)

| Secret | Descrição |
|--------|-----------|
| `SMTP_HOST` | Hostname do servidor SMTP |
| `SMTP_USER` | Utilizador SMTP |
| `SMTP_PASS` | Password SMTP |
| `SMTP_PORT` | Porta SMTP (ex: `587` para TLS, `465` para SSL) |
| `MAIL_TO` | Email do destinatário das notificações de contacto |

### Cloudflare Turnstile

| Secret | Descrição |
|--------|-----------|
| `TURNSTILE_SECRET_KEY` | Chave secreta do widget Turnstile (obtida em Cloudflare Dashboard) |

### Cloudflare API (purga de cache)

| Secret | Descrição |
|--------|-----------|
| `CLOUDFLARE_ZONE_ID` | Zone ID do domínio em Cloudflare |
| `CLOUDFLARE_API_TOKEN` | API Token com permissão `Cache Purge` |

---

## Testes E2E (Playwright)

### Instalar dependências dos testes

```bash
pnpm dlx playwright install --with-deps
```

### Correr todos os testes

```bash
pnpm test:e2e
```

### Correr com UI interactiva

```bash
pnpm test:e2e --ui
```

Os testes cobrem: navegação, cards de serviços, formulário de contacto, modal de pedido rápido, design responsivo, SEO/meta tags e acessibilidade.

---

## Estrutura do Projecto

```
estrategia-resultado/
├── src/                          # Angular app
│   └── app/
│       └── components/           # Hero, Services, About, Location, Contact, Modal, CTA, FAB
├── backend/
│   ├── api/
│   │   ├── contact.php           # Formulário de contacto completo
│   │   └── contact-request.php  # Pedido rápido de callback
│   ├── src/                      # Mailer e RateLimiter
│   ├── composer.json
│   └── config.example.php        # Template de configuração (nunca commitar config.php)
├── terraform/cloudflare/         # IaC para Cloudflare
├── .github/workflows/deploy.yml  # Pipeline CI/CD
├── PLAN.md                       # Plano de desenvolvimento detalhado
└── CONTRIBUTING.md
```

---

## Licença

Projecto privado — todos os direitos reservados.
