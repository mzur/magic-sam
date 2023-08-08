import Plugin from './components/settingsTabPlugin';
import {SettingsTabPlugins} from './import';

/**
 * The plugin component set the SAM throttle interval.
 *
 * @type {Object}
 */
if (SettingsTabPlugins) {
    SettingsTabPlugins.magicSam = Plugin;
}
