'use strict';

const debug   = require('debug')('neeo-roon-driver'),
      config  = require('./lib/util/settings')(),
      Promise = require('bluebird');

const RoonDevice  = require('./roonDevice'),
      Neeo        = require('./lib/neeo'),
      Roon        = require('./lib/roon');

// Setup Roon
// TODO: Parameter object pattern
const roonAdapter = new Roon.Adapter("org.pruessmann.neeo-roon-driver", "NEEO Driver", "0.0.1", "Doc Bobo", "boris@pruessmann.org");

const roonDeviceConfig = {
    driverName: config.roon.driverName || 'Core',
    driverManufacturer: config.roon.driverManufacturer || 'Roon'
};
const roonDevice = new RoonDevice(roonAdapter, roonDeviceConfig);

// Setup Neeo
const neeoConfig = { 
    name: "neeo-roon-driver", 
    driverManufacturer: config.roon.driverManufacturer || 'Roon',
    port: config.neeo.port || 4242,
    brain: config.neeo.brain || null
};
const neeoAdapter = new Neeo.Adapter(neeoConfig);
neeoAdapter.addDevice(roonDevice);

Promise.join(
    roonAdapter.start(),
    neeoAdapter.start()
).then(() => {
    neeoAdapter.devices.forEach((device) => device.emit('registered'));
}).catch((error) => {
    console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
    process.exit(1);
});
