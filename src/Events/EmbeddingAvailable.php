<?php

namespace Biigle\Modules\MagicSam\Events;

use Biigle\Broadcasting\UserChannel;
use Biigle\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmbeddingAvailable implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The user that requested the embedding.
     *
     * @var User
     */
    public $user;

    /**
     * The embedding filename on the storage disk.
     *
     * @var string
     */
    public $filename;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue;

    /**
     * Ignore this job if the image or user does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new event instance.
     *
     * @param string $filename
     * @param User $user
     * @return void
     */
    public function __construct($filename, User $user)
    {
        $this->queue = config('magic_sam.broadcast_queue');
        $this->filename = $filename;
        $this->user = $user;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new UserChannel($this->user);
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        $url = Storage::disk(config('magic_sam.embedding_storage_disk'))
            ->temporaryUrl($this->filename, now()->addHour());

        return [
            'url' => $url,
        ];
    }
}
