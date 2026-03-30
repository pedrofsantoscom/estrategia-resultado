<?php

declare(strict_types=1);

// TODO (Phase 3): Implement full contact form handler
// Fields: name, email, phone, service, message, cf-turnstile-response
// Steps:
//   1. Verify Cloudflare Turnstile
//   2. Validate & sanitise inputs (Validator)
//   3. Rate-limit by IP (RateLimiter)
//   4. Send owner notification + sender confirmation (Mailer)
//   5. Return JSON { success: true } or { error: "..." }

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json; charset=UTF-8');
http_response_code(501);
echo json_encode(['error' => 'Not yet implemented.']);
