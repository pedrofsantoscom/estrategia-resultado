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
if (!$limiter->isAllowed("contact-request:$ip", $rateLimitRequests, $rateLimitWindow)) {
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
    'Fiscalidade e Contabilidade',
    'Consultoria Jurídica',
    'Consultoria de Empresas',
    'Gestão de Rendas',
    'Crédito',
    'Seguros',
    'Apoio a Negócios',
    'IRS',
];

$v = new Validator();
$v->required('name', $input['name'] ?? '')
  ->maxLength('name', $input['name'] ?? '', 100)
  ->required('phone', $input['phone'] ?? '')
  ->phone('phone', $input['phone'] ?? '')
  ->maxLength('phone', $input['phone'] ?? '', 30)
  ->required('preferred_time', $input['preferred_time'] ?? '')
  ->maxLength('preferred_time', $input['preferred_time'] ?? '', 100)
  ->required('service', $input['service'] ?? '')
  ->inList('service', $input['service'] ?? '', $validServices);

if (!$v->isValid()) {
    Bootstrap::respondError(422, array_values($v->errors())[0]);
}

$name          = Validator::sanitize($input['name']);
$phone         = Validator::sanitize($input['phone']);
$preferredTime = Validator::sanitize($input['preferred_time']);
$service       = Validator::sanitize($input['service']);
$lang          = in_array($input['lang'] ?? 'pt', ['pt', 'en']) ? $input['lang'] : 'pt';

$mailer = new Mailer($config);

try {
    $mailer->sendCallbackNotification([
        'name'           => $name,
        'phone'          => $phone,
        'preferred_time' => $preferredTime,
        'service'        => $service,
        'lang'           => $lang,
    ]);
} catch (\Exception $e) {
    Bootstrap::respondError(500, 'Erro ao enviar email. Por favor tente novamente mais tarde.');
}

Bootstrap::respond(200, ['success' => true]);
