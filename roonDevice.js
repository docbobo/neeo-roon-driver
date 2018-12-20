'use strict';

const debug   = require('debug')('neeo-roon-driver'),
      Neeo    = require('./lib/neeo'),
      Promise = require('bluebird');

const MACRO_ALBUM  = 'albumname';
const MACRO_ARTIST = 'artistname';
const MACRO_TRACK  = 'trackname';

const MACRO_PLAY  = 'PLAY';
const MACRO_PAUSE = 'PAUSE';

module.exports = class RoonDevice extends Neeo.Device {
    constructor(roonAdapter, config) {
        super('MUSICPLAYER', config.driverName, config.driverManufacturer, 'org.pruessmann.neeo-roon-driver');

        this._roonAdapter = roonAdapter;
        this._config = config;

        // HACK: addCapability not working as expecting, pretending we support power. https://github.com/NEEOInc/neeo-sdk/issues/66
        this.addCapability('alwaysOn')
        this.addButtonGroup('Power')
            .addButtonGroup('Transport')
            .addButtonGroup('Transport Search')
            .addButtonGroup('Transport Scan');

        this.addTextLabel(MACRO_ARTIST, 'Artist')
            .addTextLabel(MACRO_ALBUM, 'Album')
            .addTextLabel(MACRO_TRACK, 'Track');

        this.enableDiscovery("Roon Core", "The music player for music lovers", () => { return this.getZones() });

        this.on('registered', () => { this.onInitialise() });
    }

    onInitialise() {
        debug("onInitialise()");
        this._roonAdapter.on('now_playing', (zoneId, data) => { this.now_playing(zoneId, data) });
    }

    now_playing(zoneId, data) {
        Promise.join(
            this.setValue(zoneId, MACRO_ARTIST, data.three_line.line2),
            this.setValue(zoneId, MACRO_TRACK, data.three_line.line1),
            this.setValue(zoneId, MACRO_ALBUM, data.three_line.line3)).
        catch((error) => {
            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
        })
    }

    onPowerOn(deviceId) {
        this.markDevicePoweredOn();
    }

    onPowerOff(deviceId) {
        this.markDevicePoweredOff();
    }

    onPlay(deviceId) {
        this._roonAdapter.play(deviceId);
    }

    onPause(deviceId) {
        this._roonAdapter.pause(deviceId);
    }

    onStop(deviceId) {
        this._roonAdapter.stop(deviceId);
    }

    onNext(deviceId) {
        this._roonAdapter.next(deviceId);
    }

    onPrevious(deviceId) {
        this._roonAdapter.previous(deviceId);
    }

    onForward(deviceId) {
        this._roonAdapter.seek(deviceId, 5);
    }

    onReverse(deviceId) {
        this._roonAdapter.seek(deviceId, -5);
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
