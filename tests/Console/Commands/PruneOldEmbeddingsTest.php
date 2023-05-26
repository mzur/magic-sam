<?php

namespace Biigle\Tests\Modules\MagicSam\Console\Commands;

use Illuminate\Support\Facades\Storage;
use TestCase;

class PruneOldEmbeddingsTest extends TestCase
{
    public function testHandle()
    {
        config(['magic_sam.embedding_storage_disk' => 'test']);
        config(['magic_sam.prune_age_days' => 1]);
        $disk = Storage::fake('test');
        $root = $disk->getConfig()['root'];

        $disk->put('1.npy', 'abc');
        $disk->put('2.npy', 'abc');

        // Timestamp is 2 days ago.
        touch("{$root}/1.npy", time() - 172800);

        $this->artisan('magic-sam:prune-embeddings')->assertExitCode(0);

        $disk->assertMissing('1.npy');
        $disk->assertExists('2.npy');
    }
}
