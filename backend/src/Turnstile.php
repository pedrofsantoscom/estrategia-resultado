<?php

declare(strict_types=1);

namespace App;

class Turnstile
{
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct(private readonly string $secretKey) {}

    /**
     * Verifies a Turnstile token. Fails closed on network errors.
     */
    public function verify(string $token, string $remoteIp = ''): bool
    {
        if ($token === '') {
            return false;
        }

        $payload = [
            'secret'   => $this->secretKey,
            'response' => $token,
        ];

        if ($remoteIp !== '') {
            $payload['remoteip'] = $remoteIp;
        }

        $ch = curl_init(self::VERIFY_URL);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($payload),
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT        => 5,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        if (!is_string($response)) {
            return false;
        }

        $data = json_decode($response, true);
        return is_array($data) && ($data['success'] ?? false) === true;
    }
}
