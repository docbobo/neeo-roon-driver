'use strict';

const debug = require('debug')('neeo-roon-driver'),
      config = require('./settings')();

const RoonApi          = require('node-roon-api'),
      RoonApiStatus    = require('node-roon-api-status'),
      RoonApiTransport = require('node-roon-api-transport');

const RoonAdapter = require('./roonAdapter'),
      RoonDevice  = require('./roonDevice'),
      NeeoDevice  = require('./neeoDevice'), 
      NeeoAdapter = require('./neeoAdapter');

// Setup Roon
var roonAdapter = new RoonAdapter("org.pruessmann.neeo-roon-driver", "NEEO Driver", "0.0.1", "Doc Bobo", "boris@pruessmann.org");
var roon = new RoonApi(roonAdapter);
var svc_status = new RoonApiStatus(roon);

roon.init_services({
    required_services: [ RoonApiTransport ],
    provided_services: [ svc_status ]
});
svc_status.set_status("Extenstion enabled", false);
roon.start_discovery();

let neeoConfig = { 
    name: "neeo-roon-driver", 
    port: config.neeo.port || 4242 
};
let neeoAdapter = new NeeoAdapter(neeoConfig);

let roonDeviceConfig = {
    driverName : config.roon.driverName || 'Core',
    driverManufacturer : config.roon.driverManufacturer || 'Roon',

    powerOn: config.roon.powerOn || 'NONE',
    powerOff: config.roon.powerOff || 'NONE'
};

let roonDevice = new RoonDevice(roonAdapter, roonDeviceConfig);
neeoAdapter.addDevice(roonDevice);

neeoAdapter.start().catch((error) => {
    console.error(error);
});