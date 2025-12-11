<?php

namespace Kobliat\Shared\Logging;

use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Monolog\Formatter\JsonFormatter;

class StructuredLogger
{
    private Logger $logger;
    private string $serviceName;

    public function __construct(string $serviceName, string $logLevel = 'info')
    {
        $this->serviceName = $serviceName;
        $this->logger = new Logger($serviceName);

        $handler = new StreamHandler('php://stdout', $this->getLogLevel($logLevel));
        $handler->setFormatter(new JsonFormatter());
        
        $this->logger->pushHandler($handler);
    }

    private function getLogLevel(string $level): int
    {
        return match (strtolower($level)) {
            'debug' => Logger::DEBUG,
            'info' => Logger::INFO,
            'notice' => Logger::NOTICE,
            'warning' => Logger::WARNING,
            'error' => Logger::ERROR,
            'critical' => Logger::CRITICAL,
            'alert' => Logger::ALERT,
            'emergency' => Logger::EMERGENCY,
            default => Logger::INFO,
        };
    }

    public function info(string $message, array $context = []): void
    {
        $this->logger->info($message, $this->enrichContext($context));
    }

    public function debug(string $message, array $context = []): void
    {
        $this->logger->debug($message, $this->enrichContext($context));
    }

    public function warning(string $message, array $context = []): void
    {
        $this->logger->warning($message, $this->enrichContext($context));
    }

    public function error(string $message, array $context = []): void
    {
        $this->logger->error($message, $this->enrichContext($context));
    }

    public function critical(string $message, array $context = []): void
    {
        $this->logger->critical($message, $this->enrichContext($context));
    }

    private function enrichContext(array $context): array
    {
        return array_merge([
            'service' => $this->serviceName,
            'environment' => env('APP_ENV', 'production'),
            'timestamp' => now()->toIso8601String(),
        ], $context);
    }
}
