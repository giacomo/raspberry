const path = require('path');
var sleep = require('sleep');
var rpio = require('rpio');
var on_kill = require('death');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(4433);

var timeoutCounter = 0;
var timeoutCollection = [];
var gameOver = false;
var shipPos = 0;

var LCD = require('lcdi2c');
var lcd = new LCD( 1, 0x27, 16, 2 );
lcd.createChar( 0,[ 0x18,0xc,0x1e,0x1f,0x1f,0x1e,0xc,0x18] );

on_kill(function(signal, err) {
  lcd.clear();
  lcd.off();
  process.exit(0);
});

lcd.clear();
lcd.on();

lcdRun(0,0,0,'Loading \000\000\000 SpaceImpact', 150);
initGame();
function initGame() {
    var timeoutCounter = 0;
    var timeoutCollection = [];
    lcdRun(0,0,0,'3... 2... 1... Go', 75);
    gameOver = false;
    shipPos = 0;
    lcdRunAsync(0,0,0,'          *     **   **   *  *   ****    *', 750);
    lcdRunAsync(1,0,0,'     ** *   * *    *    *   *  *      **  ', 750);
}

function lcdPut(row, col, cols, text) {
    if (cols === 0) {
      cols = text.length;
    }
    lcd.setCursor(col, row);
    lcd.print(text.substr(0, cols));
}

function lcdRun(row, col, cols, text, delay = 750) {
    if (cols === 0) {
      cols = text.length;
    }
    lcd.setCursor(col, row);
    lcd.print(text.substr(0, cols));
    var s = text;
    sleep.msleep(delay);
    while(s.length > 0) {
        s = s.substr(1);
        lcd.setCursor(col, row);
        lcd.print((s + ' ').substr(0, cols));
        sleep.msleep(delay);
    }
}

function lcdRunAsync(row, col, cols, text, delay = 750) {
    if (cols === 0) {
      cols = text.length;
    }
    lcd.setCursor(col, row);
    var shipChar = shipPos === row ? '\000' : ' ';
    lcd.print((shipChar + text).substr(0, cols));
    var s = text;
    var i = 0;
    while(s.length > 0) {
        var removedLetter = s.substr(0, 1);
        s = s.substr(1);
        i++;
        timeoutCounter++;
        var timerid = setTimeout(function (s, removedLetter, i) {
            if (gameOver === false) {
                lcd.setCursor(col, row);
                var shipChar = shipPos === row ? '\000' : removedLetter;
                if (shipChar === '\000' && removedLetter !== ' ') {
                    gameOver = true;
                    endOfGame();
                } else {
                    lcd.print((shipChar + s + ' ').substr(0, cols));
                }
            }
            timeoutCounter--;
            if (timeoutCounter === 0) {
                gameOver = true;
                endOfGameWin();
            }
        }, delay * i, s, removedLetter, i);
        timeoutCollection.push(timerid);
    }
}

function clearAllTimeouts() {
    timeoutCollection.forEach(function(index, element) {
        clearTimeout(index);
    });
    timeoutCollection = [];
}

function endOfGame() {
    clearAllTimeouts();
    lcd.clear();
    lcdPut(0, 2, 0, '-GAME  OVER-');
}

function endOfGameWin() {
    clearAllTimeouts();
    lcd.clear();
    lcdPut(0, 3, 0, '-YOU  WIN-');
}

app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function (request, response) {
    response.type('html');
    response.sendFile(__dirname + '/index.html');
});

app.get('/up', function(request, response) {
    shipPos = 0;
    response.json({
      success: true
    });
});

app.get('/down', function(request, response) {
    shipPos = 1;
    response.json({
      success: true
    });
});

app.get('/reset', function(request, response) {
    lcd.clear();
    initGame();
    response.json({
      success: true
    });
});
