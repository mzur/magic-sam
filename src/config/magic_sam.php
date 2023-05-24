<?php

return [
    /*
    | Storage disk where the SAM embeddings of images are stored.
    */
    'embedding_storage_disk' => env('MAGIC_SAM_EMBEDDING_STORAGE_DISK'),

    /*
    | Queue to submit jobs to compute embeddings to.
    */
    'request_queue' => env('MAGIC_SAM_REQUEST_QUEUE', 'default'),

    /*
    | Path to the Python executable.
    */
    'python' => env('MAGIC_SAM_PYTHON', '/usr/bin/python3'),

    /*
    | Path to the compute embedding script.
    */
    'compute_embedding_script' => __DIR__.'/../resources/scripts/compute_embedding.py',

    /*
    | The device to compute the SAM embedding on.
    |
    | Devices: cpu, gpu
    */
    'device' => env('MAGIC_SAM_DEVICE', 'gpu'),

    /*
    | URL from which to download the model checkpoint.
    |
    | See: https://github.com/facebookresearch/segment-anything#model-checkpoints
    */
    'model_url' => env('MAGIC_SAM_MODEL_URL', 'https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth'),

    /*
    | The SAM model type.
    |
    | See: https://github.com/facebookresearch/segment-anything#model-checkpoints
    */
    'model_type' => env('MAGIC_SAM_MODEL_TYPE', 'vit_h'),

    /*
    | Path to store the model checkpoint to.
    */
    'model_path' => storage_path('magic_sam').'/sam_checkpoint.pth',

    /*
     | Specifies which queue should be used for the broadcast events.
     */
    'broadcast_queue' => env('MAGIC_SAM_BORADCAST_QUEUE', 'default'),

];
