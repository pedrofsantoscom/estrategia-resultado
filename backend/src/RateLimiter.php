<?php

declare(strict_types=1);

namespace App;

class RateLimiter
{
    public function __construct(private readonly string $storageDir)
    {
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0750, true);
        }
    }

    /**
     * Returns true if the request is allowed, false if the rate limit is exceeded.
     *
     * @param string $key           Unique key (e.g. "contact:192.168.1.1")
     * @param int    $limit         Maximum requests allowed in the window
     * @param int    $windowSeconds Rolling window size in seconds
     */
    public function isAllowed(string $key, int $limit, int $windowSeconds): bool
    {
        $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        $file    = $this->storageDir . '/' . $safeKey . '.json';

        $now    = time();
        $cutoff = $now - $windowSeconds;

        $timestamps = [];
        if (file_exists($file)) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data)) {
                $timestamps = array_filter($data, fn(int $t) => $t > $cutoff);
            }
        }

        if (count($timestamps) >= $limit) {
            return false;
        }

        $timestamps[] = $now;
        file_put_contents($file, json_encode(array_values($timestamps)), LOCK_EX);

        return true;
    }
}
