# Plano de Infraestrutura Cloudflare — Estratégia & Resultado

## Decisão de Domínio

**Opção recomendada:** `estrategiaeresultado.pt`
**Alternativa:** `estrategia-resultado.pt` (com hífen, espelha o nome do repositório)

A decisão final deve ser tomada antes de iniciar a configuração Cloudflare. O domínio `.pt` é preferível por ser uma empresa portuguesa — transmite credibilidade local e melhora SEO regional. Recomenda-se também registar a versão `.com` como redirect para o `.pt`.

---

## Estrutura de Diretórios Terraform

```
infrastructure/
└── cloudflare/
    ├── main.tf              # Provider + data source da zone
    ├── variables.tf         # Variáveis (token, account_id, domínio, IP origem)
    ├── outputs.tf           # Nameservers, zone_id, chaves Turnstile
    ├── dns.tf               # Registos A, CNAME, DMARC
    ├── ssl.tf               # Modo SSL, TLS mínimo, HSTS, HTTPS automático
    ├── zone_settings.tf     # HTTP/3, Early Hints, IPv6, 0-RTT, segurança geral
    ├── redirect_rules.tf    # www → não-www (301 permanente)
    ├── transform_rules.tf   # Security headers via HTTP Response Header Transform
    ├── cache_rules.tf       # Assets estáticos, HTML Angular, bypass de API
    ├── waf_rules.tf         # WAF custom rules (bots, países, User-Agent vazio)
    ├── turnstile.tf         # Widget Turnstile para o formulário de contacto
    └── worker.tf            # Worker para headers de segurança + otimização SEO bots
```

---

## 1. Configuração DNS

### Registos necessários

| Tipo  | Nome            | Valor                          | Proxy | TTL  | Notas                          |
|-------|-----------------|--------------------------------|-------|------|--------------------------------|
| A     | `@`             | `<IP_SHARED_HOSTING>`          | ✅    | Auto | Raiz do domínio                |
| CNAME | `www`           | `estrategiaeresultado.pt`      | ✅    | Auto | Redirect tratado por regra     |
| TXT   | `_dmarc`        | `v=DMARC1; p=none; rua=mailto:info@estrategiaeresultado.pt` | ❌ | Auto | Proteção anti-spoofing email |
| TXT   | `@`             | `v=spf1 include:_spf.example.com ~all` | ❌ | Auto | SPF — ajustar ao servidor SMTP |

> **Nota:** O IP de origem é o do servidor de alojamento partilhado (o mesmo usado nas credenciais FTP do deploy). O proxy Cloudflare (nuvem laranja) garante que o IP real nunca é exposto.

---

## 2. SSL/TLS

| Configuração              | Valor                  | Notas                                                        |
|---------------------------|------------------------|--------------------------------------------------------------|
| Modo SSL                  | **Full** (não Full Strict) | O alojamento partilhado pode não ter certificado válido no origin. Se tiver, usar Full Strict. |
| Always Use HTTPS          | On                     | Redireciona HTTP → HTTPS automaticamente                     |
| TLS mínimo                | 1.2                    | Elimina TLS 1.0 e 1.1 (inseguros)                            |
| TLS 1.3                   | On                     | Suporte ao protocolo mais recente                            |
| Opportunistic Encryption  | On                     | —                                                            |
| Automatic HTTPS Rewrites  | On                     | Corrige mixed content em recursos referenciados via HTTP      |
| HSTS                      | On (`max-age=31536000`, `includeSubDomains`) | Configurado via API direta (bug no provider Terraform v5) |

```hcl
# ssl.tf
resource "cloudflare_zone_setting" "ssl" {
  zone_id = data.cloudflare_zone.main.id
  setting_id = "ssl"
  value      = "full"
}

resource "cloudflare_zone_setting" "min_tls_version" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "min_tls_version"
  value      = "1.2"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = data.cloudflare_zone.main.id
  setting_id = "always_use_https"
  value      = "on"
}
```

---

## 3. Zone Settings

| Configuração         | Valor    | Justificação                                             |
|----------------------|----------|----------------------------------------------------------|
| HTTP/3 (QUIC)        | On       | Reduz latência em redes móveis                           |
| Early Hints          | On       | Pré-carrega recursos críticos (LCP improvement)          |
| Always Online        | On       | Serve páginas em cache se o origin estiver em baixo      |
| IPv6                 | On       | Compatibilidade total                                    |
| 0-RTT                | On       | Melhora performance em reconexões (trade-off: replay attacks baixo risco) |
| Security Level       | Medium   | Equilíbrio entre proteção e acessibilidade               |
| Challenge TTL        | 1800s    | 30 minutos entre challenges                              |
| Bot Fight Mode       | **Off**  | **Importante:** No plano gratuito bloqueia Googlebot e impacta Core Web Vitals. Usar WAF custom rules em alternativa. |
| Hotlink Protection   | On       | Impede uso indevido de imagens do site                   |
| Email Obfuscation    | On       | Dificulta scraping de endereços de email no HTML         |

---

## 4. Security Headers

Implementados via **HTTP Response Header Transform Rules** (sem necessidade de Worker).

