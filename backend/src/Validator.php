<?php

declare(strict_types=1);

namespace App;

class Validator
{
    /** @var array<string, string> */
    private array $errors = [];

    public function required(string $field, mixed $value): static
    {
        if (empty(trim((string) $value))) {
            $this->errors[$field] = "O campo {$field} é obrigatório.";
        }
        return $this;
    }

    public function email(string $field, mixed $value): static
    {
        if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "O campo {$field} deve ser um email válido.";
        }
        return $this;
    }

    public function maxLength(string $field, mixed $value, int $max): static
    {
        if (mb_strlen((string) $value) > $max) {
            $this->errors[$field] = "O campo {$field} não pode ter mais de {$max} caracteres.";
        }
        return $this;
    }

    public function phone(string $field, mixed $value): static
    {
        if (!empty($value) && !preg_match('/^\+?[\d\s\-()]{7,20}$/', (string) $value)) {
            $this->errors[$field] = "O campo {$field} deve ser um número de telefone válido.";
        }
        return $this;
    }

    /**
     * @param array<int|string, mixed> $list
     */
    public function inList(string $field, mixed $value, array $list): static
    {
        if (!empty($value) && !in_array($value, $list, true)) {
            $this->errors[$field] = "O valor selecionado para {$field} não é válido.";
        }
        return $this;
    }

    public function isValid(): bool
    {
        return empty($this->errors);
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /** @return array<string, string> */
    public function getErrors(): array
    {
        return $this->errors;
    }

    public static function sanitize(mixed $value): string
    {
        return htmlspecialchars(strip_tags(trim((string) $value)), ENT_QUOTES, 'UTF-8');
    }
}
