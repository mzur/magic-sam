<?php

namespace Biigle\Modules\MagicSam\Http\Controllers;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Image;
use Biigle\Modules\MagicSam\Jobs\GenerateEmbedding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Queue;

class ImageEmbeddingController extends Controller
{
    /**
     * Request a SAM image embedding.
     *
     * @api {post} images/:id/sam-embedding Request SAM embedding
     * @apiGroup Images
     * @apiName StoreSamEmbedding
     * @apiPermission projectMember
     * @apiDescription This will generate a SAM embedding for the image and propagate the download URL to the user's Websockets channel.
     *
     * @apiParam {Number} id The image ID.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);

        Queue::pushOn(config('magic_sam.request_queue'), new GenerateEmbedding($image, $request->user()));
    }
}
