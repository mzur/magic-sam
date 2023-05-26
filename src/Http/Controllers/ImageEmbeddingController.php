<?php

namespace Biigle\Modules\MagicSam\Http\Controllers;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Image;
use Biigle\Modules\MagicSam\Jobs\GenerateEmbedding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

class ImageEmbeddingController extends Controller
{
    /**
     * Request a SAM image embedding.
     *
     * @api {post} images/:id/sam-embedding Request SAM embedding
     * @apiGroup Images
     * @apiName StoreSamEmbedding
     * @apiPermission projectMember
     * @apiDescription This will generate a SAM embedding for the image and propagate the download URL to the user's Websockets channel. If an embedding already exists, it returns the download URL directly.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "url": "https://example.com/storage/1.npy"
     * }
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        $disk = Storage::disk(config('magic_sam.embedding_storage_disk'));
        $filename = "{$image->id}.npy";
        $url = null;
        if ($disk->exists($filename)) {
            if ($disk->providesTemporaryUrls()) {
                $url = $disk->temporaryUrl($filename, now()->addHour());
            } else {
                $url = $disk->url($filename);
            }
        } else {
            Queue::connection(config('magic_sam.request_connection'))
                ->pushOn(
                    config('magic_sam.request_queue'),
                    new GenerateEmbedding($image, $request->user())
                );
        }

        return ['url' => $url];
    }
}
