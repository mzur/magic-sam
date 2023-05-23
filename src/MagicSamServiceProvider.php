<?php

namespace Biigle\Modules\MagicSam;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class MagicSamServiceProvider extends ServiceProvider
{

   /**
   * Bootstrap the application events.
   *
   * @param Modules $modules
   * @param  Router  $router
   * @return  void
   */
    public function boot(Modules $modules, Router $router)
    {
        $this->loadViewsFrom(__DIR__.'/resources/views', 'magic-sam');

        $router->group([
            'namespace' => 'Biigle\Modules\MagicSam\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->register('magic-sam', [
            'viewMixins' => [
                //
            ],
            'controllerMixins' => [
                //
            ],
            'apidoc' => [
               //__DIR__.'/Http/Controllers/Api/',
            ],
        ]);

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/magic-sam'),
        ], 'public');
    }

    /**
    * Register the service provider.
    *
    * @return  void
    */
    public function register()
    {
        //
    }
}
