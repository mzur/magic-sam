import Feature from '@biigle/ol/Feature';
import MagicWand from 'magic-wand-tool';
import Point from '@biigle/ol/geom/Point';
import PointerInteraction from '@biigle/ol/interaction/Pointer';
import Polygon from '@biigle/ol/geom/Polygon';
import RegularShape from '@biigle/ol/style/RegularShape';
import Stroke from '@biigle/ol/style/Stroke';
import Style from '@biigle/ol/style/Style';
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

        // The point that indicates the downPoint where drawing of the sketch started.
        this.isShowingPoint = false;
        this.indicatorPoint = new Feature(new Point([20, 20]));
        if (options.indicatorPointStyle !== undefined) {
            this.indicatorPoint.setStyle(options.indicatorPointStyle);
        }
        this.indicatorSource = new VectorSource();
        this.map.addLayer(new VectorLayer({
            source: this.indicatorSource,
            zIndex: 200,
        }));

        this.model = null;
        this.embedding = null;
        this.imageSizeTensor = null;
        this.imageSamScale = null;

        // wasm needs to be copied manually to public/assets/scripts/ folder
        InferenceSession.create(options.onnxUrl, {executionProviders: ['wasm']})
            .then(response => this.model = response);

        // Update the snapshot and set event listeners if the interaction is active.
        this.toggleActive();
    }

    updateEmbedding(image, url) {
        this.imageSizeTensor = new Tensor("float32", [image.height, image.width]);
        this.imageSamScale = LONG_SIDE_LENGTH / Math.max(image.height, image.width);

        let npy = new npyjs();

        return npy.load(url)
            .then((npArray) => {
                this.embedding = new Tensor("float32", npArray.data, npArray.shape);
            });
    }

    /**
     * Scaling factor of high DPI displays. The snapshot will be by a factor of
     * 'scaling' larger than the map so we have to include this factor in the
     * transformation of the mouse position.
     *
     * @return {Float}
     */
    // getHighDpiScaling() {
    //     return this.snapshot.height / this.map.getSize()[1];
    // }

    /**
     * Convert OpenLayers coordinates on the image layer to coordinates on the snapshot.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    // toSnapshotCoordinates(points) {
    //     let extent = this.map.getView().calculateExtent(this.map.getSize());
    //     let height = this.snapshot.height;
    //     let factor = this.getHighDpiScaling() / this.map.getView().getResolution();

    //     return points.map(function (point) {
    //         return [
    //             Math.round((point[0] - extent[0]) * factor),
    //             height - Math.round((point[1] - extent[1]) * factor),
    //         ];
    //     });
    // }

    /**
     * Convert coordinates on the snapshot to OpenLayers coordinates on the image layer.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    // fromSnapshotCoordinates(points) {
    //     let extent = this.map.getView().calculateExtent(this.map.getSize());
    //     let height = this.snapshot.height;
    //     let factor = this.map.getView().getResolution() / this.getHighDpiScaling();

    //     return points.map(function (point) {
    //         return [
    //             Math.round((point[0] * factor) + extent[0]),
    //             Math.round(((height - point[1]) * factor) + extent[1]),
    //         ];
    //     });
    // }

    /**
     * Convert MagicWand point objects to OpenLayers point arrays.
     *
     * @param {Array} points
     *
     * @return {Array}
     */
    fromMagicWandCoordinates(points) {
        return points.map(function (point) {
            return [point.x, point.y];
        });
    }

    /**
     * Finish drawing of a sketch.
     */
    // handleUpEvent() {
    //     this.currentThreshold = this.colorThreshold;

    //     if (this.isShowingCross) {
    //         this.sketchSource.removeFeature(this.sketchFeature);
    //     } else {
    //     }

    //     this.dispatchEvent({type: 'drawend', feature: this.sketchFeature});
    //     this.sketchFeature = null;

    //     this.indicatorSource.clear();
    //     this.isShowingPoint = false;
    //     this.isShowingCross = false;

    //     return false;
    // }

    /**
     * Start drawing of a sketch.
     */
    // handleDownEvent(e) {
    //     this.downPoint[0] = Math.round(e.coordinate[0]);
    //     this.downPoint[1] = Math.round(e.coordinate[1]);
    //     this.drawSketch();
    //     this.indicatorPoint.getGeometry().setCoordinates(this.downPoint);
    //     this.indicatorCross.getGeometry().setCoordinates(this.downPoint);
    //     this.indicatorSource.clear();
    //     this.indicatorSource.addFeature(this.indicatorCross);
    //     this.isShowingCross = true;
    //     this.isShowingPoint = false;

    //     return true;
    // }

    /**
     * Update the target point.
     */
    handleMoveEvent(e) {
        // if (!this.isShowingPoint) {
        //     this.indicatorSource.clear();
        //     this.indicatorSource.addFeature(this.indicatorPoint);
        //     this.isShowingPoint = true;
        //     this.isShowingCross = false;
        // }
        // this.indicatorPoint.getGeometry().setCoordinates(e.coordinate);

        let t0, t1, t2, t3, t4, t5, t6;

        t0 = performance.now();

        let pointCoords = new Float32Array(4);
        let pointLabels = new Float32Array(2);
        let [height, width] = this.imageSizeTensor.data;


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

        t1 = performance.now();

        // There is no previous mask, so default to 0
        const maskInput = new Tensor(
            "float32",
            new Float32Array(256 * 256),
            [1, 1, 256, 256]
        );
        const hasMaskInput = new Tensor("float32", [0]);

        t2 = performance.now();

        const feeds = {
            image_embeddings: this.embedding,
            point_coords: pointCoordsTensor,
            point_labels: pointLabelsTensor,
            orig_im_size: this.imageSizeTensor,
            mask_input: maskInput,
            has_mask_input: hasMaskInput,
        }

        t3 = performance.now();
        // Run the SAM ONNX model with the feeds returned from modelData()
        this.model.run(feeds).then((results) => {
            t4 = performance.now();
            const output = results[this.model.outputNames[0]];

            const thresholdedOutput = output.data.map(pixel => pixel > 0 ? 1 : 0);

            let imageData = {
                data: new Uint8Array(thresholdedOutput),
                width: width,
                height: height,
                bounds: { minX: 0, maxX: width, minY: 0, maxY: height }
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

            // let points = contour.points;
            let points = this.fromMagicWandCoordinates(contour.points).map(([x, y]) => [x, height - y]);
            t5 = performance.now();


            if (this.sketchFeature) {
                this.sketchFeature.getGeometry().setCoordinates([points]);
            } else {
                this.sketchFeature = new Feature(new Polygon([points]));
                if (this.sketchStyle) {
                    this.sketchFeature.setStyle(this.sketchStyle);
                }
                this.sketchSource.addFeature(this.sketchFeature);

            }
            t6 = performance.now()
            console.log('ol', Math.round(t6 - t5), 'tracing', Math.round(t5 - t4), 'sam onnx', Math.round(t4 - t3), 'gather input', Math.round(t3 - t2), 'constant inputs', Math.round(t2 - t1), 'prompt', Math.round(t1 - t0));
        });
    }

    /**
     * Update event listeners depending on the active state of the interaction.
     */
    toggleActive() {
        if (this.getActive()) {
            // this.map.on(['moveend', 'change:size'], this.updateSnapshot.bind(this));
            // this.updateSnapshot();
        } else {
            // this.map.un(['moveend', 'change:size'], this.updateSnapshot.bind(this));
            this.indicatorSource.clear();
            this.isShowingPoint = false;
            this.isShowingCross = false;
            if (this.sketchFeature) {
                this.sketchSource.removeFeature(this.sketchFeature);
                this.sketchFeature = null;
            }
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
