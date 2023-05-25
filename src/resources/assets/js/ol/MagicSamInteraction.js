import Feature from '@biigle/ol/Feature';
import MagicWand from 'magic-wand-tool';
import PointerInteraction from '@biigle/ol/interaction/Pointer';
import Polygon from '@biigle/ol/geom/Polygon';
import VectorLayer from '@biigle/ol/layer/Vector';
import VectorSource from '@biigle/ol/source/Vector';
import {InferenceSession, Tensor} from "onnxruntime-web";
import npyjs from "npyjs";

const LONG_SIDE_LENGTH = 1024;

/**
 * Control for drawing polygons using the Segment Anything Model (SAM).
 */
class MagicSamInteraction extends PointerInteraction {
    constructor(options) {
        super(options);
        this.on('change:active', this.toggleActive);

        // The image layer to use as source for the magic wand tool.
        this.layer = options.layer;

        // Value to adjust simplification of the sketch polygon. Higher values result in
        // less vertices of the polygon. Set to 0 to disable simplification.
        this.simplifyTolerant = options.simplifyTolerant === undefined ? 0 :
            options.simplifyTolerant;
        // Minimum number of required vertices for the simplified polygon.
        this.simplifyCount = options.simplifyCount === undefined ? 3 :
            options.simplifyCount;

        this.map = options.map;

        this.sketchFeature = null;
        this.sketchSource = options.source;

        if (this.sketchSource === undefined) {
            this.sketchSource = new VectorSource();
            this.map.addLayer(new VectorLayer({
                source: this.sketchSource,
                zIndex: 200,
            }));
        }

        this.sketchStyle = options.style === undefined ? null : options.style;

        this.model = null;
        this.embedding = null;
        this.imageSizeTensor = null;
        this.samSizeTensor = null;
        this.imageSamScale = null;

        // wasm needs to be present in the assets folder.
        InferenceSession.create(options.onnxUrl, {executionProviders: ['wasm']})
            .then(response => this.model = response);
    }

    updateEmbedding(image, url) {
        this.imageSizeTensor = new Tensor("float32", [image.height, image.width]);
        this.imageSamScale = LONG_SIDE_LENGTH / Math.max(image.height, image.width);
        this.samSizeTensor = new Tensor("float32", [
            Math.round(image.height * this.imageSamScale),
            Math.round(image.width * this.imageSamScale),
        ]);

        let npy = new npyjs();

        return npy.load(url)
            .then((npArray) => {
                this.embedding = new Tensor("float32", npArray.data, npArray.shape);
            });
    }

    /**
     * Finish drawing of a sketch.
     */
    handleUpEvent() {
        if (this.sketchFeature) {
            this.dispatchEvent({type: 'drawend', feature: this.sketchFeature});
        }

        return true;
    }

    /**
     * Start drawing of a sketch.
     */
    handleDownEvent(e) {
        return true;
    }

    /**
     * Update the target point.
     */
    handleMoveEvent(e) {
        let pointCoords = new Float32Array(4);
        let pointLabels = new Float32Array(2);
        let [height, ] = this.imageSizeTensor.data;
        let [samHeight, samWidth] = this.samSizeTensor.data;

        pointCoords[0] = e.coordinate[0] * this.imageSamScale;                // x
        pointCoords[1] = (height - e.coordinate[1]) * this.imageSamScale;     // y
        pointLabels[0] = 1;

        // Add in the extra point/label when only clicks and no box
        // The extra point is at (0, 0) with label -1
        pointCoords[2] = 0.0;
        pointCoords[3] = 0.0;
        pointLabels[1] = -1.0;

        // Create the tensor
        let pointCoordsTensor = new Tensor("float32", pointCoords, [1, 2, 2]);
        let pointLabelsTensor = new Tensor("float32", pointLabels, [1, 2]);

        // There is no previous mask, so default to 0
        const maskInput = new Tensor(
            "float32",
            new Float32Array(256 * 256),
            [1, 1, 256, 256]
        );
        const hasMaskInput = new Tensor("float32", [0]);

        const feeds = {
            image_embeddings: this.embedding,
            point_coords: pointCoordsTensor,
            point_labels: pointLabelsTensor,
            // Compute the mask on the downscaled size to make inference and tracing
            // faster. We scale the tracing result to the original size later.
            orig_im_size: this.samSizeTensor,
            mask_input: maskInput,
            has_mask_input: hasMaskInput,
        }

        this.model.run(feeds).then((results) => {
            const output = results[this.model.outputNames[0]];

            const thresholdedOutput = output.data.map(pixel => pixel > 0 ? 1 : 0);

            let imageData = {
                data: new Uint8Array(thresholdedOutput),
                width: samWidth,
                height: samHeight,
                bounds: {
                    minX: 0,
                    maxX: samWidth,
                    minY: 0,
                    maxY: samHeight
                },
            };

            let contour = MagicWand.traceContours(imageData)
                .filter(function (c) {
                    return !c.innner;
                })
                .shift();

            if (contour) {
                if (this.simplifyTolerant > 0) {
                    contour = MagicWand.simplifyContours([contour], this.simplifyTolerant, this.simplifyCount).shift();
                }
            }

            let points = contour.points.map(point => [point.x, point.y])
                // Scale up to original size.
                .map(([x, y]) => [x / this.imageSamScale, y / this.imageSamScale])
                // Invert y axis for OpenLayers coordinates.
                .map(([x, y]) => [x, height - y]);

            if (this.sketchFeature) {
                this.sketchFeature.getGeometry().setCoordinates([points]);
            } else {
                this.sketchFeature = new Feature(new Polygon([points]));
                if (this.sketchStyle) {
                    this.sketchFeature.setStyle(this.sketchStyle);
                }
                this.sketchSource.addFeature(this.sketchFeature);

            }
        });
    }

    /**
     * Update event listeners depending on the active state of the interaction.
     */
    toggleActive() {
        if (!this.getActive() && this.sketchFeature) {
            this.sketchSource.removeFeature(this.sketchFeature);
            this.sketchFeature = null;
        }
    }

    /**
     * Update the layer to get the image information from.
     */
    setLayer(layer) {
        this.layer = layer;
    }

}

export default MagicSamInteraction;
