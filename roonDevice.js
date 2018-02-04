'use strict';

const debug      = require('debug')('neeo-roon-driver'),
      NeeoAPI    = require('neeo-sdk'),
      NeeoDevice = require('./neeoDevice');

const MACRO_ALBUM  = 'albumname';
const MACRO_ARTIST = 'artistname';
const MACRO_TRACK  = 'trackname';

const MACRO_PLAY  = 'PLAY';
const MACRO_PAUSE = 'PAUSE';

module.exports = class RoonDevice extends NeeoDevice {
    constructor(roonAdapter, config) {
        try {
            // Device type "AUDIO" requires a patched version of the NEEO sdk.
            super('AUDIO', config.driverName, config.driverManufacturer, 'org.pruessmann.neeo-roon-driver');
        } catch (error) {
            console.error('Device type "AUDIO" not supported. Falling back to "MEDIAPLAYER"');
            super('MEDIAPLAYER', driverName, driverManufacturer);
        }

        this._roonAdapter = roonAdapter;
        this._config = config;

        // TODO: addCapability not working as expecting, pretending we support power. https://github.com/NEEOInc/neeo-sdk/issues/66
        // this.addCapability('alwaysOn')
        this.addButtonGroup('Power');

        this.addTextLabel(MACRO_ARTIST, 'Artist')
            .addTextLabel(MACRO_ALBUM, 'Album')
            .addTextLabel(MACRO_TRACK, 'Track')

        // Since Roon doesn't support 'STOP', we cannot use the button group 'Transport'
        this.addButton(MACRO_PLAY)
            .addButton(MACRO_PAUSE);
        
        this.enableDiscovery("Roon Core", "The music player for music lovers", () => { return this.getZones() });
    }

    onInitialise() {
        debug("onInitialise()");
        this._roonAdapter.on('now_playing', (zoneId, data) => { this.now_playing(zoneId, data) });
    }

    now_playing(zoneId, data) {
        this.setValue(MACRO_TRACK, data.three_line.line1, zoneId);
        this.setValue(MACRO_ARTIST, data.three_line.line2, zoneId);
        this.setValue(MACRO_ALBUM, data.three_line.line3, zoneId);
    }

    onPowerOn(deviceId) {
        this.onButtonPressed(this._config.powerOn, deviceId);
    }

    onPowerOff(deviceId) {
        this.onButtonPressed(this._config.powerOff, deviceId);
    }

    onPlay(deviceId) {
        this._roonAdapter.play(deviceId);
    }

    onPause(deviceId) {
        this._roonAdapter.pause(deviceId);
    }

    getZones() {        
        const allDevices = this._roonAdapter.getAllZones();
        return allDevices.map((deviceEntry) => {
            return {
                id: deviceEntry.id,
                name: deviceEntry.display_name
            };
        });
    }
}