```hcl
# transform_rules.tf
resource "cloudflare_ruleset" "security_headers" {
  zone_id = data.cloudflare_zone.main.id
  name    = "Security Headers"
  kind    = "zone"
  phase   = "http_response_headers_transform"

  rules {
    description = "Add security headers"
    expression  = "true"
    action      = "rewrite"
    action_parameters {
      headers {
        name      = "X-Content-Type-Options"
        operation = "set"
        value     = "nosniff"
      }
      headers {
        name      = "X-Frame-Options"
        operation = "set"
        value     = "DENY"
      }
      headers {
        name      = "Referrer-Policy"
        operation = "set"
        value     = "strict-origin-when-cross-origin"
      }
      headers {
        name      = "Permissions-Policy"
        operation = "set"
        value     = "camera=(), microphone=(), geolocation=()"
      }
      headers {
        name      = "X-XSS-Protection"
        operation = "set"
        value     = "1; mode=block"
      }
    }
  }
}
```

**Content-Security-Policy:** Dada a complexidade do Angular com SSR, o CSP deve ser gerido no Worker (ver secção 9) ou no `.htaccess` do servidor, não como Transform Rule — o Angular injeta scripts inline que exigem nonces ou hashes, incompatíveis com uma CSP estática simples.

---

## 5. Cache Rules

O Angular gera ficheiros com content hashes no nome (ex: `main.a1b2c3.js`). Isto permite cache agressivo em assets estáticos — um novo deploy gera novos hashes, invalidando automaticamente o cache do browser.

### Regra 1 — Assets Estáticos (30 dias)

Cobre todos os ficheiros gerados pelo build Angular com extensões estáticas:

```
Expression:
(http.request.uri.path.extension in {"jpg" "jpeg" "png" "webp" "gif" "avif"
 "svg" "ico" "css" "js" "woff2" "woff" "ttf" "eot" "mp4" "pdf"})
```

- Edge cache TTL: **30 dias**
- Browser cache TTL: **7 dias**
- Cache everything: sim

### Regra 2 — HTML Angular (sem cache ou cache curto)

As páginas HTML são geradas com SSR e podem mudar com um deploy. Com a estratégia atual (deploy FTP), não existe invalidação automática do cache de HTML.

```
Expression:
(http.request.uri.path matches "^/(pt|en)?(/.*)?$" and
 not http.request.uri.path.extension in {"js" "css" "jpg" "png" "svg" "ico"
  "woff2" "woff" "ttf" "avif" "webp" "gif"})
```

- Edge cache TTL: **4 horas** (purge no deploy resolve desfasamento)
- Browser cache TTL: **no-cache** (o browser pede sempre ao edge)
- Cache everything: sim

### Regra 3 — API Backend (bypass)

```
Expression: starts_with(http.request.uri.path, "/backend/")
```

- Cache: **Bypass** — respostas da API nunca devem ser cacheadas

---

## 6. WAF Rules

```hcl
# waf_rules.tf — ordem importa (processamento sequencial)
```

| Prioridade | Regra                          | Condição                                              | Ação      |
|------------|--------------------------------|-------------------------------------------------------|-----------|
| 1          | Block empty User-Agent         | `http.user_agent eq ""`                               | Block     |
| 2          | Challenge high threat score    | `cf.threat_score gt 40`                               | Challenge |
| 3          | Challenge países de alto risco | `ip.geoip.country in {"RU" "CN" "KP" "IR"}`           | Challenge |
| 4          | Restringir API a POST          | `starts_with(uri.path, "/backend/") and not http.request.method eq "POST"` | Block |
| 5          | Challenge API suspeita         | `starts_with(uri.path, "/backend/contact") and cf.threat_score gt 15` | Challenge |

**Nota:** Bots legítimos (Googlebot, Bingbot, etc.) devem ser excluídos das regras 2 e 3 via condição `not cf.client.bot`. O Bot Fight Mode deve estar **desligado** (ver Zone Settings).

---

## 7. Redirect Rules

### www → não-www (redirect canónico)

```hcl
# redirect_rules.tf
resource "cloudflare_ruleset" "redirect_www" {
  zone_id = data.cloudflare_zone.main.id
  name    = "Redirect www to apex"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules {
    description = "www to non-www permanent redirect"
    expression  = "http.host eq \"www.estrategiaeresultado.pt\""
    action      = "redirect"
    action_parameters {
      from_value {
        status_code = 301
        target_url {
          expression = "concat(\"https://estrategiaeresultado.pt\", http.request.uri.path)"
        }
        preserve_query_string = true
      }
    }
  }
}
```

Se no futuro existir domínio `.com` a redirecionar para `.pt`, criar zona separada e adicionar redirect ruleset equivalente (ver padrão `pt_zone.tf` do feelathomehouse-v2).

---

## 8. Turnstile (CAPTCHA do Formulário de Contacto)

```hcl
# turnstile.tf
resource "cloudflare_turnstile_widget" "contact_form" {
  account_id = var.cloudflare_account_id
  name       = "Formulário de Contacto"
  domains    = ["estrategiaeresultado.pt"]
  mode       = "managed"
}
```

