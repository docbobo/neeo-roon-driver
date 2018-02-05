'use strict';

const chai = require('chai'),
      spies  = require('chai-spies');

const assert = chai.assert,
      should = chai.should();

const Neeo  = require('../lib/neeo');

chai.use(spies);

describe('Neeo.Device', function() {
    const iut = new Neeo.Device('ACCESSORY', 'MockComponent');

    describe('#onButtonPressed()', function() {
        it('should forward to onPowerOn', function() {
            const spy = chai.spy.on(iut, 'onPowerOn');
            iut.onButtonPressed('POWER ON', '0815');
            spy.should.have.been.called.with('0815');
        });

        it('should forward to onPowerOff', function() {
            const spy = chai.spy.on(iut, 'onPowerOff');
            iut.onButtonPressed('POWER OFF', '0815');
            spy.should.have.been.called.with('0815');
        });

        it('should forward to onPlay', function() {
            const spy = chai.spy.on(iut, 'onPlay');
            iut.onButtonPressed('PLAY', '0815');
            spy.should.have.been.called.with('0815');
        });

        it('should forward to onPause', function() {
            const spy = chai.spy.on(iut, 'onPause');
            iut.onButtonPressed('PAUSE', '0815');
            spy.should.have.been.called.with('0815');
        });

        it('should forward to onNext', function() {
            const spy = chai.spy.on(iut, 'onNext');
            iut.onButtonPressed('NEXT', '0815');
            spy.should.have.been.called.with('0815');
        });

        it('should forward to onPrevious', function() {
            const spy = chai.spy.on(iut, 'onPrevious');
            iut.onButtonPressed('PREVIOUS', '0815');
            spy.should.have.been.called.with('0815');
        });
    });
});