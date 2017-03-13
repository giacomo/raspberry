var i2c = require('i2c-bus'),
    i2cBus = i2c.openSync(1),
    Oled = require('oled-i2c-bus'),
    on_kill = require('death'),
    dateFormat = require('dateformat'),
    math = require('mathjs');

const SIZE_X=128,
      SIZE_Y=64;
var digiClockInterval = null;

var opts = {
  width: SIZE_X,
  height: SIZE_Y,
  address: 0x3C
};

var oled = new Oled(i2cBus, opts);
oled.clearDisplay();

digiClockInterval = setInterval(analogClock, 1000);

on_kill(function(signal, err) {
    clearInterval(digiClockInterval);
    oled.clearDisplay(false);
    process.exit(0);
});

var font = require('oled-font-5x7');

function digitalClock() {
    var date=new Date();

    // Location fits 128x64 OLED
    oled.drawLine(0, 0, 127, 0, 1);
    oled.drawLine(127, 1, 127, 61, 1);
    oled.drawLine(0, 62, 0, 1, 1);
    oled.drawLine(1, 62, 127, 62, 1);
    oled.setCursor(12, 25);
    oled.writeString(font, 2, dateFormat(date, 'HH:MM:ss'), 1, true);
}

function radians(degrees) {
  return degrees * Math.PI / 180;
};

function posn(angle, arm_length) {
    var dx = math.ceil(math.cos(radians(angle)) * arm_length);
    var dy = math.ceil(math.sin(radians(angle)) * arm_length);
    return [dx, dy];
}

function analogClock() {
    var date = new Date();
    var hour = date.getHours();
    var min  = date.getMinutes();
    var sec  = date.getSeconds();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day  = date.getDate();

    var margin = 6;
    var cx = 28;
    var cy = 60 / 2;
    var left = cx - cy;
    var right = cx + cy;

    var hrs_angle = 270 + (30 * (hour + (min / 60.0)));
    var hrs = posn(hrs_angle, cy - margin - 7);
    var min_angle = 270 + (6 * min);
    var mins = posn(min_angle, cy - margin - 2);
    var sec_angle = 270 + (6 * sec);
    var secs = posn(sec_angle, cy - margin - 2);

    oled.clearDisplay();
    oled.drawLine(0, 0, 127, 0, 1);
    oled.drawLine(127, 1, 127, 61, 1);
    oled.drawLine(0, 62, 0, 1, 1);
    oled.drawLine(1, 62, 127, 62, 1);
    oled.drawLine(cx, cy-2, cx + hrs[0], cy-2 + hrs[1], 1);
    oled.drawLine(cx, cy-2, cx + mins[0], cy-2 + mins[1], 1);
    oled.drawLine(cx, cy-2, cx + secs[0], cy-2 + secs[1], 1);
    oled.setCursor(67, 30);
    oled.writeString(font, 1, dateFormat(date, 'dd.mm.yy'), 1, true);
    oled.setCursor(67, 40);
    oled.writeString(font, 1, dateFormat(date, 'HH:MM:ss'), 1, true);
}