- **Modo `managed`:** invisível para utilizadores legítimos, challenge para tráfego suspeito
- A chave pública (`turnstile_site_key`) vai para a variável de ambiente do Angular
- A chave secreta (`turnstile_secret_key`) vai para o `backend/config.php` via GitHub Secret
- Verificação no backend PHP já está prevista no PLAN.md (endpoints `contact.php` e `contact-request.php`)

---

## 9. Worker (Opcional — Fase Avançada)

Um Cloudflare Worker permite lógica mais sofisticada que as Transform Rules. Para este projeto, é útil para:

1. **Injeção de CSP com nonce** — gera um nonce por request e injeta no HTML e no header `Content-Security-Policy`
2. **Otimização para bots SEO** — serve HTML pré-renderizado (SSR output) diretamente sem overhead de processamento Angular no origin

```javascript
// worker.js (esboço)
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);

    // Security headers adicionais ao que as Transform Rules já fazem
    const nonce = crypto.randomUUID().replace(/-/g, '');
    newHeaders.set(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com; ` +
      `style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; ` +
      `frame-src https://challenges.cloudflare.com; connect-src 'self';`
    );

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
```

> **Recomendação:** Começar apenas com Transform Rules (secção 4). O Worker adiciona complexidade e tem limites de CPU no plano gratuito. Implementar só se o CSP com nonce for um requisito de segurança explícito.

---

## 10. Cache Purge no Deploy (GitHub Actions)

O workflow de deploy já tem esta etapa. Garante que após cada deploy FTP, o edge cache Cloudflare é invalidado para as páginas HTML.

```yaml
# .github/workflows/deploy.yml (secção já existente — verificar se está assim)
- name: Purge Cloudflare Cache
  run: |
    curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
      -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything": true}'
```

**Alternativa mais cirúrgica** (só purge de HTML, preserva cache de assets):
```json
{
  "files": [
    "https://estrategiaeresultado.pt/",
    "https://estrategiaeresultado.pt/pt/",
    "https://estrategiaeresultado.pt/en/"
  ]
}
```

Os assets JS/CSS não precisam de purge porque os content hashes mudam automaticamente com cada build.

### GitHub Secrets necessários

| Secret                    | Descrição                                               |
|---------------------------|---------------------------------------------------------|
| `CLOUDFLARE_ZONE_ID`      | ID da zona Cloudflare (output do Terraform)             |
| `CLOUDFLARE_API_TOKEN`    | Token com permissão `Zone.Cache Purge`                  |

---

## Permissões do API Token Cloudflare

Criar um token dedicado para o Terraform (permissões amplas, apenas durante infra setup):

| Recurso               | Permissão            | Âmbito             |
|-----------------------|----------------------|--------------------|
| Zone Settings         | Edit                 | Zone específica    |
| DNS                   | Edit                 | Zone específica    |
| Cache Rules           | Edit                 | Zone específica    |
| Transform Rules       | Edit                 | Zone específica    |
| Firewall Services     | Edit                 | Zone específica    |
| Workers Scripts       | Edit                 | Account            |
| Turnstile             | Edit                 | Account            |
| Zone                  | Edit                 | Zone específica    |

Criar um **segundo token** para o GitHub Actions (permissões mínimas):

| Recurso       | Permissão      | Âmbito          |
|---------------|----------------|-----------------|
| Cache Purge   | Purge          | Zone específica |

---

## Estado das Variáveis Terraform

```hcl
# variables.tf
variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "domain" {
  type    = string
  default = "estrategiaeresultado.pt"
}

variable "origin_ip" {
  type        = string
  description = "IP do servidor de alojamento partilhado (origem FTP)"
}
```

---

## Fases de Implementação

### Fase 1 — DNS e SSL (imediato, antes do lançamento)
1. Registar domínio `estrategiaeresultado.pt`
2. Criar zona Cloudflare e apontar nameservers no registo do domínio
3. Configurar DNS (A record, www CNAME, DMARC)
4. Configurar SSL Full + Always HTTPS + TLS 1.2
5. Configurar redirect www → apex

### Fase 2 — Segurança e Performance (antes do lançamento)
6. Aplicar Zone Settings (HTTP/3, Early Hints, etc.)
7. Adicionar Transform Rules (security headers)
8. Configurar Cache Rules
9. Configurar WAF Rules básicas

### Fase 3 — Formulário e Deploy (integração com backend)
10. Criar widget Turnstile + injetar chaves no build
11. Configurar cache purge no GitHub Actions
12. Teste end-to-end do formulário com Turnstile real

### Fase 4 — Avançado (pós-lançamento, opcional)
13. Worker com CSP nonce (se necessário)
14. Zona `.com` como redirect para `.pt` (se registado)
15. Ajuste fino de WAF rules com dados reais de tráfego

---

## Referências

- Padrão de implementação: `feelathomehouse-v2/infrastructure/cloudflare/`
- Provider Terraform: `cloudflare/cloudflare ~> 5.0`
- HSTS: configurar via Cloudflare dashboard (bug no provider v5 que impede gestão via Terraform)
