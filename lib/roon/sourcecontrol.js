'use strict';

const debug        = require('debug')('neeo-roon-driver:roon:adapter');
      
module.exports = class RoonSourceControl {

    constructor(id, name, selected, cb) {
        this.state = {
            control_key: id,
            display_name: name,
            supports_standby: true,
            status: selected ? "selected" : "standby"
        };
        this._cb = cb;
        this._handle = null;
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

    update_state(state) {
        this._handle.update_state({ status: state });
    }
}