<script>
import ImageEmbeddingApi from './api/image';
import MagicSamInteraction from './ol/MagicSamInteraction';
import {Echo} from './import';
import {Keyboard} from './import';
import {Styles} from './import';

let magicSamInteraction;
let currentImageUrl;
let currentImageUrlId;

/**
 * Mixin for the annotationCanvas component that contains logic for the Magic Sam interaction.
 *
 * @type {Object}
 */
export default {
    data: function () {
        return {
            loadingMagicSamEmbedding: false,
        };
    },
    computed: {
        crossOrigin() {
            return this.image && this.image.crossOrigin;
        },
        isMagicSamming() {
            return this.interactionMode === 'magicSam' && !this.crossOrigin;
        },
    },
    methods: {
        toggleMagicSam() {
            if (this.isMagicSamming) {
                this.resetInteractionMode();
            } else if (this.canAdd) {
                if (!magicSamInteraction) {
                    this.initSamInteraction();
                }
                this.interactionMode = 'magicSam';
            }
        },
        // maybeUpdateMagicSamSnapshot(image) {
        //     // The magic sam interaction is unable to detect any change if the
        //     // image is switched. So if the interaction is currently active we
        //     // have to update it manually here.
        //     if (image && !image.tiled && this.isMagicSamming) {
        //         magicSamInteraction.updateSnapshot();
        //     }
        // },
        // maybeSetMagicSamLayer(image, oldImage) {
        //     // Swap source layers for the magic sam interaction if image types
        //     // change.
        //     if (image && !this.crossOrigin) {
        //         if (image.tiled === true) {
        //             if (!oldImage || oldImage.tiled !== true) {
        //                 magicSamInteraction.setLayer(this.tiledImageLayer);
        //             }
        //         } else {
        //             if (!oldImage || oldImage.tiled === true) {
        //                 magicSamInteraction.setLayer(this.imageLayer);
        //             }
        //         }
        //     }
        // },
        toggleMagicSamInteraction(isMagicSamming) {
            if (!isMagicSamming) {
                magicSamInteraction.setActive(false);
            } else if (this.hasSelectedLabel) {
                // TODO handle repeated clicks and switching of images while loading
                if (currentImageUrlId === this.image.id) {
                    magicSamInteraction.setActive(true);
                } else {
                    this.loadingMagicSamEmbedding = true;
                    ImageEmbeddingApi.save({id: this.image.id}, {});
                }
            } else {
                this.requireSelectedLabel();
            }
        },
        handleSamEmbeddingAvailable(event) {
            if (this.loadingMagicSamEmbedding) {
                currentImageUrl = event.url;
                currentImageUrlId = this.image.id;
                magicSamInteraction.updateEmbedding(this.image, event.url)
                    .then(() => magicSamInteraction.setActive(true))
                    .then(() => this.loadingMagicSamEmbedding = false);
            }
        },
        handleSamEmbeddingFailed() {
            //
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
