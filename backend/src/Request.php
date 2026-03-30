<?php

declare(strict_types=1);

namespace App;

class Request
{
    /**
     * Returns the real client IP, trusting CF-Connecting-IP when present.
     */
    public static function getRealIp(): string
    {
        $cfIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
        if ($cfIp !== '' && filter_var($cfIp, FILTER_VALIDATE_IP) !== false) {
            return $cfIp;
        }

        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Parses the JSON request body. Returns null on missing or invalid JSON.
     *
     * @return array<string, mixed>|null
     */
    public static function getJsonBody(): ?array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return null;
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }
}
