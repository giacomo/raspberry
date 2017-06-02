var noble = require('noble');

var NORDIC_SERVICE = "6e400001b5a3f393e0a9e50e24dcca9e";
var NORDIC_TX = "6e400002b5a3f393e0a9e50e24dcca9e";
var NORDIC_RX = "6e400003b5a3f393e0a9e50e24dcca9e";
var CHUNKSIZE = 16;
var txCharacteristic;
var rxCharacteristic;
var txDataQueue = [];
var txInProgress = false;

var puckId = '[PUCK_ID]';

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
      console.log('peripheral found with id: ' + peripheral.id);
      if (peripheral.id === puckId) {
          noble.stopScanning();
          connectToPeriphal(peripheral);
      }
});


function connectToPeriphal(peripheral) {
  peripheral.connect(function(err) {
    peripheral.discoverServices([NORDIC_SERVICE], function(err, services) {
      services.forEach(function(service) {
        console.log('found service:', service.uuid);
        service.discoverCharacteristics([], function(err, characteristics) {
          characteristics.forEach(function(characteristic) {
            console.log('found characteristic:', characteristic.uuid);
            if (NORDIC_TX == characteristic.uuid) {
              txCharacteristic = characteristic;
            }

            if (NORDIC_RX == characteristic.uuid) {
              rxCharacteristic = characteristic;
            }
          });

          if (rxCharacteristic && txCharacteristic) {
            readPuckInfos();
          } else {
            console.log('missing characteristics');
          }
        });
      });
    });
  });

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  function readPuckInfos() {
    eval('E.getTemperature()\n', function(data) {
      console.log('temp: ', data, '°C');
    });
    eval('Puck.getBatteryPercentage()\n', function(data) {
      console.log('battery: ', data, '%');
    });
  }

  function write(data, callback) {
    if (data) {
      txDataQueue.push({data:data,callback:callback});
    }

    if (!txInProgress) {
      writeChunk();
    }
  }

  function writeChunk() {
    var chunk;
    if (!txDataQueue.length) {
      return;
    }
    var txItem = txDataQueue[0];
    if (txItem.data.length <= CHUNKSIZE) {
      chunk = txItem.data;
      txItem.data = undefined;
    } else {
      chunk = txItem.data.substr(0,CHUNKSIZE);
      txItem.data = txItem.data.substr(CHUNKSIZE);
    }
    txInProgress = true;

    txCharacteristic.write(new Buffer(str2ab(chunk)), false, function(err){
        if (!err) {
          if (!txItem.data) {
            txDataQueue.shift();
            if (txItem.callback) {
              rxCharacteristic.read(function(error, data) {
                var dataString = data.toString();
                var dataArray = dataString.split("\r\n");
                if(dataArray.length > 0) {
                  var result = dataArray[1].replace('=', '');
                  txItem.callback(result);
                }
              });
            }
          }
          txInProgress = false;
          writeChunk();
        }
    });
  }

  function eval(data, callback) {
      write(data, callback);
  }
}