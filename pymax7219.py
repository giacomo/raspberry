#!/usr/bin/env python
# -*- coding: utf-8 -*-
import re
import time
from datetime import datetime, timedelta
import argparse

from luma.led_matrix.device import max7219
from luma.core.serial import spi, noop
from luma.core.render import canvas
from luma.core.virtual import viewport
from luma.core.legacy import text, show_message
from luma.core.legacy.font import proportional, CP437_FONT, TINY_FONT, SINCLAIR_FONT, LCD_FONT

serial = spi(port=0, device=0, gpio=noop())
device = max7219(serial, cascaded=4, block_orientation="vertical")

# start clock
while True:
    with canvas(device) as draw:
        # draw.rectangle(device.bounding_box, outline="white", fill="black")
        msg = datetime.now().strftime("%H:%M:%S")
        point = abs(30 - int(datetime.now().strftime("%S")))
        if (point != 0):
            draw.line([1,0, point, 0], fill="white")
        text(draw, (3, 1), msg, fill="white", font=proportional(TINY_FONT))

    time.sleep(1)
