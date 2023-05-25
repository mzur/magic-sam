<script>
import ImageEmbeddingApi from './api/image';
import MagicSamInteraction from './ol/MagicSamInteraction';
import {Echo} from './import';
import {handleErrorResponse} from './import';
import {Keyboard} from './import';
import {Messages} from './import';
import {Styles} from './import';

let magicSamInteraction;
let loadedImageId;

/**
 * Mixin for the annotationCanvas component that contains logic for the Magic Sam interaction.
 *
 * @type {Object}
 */
export default {
    data: function () {
        return {
            loadingMagicSam: false,
            loadingMagicSamTakesLong: false,
        };
    },
    computed: {
        isMagicSamming() {
            return this.interactionMode === 'magicSam';
        },
        magicSamButtonClass() {
            return this.loadingMagicSamTakesLong ? 'loading-magic-sam-long' : '';
        },
    },
    methods: {
        startLoadingMagicSam() {
            this.loadingMagicSam = true;
        },
        finishLoadingMagicSam() {
            this.loadingMagicSam = false;
            this.loadingMagicSamTakesLong = false;
        },
        toggleMagicSam() {
            if (this.isMagicSamming) {
                this.resetInteractionMode();
            } else if (this.canAdd && !this.image.tiled) {
                if (!magicSamInteraction) {
                    this.initSamInteraction();
                }
                this.interactionMode = 'magicSam';
            }
        },
        toggleMagicSamInteraction(active) {
            if (!active) {
                magicSamInteraction.setActive(false);
            } else if (this.hasSelectedLabel) {
                // TODO handle repeated clicks and switching of images while loading
                if (loadedImageId === this.image.id) {
                    magicSamInteraction.setActive(true);
                } else {
                    this.startLoadingMagicSam();
                    ImageEmbeddingApi.save({id: this.image.id}, {})
                        .then((response) => {
                            if (response.body.url !== null) {
                                this.handleSamEmbeddingAvailable(response.body);
                            } else {
                                this.loadingMagicSamTakesLong = true;
                            }
                        }, (response) => {
                            this.resetInteractionMode();
                            this.finishLoadingMagicSam();
                            handleErrorResponse(response);
                        });
                }
            } else {
                this.requireSelectedLabel();
            }
        },
        handleSamEmbeddingAvailable(event) {
            if (this.loadingMagicSam) {
                loadedImageId = this.image.id;
                magicSamInteraction.once('warmup', this.finishLoadingMagicSam);
                magicSamInteraction.updateEmbedding(this.image, event.url)
                    .then(() => magicSamInteraction.setActive(true));
            }
        },
        handleSamEmbeddingFailed() {
            Messages.warning('Could not load the image embedding.');
            this.finishLoadingMagicSam();
            this.resetInteractionMode();
        },
        initSamInteraction() {
            magicSamInteraction = new MagicSamInteraction({
                map: this.map,
                source: this.annotationSource,
                style: Styles.editing,
                indicatorPointStyle: Styles.editing,
                indicatorCrossStyle: Styles.cross,
                onnxUrl: biigle.$require('magic-sam.onnx-url'),
                simplifyTolerant: 0.1,
            });
            magicSamInteraction.on('drawend', this.handleNewFeature);
            magicSamInteraction.setActive(false);
            this.map.addInteraction(magicSamInteraction);
        },
    },
    created() {
        if (this.canAdd) {
            Keyboard.on('z', this.toggleMagicSam, 0, this.listenerSet);
            // this.$watch('image', this.maybeUpdateMagicSamSnapshot);
            // this.$watch('image', this.maybeSetMagicSamLayer);
            this.$watch('isMagicSamming', this.toggleMagicSamInteraction);

            Echo.getInstance().private(`user-${this.userId}`)
                .listen('.Biigle\\Modules\\MagicSam\\Events\\EmbeddingAvailable', this.handleSamEmbeddingAvailable)
                .listen('.Biigle\\Modules\\MagicSam\\Events\\EmbeddingFailed', this.handleSamEmbeddingFailed);
        }
    },
};
</script>
