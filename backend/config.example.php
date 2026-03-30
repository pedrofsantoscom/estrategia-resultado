<?php
// Copy this file to config.php and fill in all values.
// config.php must never be committed — it is in .gitignore.
//
// In CI (deploy.yml), this file is copied to config.php and placeholders
// are replaced with GitHub secrets via sed. Placeholders use the format
// __PLACEHOLDER_NAME__ so they are easy to find and replace.
return [

    // --- Email notifications ---
    'notification_email' => '__MAIL_TO__',

    // --- SMTP (PHPMailer) ---
    // Set turnstile_secret_key to 'dev' and smtp_* to dummy values for local testing.
    'smtp_host'      => '__SMTP_HOST__',
    'smtp_port'      => 465,
    'smtp_user'      => '__SMTP_USER__',
    'smtp_pass'      => '__SMTP_PASS__',
    'smtp_from'      => '__SMTP_USER__',
    'smtp_from_name' => 'Estratégia & Resultado',

    // --- Cloudflare Turnstile ---
    // Get from: https://dash.cloudflare.com → Turnstile
    // Use 'dev' to skip verification locally.
    'turnstile_secret_key' => '__TURNSTILE_SECRET_KEY__',

    // --- WhatsApp quick-reply ---
    // International format without leading +. Example: 351912345678
    'whatsapp_number' => '__WHATSAPP_NUMBER__',

    // --- Rate limiting ---
    // Maximum submissions per window per IP (applies to each endpoint independently).
    'rate_limit_requests' => 5,
    'rate_limit_window'   => 900, // 15 minutes in seconds

    // --- CORS ---
    'allowed_origins' => [
        'http://localhost:4200',
        'https://estrategiaeresultado.pt',
        'https://www.estrategiaeresultado.pt',
    ],

];
