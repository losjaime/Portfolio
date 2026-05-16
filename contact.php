<?php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Config ────────────────────────────────────────────────────────────────
$to      = 'carlosjaime.tx@gmail.com';
$subject = 'Portfolio — New Message';

// ── Rate Limiting (max 5 submissions per hour per session) ────────────────
session_start();
$now = time();

if (!isset($_SESSION['contact_attempts'])) {
    $_SESSION['contact_attempts'] = [];
}

$_SESSION['contact_attempts'] = array_values(array_filter(
    $_SESSION['contact_attempts'],
    function ($t) use ($now) { return $now - $t < 3600; }
));

if (count($_SESSION['contact_attempts']) >= 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many submissions. Please try again in an hour.']);
    exit;
}

// ── Method Check ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.']);
    exit;
}

// ── Parse JSON Body ───────────────────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

// ── Honeypot Check ────────────────────────────────────────────────────────
// Bots fill every field; real users leave this blank.
if (!empty($input['website'])) {
    // Silently succeed — don't tip off the bot.
    echo json_encode(['success' => true]);
    exit;
}

// ── Sanitize Inputs ───────────────────────────────────────────────────────
$name    = trim(strip_tags($input['name']    ?? ''));
$email   = trim(strip_tags($input['email']   ?? ''));
$message = trim(strip_tags($input['message'] ?? ''));

// ── Server-Side Validation ────────────────────────────────────────────────
$errors = [];

if (strlen($name) < 2 || strlen($name) > 100) {
    $errors[] = 'Name must be between 2 and 100 characters.';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    $errors[] = 'Please enter a valid email address.';
}

if (strlen($message) < 10 || strlen($message) > 5000) {
    $errors[] = 'Message must be between 10 and 5000 characters.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// ── Prevent Email Header Injection ────────────────────────────────────────
// Strip newlines from fields that land in email headers.
$name  = preg_replace('/[\r\n\t]/', ' ', $name);
$email = preg_replace('/[\r\n\t]/', '',  $email);

// ── Build and Send Email ──────────────────────────────────────────────────
$headers  = "From: Portfolio Contact <no-reply@yourdomain.com>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$body  = "You received a new message from your portfolio contact form.\r\n";
$body .= str_repeat('-', 48) . "\r\n";
$body .= "Name:    {$name}\r\n";
$body .= "Email:   {$email}\r\n\r\n";
$body .= "Message:\r\n{$message}\r\n";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    $_SESSION['contact_attempts'][] = $now;
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not send your message. Please try again later.']);
}
