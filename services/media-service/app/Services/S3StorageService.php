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
        $disk = env('FILESYSTEM_DISK', 'public');
        // For MinIO compatibility, ensure visibility is correct if using public buckets
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $key = $file->storeAs($path, $filename, $disk);

        return $key;
    }

    /**
     * Get temporary download URL
     */
    public function getPresignedUrl(string $key, int $minutes = 60): string
    {
        $disk = env('FILESYSTEM_DISK', 'public');
        if ($disk === 'local' || $disk === 'public') {
            return Storage::disk($disk)->url($key);
        }
        return Storage::disk($disk)->temporaryUrl($key, now()->addMinutes($minutes));
    }

    /**
     * Delete file
     */
    public function delete(string $key): bool
    {
        $disk = env('FILESYSTEM_DISK', 'public');
        return Storage::disk($disk)->delete($key);
    }
}
