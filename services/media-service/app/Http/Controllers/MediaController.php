<?php

namespace App\Http\Controllers;

use App\Events\MediaUploaded;
use App\Models\Media;
use App\Services\S3StorageService;
use App\Services\VirusScannerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kobliat\Shared\Events\EventBus;

class MediaController extends Controller
{
    private S3StorageService $storage;

    private VirusScannerService $scanner;

    private EventBus $eventBus;

    public function __construct(
        S3StorageService $storage,
        VirusScannerService $scanner,
        EventBus $eventBus
    ) {
        $this->storage = $storage;
        $this->scanner = $scanner;
        $this->eventBus = $eventBus;
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'owner_service' => 'required|string',
        ]);

        $file = $request->file('file');

        // 1. Scan for viruses
        if (! $this->scanner->isSafe($file)) {
            return response()->json(['error' => 'File rejected by virus scanner'], 400);
        }

        // 2. Upload to S3
        $path = $this->storage->store($file);

        // 3. Create Record
        $media = Media::create([
            'owner_service' => $request->input('owner_service'),
            'filename' => $file->getClientOriginalName(),
            'content_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'storage_key' => $path,
            'is_scanned' => true,
            'is_infected' => false,
        ]);

        // 4. Publish Event
        $this->eventBus->publishEvent(new MediaUploaded(
            $media->id,
            $media->filename,
            $media->content_type,
            $media->storage_key
        ));

        return response()->json($media, 201);
    }

    public function show(string $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        return response()->json($media);
    }

    public function download(string $id): JsonResponse
    {
        $media = Media::findOrFail($id);
        $url = $this->storage->getPresignedUrl($media->storage_key);

        return response()->json([
            'download_url' => $url,
            'expires_in_seconds' => 3600,
        ]);
    }
}
