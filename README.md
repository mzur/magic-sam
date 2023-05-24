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

## Developing

Take a look at the [development guide](https://github.com/biigle/core/blob/master/DEVELOPING.md) of the core repository to get started with the development setup.

Want to develop a new module? Head over to the [biigle/module](https://github.com/biigle/module) template repository.

## Contributions and bug reports

Contributions to BIIGLE are always welcome. Check out the [contribution guide](https://github.com/biigle/core/blob/master/CONTRIBUTING.md) to get started.
