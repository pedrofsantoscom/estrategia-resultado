<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Bootstrap;
use App\Mailer;
use App\RateLimiter;
use App\Request;
use App\Turnstile;
use App\Validator;

$config = require __DIR__ . '/../config.php';

Bootstrap::init($config['allowed_origins']);
Bootstrap::requirePost();

$ip = Request::getRealIp();

// Rate limit: 5 requests per 15 minutes per IP
$rateLimitRequests = (int) ($config['rate_limit_requests'] ?? 5);
$rateLimitWindow   = (int) ($config['rate_limit_window'] ?? 900);

$limiter = new RateLimiter(__DIR__ . '/../tmp/rate-limits');
if (!$limiter->isAllowed("contact:$ip", $rateLimitRequests, $rateLimitWindow)) {
    Bootstrap::respondError(429, 'Demasiados pedidos. Por favor tente novamente mais tarde.');
}

$input = Request::getJsonBody();
if ($input === null) {
    Bootstrap::respondError(400, 'Pedido inválido. Certifique-se de enviar JSON válido.');
}

// Verify Turnstile token (skip if secret is 'dev' — local development only)
if (($config['turnstile_secret_key'] ?? '') !== 'dev') {
    $token     = (string) ($input['turnstile_token'] ?? '');
    $turnstile = new Turnstile($config['turnstile_secret_key']);
    if (!$turnstile->verify($token, $ip)) {
        Bootstrap::respondError(403, 'Verificação de segurança falhou. Recarregue a página e tente novamente.');
    }
}

$validServices = [
    'Intermediação de Crédito',
    'Serviços Jurídicos',
    'Seguros',
    'Apoio Administrativo',
    'Consultadoria Empresarial',
    'Fiscalidade e Contabilidade',
    'Análise e Entrega do IRS',
    'Gestão de Rendas',
    'Intermediação de Actividades de Serviços de Apoio aos Negócios',
    'Orçamentista',
];

$v = new Validator();
$v->required('name', $input['name'] ?? '')
  ->maxLength('name', $input['name'] ?? '', 100)
  ->required('email', $input['email'] ?? '')
  ->email('email', $input['email'] ?? '')
  ->required('phone', $input['phone'] ?? '')
  ->phone('phone', $input['phone'] ?? '')
  ->maxLength('phone', $input['phone'] ?? '', 30)
  ->required('service', $input['service'] ?? '')
  ->inList('service', $input['service'] ?? '', $validServices)
  ->required('message', $input['message'] ?? '')
  ->maxLength('message', $input['message'] ?? '', 2000);

if (!$v->isValid()) {
    Bootstrap::respondError(422, array_values($v->errors())[0]);
}

$name    = Validator::sanitize($input['name']);
$email   = Validator::sanitize($input['email']);
$phone   = Validator::sanitize($input['phone']);
$service = Validator::sanitize($input['service']);
$message = Validator::sanitize($input['message']);
$lang    = in_array($input['lang'] ?? 'pt', ['pt', 'en']) ? $input['lang'] : 'pt';

$mailer = new Mailer($config);

try {
    $mailer->sendContactNotification([
        'name'    => $name,
        'email'   => $email,
        'phone'   => $phone,
        'service' => $service,
        'message' => $message,
        'lang'    => $lang,
    ]);

    $mailer->sendContactConfirmation([
        'name'    => $name,
        'email'   => $email,
        'service' => $service,
        'lang'    => $lang,
    ]);
} catch (\Exception $e) {
    Bootstrap::respondError(500, 'Erro ao enviar email. Por favor tente novamente mais tarde.');
}

Bootstrap::respond(200, ['success' => true]);
