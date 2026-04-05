<?php

namespace App\Exceptions;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed for validation exceptions.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // ── Always return JSON for API requests ──────────────

        $this->renderable(function (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Resource not found',
                'message' => 'The requested resource was not found.',
            ], 404);
        });

        $this->renderable(function (NotFoundHttpException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Not found',
                'message' => 'The requested endpoint does not exist.',
            ], 404);
        });

        $this->renderable(function (MethodNotAllowedHttpException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Method not allowed',
                'message' => $e->getMessage(),
            ], 405);
        });

        $this->renderable(function (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        });

        $this->renderable(function (AuthenticationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthenticated',
                'message' => 'You must be logged in to access this resource.',
            ], 401);
        });

        $this->renderable(function (TooManyRequestsHttpException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Too many requests',
                'message' => 'Rate limit exceeded. Please slow down.',
            ], 429);
        });

        // Database constraint violations
        $this->renderable(function (QueryException $e) {
            $code = $e->getCode();
            // Foreign key / unique constraint violation
            if (in_array($code, ['23000', '23503', '23505'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Data constraint violation',
                    'message' => 'This operation violates a data constraint. The record may be in use or already exists.',
                ], 422);
            }
            // In production, don't expose raw SQL errors
            if (app()->environment('production')) {
                report($e);
                return response()->json([
                    'success' => false,
                    'error' => 'Database error',
                    'message' => 'A database error occurred. Please try again.',
                ], 500);
            }
            return null; // Let default handler show details in dev
        });

        // Catch-all: never return HTML in production API
        $this->renderable(function (Throwable $e) {
            if (request()->is('api/*') || request()->wantsJson()) {
                $status = $e instanceof HttpException ? $e->getStatusCode() : 500;
                $message = app()->environment('production')
                    ? 'An unexpected error occurred.'
                    : $e->getMessage();

                if ($status === 500) {
                    report($e);
                }

                return response()->json([
                    'success' => false,
                    'error' => 'Server error',
                    'message' => $message,
                ], $status);
            }
        });
    }
}
