<?php

namespace Biigle\Tests\Modules\MagicSam\Http\Controllers;

use ApiTestCase;
use Biigle\Image;
use Biigle\Modules\MagicSam\Jobs\GenerateEmbedding;
use Illuminate\Support\Facades\Queue;

class ImageEmbeddingControllerTest extends ApiTestCase
{
    public function testStore()
    {
        config(['magic_sam.request_queue' => 'gpu-quick']);
        Queue::fake();
        $image = Image::factory()->create(['volume_id' => $this->volume()->id]);

        $this->doTestApiRoute('POST', "/api/v1/images/{$image->id}/sam-embedding");

        $this->beGlobalGuest();
        $this->postJson("/api/v1/images/{$image->id}/sam-embedding")->assertStatus(403);

        $this->beUser();
        $this->postJson("/api/v1/images/{$image->id}/sam-embedding")->assertStatus(403);

        $this->beGuest();
        $this->postJson("/api/v1/images/{$image->id}/sam-embedding")->assertStatus(200);

        Queue::assertPushedOn('gpu-quick', function (GenerateEmbedding $job) use ($image) {
            $this->assertEquals($image->id, $job->image->id);
            $this->assertEquals($this->guest()->id, $job->user->id);

            return true;
        });
    }
}
