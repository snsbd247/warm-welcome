<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Scheduled tasks
Schedule::command('bills:generate')->monthlyOn(1, '00:00');
Schedule::command('customers:auto-suspend --days=7')->dailyAt('02:00');
Schedule::command('sessions:cleanup')->hourly();
