<?php

declare(strict_types=1);

namespace App;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

class Mailer
{
    /** @param array<string, mixed> $config */
    public function __construct(private readonly array $config) {}

    /**
     * Send the owner notification and an optional confirmation to the sender.
     *
     * @param array<string, string> $data   Form data (name, email, phone, service, message, …)
     * @param string                $subject Email subject
     * @param string                $body    HTML body for the owner notification
     * @param bool                  $sendConfirmation  Whether to also send a confirmation to $data['email']
     */
    public function send(
        array $data,
        string $subject,
        string $body,
        bool $sendConfirmation = false
    ): void {
        $mail = $this->createMailer();

        $mail->addAddress($this->config['notification_email']);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body);

        if (!$mail->send()) {
            throw new MailerException($mail->ErrorInfo);
        }

        if ($sendConfirmation && !empty($data['email'])) {
            $confirmMail = $this->createMailer();
            $confirmMail->addAddress($data['email'], $data['name'] ?? '');
            $confirmMail->Subject = 'Recebemos o seu pedido — Estratégia & Resultado';
            $confirmMail->Body    = $this->confirmationBody($data);
            $confirmMail->AltBody = strip_tags($confirmMail->Body);

            if (!$confirmMail->send()) {
                throw new MailerException($confirmMail->ErrorInfo);
            }
        }
    }

    private function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $this->config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $this->config['smtp_user'];
        $mail->Password   = $this->config['smtp_pass'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = (int) $this->config['smtp_port'];
        $mail->CharSet    = 'UTF-8';
        $mail->isHTML(true);
        $mail->setFrom($this->config['smtp_from'], $this->config['smtp_from_name']);
        return $mail;
    }

    /** @param array<string, string> $data */
    private function confirmationBody(array $data): string
    {
        $name = htmlspecialchars($data['name'] ?? '', ENT_QUOTES, 'UTF-8');
        return <<<HTML
        <p>Caro/a {$name},</p>
        <p>Recebemos o seu pedido de contacto e entraremos em contacto consigo brevemente.</p>
        <p>Com os melhores cumprimentos,<br>Estratégia &amp; Resultado</p>
        HTML;
    }
}
