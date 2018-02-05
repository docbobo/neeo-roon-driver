'use strict';

const debug        = require('debug')('neeo-roon-driver:neeo:adapter'),
      EventEmitter = require('events'),
      NeeoAPI      = require('neeo-sdk');

module.exports = class NeeoAdapter extends EventEmitter {
    constructor(neeoConf) {
        super(); 

        this.neeoConf = neeoConf;

        this.devices = [];
        this.sdkDevices = [];
    }

    addDevice(device) {
        debug("addDevice(%o)", device);
        this.devices.push(device);
        this.sdkDevices.push(device.device);
    }

    start() {
        if (this.neeoConf.brain) {
            console.log('[neeo-roon-driver] Connecting Brain (%s) ...', this.neeoConf.brain);
            return this.startServer();
        } else {
            console.log('[neeo-roon-driver] Discover one Brain ...');
            return NeeoAPI.discoverOneBrain().then((brain) => {
                this.neeoConf.brain = brain;
                console.log('[neeo-roon-driver] Brain discovered:', brain.name);
                return this.startServer();
            });
        }
    }

    startServer() {
        if (this.neeoConf.brain.name) {
            console.log('[neeo-roon-driver] Starting API server and connect to Brain: %s ...', this.neeoConf.brain.name);
        } else {
            console.log('[neeo-roon-driver] Starting API server and connect to Brain: %s ...', this.neeoConf.brain);
        }

        if (this.neeoConf.baseurl) {
            console.log('[neeo-roon-driver] Force driver base url: %s ...', this.neeoConf.baseurl);
        }

        this.neeoConf.devices = this.sdkDevices;

        return NeeoAPI.startServer(this.neeoConf).then(() => {
            console.log('[neeo-roon-driver] API is ready and running!');
            console.log('');
            console.log('[neeo-roon-driver] ===> Use the NEEO app to search for "%s" device. <===', this.neeoConf.driverManufacturer);
            console.log('');
        });
    }
};