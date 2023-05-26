# BIIGLE Magic SAM Module

[![Test status](https://github.com/biigle/magic-sam/workflows/Tests/badge.svg)](https://github.com/biigle/magic-sam/actions?query=workflow%3ATests)

This is a BIIGLE module that offers the Magic SAM image annotation instrument.

## Installation

1. Run `composer require biigle/magic-sam`.
2. Run `php artisan vendor:publish --tag=public` to refresh the public assets of the modules. Do this for every update of this module.
3. Configure a storage disk for the image embedding files. Set the `MAGIC_SAM_EMBEDDING_STORAGE_DISK` variable in the `.env` file to the name of the respective storage disk. The content of the storage disk should be publicly accessible. Example for local disks:
    ```php
    'magic-sam' => [
        'driver' => 'local',
        'root' => storage_path('app/public/magic-sam'),
        'url' => env('APP_URL').'/storage/magic-sam',
        'visibility' => 'public',
    ],
    ```
    This requires the link `storage -> ../storage/app/public` in the `public` directory.

## Configuration

Image embeddings are computed in jobs submitted to the `default` on the CPU. They require a queue worker Docker container that satisfies the Python [requirements](requirements.txt) of this repository. Embeddings can be computed much faster on a GPU. You can cnfigure the queue name with the `MAGIC_SAM_REQUEST_QUEUE` and the device (`cpu` or `cuda`) with the `MAGIC_SAM_DEVICE` environment variables.

Image embedding files are automatically deleted after 30 days. You can configure this with the `MAGIC_SAM_PRUNE_AGE_DAYS` environment variable.

## References

Reference publications that you should cite if you use Magic SAM for one of your studies.

- **BIIGLE 2.0**
    [Langenkämper, D., Zurowietz, M., Schoening, T., & Nattkemper, T. W. (2017). Biigle 2.0-browsing and annotating large marine image collections.](https://doi.org/10.3389/fmars.2017.00083)
    Frontiers in Marine Science, 4, 83. doi: `10.3389/fmars.2017.00083`

- **Segment Anything**
    [Kirillov, A., Mintun, E., Ravi, N., Mao, H., Rolland, C., Gustafson, L., Xiao, T., Whitehead, S., Berg, A.C., Lo, W.Y. and Dollár, P., (2023). Segment anything.](https://doi.org/10.48550/arXiv.2304.02643)
    arXiv preprint arXiv:2304.02643. doi: `10.48550/arXiv.2304.02643`

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
