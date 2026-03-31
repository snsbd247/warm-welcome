<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [env('FRONTEND_URL', '*')],

    'allowed_origins_patterns' => [
        // Allow any subdomain of the main domain
        '#^https?://(.+\.)?'.preg_quote(parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost', '#').'$#',
    ],

    'allowed_headers' => [
        'Content-Type', 'Authorization', 'X-Session-Token', 'X-Setup-Token',
        'X-Requested-With', 'Accept', 'Origin',
    ],

    'exposed_headers' => ['X-Total-Count'],

    'max_age' => 86400,

    'supports_credentials' => true,

];
