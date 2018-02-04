'use strict';

const EventEmitter = require('events');
const neeoapi = require('neeo-sdk');

module.exports = class NeeoAdapter extends EventEmitter {
    constructor(neeoConf) {
        super(); //must call super for "this" to be defined.

        this.neeoConf = neeoConf;

        this.devices = [];
        this.sdkDevices = [];
    }

    addDevice(device) {
        this.devices.push(device);
        this.sdkDevices.push(device.device);
    }

    start() {
        if (this.neeoConf.brain) {
            console.log('[NEEO] Connecting Brain (', this.neeoConf.brain, ') ...');
            return this.startServer();
        } else {
            console.log('[NEEO] Discover one Brain ...');
            return neeoapi.discoverOneBrain()
                .then((brain) => {
                    this.neeoConf.brain = brain;
                    console.log('[NEEO] Brain discovered:', brain.name);
                    return this.startServer();
                });
        }
    }

    startServer() {
        if (this.neeoConf.brain.name)
            console.log('[NEEO] Starting API server and connect to Brain:', this.neeoConf.brain.name, '...');
        else
            console.log('[NEEO] Starting API server and connect to Brain:', this.neeoConf.brain, '...');

        if (this.neeoConf.baseurl)
            console.log('[NEEO] Force driver base url:', this.neeoConf.baseurl, '...');

        this.neeoConf.devices = this.sdkDevices;

        return neeoapi.startServer(this.neeoConf)
            .then(() => {
                let driverManufacturer = 'Roon';

                console.log('[NEEO] API is ready and running!');
                console.log('');
                console.log('[NEEO] ===> Use the NEEO app to search for "' + driverManufacturer + '" device. <===');
                console.log('');
            })
            .catch((error) => {
                //if there was any error, print message out to console
                console.error('[NEEO] ERROR: "', error.message, '"');
                process.exit(1);
            });
    }
};