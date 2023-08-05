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
let loadingImageId;

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
        magicSamButtonTitle() {
            if (this.loadingMagicSamTakesLong) {
                return 'Preparing the magic for this image';
            }

            return 'Draw a polygon using the magic SAM tool 𝗭';
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
                    this.initMagicSamInteraction();
                }
                this.interactionMode = 'magicSam';
            }
        },
        handleSamEmbeddingRequestSuccess(response) {
            if (this.image.id !== loadingImageId) {
                return;
            }

            if (response.body.url !== null) {
                this.handleSamEmbeddingAvailable(response.body);
            } else {
                // Wait for the Websockets event.
                this.loadingMagicSamTakesLong = true;
            }
        },
        handleSamEmbeddingRequestFailure(response) {
            this.resetInteractionMode();
            this.finishLoadingMagicSam();
            handleErrorResponse(response);
        },
        handleSamEmbeddingAvailable(event) {
            if (!this.loadingMagicSam) {
                return;
            }

            if (this.image.id !== loadingImageId) {
                return;
            }

            if (loadedImageId === this.image.id) {
                return;
            }

            loadedImageId = this.image.id;
            magicSamInteraction.updateEmbedding(this.image, event)
                .then(this.finishLoadingMagicSam)
                .then(() => {
                    // The user could have disabled the interaction while loading.
                    if (this.isMagicSamming) {
                        magicSamInteraction.setActive(true);
                    }
                });
        },
        handleSamEmbeddingFailed() {
            if (this.loadingMagicSam) {
                Messages.danger('Could not load the image embedding.');
                this.finishLoadingMagicSam();
                this.resetInteractionMode();
            }
        },
        initMagicSamInteraction() {
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
    watch: {
        image(image) {
            if (this.loadingMagicSam && loadingImageId !== image.id) {
                this.finishLoadingMagicSam();
                this.resetInteractionMode();
            }

            if (this.isMagicSamming) {
                this.resetInteractionMode();
            }
        },
        isMagicSamming(active) {
            if (!active) {
                magicSamInteraction.setActive(false);
                return;
            }

            if (!this.hasSelectedLabel) {
                this.requireSelectedLabel();
                return;
            }

            if (loadedImageId === this.image.id) {
                magicSamInteraction.setActive(true);
                return;
            }

            if (this.loadingMagicSam) {
                return;
            }

            loadingImageId = this.image.id;
            this.startLoadingMagicSam();
            // request the image embedding from torchserve using fetch api
            fetch("http://localhost:8080/predictions/SAM/1.0", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    img_id: this.image.id,
                }),
            })
            .then((response) => {
                // Check if the response status is successful
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                // Parse the JSON response
                return response.json();
            })
            .then(this.handleSamEmbeddingAvailable)
            .catch(this.handleSamEmbeddingRequestFailure)
        },
        canAdd: {
            handler(canAdd) {
                if (canAdd) {
                    Keyboard.on('z', this.toggleMagicSam, 0, this.listenerSet);
                } else {
                    Keyboard.off('z', this.toggleMagicSam, 0, this.listenerSet);
                }
            },
            immediate: true,
        },
    },
};
</script>
