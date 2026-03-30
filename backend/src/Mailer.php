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
     * Send owner notification for a full contact form submission.
     *
     * @param array{name: string, email: string, phone: string, service: string, message: string} $data
     */
    public function sendContactNotification(array $data): void
    {
        $mail = $this->createMailer();
        $mail->addAddress((string) $this->config['notification_email']);
        $mail->Subject = "Novo Contacto: {$data['name']} — {$data['service']}";
        $mail->Body    = $this->buildContactOwnerBody($data);
        $mail->AltBody = $this->buildContactOwnerText($data);

        if (!$mail->send()) {
            throw new MailerException($mail->ErrorInfo);
        }
    }

    /**
     * Send confirmation email to the person who submitted the contact form.
     *
     * @param array{name: string, email: string, service: string} $data
     */
    public function sendContactConfirmation(array $data): void
    {
        $mail = $this->createMailer();
        $mail->addAddress($data['email'], $data['name']);
        $mail->Subject = 'Recebemos o seu pedido — Estratégia & Resultado';
        $mail->Body    = $this->buildContactConfirmationBody($data);
        $mail->AltBody = $this->buildContactConfirmationText($data);

        if (!$mail->send()) {
            throw new MailerException($mail->ErrorInfo);
        }
    }

    /**
     * Send owner notification for a callback (quick contact) request.
     *
     * @param array{name: string, phone: string, preferred_time: string, service: string} $data
     */
    public function sendCallbackNotification(array $data): void
    {
        $mail = $this->createMailer();
        $mail->addAddress((string) $this->config['notification_email']);
        $mail->Subject = "Pedido de Contacto: {$data['name']} — {$data['service']}";
        $mail->Body    = $this->buildCallbackOwnerBody($data);
        $mail->AltBody = $this->buildCallbackOwnerText($data);

        if (!$mail->send()) {
            throw new MailerException($mail->ErrorInfo);
        }
    }

    private function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = (string) $this->config['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = (string) $this->config['smtp_user'];
        $mail->Password   = (string) $this->config['smtp_pass'];
        $port             = (int) $this->config['smtp_port'];
        $mail->SMTPSecure = $port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $port;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom((string) $this->config['smtp_from'], (string) $this->config['smtp_from_name']);
        $mail->isHTML(true);
        return $mail;
    }

    /** @param array<string, string> $d */
    private function buildContactOwnerBody(array $d): string
    {
        $name    = htmlspecialchars($d['name'], ENT_QUOTES, 'UTF-8');
        $email   = htmlspecialchars($d['email'], ENT_QUOTES, 'UTF-8');
        $phone   = htmlspecialchars($d['phone'], ENT_QUOTES, 'UTF-8');
        $service = htmlspecialchars($d['service'], ENT_QUOTES, 'UTF-8');
        $message = nl2br(htmlspecialchars($d['message'], ENT_QUOTES, 'UTF-8'));
        $waPhone = preg_replace('/[^0-9]/', '', $d['phone']);
        $waText  = rawurlencode("Olá {$d['name']}, obrigado pelo seu contacto sobre {$d['service']}...");

        return <<<HTML
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;background:#fff">
          <div style="border-top:4px solid #C8972E;padding-top:16px;margin-bottom:24px">
            <h2 style="color:#1A2744;margin:0">Novo Pedido de Contacto</h2>
            <p style="color:#888;margin:4px 0 0">Via formulário de contacto — estrategiaeresultado.pt</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f5f3ee">
              <td style="padding:10px 12px;font-weight:bold;width:160px;color:#1A2744;border-bottom:1px solid #e8e4db">Nome</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">$name</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;border-bottom:1px solid #e8e4db">Email</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">
                <a href="mailto:$email" style="color:#C8972E;text-decoration:none">$email</a>
              </td>
            </tr>
            <tr style="background:#f5f3ee">
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;border-bottom:1px solid #e8e4db">Telefone</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">
                <a href="tel:$phone" style="color:#C8972E;text-decoration:none">$phone</a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;border-bottom:1px solid #e8e4db">Serviço</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">
                <strong style="color:#1A2744">$service</strong>
              </td>
            </tr>
            <tr style="background:#f5f3ee">
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;vertical-align:top">Mensagem</td>
              <td style="padding:10px 12px">$message</td>
            </tr>
          </table>
          <div style="margin-top:24px">
            <a href="https://wa.me/$waPhone?text=$waText"
               style="background:#25d366;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;margin-right:8px;display:inline-block;font-weight:bold">
              Responder via WhatsApp
            </a>
            <a href="mailto:$email"
               style="background:#1A2744;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;font-weight:bold">
              Responder por Email
            </a>
          </div>
          <p style="margin-top:40px;color:#aaa;font-size:11px;border-top:1px solid #eee;padding-top:12px">
            Estratégia &amp; Resultado · estrategiaeresultado.pt
          </p>
        </body>
        </html>
        HTML;
    }

    /** @param array<string, string> $d */
    private function buildContactOwnerText(array $d): string
    {
        return implode("\n", [
            'NOVO PEDIDO DE CONTACTO',
            '=======================',
            "Nome     : {$d['name']}",
            "Email    : {$d['email']}",
            "Telefone : {$d['phone']}",
            "Serviço  : {$d['service']}",
            "Mensagem : {$d['message']}",
        ]);
    }

    /** @param array<string, string> $d */
    private function buildContactConfirmationBody(array $d): string
    {
        $name    = htmlspecialchars($d['name'], ENT_QUOTES, 'UTF-8');
        $service = htmlspecialchars($d['service'], ENT_QUOTES, 'UTF-8');

        return <<<HTML
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;background:#fff">
          <div style="border-top:4px solid #C8972E;padding-top:16px;margin-bottom:24px">
            <h2 style="color:#1A2744;margin:0">Recebemos o seu pedido</h2>
          </div>
          <p>Caro/a <strong>$name</strong>,</p>
          <p>Obrigado por nos contactar sobre <strong style="color:#1A2744">$service</strong>.</p>
          <p>Recebemos a sua mensagem e entraremos em contacto consigo brevemente para dar seguimento ao seu pedido.</p>
          <p style="margin-top:32px">Com os melhores cumprimentos,<br>
            <strong style="color:#1A2744">Estratégia &amp; Resultado</strong>
          </p>
          <p style="margin-top:40px;color:#aaa;font-size:11px;border-top:1px solid #eee;padding-top:12px">
            Este é um email automático — por favor não responda diretamente a este endereço.<br>
            Estratégia &amp; Resultado · estrategiaeresultado.pt
          </p>
        </body>
        </html>
        HTML;
    }

    /** @param array<string, string> $d */
    private function buildContactConfirmationText(array $d): string
    {
        return implode("\n", [
            "Caro/a {$d['name']},",
            '',
            "Obrigado por nos contactar sobre {$d['service']}.",
            'Recebemos a sua mensagem e entraremos em contacto consigo brevemente.',
            '',
            'Com os melhores cumprimentos,',
            'Estratégia & Resultado',
        ]);
    }

    /** @param array<string, string> $d */
    private function buildCallbackOwnerBody(array $d): string
    {
        $name          = htmlspecialchars($d['name'], ENT_QUOTES, 'UTF-8');
        $phone         = htmlspecialchars($d['phone'], ENT_QUOTES, 'UTF-8');
        $preferredTime = htmlspecialchars($d['preferred_time'], ENT_QUOTES, 'UTF-8');
        $service       = htmlspecialchars($d['service'], ENT_QUOTES, 'UTF-8');
        $waPhone       = preg_replace('/[^0-9]/', '', $d['phone']);
        $waText        = rawurlencode("Olá {$d['name']}, somos da Estratégia & Resultado e gostaríamos de falar consigo sobre {$d['service']}.");

        return <<<HTML
        <!DOCTYPE html>
        <html lang="pt">
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;background:#fff">
          <div style="border-top:4px solid #C8972E;padding-top:16px;margin-bottom:24px">
            <h2 style="color:#1A2744;margin:0">Pedido de Contacto Telefónico</h2>
            <p style="color:#888;margin:4px 0 0">Via formulário rápido — estrategiaeresultado.pt</p>
          </div>
          <p>Um visitante solicitou ser contactado por telefone:</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f5f3ee">
              <td style="padding:10px 12px;font-weight:bold;width:180px;color:#1A2744;border-bottom:1px solid #e8e4db">Nome</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">$name</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;border-bottom:1px solid #e8e4db">Telefone</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">
                <a href="tel:$phone" style="color:#C8972E;text-decoration:none">$phone</a>
              </td>
            </tr>
            <tr style="background:#f5f3ee">
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744;border-bottom:1px solid #e8e4db">Horário preferido</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e8e4db">$preferredTime</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;font-weight:bold;color:#1A2744">Serviço</td>
              <td style="padding:10px 12px"><strong style="color:#1A2744">$service</strong></td>
            </tr>
          </table>
          <div style="margin-top:24px">
            <a href="https://wa.me/$waPhone?text=$waText"
               style="background:#25d366;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;margin-right:8px;display:inline-block;font-weight:bold">
              Responder via WhatsApp
            </a>
            <a href="tel:$phone"
               style="background:#1A2744;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;font-weight:bold">
              Ligar Agora
            </a>
          </div>
          <p style="margin-top:40px;color:#aaa;font-size:11px;border-top:1px solid #eee;padding-top:12px">
            Estratégia &amp; Resultado · estrategiaeresultado.pt
          </p>
        </body>
        </html>
        HTML;
    }

    /** @param array<string, string> $d */
    private function buildCallbackOwnerText(array $d): string
    {
        return implode("\n", [
            'PEDIDO DE CONTACTO TELEFÓNICO',
            '=============================',
            "Nome             : {$d['name']}",
            "Telefone         : {$d['phone']}",
            "Horário preferido: {$d['preferred_time']}",
            "Serviço          : {$d['service']}",
        ]);
    }
}
