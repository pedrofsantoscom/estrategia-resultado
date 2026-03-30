<?php

declare(strict_types=1);

namespace App;

class Bootstrap
{
    /** @param array<string, mixed> $allowedOrigins */
    public static function init(array $allowedOrigins): void
    {
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header_remove('X-Powered-By');

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Methods: POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            header('Access-Control-Max-Age: 86400');
            header('Vary: Origin');
        }
    }

    public static function requirePost(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            self::respondError(405, 'Método não permitido.');
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return never
     */
    public static function respond(int $code, array $data): never
    {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** @return never */
    public static function respondError(int $code, string $message): never
    {
        http_response_code($code);
        echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
