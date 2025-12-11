<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Media;
use App\Services\S3StorageService;
use App\Services\VirusScannerService;
use Kobliat\Shared\Events\EventBus;
use Mockery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $mockBus = Mockery::mock(EventBus::class);
        $mockBus->shouldReceive('publishEvent')->byDefault();
        $this->app->instance(EventBus::class, $mockBus);

        $mockScanner = Mockery::mock(VirusScannerService::class);
        $mockScanner->shouldReceive('isSafe')->andReturn(true);
        $this->app->instance(VirusScannerService::class, $mockScanner);

        $mockStorage = Mockery::mock(S3StorageService::class);
        $mockStorage->shouldReceive('store')->andReturn('uploads/test.jpg');
        $this->app->instance(S3StorageService::class, $mockStorage);
    }

    public function test_can_upload_media()
    {
        Storage::fake('s3');
        $file = UploadedFile::fake()->image('test.jpg');

        $response = $this->postJson('/api/media', [
            'file' => $file,
            'owner_service' => 'messaging-service'
        ]);

        $response->assertStatus(201)
            ->assertJson(['filename' => 'test.jpg']);

        $this->assertDatabaseHas('media', [
            'filename' => 'test.jpg',
            'storage_key' => 'uploads/test.jpg'
        ]);
    }
}
