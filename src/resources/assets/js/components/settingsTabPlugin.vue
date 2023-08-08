<script>
import {Events} from '../import';
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
            'SAMthrottleInterval': 1000,
        };
    },
    watch: {
        SAMthrottleInterval(interval){
            interval = parseFloat(interval);
            Events.$emit('settings.SAMthrottleInterval', interval);
            this.settings.set('SAMthrottleInterval', interval);
        },
    },
    created() { 
        if (this.settings.has('SAMthrottleInterval')) {
            this.SAMthrottleInterval = this.settings.get('SAMthrottleInterval');
        }
    }
};
</script>
