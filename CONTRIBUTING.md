# Contributing

## Branches

- `main` — branch principal; todo trabalho deve ser mergeado aqui
- `production` — branch de deploy; push aqui aciona o CI/CD para produção

Nunca commitar directamente para `production`. O fluxo correcto é:

```bash
# Trabalhar numa feature branch
git checkout -b claude/nome-descritivo
# ... fazer commits ...
# Mergear em main
git checkout main && git merge claude/nome-descritivo
# Depois, quando pronto para deploy:
git checkout production && git merge main && git push origin production
```

## Commits

- Usar mensagens descritivas em inglês ou português
- Prefixos: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Exemplos: `feat: add contact form validation`, `fix: turnstile token expiry handling`

## Frontend (Angular)

- Componentes em `src/app/components/`
- Um componente por directório com `.ts`, `.html`, `.scss`
- Estilos globais em `src/styles.css` (Tailwind utilities)
- Verificar que `pnpm build` passa antes de mergear

## Backend (PHP)

- Código em `backend/src/` com autoloading PSR-4
- Nunca commitar `backend/config.php` — está no `.gitignore`; usar `config.example.php` como template
- Ficheiros de rate limiting em `backend/tmp/` — também no `.gitignore`

## Segredos e Configuração

- Nunca commitar credenciais, passwords, ou chaves API
- Usar GitHub Secrets para todas as credenciais de produção (ver `README.md`)
- O `config.php` é gerado pelo CI/CD a partir de `config.example.php` e dos secrets

## Testes E2E

Antes de submeter alterações ao formulário de contacto, modal, ou navegação, correr:

```bash
pnpm test:e2e
```

Todos os testes devem passar.
