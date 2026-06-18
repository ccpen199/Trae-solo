const deviceProtocol = require('./DeviceProtocol');
const MqttAdapter = require('./MqttAdapter');
const HttpAdapter = require('./HttpAdapter');

deviceProtocol.registerAdapter('mqtt', new MqttAdapter());
deviceProtocol.registerAdapter('http', new HttpAdapter());
deviceProtocol.registerAdapter('modbus', new MqttAdapter());
deviceProtocol.registerAdapter('custom', new HttpAdapter());

module.exports = deviceProtocol;
