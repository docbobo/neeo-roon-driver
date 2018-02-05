'use strict';

const debug        = require('debug')('neeo-roon-driver:neeo:device'),
      NeeoAPI      = require('neeo-sdk'),
      EventEmitter = require('events'),
      Promise      = require('bluebird');

let handlerNotImplemented = function() { debug('Button handler not implemented'); }

module.exports = class NeeoDevice extends EventEmitter {
    get device() { return this._neeoDevice }

    constructor(type, name, manufacturer, uniqueId) {
        super();

        this._deviceControls = [];
        this._deviceState = new Map();

        this._markDevicePoweredOn = handlerNotImplemented;
        this._markDevicePoweredOff = handlerNotImplemented;

        this._neeoDevice = 
            NeeoAPI.buildDevice(name, uniqueId)
                .setManufacturer(manufacturer)
                .setType(type)
                .addButtonHander((name, deviceId) => { this.onButtonPressed(name, deviceId) })
                .registerSubscriptionFunction((updateCallback, optionalCallbackFunctions) => { 
                    this.registerSubscriptionFunction(updateCallback, optionalCallbackFunctions); 
                });
    }

    enableDiscovery(headerText, description, cb) {
        this._neeoDevice.enableDiscovery({ headerText: headerText, description: description }, cb);
    }

    markDevicePoweredOn() {
        debug("markDevicePoweredOn()");
        this._markDevicePoweredOn();
    }

    markDevicePoweredOff() {
        debug("markDevicePoweredOff()");
        this._markDevicePoweredOff();
    }

    onInitialise() {
        handlerNotImplemented();
    }

    registerSubscriptionFunction(updateCallback, optionalCallbackFunctions) {
        this.updateCallback = updateCallback

        if (optionalCallbackFunctions && optionalCallbackFunctions.powerOnNotificationFunction) {
            this._markDevicePoweredOn = optionalCallbackFunctions.powerOnNotificationFunction;
        }

        if (optionalCallbackFunctions && optionalCallbackFunctions.powerOffNotificationFunction) {
            this._markDevicePoweredOff = optionalCallbackFunctions.powerOffNotificationFunction;
        }
    }

    onButtonPressed(name, deviceId) {
        debug('button_pressed(%o, %o)', name, deviceId);
        
        switch (name) {
            case 'NONE':
                break;

            case 'POWER ON':
                this.onPowerOn(deviceId);
                break;

            case 'POWER OFF':
                this.onPowerOff(deviceId);
                break;

            case 'PLAY':
                this.onPlay(deviceId);
                break;
    
            case 'PAUSE':
                this.onPause(deviceId);
                break;

            case 'NEXT':
                this.onNext(deviceId);
                break;

            case 'PREVIOUS':
                this.onPrevious(deviceId);
                break;
            
            default:
                console.error('[neeo-roon-driver] Unhandled button "%s" pressed.', name);
        }
    }

    onPowerOn(deviceId) {
        handlerNotImplemented();
    }

    onPowerOff(deviceId) {
        handlerNotImplemented();
    }

    onPlay(deviceId) {
        handlerNotImplemented();
    }

    onPause(deviceId) {
        handlerNotImplemented();
    }

    onNext(deviceId) {
        handlerNotImplemented();
    }

    onPrevious(deviceId) {
        handlerNotImplemented();
    }

    getValue(deviceId, name) {
        debug("getValue(%o, %o)", deviceId, name);

        let deviceState = this._deviceState.get(deviceId);
        if (deviceState == null || deviceState[name] == null) {
            return null;
        }
        
        return deviceState[name].value;
    }

    setValue(deviceId, name, value) {
        return new Promise((resolve, reject) => {
            let deviceState = this._deviceState.get(deviceId);
            if (deviceState == null) {
                deviceState = {};
                this._deviceState.set(deviceId, deviceState);
            }

            if (deviceState[name] == null) {
                deviceState[name] = {};
                deviceState[name].value = this._deviceControls[name].defaultValue;
            }
    
            let oldValue = deviceState[name].value;
            deviceState[name].value = value;
    
            if (oldValue != value) {
                return this.updateComponent(deviceId, name);
            } else {
                resolve();
            }
        }).catch((error) => {
            console.error('[neeo-roon-driver] ERROR: "%s"', error.message);
        });
    }

    addCapability(capability) {
        this._neeoDevice.addCapability(capability);
    }

    updateComponent(deviceId, name) {
        debug("updateComponent(%o, %o)", deviceId, name);

        let deviceState = this._deviceState.get(deviceId);
        let param = {
            uniqueDeviceId: deviceId,
            component:      name,
            value:          deviceState[name].value
        };

        return this.updateCallback(param);
    }

    checkForDuplicateControlName(name) {
        if (this._deviceControls[name]) {
            throw new Error('A control with name ' + name + ' was already added.');
        }
    }

    addButton(name, label) {
        this.checkForDuplicateControlName(name);

        this._deviceControls[name] = {
            type: 'Button',
            name: name
        };

        this._neeoDevice.addButton({ name: name, label: label });

        return this;
    }

    addButtonGroup(name) {
        this.checkForDuplicateControlName(name);

        this._deviceControls[name] = {
            type: 'ButtonGroup',
            name: name
        };

        this._neeoDevice.addButtonGroup(name);

        return this;
    }

    addSlider(name, label, min = 0, max = 100, initialValue = 0, unit = '') {
        this.checkForDuplicateControlName(name);

        this._deviceControls[name] = {
            type: 'Slider',
            name: name,
            label: label,
            defaultValue: initialValue
        };

        this._neeoDevice.addSlider({ name: name, label: label, range: [min, max], unit: unit }, {
            setter: (deviceId, value) => this.setValue(deviceId, name, value),
            getter: (deviceId) => this.getValue(deviceId, name)
        });

        return this;
    }

    addTextLabel(name, label, initialValue = '') {
        this.checkForDuplicateControlName(name);

        this._deviceControls[name] = {
            type: 'TextLabel',
            name: name,
            label: label,
            defaultValue: initialValue
        };

        this._neeoDevice.addTextLabel({ name: name, label: label }, (deviceId) => { return this.getValue(deviceId, name) });

        return this;
    }
};