<?php

declare(strict_types=1);

namespace App;

class RateLimiter
{
    private string $storageDir;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(
        string $storageDir,
        int $maxRequests = 5,
        int $windowSeconds = 3600
    ) {
        $this->storageDir   = rtrim($storageDir, '/');
        $this->maxRequests  = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    /**
     * Returns true if the request is allowed, false if rate limit is exceeded.
     */
    public function allow(string $ip): bool
    {
        $file = $this->storageDir . '/' . md5($ip) . '.json';

        $now    = time();
        $window = $now - $this->windowSeconds;

        $timestamps = [];

        if (file_exists($file)) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data)) {
                $timestamps = array_filter($data, fn(int $t) => $t > $window);
            }
        }

        if (count($timestamps) >= $this->maxRequests) {
            return false;
        }

        $timestamps[] = $now;
        file_put_contents($file, json_encode(array_values($timestamps)), LOCK_EX);

        return true;
    }
}
