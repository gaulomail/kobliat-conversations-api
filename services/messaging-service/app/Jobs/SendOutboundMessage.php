<?php

namespace App\Jobs;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendOutboundMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array
     */
    public $backoff = [10, 30, 60]; // 10s, 30s, 60s

    /**
     * The message to send.
     *
     * @var Message
     */
    protected Message $message;

    /**
     * Create a new job instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Attempting to send outbound message", [
            'message_id' => $this->message->id,
            'attempt' => $this->attempts(),
        ]);

        try {
            // Determine the channel and send accordingly
            $success = match ($this->message->channel) {
                'whatsapp' => $this->sendWhatsApp(),
                'sms' => $this->sendSMS(),
                'email' => $this->sendEmail(),
                default => $this->sendGeneric(),
            };

            if ($success) {
                // Update message status
                $this->message->update([
                    'is_processed' => true,
                    'sent_at' => now(),
                ]);

                Log::info("Successfully sent outbound message", [
                    'message_id' => $this->message->id,
                ]);
            } else {
                throw new \Exception("Failed to send message via {$this->message->channel}");
            }
        } catch (\Exception $e) {
            Log::error("Error sending outbound message", [
                'message_id' => $this->message->id,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            // If we've exhausted all retries, mark as failed
            if ($this->attempts() >= $this->tries) {
                $this->message->update([
                    'is_processed' => false,
                    'metadata' => array_merge($this->message->metadata ?? [], [
                        'failed_at' => now()->toIso8601String(),
                        'failure_reason' => $e->getMessage(),
                        'attempts' => $this->attempts(),
                    ]),
                ]);

                Log::error("Outbound message failed after {$this->tries} attempts", [
                    'message_id' => $this->message->id,
                ]);
            }

            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Send via WhatsApp
     */
    protected function sendWhatsApp(): bool
    {
        // TODO: Implement actual WhatsApp API integration
        // For now, simulate with a webhook or external service call
        
        $response = Http::timeout(10)->post(env('WHATSAPP_API_URL', 'http://localhost:9000/whatsapp/send'), [
            'to' => $this->message->metadata['recipient'] ?? null,
            'message' => $this->message->body,
            'message_id' => $this->message->id,
        ]);

        return $response->successful();
    }

    /**
     * Send via SMS
     */
    protected function sendSMS(): bool
    {
        // TODO: Implement SMS provider integration (Twilio, etc.)
        
        $response = Http::timeout(10)->post(env('SMS_API_URL', 'http://localhost:9000/sms/send'), [
            'to' => $this->message->metadata['phone'] ?? null,
            'message' => $this->message->body,
            'message_id' => $this->message->id,
        ]);

        return $response->successful();
    }

    /**
     * Send via Email
     */
    protected function sendEmail(): bool
    {
        // TODO: Implement email sending
        
        return true;
    }

    /**
     * Generic send method
     */
    protected function sendGeneric(): bool
    {
        Log::warning("Using generic send method for channel: {$this->message->channel}");
        
        // Simulate sending
        return true;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Outbound message job permanently failed", [
            'message_id' => $this->message->id,
            'error' => $exception->getMessage(),
        ]);

        // Update message to mark as permanently failed
        $this->message->update([
            'is_processed' => false,
            'metadata' => array_merge($this->message->metadata ?? [], [
                'permanently_failed_at' => now()->toIso8601String(),
                'failure_reason' => $exception->getMessage(),
            ]),
        ]);
    }
}
