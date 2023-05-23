<?php

namespace Biigle\Tests\Modules\MagicSam\Jobs;

use Biigle\Image;
use Biigle\Modules\MagicSam\Events\EmbeddingAvailable;
use Biigle\Modules\MagicSam\Events\EmbeddingFailed;
use Biigle\Modules\MagicSam\Jobs\GenerateEmbedding;
use Biigle\User;
use Exception;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use TestCase;

class GenerateEmbeddingTest extends TestCase
{
    public function testHandle()
    {
        Event::fake();
        $disk = Storage::fake('test');
        config(['magic_sam.embedding_storage_disk' => 'test']);

        $image = Image::factory()->create();
        $disk->put('files/test-image.jpg', 'abc');
        $user = User::factory()->create();
        $outputFile = sys_get_temp_dir()."/{$image->id}.npy";
        $job = new GenerateEmbeddingStub($image, $user);

        try {
            File::put($outputFile, 'abc');
            $job->handle();
            $disk->assertExists("{$image->id}.npy");
        } finally {
            File::delete($outputFile);
        }

        $this->assertTrue($job->pythonCalled);
        Event::assertDispatched(function (EmbeddingAvailable $event) use ($user, $image) {
            $this->assertEquals($user->id, $event->user->id);
            $this->assertEquals("{$image->id}.npy", $event->filename);

            return true;
        });
    }

    public function testHandleExists()
    {
        Event::fake();
        $disk = Storage::fake('test');
        config(['magic_sam.embedding_storage_disk' => 'test']);

        $image = Image::factory()->create();
        $disk->put('files/test-image.jpg', 'abc');
        $disk->put("{$image->id}.npy", 'abc');
        $user = User::factory()->create();
        $job = new GenerateEmbeddingStub($image, $user);

        $job->handle();
        $this->assertFalse($job->pythonCalled);

        Event::assertDispatched(function (EmbeddingAvailable $event) use ($user, $image) {
            $this->assertEquals($user->id, $event->user->id);
            $this->assertEquals("{$image->id}.npy", $event->filename);

            return true;
        });
    }

    public function testHandleException()
    {
        Event::fake();
        $disk = Storage::fake('test');
        config(['magic_sam.embedding_storage_disk' => 'test']);

        $image = Image::factory()->create();
        $disk->put('files/test-image.jpg', 'abc');
        $user = User::factory()->create();
        $job = new GenerateEmbeddingStub($image, $user);
        $job->throw = true;

        try {
            $job->handle();
            $this->fail('Expected an exception');
        } catch (Exception $e) {
            //
        }

        Event::assertDispatched(function (EmbeddingFailed $event) use ($user) {
            $this->assertEquals($user->id, $event->user->id);

            return true;
        });
    }
}

class GenerateEmbeddingStub extends GenerateEmbedding
{
    public $pythonCalled = false;
    public $throw = false;

    protected function python($command)
    {
        $this->pythonCalled = true;
        if ($this->throw) {
            throw new Exception;
        }
    }

    protected function maybeDownloadCheckpoint($from, $to)
    {
        //
    }
}
