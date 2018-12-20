'use strict';

const debug        = require('debug')('neeo-roon-driver:roon:adapter'),
      EventEmitter = require('events');

const RoonApi          = require('node-roon-api'),
      RoonApiStatus    = require('node-roon-api-status'),
      RoonApiTransport = require('node-roon-api-transport');

const log_error = function(error) { if (error) { console.error('[neeo-roon-driver] ERROR: "%s"', error.message); } }

const RoonSourceControl = class RoonSourceControl {
    constructor(id, name, selected, cb) {
        this.state = {
            display_name: name,
            supports_standby: true,
            status: selected ? "selected" : "standby"
        };
        this._cb = cb;
    }

    convenience_switch(req) {
        debug("convenience_switch(%o)", req);

        try {
            this._cb.convenience_switch();
            req.send_complete("Success");
        } catch (error) {
            debug("convenience_switch(%o) failed.", req);

            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
            req.send_complete("Failure");
        }
    }

    standby(req) {
        debug("standby(%o)", req);

        try {
            this._cb.standby();
            req.send_complete("Success");
        } catch (error) {
            debug("standby(%o) failed.", req);

            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
            req.send_complete("Failure");
        }
    }
}

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

    start() {
        return new Promise((resolve, reject) => {
            debug("start()");

            // TODO: Use delegate so that we can rename to onCorePaire, onCoreUnpaired ?
            const roon = new RoonApi(this);
            this._svcStatus = new RoonApiStatus(roon);

            roon.init_services({
                required_services: [ RoonApiTransport ],
                provided_services: [ this._svcStatus ]
            });
            this._svcStatus.set_status("Extension enabled", false);
            
            roon.start_discovery();
            resolve();
        });
    }

    core_paired(core) {
        // TODO: Needs lots of cleanup, fixing.
        debug("core_paired(%o)", core);
        this._core = core;

        let transport = this._core.services.RoonApiTransport;
        transport.subscribe_zones((response, data) => { this.onZoneChange(response, data ); });
    }

    core_unpaired(core) {
        // TODO: Need to remove zones

        debug("core_unpaired(%o)", core);        
        this._core = null;
    }

    onZoneChange(response, data) {
        if (response == "Subscribed") {
            for (let x in data.zones) {
                this._zoneList.set(data.zones[x].zone_id, data.zones[x]);
                this.emit("now_playing", data.zones[x].zone_id, data.zones[x].now_playing)                    
            }
        } else if (response == "Changed") {
            for (let i in data) {
                if (i == "zones_changed") {
                    for (let x in data.zones_changed) {
                        this.emit("now_playing", data.zones_changed[x].zone_id, data.zones_changed[x].now_playing)
                    }
                }
            }
        }
    }

    getAllZones() {
        const zoneIds = Array.from(this._zoneList.keys());
        return zoneIds.map((id) => {            
            const entry = this._zoneList.get(id);
            entry.id = id; // FIXME: Questionable
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

    stop(zoneId) {
        let transport = this._core.services.RoonApiTransport;
        transport.control({ zone_id: zoneId }, "stop", log_error);
    }

    next(zoneId) {
        let transport = this._core.services.RoonApiTransport;
        transport.control({ zone_id: zoneId }, "next", log_error);
    }

    previous(zoneId) {
        let transport = this._core.services.RoonApiTransport;
        transport.control({ zone_id: zoneId }, "previous", log_error);
    }

    seek(zoneId, seconds) {
        let transport = this._core.services.RoonApiTransport;
        transport.seek({ zone_id: zoneId }, "relative", seconds, log_error);
    }
};