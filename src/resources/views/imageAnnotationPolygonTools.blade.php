<control-button v-if="crossOrigin" icon="fa-hat-wizard" title="The magic SAM tool is not available for remote images without cross-origin resource sharing" :disabled="true"></control-button>
<control-button v-else v-cloak icon="fa-hat-wizard" title="Draw a polygon using the magic SAM tool 𝗭" :active="isMagicSamming" v-on:click="toggleMagicSam"></control-button>

@push('scripts')
<script src="{{ cachebust_asset('vendor/magic-sam/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('magic-sam.onnx-url', '{{cachebust_asset('vendor/magic-sam/'.config('magic_sam.onnx_file'))}}');
</script>
@endpush
