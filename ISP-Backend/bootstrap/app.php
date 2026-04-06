<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'admin.auth'        => \App\Http\Middleware\AdminAuth::class,
            'customer.auth'     => \App\Http\Middleware\CustomerAuth::class,
            'reseller.auth'     => \App\Http\Middleware\ResellerAuth::class,
            'check.permission'  => \App\Http\Middleware\CheckPermission::class,
            'tenant.resolve'    => \App\Http\Middleware\ResolveTenant::class,
            'super.admin.auth'  => \App\Http\Middleware\SuperAdminAuth::class,
            'check.subscription'=> \App\Http\Middleware\CheckSubscription::class,
            'check.plan_module' => \App\Http\Middleware\CheckPlanModule::class,
        ]);

        // Apply tenant resolution to all API requests.
        // This app uses stateless session tokens for admin/customer/super-admin APIs,
        // so Sanctum's stateful SPA middleware must stay disabled on VPS deployments.
        $middleware->api(prepend: [
            \App\Http\Middleware\ResolveTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
