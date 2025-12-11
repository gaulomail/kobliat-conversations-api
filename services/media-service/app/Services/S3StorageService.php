<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class S3StorageService
{
    /**
     * Store file in S3/MinIO
     */
    public function store(UploadedFile $file, string $path = 'uploads'): string
    {
        // For MinIO compatibility, ensure visibility is correct if using public buckets
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $key = $file->storeAs($path, $filename, 's3');

        return $key;
    }

    /**
     * Get temporary download URL
     */
    public function getPresignedUrl(string $key, int $minutes = 60): string
    {
        return Storage::disk('s3')->temporaryUrl($key, now()->addMinutes($minutes));
    }

    /**
     * Delete file
     */
    public function delete(string $key): bool
    {
        return Storage::disk('s3')->delete($key);
    }
}
