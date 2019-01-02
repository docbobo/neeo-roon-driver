'use strict';

const debug   = require('debug')('neeo-roon-driver'),
      Neeo    = require('./lib/neeo'),
      Roon    = require('./lib/roon'),
      Promise = require('bluebird');

const MACRO_ALBUM  = 'albumname';
const MACRO_ARTIST = 'artistname';
const MACRO_TRACK  = 'trackname';

const MACRO_PLAY  = 'PLAY';
const MACRO_PAUSE = 'PAUSE';

module.exports = class RoonDevice extends Neeo.Device {
    constructor(roonAdapter, config) {
        super('MEDIAPLAYER', config.driverName, config.driverManufacturer, 'org.pruessmann.neeo-roon-driver');

        this._roonAdapter = roonAdapter;
        this._config = config;
        this._neeoAdapter = null;

        this.addCapability('addAnotherDevice');
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

    setNeeoAdapter(neeoAdapter) {
        this._neeoAdapter = neeoAdapter;
    }

    onInitialise() { 
        debug("onInitialise()");
        this._roonAdapter.on('now_playing', (zoneId, data) => { this.now_playing(zoneId, data) });
    }

    onDeviceAdded(deviceId) {
        debug("onDeviceAdded(%o)", deviceId);

        try {
            const zone = this._roonAdapter.getAllZones().find((element) => {
                return element.zone_id == deviceId;
            });

            var neeoAdapter = this._neeoAdapter;
            this._neeoAdapter.invalidateRecipes();

            this._sourceControl = new Roon.SourceControl(deviceId, zone.display_name, false, {
                convenience_switch: function() {
                    neeoAdapter.getRecipe(zone.display_name).then((recipe) => {
                        recipe.action.powerOn();
                    }).catch((error) => console.log(error));
                },
                standby: function() {
                    neeoAdapter.getRecipe(zone.display_name).then((recipe) => {
                        recipe.action.powerOff();
                    }).catch((error) => console.log(error));
                }
            });
            this._roonAdapter.registerSourceControl(this._sourceControl);

            neeoAdapter.getRecipe(zone.display_name).then((recipe) => {
                if (recipe.isPoweredOn) {
                    this._sourceControl.update_state("selected");
                } else {
                    this._sourceControl.update_state("standby");
                }
            });
        } catch (error) {
            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
        }
    }

    onDeviceRemoved(deviceId) {
        debug("onDeviceRemoved(%o)", deviceId);

        try {
            this._roonAdapter.unregisterSourceControl(this._sourceControl);
            this._sourceControl = null;
        } catch (error) {
            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
        }
    }

    onInitializeDeviceList(deviceIds) {
        deviceIds.forEach((deviceId) => this.onDeviceAdded(deviceId));
    }

    now_playing(zoneId, data) {
        try {
            if (data != null) {
                Promise.join(
                    this.setValue(zoneId, MACRO_ARTIST, data.three_line.line2),
                    this.setValue(zoneId, MACRO_TRACK, data.three_line.line1),
                    this.setValue(zoneId, MACRO_ALBUM, data.three_line.line3)).
                catch((error) => {
                    console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
                })
            }
        } catch (error) {
            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
        }
    }

    onPowerOn(deviceId) {
        //this.markDevicePoweredOn();
        this._sourceControl.update_state("selected");
    }

    onPowerOff(deviceId) {
        //this.markDevicePoweredOff();
        this._sourceControl.update_state("standby");
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
