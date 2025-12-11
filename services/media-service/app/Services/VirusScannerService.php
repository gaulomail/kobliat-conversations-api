<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class VirusScannerService
{
    /**
     * Scan file for viruses.
     * Returns true if safe, false if infected.
     */
    public function isSafe(UploadedFile $file): bool
    {
        // Mock implementation for development
        // In production, integrate with ClamAV via calmav-php/clamav-validator
        
        // Simulating scan
        $path = $file->getPathname();
        Log::info("Scanning file: {$path}");
        
        // return false if filename contains 'eicar';
        if (str_contains($file->getClientOriginalName(), 'eicar')) {
            Log::warning("Virus detected in file: {$file->getClientOriginalName()}");
            return false;
        }

        return true;
    }
}
