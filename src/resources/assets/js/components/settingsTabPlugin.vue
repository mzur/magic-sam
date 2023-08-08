<script>
import MagicSamMixin from '../MagicSamMixin.vue';
/**
 * The plugin component to edit the Magic-SAM throttle interval.
 *
 * @type {Object}
 */
export default {
    props: {
        settings: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            restoreKeys: [
                'SAMthrottleInterval',
            ],
            'SAMthrottleInterval': 1000,
        };
    },
    watch: {
        SAMthrottleInterval(interval) {
            interval = parseFloat(interval);
            this.$emit('change', 'SAMthrottleInterval', interval);
            this.settings.set('SAMthrottleInterval', interval);
            MagicSamMixin.methods.set_throttleInterval(interval);
        },
    },
};
</script>
