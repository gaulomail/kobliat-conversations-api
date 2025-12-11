<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kobliat\Shared\Events\EventBus;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(EventBus::class, function ($app) {
            return new EventBus([
                'brokers' => env('KAFKA_BROKER', 'localhost:9092'),
                'rest_proxy_url' => env('KAFKA_REST_PROXY_URL', 'http://localhost:8082'),
                'driver' => env('EVENT_BUS_DRIVER', 'kafka'),
            ], 'inbound-gateway');
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
