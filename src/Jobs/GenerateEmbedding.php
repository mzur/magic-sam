<?php

namespace Biigle\Modules\MagicSam\Jobs;

use Biigle\Image;
use Biigle\Modules\MagicSam\Events\EmbeddingAvailable;
use Biigle\Modules\MagicSam\Events\EmbeddingFailed;
use Biigle\User;
use Exception;
use FileCache;
use Illuminate\Bus\Queueable;
use Illuminate\Http\File as HttpFile;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class GenerateEmbedding
{
    use SerializesModels, Queueable;

    /**
     * The image to generate an embedding of.
     *
     * @var Image
     */
    public $image;

    /**
     * The user who initiated the job.
     *
     * @var User
     */
    public $user;

    /**
     * Ignore this job if the image or user does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new instance.
     *
     * @param Image $image
     * @param User $user
     */
    public function __construct(Image $image, User $user)
    {
        $this->image = $image;
        $this->user = $user;
    }

    /**
      * Handle the job.
      *
      * @return void
      */
    public function handle()
    {
        $filename = "{$this->image->id}.npy";
        $outputPath = sys_get_temp_dir()."/{$filename}";
        $disk = Storage::disk(config('magic_sam.embedding_storage_disk'));
        try {
            if (!$disk->exists($filename)) {
                try {
                    $this->generateEmbedding($outputPath);
                    $disk->putFileAs('', new HttpFile($outputPath), $filename);
                } finally {
                    File::delete($outputPath);
                }
            }

            EmbeddingAvailable::dispatch($filename, $this->user);
        } catch (Exception $e) {
            EmbeddingFailed::dispatch($this->user);
        }
    }

    /**
     * Generate the embedding.
     *
     * @param string $outputPath
     */
    protected function generateEmbedding($outputPath)
    {
        FileCache::getOnce($this->image, function ($file, $path) use ($outputPath) {
            $checkpointUrl = config('magic_sam.model_url');
            $checkpointPath = config('magic_sam.model_path');
            $this->maybeDownloadCheckpoint($checkpointUrl, $checkpointPath);
            $modelType = config('magic_sam.model_type');
            $device = config('magic_sam.device');
            $script = config('magic_sam.compute_embedding_script');

            $this->python("{$script} '{$checkpointPath}' '{$modelType}' '{$device}' '{$path}' '{$outputPath}'");
        });
    }

    /**
     * Downloads the model checkpoint if they weren't downloaded yet.
     *
     * @param string $from
     * @param string $to
     */
    protected function maybeDownloadCheckpoint($from, $to)
    {
        if (!File::exists($to)) {
            if (!File::exists(dirname($to))) {
                File::makeDirectory(dirname($to), 0700, true, true);
            }
            $success = @copy($from, $to);

            if (!$success) {
                throw new Exception("Failed to download checkpoint from '{$from}'.");
            }
        }
    }

    /**
     * Execute a Python command.
     *
     * @param string $command
     * @throws Exception On a non-zero exit code.
     *
     * @return string
     */
    protected function python($command)
    {
        $code = 0;
        $lines = [];
        $python = config('magic_sam.python');
        exec("{$python} -u {$command} 2>&1", $lines, $code);

        if ($code !== 0) {
            $lines = implode("\n", $lines);
            throw new Exception("Error while executing python command '{$command}':\n{$lines}", $code);
        }
    }
}
