<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class MediaUploaded extends DomainEvent
{
    public function __construct(string $mediaId, string $filename, string $contentType, string $storageKey)
    {
        parent::__construct(
            topic: 'media.uploaded',
            payload: [
                'media_id' => $mediaId,
                'filename' => $filename,
                'content_type' => $contentType,
                'storage_key' => $storageKey,
            ],
            sourceService: 'media-service'
        );
    }
}
