var ds18b20 = require('ds18b20');
var sensorIds = [];

ds18b20.sensors(function(err, ids) {
    var objects = {};
    objects['sensors'] = [];

    if (err) {
        return console.log('Can not get sensor IDs', err);
    }

    ids.forEach(function(id) {
        objects['sensors'].push({
            name: id,
            temp: ds18b20.temperatureSync(id, {parser: 'hex'})
        });
    });

    console.log(JSON.stringify(objects));
});
