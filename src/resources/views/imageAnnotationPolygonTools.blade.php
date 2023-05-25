<control-button v-if="image?.tiled" icon="fa-hat-wizard" title="The magic SAM tool is not available for very large images" :disabled="true"></control-button>
<control-button v-else v-cloak icon="fa-hat-wizard" title="Draw a polygon using the magic SAM tool 𝗭" :active="isMagicSamming" :loading="loadingMagicSam" :class="magicSamButtonClass" v-on:click="toggleMagicSam"></control-button>

@push('scripts')
<script src="{{ cachebust_asset('vendor/magic-sam/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('magic-sam.onnx-url', '{{cachebust_asset('vendor/magic-sam/'.config('magic_sam.onnx_file'))}}');
</script>
@endpush

@push('styles')
<link rel="stylesheet" type="text/css" href="{{ cachebust_asset('vendor/magic-sam/styles/main.css') }}">
@endpush
