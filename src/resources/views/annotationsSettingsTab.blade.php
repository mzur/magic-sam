<component :is="plugins.magicsam" :settings="settings" inline-template>
    <div class="sidebar-tab__section">
            <h5 title="Set the interval at which SAM proposals are updated">SAM throttle intervall (<span v-text="SAMthrottleInterval"></span>)</h5>
            <input type="range" min="10" max="2000" step="10" v-model="SAMthrottleInterval">
    </div>
</component>