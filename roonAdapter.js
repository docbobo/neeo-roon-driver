'use strict';

const debug        = require('debug')('neeo-roon-driver:adapter'),
      EventEmitter = require('events');

let log_error = function(error) { if (error) { console.error(error); } }

module.exports = class RoonAdapter extends EventEmitter {
    get extension_id() { return this._extensionId }
    get display_name() { return this._displayName }
    get display_version() { return this._version }
    get publisher() { return this._publisher }
    get email() { return this._email }

    get zones() { return this._zoneList }

    constructor(extensionId, displayName, version, publisher, email) {
        super();

        this._extensionId = extensionId;
        this._displayName = displayName;
        this._version = version;
        this._publisher = publisher;
        this._email = email;

        this._zoneList = new Map();
    }

    core_paired(core) {
        debug("core_paired(%o)", core);
        this._core = core;

        let transport = this._core.services.RoonApiTransport;
        transport.subscribe_zones((function(response, data) {
            if (response == "Subscribed") {
                for (var x in data.zones) {
                    this._zoneList.set(data.zones[x].zone_id, data.zones[x]);
                    this.emit("now_playing", data.zones[x].zone_id, data.zones[x].now_playing)                    
                }
            } else if (response == "Changed") {
                for (var i in data) {
                    if (i == "zones_changed") {
                        for (x in data.zones_changed) {
                            this.emit("now_playing", data.zones_changed[x].zone_id, data.zones_changed[x].now_playing)
                        }
                    }
                }
            }
        }).bind(this));
    }

    core_unpaired(core) {
        debug("core_unpaired(%o)", core);
        this._core = null;
    }

    getAllZones() {
        const deviceIds = Array.from(this._zoneList.keys() );
        return deviceIds.map((id) => {
            const entry = this._zoneList.get(id);
            entry.id = id;
            return entry;
        });
    }

    play(zoneId) {
        let transport = this._core.services.RoonApiTransport;
        transport.control({ zone_id: zoneId }, "play", log_error);
    }

    pause(zoneId) {
        let transport = this._core.services.RoonApiTransport;
        transport.control({ zone_id: zoneId }, "pause", log_error);
    }
};