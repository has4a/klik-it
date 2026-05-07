<?php
/**
 * ============================================================================
 * Klik_IT — Contact form handler
 * ============================================================================
 * Receives POST from the contact form, validates, optionally verifies the
 * reCAPTCHA v3 token, and sends an email via PHP mail().
 *
 * BEFORE GO-LIVE
 * --------------
 *   1. Set RECIPIENT_EMAIL below to the inbox that should receive enquiries.
 *   2. Set RECAPTCHA_SECRET (Google reCAPTCHA admin → klikit.sk site → secret
 *      key). Until this is set the verify step is skipped — honeypot is the
 *      only spam guard.
 *   3. Confirm `mail()` works on the production host (XAMPP locally won't
 *      send unless sendmail is configured). On most shared hosts it just
 *      works. If your host requires SMTP-auth, swap mail() for PHPMailer
 *      (`composer require phpmailer/phpmailer`) — the call site in
 *      `sendEmail()` is the only thing that changes.
 *
 * NOTE: This file is not deployed by Vite. On Cloudflare Pages it 404s
 * (Pages is static-only). Deploy the PHP backend to your traditional
 * hosting where klikit.sk is served, OR convert this to a Cloudflare
 * Pages Function (`functions/api/send-email.js`).
 * ============================================================================
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// ---------------------------------------------------------------------------
// CONFIG — edit before deploy
// ---------------------------------------------------------------------------
const RECIPIENT_EMAIL    = 'info@klikit.sk';
const FROM_EMAIL         = 'noreply@klikit.sk';
const FROM_NAME          = 'Klik_IT web';
const RECAPTCHA_SECRET   = '';  // empty = skip verify (honeypot only)
const RECAPTCHA_MIN_SCORE = 0.5;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message): never {
    respond($status, ['ok' => false, 'error' => $message]);
}

function ok(string $message = 'OK'): never {
    respond(200, ['ok' => true, 'message' => $message]);
}

// ---------------------------------------------------------------------------
// REQUEST GUARDS
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Method Not Allowed');
}

// Honeypot — silent bot accept; the form's visible "website" field is
// hidden from humans but bots fill it. Pretend success so they don't retry.
if (!empty($_POST['website'] ?? '')) {
    ok('Ďakujeme!');
}

// ---------------------------------------------------------------------------
// FIELD VALIDATION (mirrors Forms.js client-side rules)
// ---------------------------------------------------------------------------
$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$phone   = trim((string)($_POST['phone']   ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if (mb_strlen($name) < 2)             fail(400, 'Meno musí mať aspoň 2 znaky.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail(400, 'Neplatný e-mail.');
if (mb_strlen($message) < 10)         fail(400, 'Správa musí mať aspoň 10 znakov.');
if (mb_strlen($message) > 5000)       fail(400, 'Správa je príliš dlhá.');

// ---------------------------------------------------------------------------
// reCAPTCHA v3 VERIFY (skipped if secret not configured)
// ---------------------------------------------------------------------------
$token = trim((string)($_POST['recaptcha_token'] ?? ''));
if (RECAPTCHA_SECRET !== '' && $token !== '') {
    $context = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => 'Content-Type: application/x-www-form-urlencoded',
            'content'       => http_build_query([
                'secret'   => RECAPTCHA_SECRET,
                'response' => $token,
                'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ]),
            'timeout'       => 5,
            'ignore_errors' => true,
        ],
    ]);
    $body = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    if ($body === false) fail(502, 'reCAPTCHA service unreachable.');
    $verify = json_decode($body, true);
    if (!is_array($verify) || empty($verify['success'])) {
        fail(403, 'reCAPTCHA verification failed.');
    }
    if (($verify['score'] ?? 0) < RECAPTCHA_MIN_SCORE) {
        fail(403, 'Spam detected.');
    }
}

// ---------------------------------------------------------------------------
// EMAIL COMPOSE + SEND
// ---------------------------------------------------------------------------
$subject = sprintf('Nová správa z klikit.sk — %s', $name);

$body  = "Meno:    $name\n";
$body .= "E-mail:  $email\n";
$body .= "Telefón: " . ($phone !== '' ? $phone : '(neuvedené)') . "\n";
$body .= "IP:      " . ($_SERVER['REMOTE_ADDR'] ?? '?') . "\n\n";
$body .= "— Správa —\n";
$body .= $message . "\n";

$fromAddr = sprintf('%s <%s>', FROM_NAME, FROM_EMAIL);
$replyTo  = sprintf('%s <%s>', $name, $email);

$headers  = "From: $fromAddr\r\n";
$headers .= "Reply-To: $replyTo\r\n";
$headers .= "X-Mailer: PHP/" . PHP_VERSION . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = @mail(RECIPIENT_EMAIL, $encodedSubject, $body, $headers);

if (!$sent) {
    fail(500, 'Email sa nepodarilo odoslať.');
}

ok('Ďakujeme! Vaša správa bola odoslaná. Ozveme sa do 24 hodín.');
