
"use strict";


s64.screen.setup = function() {
    s64.screen.setup_delay = 1000;

    s64.screen.lines = [];
    s64.screen.undos = [];
    s64.screen.mark = null;
    s64.screen.highlight_color = 'rgba(255,255,255,0.2)';
    s64.screen.blink_rate = 512;

    s64.screen.themes = ['C64', 'Blue', 'Terminal',
                         'UbuntuDark', 'UbuntuLight', 'SolarDark',
                         'SolarLight', 'ContrastDark', 'ContrastLight'];

    s64.screen.tts = false;
    s64.screen.tts_rate = 0.9;
    s64.screen.tts_enqueue = false;

    s64.screen.last_tab_listf = '';
    s64.screen.saved_lines = null;
    s64.screen.ALIGN_CENTER = 'center';
    s64.screen.ALIGN_RIGHT = 'right';
    s64.screen.PROMPT = '>';
    s64.screen.READY = 'ready.';

    s64.screen.font_style = 'normal';
    s64.screen.font_family = 'CousineRegular'; // InconsolataMedium, DroidSansMonoRegular, CPMono_v07Bold, CousineRegular
    document.body.style.font = s64.screen.getFontStyle();

    setTimeout(function() {
        document.getElementById('commodore').innerHTML = '';

        // settings loaded from disk
        s64.screen.foreground_color = s64.disk.loadConfig('s64.screen.foreground_color');
        s64.screen.background_color = s64.disk.loadConfig('s64.screen.background_color');
        s64.screen.border_color = s64.disk.loadConfig('s64.screen.border_color');

        s64.screen.buffer = [];
        s64.screen.user_buffer = [];

        s64.screen.cloc = 0; // cursor location (line number) on the screen
        s64.screen.cloch = 0;
        // s64.screen.font_family = s64.disk.loadConfig('s64.screen.font_family');
        s64.screen.font_height = parseInt(s64.disk.loadConfig('s64.screen.font_height'));
        s64.screen.char_width = s64.screen.getCharWidth();
        var line_height = s64.disk.loadConfig('s64.screen.line_height');
        if (line_height) {
            s64.screen.line_height = parseInt(line_height);
            console.log('line height', s64.screen.line_height);
        } else {
            s64.screen.line_height = s64.screen.font_height
                + Math.ceil(s64.screen.font_height * (s64.screen.font_height <= 16 ? .55 : .50));
                console.log('line height', s64.screen.line_height);
        }

        s64.screen.border_width = 30;
        s64.screen.inner_width = (window.innerWidth - (s64.screen.border_width * 2)) - 20;
        s64.screen.width = (s64.screen.inner_width - (s64.screen.inner_width % s64.screen.char_width))
            + (s64.screen.border_width * 2);
        s64.screen.inner_height = (window.innerHeight - (s64.screen.border_width * 2)) - 20;
        s64.screen.height = (s64.screen.inner_height - (s64.screen.inner_height % s64.screen.line_height))
            + (s64.screen.border_width * 2);
        s64.screen.cursor_interval_id = null;
        s64.screen.cursor_on = true;
        s64.screen.first_line = 0;

        // estimated number of characters that fit across the text area
        s64.screen.total_char_width = (s64.screen.width - (s64.screen.border_width * 2)) / s64.screen.char_width;

        s64.screen.canvas = document.createElement('canvas');
        s64.screen.canvas.style.boxShadow = '0px 1px 5px 0px ' + s64.screen.border_color;
        s64.screen.canvas.width = s64.screen.width;
        s64.screen.canvas.height = s64.screen.height;
        s64.screen.canvas.id = 'canvas';
        s64.screen.ctx = s64.screen.canvas.getContext('2d');
        // s64.screen.ctx.imageSmoothingEnabled = false;
        s64.screen.ctx.font = s64.screen.getFontStyle();

        s64.screen.drawBorder();
        s64.screen.drawTextArea();
        s64.screen.ctx.fillStyle = s64.screen.foreground_color;
        s64.screen.ctx.textBaseline = 'top';

        document.getElementById('commodore').appendChild(s64.screen.canvas);
        document.getElementById('commodore').style.width = s64.screen.width + "px";
        document.getElementById('commodore').style.height = s64.screen.height + "px";

        s64.screen.startCursor();

        s64.screen.printLine('SOLE 64 version ' + s64.kernal.VERSION);
        s64.screen.printLine('Simple Operating and Learning Environment');
        s64.screen.printLine("Type 'help' and hit enter to get started");
        s64.screen.printLine('');
        s64.screen.printLine('Ready.');

        s64.screen.current_line_edited = '';

        window.addEventListener('blur', function(event) { s64.screen.blur(); }, true);
        window.addEventListener('focus', function(event) { s64.screen.focus(); }, true);
        window.addEventListener('resize', function(event) {
            s64.screen.refresh();
            s64.vic.refresh();
            s64.v3d.refresh();
        }, true);
        window.addEventListener('click', function(event) { s64.screen.click(event); }, true);

        s64.screen.handleHash(window.location.hash);

        var dropbox;
        dropbox = document.getElementById("commodore");
        dropbox.addEventListener("dragenter", s64.screen.dragenter, false);
        dropbox.addEventListener("dragover", s64.screen.dragover, false);
        dropbox.addEventListener("drop", s64.screen.drop, false);
        s64.screen.dropbox_file = null;

        s64.kernal.restoreSession();

        s64.vic.setup();
        s64.v3d.setup();

        s64.screen.goBuffer()

        s64.screen.canvas.style['-webkit-transform'] = 'scale(1)';

    }, s64.screen.setup_delay);
};

s64.screen.refresh = function() {
    s64.screen.stopCursor();

    s64.screen.inner_width = (window.innerWidth - (s64.screen.border_width * 2)) - 20;
    s64.screen.width = (s64.screen.inner_width - (s64.screen.inner_width % s64.screen.char_width))
        + (s64.screen.border_width * 2);
    s64.screen.inner_height = (window.innerHeight - (s64.screen.border_width * 2)) - 20;
    s64.screen.height = (s64.screen.inner_height - (s64.screen.inner_height % s64.screen.line_height))
        + (s64.screen.border_width * 2);

    s64.screen.total_char_width = (s64.screen.width - (s64.screen.border_width * 2)) / s64.screen.char_width;

    s64.screen.canvas.width = s64.screen.width;
    s64.screen.canvas.height = s64.screen.height;

    s64.screen.ctx = s64.screen.canvas.getContext('2d');
    s64.screen.ctx.font = s64.screen.getFontStyle();

    s64.screen.drawBorder();
    s64.screen.drawTextArea();

    s64.screen.ctx.fillStyle = s64.screen.foreground_color;
    s64.screen.ctx.textBaseline = 'top';

    document.getElementById('commodore').style.width = s64.screen.width + "px";
    document.getElementById('commodore').style.height = s64.screen.height + "px";

    var old_cloc = s64.screen.cloc;
    var screen_lines = Math.floor(s64.screen.getScreenHeightLines());
    if (old_cloc > screen_lines && screen_lines > 0) {
        old_cloc = screen_lines - 1;
    }
    s64.screen.rePrintScreen();
    s64.screen.cloc = old_cloc;
    s64.screen.rePrintLine();
    s64.screen.printCursor();

    s64.screen.startCursor();
};

s64.screen.dragenter = function(e) {
    e.stopPropagation();
    e.preventDefault();
};

s64.screen.dragover = function(e) {
    e.stopPropagation();
    e.preventDefault();
}

s64.screen.drop = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    console.log(files);
    if (files.length > 0) {
        var file = files[0];
        console.log(file);
        s64.disk.loadDroppedFile(file);
    }
};

s64.screen.confirmFileDropLoad = function(answer) {
    console.log('LOADING FILE ' + s64.screen.dropbox_file.file.name);
    console.log(s64.screen.dropbox_file);
    if (answer == 'y' || answer == 'Y') {
        try {
            var data = JSON.parse(s64.screen.dropbox_file.data);
            if (data.length) {
                s64.kernal.memory = data;
                s64.screen.printLine('File loaded');
            } else {
                s64.screen.printLine('File is bad');
            }
        } catch (e) {
            console.log(e);
            s64.screen.printLine('File load failed with error: ' + e);
        }
    } else {
        s64.screen.printLine('Fine.');
    }
};

s64.screen.blur = function() {
    s64.screen.stopCursor();
    s64.screen.clearCursor();
};

s64.screen.focus = function() {
    s64.screen.stopCursor();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.click = function(event) {
    s64.screen.clearHighlight();

    if (event.ctrlKey == true) {
        var copy = s64.screen.getLineAtY(event.y);
        s64.kernal.kill_ring.push(copy);
        if (s64.kernal.kill_ring.length > 30) {
            s64.kernal.kill_ring.slice(s64.kernal.kill_ring.length - 29);
        }
    }
};

s64.screen.getLineAtY = function(y) {
    y = y - s64.screen.border_width - 10;
    var v = Math.floor(y / s64.screen.line_height);
    return s64.screen.lines[s64.screen.first_line + v];
};

s64.screen.getCharWidth = function() {
    var mycanvas = document.createElement('canvas');
    mycanvas.width = 100;
    mycanvas.height = 100;
    var ctx = mycanvas.getContext('2d');
    ctx.font = s64.screen.getFontStyle();
    ctx.textBaseline = 'top';
    var char_width = ctx.measureText('W').width;

    return char_width;
};

s64.screen.getFontStyle = function() {
    return s64.screen.font_style + ' ' + (s64.screen.font_height || 24) + "pt 'Cousine', 'CousineRegular', '" + s64.screen.font_family + "', monospace";
};

s64.screen.reset = function() {
    s64.screen.stopCursor();
    s64.screen.cloc = 0;
    s64.screen.first_line = 0;
    s64.screen.lines = [];
    document.getElementById('commodore').innerHTML = '';
    s64.screen.setup();
};

s64.screen.goBuffer = function(now) {
    now = now || false;
    if (s64.screen.buffer.length > 0) {
        (s64.screen.buffer.shift())();
        if (now) s64.screen.goBuffer();
        else setTimeout(s64.screen.goBuffer, 0); // postMessage method doesn't seem much faster on the chromebook.
    }
};

s64.screen.print = function(text, newline, user_input) {
    newline = newline || false;
    user_input = user_input || false;

    s64.screen.buffer.push(function() { s64.screen.print2(text, newline, user_input); });
    setTimeout(s64.screen.goBuffer, 0);
    return;
};

s64.screen.print2 = function(text, newline, user_input) {
    if (null == text || undefined == text) {
	return;
    }

    s64.screen.stopCursor();

    if (undefined == s64.screen.lines[s64.screen.cloc + s64.screen.first_line]) {
        s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = '';
    }

    s64.screen.ctx.fillStyle = s64.screen.foreground_color;

    if (!user_input && newline) {
        s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = '';
        s64.screen.cloch = 0;
    }

    if (!user_input) {
        if (s64.screen.tts) {
            try {
                setTimeout(function() {
                    chrome.tts.speak(text, {
                        'enqueue': s64.screen.tts_enqueue,
                        'rate': s64.screen.tts_rate
                    });
                }, 50);
            } catch (e) {}
        }
    } else {
        s64.screen.clearHighlight();
    }

    for (var i = 0; i < text.length; i++) {
	s64.screen.clearCursor();
	s64.screen.ctx.fillStyle = s64.screen.foreground_color;

        // if it fits on the screen
	if (s64.screen.ctx.measureText(s64.screen.lines[s64.screen.cloc + s64.screen.first_line]
				       + text[i]).width + s64.screen.border_width
	    <= (s64.screen.width - s64.screen.border_width)) {
	    s64.screen.ctx.fillText(text[i],
				    s64.screen.getCursorXPosition(),
				    s64.screen.getCursorYPosition());

            var line = s64.screen.lines[s64.screen.cloc + s64.screen.first_line];
            line = line.substr(0, s64.screen.cloch) + text[i] + line.substr(s64.screen.cloch).replace(/\s+$/,'');
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = line;

            s64.screen.cloch += 1;

            s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
	} else {
            if (!user_input) {
                var line = s64.screen.lines[s64.screen.cloc + s64.screen.first_line];
                line = line.substr(0, s64.screen.cloch) + text[i] + line.substr(s64.screen.cloch).replace(/\s+$/,'');
                s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = line;

                s64.screen.cloch += 1;
            }
        }
    }

    s64.screen.pushUndo(s64.screen.getCurrentLine());

    s64.screen.printCursor();

    if (newline) {
        s64.screen.clearCursor();
	s64.screen.drawBorder();
	s64.screen.newLine();
        if (s64.screen.lines[s64.screen.cloc + s64.screen.first_line] != undefined) {
            s64.screen.rePrintLine();
        }
	s64.screen.printCursor();
        s64.screen.startCursor();
    } else {
	s64.screen.startCursor();
    }
};

s64.screen.pushUndo = function(current_line) {
    var online = s64.screen.cloc + s64.screen.first_line;
    var undo = s64.screen.undos[online];

    current_line = current_line || '';
    if (undefined == undo) {
        undo = { position: 0, changes: [{ cloch: 0, text: '' }] };

        if (current_line != '') {
            undo['changes'].push({ cloch: s64.screen.cloch, text: current_line });
            undo['position']++;
        }
    }

    if (current_line != undo['changes'][undo['position']]['text']) {
        if (undo['position'] < undo['changes'].length - 1) {
            undo['changes'] = undo['changes'].slice(0, undo['position'] + 1);
        }
        undo['changes'].push({ cloch: s64.screen.cloch, text: current_line == undefined ? '' : current_line });
        undo['position']++;
    }
    s64.screen.undos[online] = undo;
};

s64.screen.undo = function() {
    s64.screen.clearCursor();
    s64.screen.stopCursor();

    var online = s64.screen.cloc + s64.screen.first_line;
    var undo = s64.screen.undos[online];

    var current_line = s64.screen.getCurrentLine() || '';
    if (undefined == undo) {
        undo = { position: 0, changes: [{ cloch: 0, text: '' }] };

        if (current_line != '') {
            undo['changes'].push({ cloch: s64.screen.cloch, text: current_line });
            undo['position']++;
        }
    }


    if (undo['position'] <= 0) undo['position'] = 0;
    else undo['position']--;
    var line = undo['changes'][undo['position']].text;
    s64.screen.setCurrentLine(line);
    s64.screen.rePrintLine();
    s64.screen.cloch = undo['changes'][undo['position']].cloch;
    s64.screen.undos[online] = undo;

    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.redo = function() {
    s64.screen.clearCursor();
    s64.screen.stopCursor();

    var online = s64.screen.cloc + s64.screen.first_line;
    var undo = s64.screen.undos[online];

    var current_line = s64.screen.getCurrentLine() || '';
    if (undefined == undo) {
        undo = { position: 0, changes: [{ cloch: 0, text: '' }] };

        if (current_line != '') {
            undo['changes'].push({ cloch: s64.screen.cloch, text: current_line });
            undo['position']++;
        }
    }

    if (undo['position'] >= undo['changes'].length - 1) undo['position'] = undo['changes'].length - 1;
    else undo['position']++;
    var line = undo['changes'][undo['position']].text;
    s64.screen.setCurrentLine(line);
    s64.screen.rePrintLine();
    s64.screen.cloch = undo['changes'][undo['position']].cloch;
    s64.screen.undos[online] = undo;

    s64.screen.startCursor();
    s64.screen.printCursor();
};

/*
 * override_buffer = true = probably user input
 */
s64.screen.printLine = function(text, override_buffer, align) {
    if (s64.interp.input_queue.length > 0) {
        // console.log("THE PROGRAM IS TRYING TO PRINT SOMETHING TO SCREEN WHILE WAITING FOR USER INPUT. THIS IS NOT OKAY.");
        // return;
    }

    if (align == s64.screen.ALIGN_CENTER) {
        var left_over = s64.screen.total_char_width - text.length;
        if (override_buffer) {
	    left_over = s64.screen.total_char_width - text.length - s64.screen.getCurrentLine().length;
        }

        var padding = Math.floor(left_over / 2)
	for (var i = 0; i < padding; i++) {
	    text = ' ' + text;
	}
    } else if (align == s64.screen.ALIGN_RIGHT) {
        var left_over = s64.screen.total_char_width - text.length;
        if (override_buffer) {
	    var left_over = s64.screen.total_char_width - text.length - s64.screen.getCurrentLine().length;
        }
	for (var i = 0; i < left_over; i++) {
	    text = ' ' + text;
	}
    }

    s64.screen.print(text, true, override_buffer);

    s64.learn.in(text);
};

s64.screen.rePrintLine = function(line_num, cursor_position, erase_current) {
    if (!line_num) {
        line_num = s64.screen.cloc + s64.screen.first_line
    }
    if (!cursor_position) {
	cursor_position = s64.screen.cloc;
    }
    if (erase_current == undefined) {
	erase_current = true;
    }

    if (erase_current) {
	s64.screen.ctx.fillStyle = s64.screen.background_color;
	s64.screen.ctx.fillRect(
	    s64.screen.border_width, (cursor_position * s64.screen.line_height) + s64.screen.border_width,
	    s64.screen.width - s64.screen.border_width * 2, s64.screen.line_height);
    }

    if (s64.screen.ctx.measureText(s64.screen.lines[line_num]).width + s64.screen.border_width
	> (s64.screen.width - s64.screen.border_width)) {
        var line = s64.screen.lines[line_num];
        line = line.substr(0, s64.screen.total_char_width);
        s64.screen.lines[line_num] = line;
    }

    s64.screen.highlight();

    s64.screen.ctx.fillStyle = s64.screen.foreground_color;
    s64.screen.ctx.fillText(
        (undefined != s64.screen.lines[line_num] ? s64.screen.lines[line_num] : ''),
         s64.screen.border_width,
        (cursor_position * s64.screen.line_height) + s64.screen.border_width);

    // s64.screen.pushUndo(s64.screen.lines[line_num]);
};

s64.screen.newLine = function() {
    s64.screen.clearHighlight();

    var scrolled = false;

    s64.screen.cloc += 1;
    s64.screen.cloch = 0;

    // if we need to scroll
    if (s64.screen.cloc >= Math.floor(s64.screen.getScreenHeightLines())) {
	s64.screen.first_line += 1;

	s64.screen.rePrintScreen();

        scrolled = true;
    }

    return scrolled;
};

s64.screen.rePrintScreen = function() {
    s64.screen.drawTextArea();

    var screen_lines = Math.floor(s64.screen.getScreenHeightLines());
    var starting_line = s64.screen.first_line;
    if (screen_lines > s64.screen.lines.length) {
        screen_lines = s64.screen.lines.length;
    }

    s64.screen.cloc = 0;
    var curr_line = starting_line;
    for (var i = 0; i < screen_lines; i++) {
	s64.screen.rePrintLine(curr_line, s64.screen.cloc, false);

        if (i != screen_lines - 1) { // if it's not the last one
	    s64.screen.cloc += 1;
        }
        curr_line++;
    }

    s64.screen.drawBorder();
};

s64.screen.getScreenHeightLines = function() {
    return (s64.screen.height - (s64.screen.border_width * 2)) / s64.screen.line_height;
};

s64.screen.getCurrentLine = function(offset) {
    if (!offset) {
	offset = 0;
    }
    var r = '';
    try {
        r = s64.screen.lines[s64.screen.cloc + s64.screen.first_line + offset];
        if (undefined == r) {
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line + offset] = '';
            r = '';
        }
    } catch (e) {
        console.log(e);
        console.log(e.stack);
    }
    return r;
};

s64.screen.setCurrentLine = function(line, offset) {
    if (!offset) {
	offset = 0;
    }

    s64.screen.lines[s64.screen.cloc + s64.screen.first_line + offset] = line;
};

s64.screen.clearLine = function(line_num) {
    s64.screen.stopCursor();

    var current_line = s64.screen.getCurrentLine();
    var matches = current_line.match(/^(\s+)?\*?(\d+)\s(.+)$/);
    if (matches) {
        if (matches[1] == undefined) matches[1] = '';

        if (current_line.trim().substr(0, 1) == '*') {
            s64.screen.setCurrentLine(matches[1] + '*' + matches[2]);
        } else {
            s64.screen.setCurrentLine(matches[1] + matches[2]);
        }
        s64.screen.cloch = s64.screen.getCurrentLine().length;
    } else {
        if (current_line.substr(0, 1) == s64.screen.PROMPT && s64.interp.input_queue.length > 0) {
            s64.screen.setCurrentLine(s64.screen.PROMPT);
        } else if (current_line.length < 1){
            s64.screen.removeLine();
            return;
        } else {
            s64.screen.setCurrentLine('');
        }
        s64.screen.cloch = s64.screen.getCurrentLine().length;
    }

    s64.screen.pushUndo(s64.screen.lines[line_num]);
    s64.screen.rePrintLine();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.removeLine = function() {
    var slice_point = s64.screen.cloc + s64.screen.first_line;
    s64.screen.lines = s64.screen.lines.slice(0, slice_point).concat(s64.screen.lines.slice(slice_point + 1));
    s64.screen.undos = s64.screen.undos.slice(0, slice_point).concat(s64.screen.undos.slice(slice_point + 1));
    var old_cloc = s64.screen.cloc;
    s64.screen.rePrintScreen();
    s64.screen.cloc = old_cloc;

    s64.screen.rePrintLine();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.pressBackspace = function(event) {
    s64.screen.stopCursor();

    if (s64.screen.getCursorXPosition() >= s64.screen.width - s64.screen.border_width) {
	s64.screen.drawBorder();
    }

    if (s64.screen.cloch > 0) {
        if (s64.screen.cloch == 1
            && s64.screen.getCurrentLine().substr(0, 1) == s64.screen.PROMPT
            && s64.interp.input_queue.length > 0) {
            // getting input; don't delete the question mark
        } else {
            if (event.ctrlKey == true) {
                var num_chars = 1;
                var line = s64.screen.getCurrentLine().substr(0, s64.screen.cloch);
                var splits = line.split(/\b/);
                if (splits) {
                    num_chars = splits[splits.length - 1].length;
                    if (splits[splits.length - 2] == ' ') {
                        num_chars++;
                    }
                }

                s64.screen.cloch -= num_chars;

                s64.screen.lines[s64.screen.cloc + s64.screen.first_line] =
                    s64.screen.getCurrentLine().substr(0, s64.screen.cloch)
                    + s64.screen.getCurrentLine().substr(s64.screen.cloch+num_chars);

            } else {
                s64.screen.cloch -= 1;
                s64.screen.lines[s64.screen.cloc + s64.screen.first_line] =
                    s64.screen.getCurrentLine().substr(0, s64.screen.cloch)
                    + s64.screen.getCurrentLine().substr(s64.screen.cloch+1);
            }
        }
    }

    s64.screen.pushUndo(s64.screen.lines[s64.screen.cloc + s64.screen.first_line]);

    s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
    s64.screen.printCursor();

    s64.screen.startCursor();
};

s64.screen.pressDelete = function(event) {
    s64.screen.stopCursor();

    if (s64.screen.getCursorXPosition() >= s64.screen.width - s64.screen.border_width) {
	s64.screen.drawBorder();
    }

    if (event.ctrlKey == true) {
        var num_chars = 1;
        var line = s64.screen.getCurrentLine().substr(s64.screen.cloch);
        var splits = line.split(/\b/);
        if (splits) {
            num_chars = splits[0].length;
            if (splits[1] == ' ') {
                num_chars++;
            }
        }

        s64.screen.lines[s64.screen.cloc + s64.screen.first_line] =
            s64.screen.getCurrentLine().substr(0, s64.screen.cloch)
            + s64.screen.getCurrentLine().substr(s64.screen.cloch+num_chars);

    } else {
        s64.screen.lines[s64.screen.cloc + s64.screen.first_line] =
            s64.screen.getCurrentLine().substr(0, s64.screen.cloch)
            + s64.screen.getCurrentLine().substr(s64.screen.cloch+1);
    }

    s64.screen.pushUndo(s64.screen.lines[s64.screen.cloc + s64.screen.first_line]);
    s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
    s64.screen.printCursor();

    s64.screen.startCursor();
};

s64.screen.pressEnter = function(ctrl, shift) {
    ctrl = ctrl || false;
    shift = shift || false;

    s64.screen.stopCursor();
    s64.screen.clearCursor();

    if (s64.screen.getCursorXPosition() >= s64.screen.width - s64.screen.border_width) {
	s64.screen.drawBorder();
    }

    var line = s64.screen.getCurrentLine();

    s64.screen.newLine();

    if (shift == true) {
        var slice_point = s64.screen.cloc + s64.screen.first_line;
        s64.screen.lines = s64.screen.lines.slice(0, slice_point).concat('').concat(s64.screen.lines.slice(slice_point));
        var old_cloc = s64.screen.cloc;
        s64.screen.rePrintScreen();
        s64.screen.cloc = old_cloc;
    }

    if (s64.interp.input_queue.length > 1) {
        s64.screen.print(s64.screen.PROMPT);
    } else {
        if (undefined != s64.screen.lines[s64.screen.cloc + s64.screen.first_line]) {
            s64.screen.rePrintLine();
        }
    }

    s64.screen.printCursor();
    s64.screen.startCursor();

    if (ctrl != true) {
        s64.interp.process(line);
    }

    s64.interp.current_history = s64.interp.history.length;
};

s64.screen.pressTab = function(event) {
    var current_line = s64.screen.getCurrentLine();
    var edit_line_regex = /^\*?(\d+)$/;
    var tab_history_regex = /^!(\d+)$/;
    var tab_search_history_regex = /^!(.+)$/;
    var tab_listf_regex = /^(listf|lf)\s(.+)$/;

    if (event.shiftKey == false) {
        if (edit_line_regex.test(current_line)) {
            var matches = edit_line_regex.exec(current_line);
            var line = s64.kernal.memory[parseInt(matches[1])];
            if (line) {
                if (current_line.substr(0, 1) == '*') {
                    s64.screen.setCurrentLine('*' + matches[1] + ' ');
                } else {
                    s64.screen.setCurrentLine(matches[1] + ' ' + line);
                }
                s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
                s64.screen.cloch = s64.screen.getCurrentLine().length;
            } else {
                s64.screen.print(' ');
            }
        } else if (tab_history_regex.test(current_line)) {
            var matches = tab_history_regex.exec(current_line);
            var line = s64.interp.history[parseInt(matches[1])];
            if (line) {
                s64.screen.setCurrentLine(line);
                s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
                s64.screen.cloch = s64.screen.getCurrentLine().length;
            }
        } else if (tab_search_history_regex.test(current_line)) {
            var matches = tab_search_history_regex.exec(current_line);
            var text = matches[1];
            var line = null;

            for (var i = s64.interp.history.length - 1; i >= 0; i--) {
                if (s64.interp.history[i].indexOf(text) == 0) {
                    line = s64.interp.history[i];
                    break;
                }
            }

            if (line == null) {
                var reg = new RegExp(text);
                for (var i = s64.interp.history.length - 1; i >= 0; i--) {
                    if (reg.test(s64.interp.history[i])) {
                        line = s64.interp.history[i];
                        break;
                    }
                }
            }

            if (line) {
                s64.screen.setCurrentLine(line);
                s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
                s64.screen.cloch = s64.screen.getCurrentLine().length;
            }
        } else if (tab_listf_regex.test(current_line)) {
            var matches = tab_listf_regex.exec(current_line);
            var text = matches[2];
            // var subtext = text.substr(0, s64.screen.cloch - 6);

            var found = false;
            for (var name in s64.interp.functions) {
                if (name.toLowerCase().indexOf(text.toLowerCase()) == 0) {
                    s64.screen.setCurrentLine(matches[1] + ' ' + name);
                    s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
                    s64.screen.cloch = s64.screen.getCurrentLine().length;
                    break;
                }
            }
        } else {
	    s64.screen.print('   ', false, true);
        }
    } else if (event.shiftKey == true) {

    }
};

s64.screen.pressLeftArrow = function(event) {
    if (s64.screen.cloch == 1
        && s64.screen.getCurrentLine().substr(0, 1) == s64.screen.PROMPT
        && s64.interp.input_queue.length > 0) {
        // getting input; don't delete the question mark
    } else if (s64.screen.cloch > 0) {
        if (s64.screen.getCursorXPosition() >= s64.screen.width - s64.screen.border_width) {
	    s64.screen.drawBorder();
	}

        s64.screen.stopCursor();

        var num_chars = 1;
        if (event.ctrlKey == true) {
            var line = s64.screen.getCurrentLine().substr(0, s64.screen.cloch);
            var splits = line.split(/\b/);
            if (splits) {
                num_chars = splits[splits.length - 1].length;
                if (splits[splits.length - 2] == ' ') {
                    num_chars++;
                }
            }
        }

        if (event.shiftKey == true) {
            if (null == s64.screen.mark) s64.screen.setKillMark();
        } else {
            if (null != s64.screen.mark) s64.screen.clearHighlight();
        }

        s64.screen.cloch -= num_chars;

        s64.screen.trimCurrentLine();

        s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
        s64.screen.printCursor();
        s64.screen.startCursor();
    }
};

s64.screen.trimCurrentLine = function() {
    var line = s64.screen.getCurrentLine();
    var c = s64.screen.cloch;
    line = line.substr(0, c) + line.substr(c).replace(/\s+$/,'');
    s64.screen.setCurrentLine(line);
};

s64.screen.pressRightArrow = function(event) {
    if (s64.screen.cloch < s64.screen.getCurrentLine().length) {
        s64.screen.stopCursor();

        var num_chars = 1;
        if (event.ctrlKey == true) {
            var line = s64.screen.getCurrentLine().substr(s64.screen.cloch);
            var splits = line.split(/\b/);
            if (splits) {
                num_chars = splits[0].length;
                if (splits[1] == ' ') {
                    num_chars++;
                }
            }
        }

        if (event.shiftKey == true) {
            if (null == s64.screen.mark) s64.screen.setKillMark();
        } else {
            if (null != s64.screen.mark) s64.screen.clearHighlight();
        }

        s64.screen.cloch += num_chars;

        s64.screen.trimCurrentLine();

        s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
        s64.screen.printCursor();
        s64.screen.startCursor();
    }
};

s64.screen.pressUpArrow = function(event) {
    event = event || { ctrlKey: false };

    s64.screen.clearHighlight();

    if (event.ctrlKey == true) {
        s64.screen.upHistory();
        return;
    }

    if (s64.interp.input_queue.length > 0) {
        return;
    }

    s64.screen.stopCursor();
    s64.screen.clearCursor();

    s64.screen.cloc--;
    if (s64.screen.cloc < 0) {
        if (s64.screen.first_line <= 0) {
            s64.screen.cloc = 0;
        } else {
            s64.screen.scrollUp();
        }
    }

    if (s64.screen.cloch > s64.screen.getCurrentLine().length) {
        s64.screen.cloch = s64.screen.getCurrentLine().length;
    }

    s64.screen.printCursor();
    s64.screen.startCursor();
};

s64.screen.pressDownArrow = function(event) {
    event = event || { ctrlKey: false };

    s64.screen.clearHighlight();

    if (event.ctrlKey == true) {
        s64.screen.downHistory();
        return;
    }

    if (s64.interp.input_queue.length > 0) {
        return;
    }

    if (undefined == s64.screen.lines[s64.screen.cloc + s64.screen.first_line + 1]) {
        return;
    }

    s64.screen.stopCursor();
    s64.screen.clearCursor();
    s64.screen.cloc++;

    var screen_lines = Math.floor(s64.screen.getScreenHeightLines());
    if (s64.screen.cloc >= screen_lines) {
        s64.screen.scrollDown();
    }

    if (s64.screen.cloch > s64.screen.getCurrentLine().length) {
        s64.screen.cloch = s64.screen.getCurrentLine().length;
    }

    s64.screen.printCursor();
    s64.screen.startCursor();
};

s64.screen.upHistory = function() {
    s64.screen.stopCursor();

    if (s64.interp.current_history == s64.interp.history.length) {
        s64.screen.current_line_edited = s64.screen.getCurrentLine();
        if (s64.interp.input_queue.length > 0) {
            s64.screen.current_line_edited = s64.screen.current_line_edited.substr(1);
        }
    }

    if (s64.interp.current_history > 0) {
        s64.interp.current_history--;
    }

    var command = s64.interp.history[s64.interp.current_history];

    if (command) {
        if (s64.interp.input_queue.length > 0) {
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = s64.screen.PROMPT + command;
        } else {
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = command;
        }
        s64.screen.cloch = s64.screen.lines[s64.screen.cloc + s64.screen.first_line].length;
        s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
    }

    s64.screen.printCursor();
    s64.screen.startCursor();
};

s64.screen.downHistory = function() {
    s64.screen.stopCursor();

    var command = undefined;

    if (s64.interp.current_history < s64.interp.history.length) {
        s64.interp.current_history++;
        command = s64.interp.history[s64.interp.current_history];
        if (!command) {
            command = s64.screen.current_line_edited;
        }
    }

    if (undefined != command) {
        if (s64.interp.input_queue.length > 0) {
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = s64.screen.PROMPT + command;
        } else {
            s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = command;
        }
        s64.screen.cloch = s64.screen.lines[s64.screen.cloc + s64.screen.first_line].length;
        s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
    }

    s64.screen.printCursor();
    s64.screen.startCursor();
};

s64.screen.pressHomeKey = function(event) {
    s64.screen.stopCursor();

    if (event.shiftKey == true) {
        if (null == s64.screen.mark) s64.screen.setKillMark();
    } else {
        if (null != s64.screen.mark) s64.screen.clearHighlight();
    }

    if (event.ctrlKey == true) { // go to top
        if (s64.interp.input_queue.length < 1) {
            var old_cloc = s64.screen.cloc;

            s64.screen.first_line = 0;
            s64.screen.rePrintScreen();
            s64.screen.cloch = 0;
            s64.screen.cloc = 0;

            var screen_lines = Math.floor(s64.screen.getScreenHeightLines());
            if (s64.screen.lines.length < screen_lines) {
                s64.screen.rePrintLine(s64.screen.lines.length - 1, s64.screen.lines.length - 1);
            }

            s64.screen.startCursor();
            s64.screen.printCursor();
            return;
        }
    }

    if (s64.interp.input_queue.length > 0 && s64.screen.getCurrentLine()[0] == s64.screen.PROMPT) {
        s64.screen.cloch = 1;
    } else {
        s64.screen.cloch = 0;
    }

    s64.screen.trimCurrentLine();
    s64.screen.rePrintLine();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.pressEndKey = function(event) {
    s64.screen.stopCursor();

    if (event.shiftKey == true) {
        if (null == s64.screen.mark) s64.screen.setKillMark();
    } else {
        if (null != s64.screen.mark) s64.screen.clearHighlight();
    }

    if (event.ctrlKey == true) { // go to bottom
        if (s64.interp.input_queue.length < 1) {
            var screen_lines = Math.floor(s64.screen.getScreenHeightLines());
            // if (s64.screen.lines < screen_lines) screen_lines = s64.screen.lines;
            s64.screen.first_line = s64.screen.lines.length - screen_lines;
            if (s64.screen.first_line < 0) s64.screen.first_line = 0;
            s64.screen.rePrintScreen();
            s64.screen.cloch = s64.screen.getCurrentLine().length;
            s64.screen.startCursor();
            s64.screen.printCursor();
            return;
        }
    }

    s64.screen.cloch = s64.screen.getCurrentLine().length;
    s64.screen.trimCurrentLine();
    s64.screen.rePrintLine();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.getCharacterUnderCursor = function() {
    var line = s64.screen.getCurrentLine();
    var c = '';

    if (line && s64.screen.cloch <= line.length) {
        c = line.slice(s64.screen.cloch, s64.screen.cloch + 1);
    }

    return c;
};

s64.screen.printCursor = function() {
    if (s64.screen.getCurrentLine() == undefined) {
        s64.screen.print('');
    }

    var begin_fill_style = s64.screen.ctx.fillStyle;

    s64.screen.ctx.fillStyle = s64.screen.foreground_color;

    var x = s64.screen.getCursorXPosition();
    var y = s64.screen.getCursorYPosition();
    var width = s64.screen.char_width;
    var height = s64.screen.line_height;
    var radius = 1;

    // rounded rectangle from http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
    s64.screen.ctx.beginPath();
    s64.screen.ctx.moveTo(x + radius, y);
    s64.screen.ctx.lineTo(x + width - radius, y);
    s64.screen.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    s64.screen.ctx.lineTo(x + width, y + height - radius);
    s64.screen.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    s64.screen.ctx.lineTo(x + radius, y + height);
    s64.screen.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    s64.screen.ctx.lineTo(x, y + radius);
    s64.screen.ctx.quadraticCurveTo(x, y, x + radius, y);
    s64.screen.ctx.closePath();
    s64.screen.ctx.fill();

    /*
      s64.screen.ctx.fillRect(
      s64.screen.getCursorXPosition(), s64.screen.getCursorYPosition(),
      s64.screen.char_width, s64.screen.line_height);
    */

    s64.screen.ctx.fillStyle = s64.screen.background_color;
    s64.screen.ctx.fillText(s64.screen.getCharacterUnderCursor(),
			    s64.screen.getCursorXPosition(),
			    s64.screen.getCursorYPosition());

    s64.screen.ctx.fillStyle = begin_fill_style;
};

s64.screen.clearCursor = function() {
    if (s64.screen.getCursorXPosition() >= s64.screen.width - s64.screen.border_width) {
       	s64.screen.ctx.fillStyle = s64.screen.border_color;
    } else {
	s64.screen.ctx.fillStyle = s64.screen.background_color;
    }

    s64.screen.ctx.fillRect(
	s64.screen.getCursorXPosition(), s64.screen.getCursorYPosition(),
	s64.screen.char_width, s64.screen.line_height);

    if (s64.screen.mark != null) {
        s64.screen.ctx.fillStyle = s64.screen.highlight_color;
        s64.screen.ctx.fillRect(
	    s64.screen.getCursorXPosition(), s64.screen.getCursorYPosition(),
	    s64.screen.char_width, s64.screen.line_height);

    }

    s64.screen.ctx.fillStyle = s64.screen.foreground_color;
    s64.screen.ctx.fillText(s64.screen.getCharacterUnderCursor(),
			    s64.screen.getCursorXPosition(),
			    s64.screen.getCursorYPosition());

};

s64.screen.toggleCursor = function() {
    if (s64.screen.cursor_on) {
	s64.screen.clearCursor();
	s64.screen.cursor_on = false;
    } else {
	s64.screen.printCursor();
	s64.screen.cursor_on = true;
    }
};

s64.screen.stopCursor = function() {
    s64.screen.cursor_on = false;

    clearInterval(s64.screen.cursor_interval_id);
    s64.screen.cursor_interval_id = null;
};

s64.screen.startCursor = function() {
    if (s64.screen.cursor_interval_id != null) {
        s64.screen.stopCursor();
    }

    s64.screen.cursor_on = true;
    if (s64.screen.blink_rate > 0) {
        s64.screen.cursor_interval_id = window.setInterval(s64.screen.toggleCursor, s64.screen.blink_rate);
    }
};

s64.screen.getCursorPosition = function() {
    return [s64.screen.getCursorXPosition(), s64.screen.getCursorYPosition()];
};

s64.screen.getCursorXPosition = function() {
    // still haven't figured this one out: in chrome on linux and windows, I can always guess the x
    // position of the cursor by taking the number of characters from the left that it is and multiplying
    // that by the character width. However, on the cr-48 chromebook, the character width reported by
    // measureText() and the actual character width that the canvas prints the text as, is different.
    // (Character width report the same on chromebook and chrome.) So the only reliable way to determine the
    // x coordinate of the cursor is by using measureText. So much for assuming a character was XxY. These
    // are monospace fonts I'm using, and it actually appears some characters render as the expected width
    // and others do not. It's polyspacing? Indeed, monospace fonts on chrome os do not appear to render monospaced.
    var x = (s64.screen.ctx.measureText(s64.screen.getCurrentLine().substr(0, s64.screen.cloch)).width
             + s64.screen.border_width);
    // var x = (s64.screen.cloch * s64.screen.char_width) + s64.screen.border_width;

    return x;
};

s64.screen.getCursorYPosition = function() {
    return (s64.screen.cloc * s64.screen.line_height) + s64.screen.border_width;
};


s64.screen.drawBorder = function() {
    s64.screen.ctx.fillStyle = s64.screen.border_color;

    s64.screen.ctx.fillRect(0, 0, s64.screen.border_width, s64.screen.height);
    s64.screen.ctx.fillRect(s64.screen.width - s64.screen.border_width, 0,
			    s64.screen.width, s64.screen.height);

    s64.screen.ctx.fillRect(s64.screen.border_width, 0,
			    s64.screen.width - s64.screen.border_width, s64.screen.border_width);

    s64.screen.ctx.fillRect(s64.screen.border_width, s64.screen.height - s64.screen.border_width,
			    s64.screen.width - s64.screen.border_width, s64.screen.height);
};

s64.screen.drawTextArea = function() {
    s64.screen.ctx.fillStyle = s64.screen.background_color;
    s64.screen.ctx.fillRect(s64.screen.border_width,
			    s64.screen.border_width,
			    s64.screen.width - s64.screen.border_width * 2,
			    s64.screen.height - s64.screen.border_width * 2);
};

s64.screen.listMemory = function(start, stop) {
    if (start == 0 && stop == 0) {
        return;
    }

    var padding = ((stop - start) + '').length;
    var t = 0;
    for (var i = start; i <= stop; i++) {
	if (s64.kernal.memory[i]) {
	    s64.screen.printLine(s64.screen.padNumber(i, padding) + ' ' + s64.kernal.memory[i]);
	}
    }
};

s64.screen.listHistory = function() {
    var padding = ((s64.interp.history.length - 1) + '').length;

    for (var i = 0; i < s64.interp.history.length; i++) {
        s64.screen.printLine(s64.screen.padNumber(i, padding) + ' ' + s64.interp.history[i]);
    }
};

s64.screen.runHistory = function(command) {
    s64.screen.printLine(command);
};

s64.screen.padNumber = function(num, padding) {
    var paddedNumberString = '' + num;

    while (paddedNumberString.length < padding) {
        paddedNumberString = ' ' + paddedNumberString;
    }

    return paddedNumberString;
};

s64.screen.handleHash = function(hash) {
    window.location.hash = '';

    var hash_regex = /#help:(\w+)/;
    if (hash_regex.test(hash)) {
        var matches = hash_regex.exec(hash);
        s64.help.show(matches[1]);
    }
};

s64.screen.showLastSave = function() {
    var save_regex = /^save(\s)(\w+|\w+@\w+)/;
    for (var i = s64.interp.history.length; i > 0; i--) {
        if (save_regex.test(s64.interp.history[i])) {
            s64.screen.print(s64.interp.history[i]);
            break;
        }
    }
};

s64.screen.throwFit = function(message) {
    s64.vic.clear();
    s64.interp.input_queue = [];
    if (message) s64.screen.printLine(message);
};

s64.screen.scrollUp = function() {
    var screen_lines = Math.floor(s64.screen.getScreenHeightLines());

    if (s64.screen.first_line <= 0) {
        return;
    }

    s64.screen.first_line--;
    var starting_line = s64.screen.first_line;

    s64.screen.drawTextArea();

    s64.screen.cloc = 0;
    var j = 1;
    for (var i = starting_line; i < s64.screen.lines.length; i++) {
        if (j > screen_lines) {
            break;
        }
        j++;
	s64.screen.rePrintLine(i, s64.screen.cloc, false);
        if (i != s64.screen.lines.length - 1) { // if it's the last one
	    s64.screen.cloc += 1;
        }
    }

    s64.screen.drawBorder();

    s64.screen.cloc = 0;
};

s64.screen.scrollDown = function() {
    var screen_lines = Math.floor(s64.screen.getScreenHeightLines());

    s64.screen.first_line++;
    var starting_line = s64.screen.first_line;

    s64.screen.drawTextArea();

    s64.screen.cloc = 0;
    var j = 1;
    for (var i = starting_line; i < s64.screen.lines.length; i++) {
        if (j > screen_lines) {
            break;
        }
        j++;
	s64.screen.rePrintLine(i, s64.screen.cloc, false);
        if (i != s64.screen.lines.length - 1) { // if it's not the last one
	    s64.screen.cloc += 1;
        }
    }

    s64.screen.drawBorder();

    s64.screen.cloc = screen_lines - 1;
};

s64.screen.pressPageUp = function(event) {
    var lines = Math.floor(s64.screen.getScreenHeightLines());
    if (event.shiftKey == true) lines = Math.ceil(lines / 2);
    for (var i = 0; i < lines - 1; i++) {
        s64.screen.pressUpArrow();
    }
};

s64.screen.pressPageDown = function(event) {
    var lines = Math.floor(s64.screen.getScreenHeightLines());
    if (event.shiftKey == true) lines = Math.ceil(lines / 2);
    for (var i = 0; i < lines - 1; i++) {
        s64.screen.pressDownArrow();
    }
};

s64.screen.clearScreen = function() {
    s64.screen.stopCursor();
    s64.screen.lines = [];
    s64.screen.undos = [];
    s64.screen.buffer = [];
    s64.screen.first_line = 0;
    s64.screen.clearHighlight();
    s64.screen.rePrintScreen();
    s64.screen.startCursor();
    s64.screen.printCursor();
};

s64.screen.saveFileCallback = function(e) {
    if (e.type == 'success') {
        s64.screen.printLine('File saved');
    } else {
        s64.screen.printLine('!Error: File not saved');
    }
};

s64.screen.saveRemoteFileCallback = function(e) {
    if (e.target.status == 200 && e.target.response != '0') {
        s64.screen.printLine('File saved to remove server');
    } else {
        s64.screen.printLine('!Error: File not saved');
    }
};

s64.screen.removeRemoteFileCallback = function(e) {
    if (e.target.status == 200 && e.target.response != '0') {
        s64.screen.printLine('File removed from remote server');
    } else {
        s64.screen.printLine('!Error: File not removed');
    }
};

s64.screen.setTheme = function(num) {
    var name = s64.screen.themes[num-1].toLowerCase();

    if (undefined == name || null == name || !s64.disk.configs[name]) {
        s64.screen.printLine('');
        s64.screen.printLine('Theme not found');
        return;
    }

    s64.disk.default_config = name;
    s64.disk.resetConfigsForTheme();

    window.location.reload();
};

s64.screen.setFontSize = function(size) {
    if (size < 1) {
        s64.screen.printLine('');
        s64.screen.printLine('Please choose a font size greater than 0');
        return;
    }

    s64.disk.saveConfig('s64.screen.font_height', size);
    window.location.reload();
};

s64.screen.setFontFamily = function(name) {
    s64.disk.saveConfig('s64.screen.font_family', name);
    window.location.reload();
};

s64.screen.setKillMark = function() {
    s64.screen.mark = s64.screen.cloch;
};

s64.screen.cut = function() {
    if (s64.screen.mark == null) return;

    var old_cloch = s64.screen.cloch;

    var start = s64.screen.mark <= s64.screen.cloch ? s64.screen.mark : s64.screen.cloch;
    var stop = s64.screen.cloch >= s64.screen.mark ? s64.screen.cloch : s64.screen.mark;

    var line = s64.screen.lines[s64.screen.cloc + s64.screen.first_line];
    var cut = line.substr(start, stop - start + 1);
    line = line.substr(0, start) + line.substr(stop + 1);

    s64.kernal.kill_ring.push(cut);
    if (s64.kernal.kill_ring.length > 30) {
        s64.kernal.kill_ring.slice(s64.kernal.kill_ring.length - 29);
    }

    s64.screen.lines[s64.screen.cloc + s64.screen.first_line] = line;
    s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);

    if (s64.screen.getCurrentLine().length < old_cloch) {
        s64.screen.cloch = s64.screen.getCurrentLine().length;
    }

    s64.screen.clearHighlight();
};

s64.screen.copy = function() {
    if (s64.screen.mark == null) return;

    var start = s64.screen.mark <= s64.screen.cloch ? s64.screen.mark : s64.screen.cloch;
    var stop = s64.screen.cloch >= s64.screen.mark ? s64.screen.cloch : s64.screen.mark;

    var copy = s64.screen.lines[s64.screen.cloc + s64.screen.first_line];
    copy = copy.substr(start, stop - start + 1);

    s64.kernal.kill_ring.push(copy);
    if (s64.kernal.kill_ring.length > 30) {
        s64.kernal.kill_ring.slice(s64.kernal.kill_ring.length - 29);
    }

    s64.screen.clearHighlight();
};

s64.screen.paste = function() {
    s64.screen.print(s64.kernal.kill_ring[s64.kernal.kill_ring.length - 1], false, true);
};

s64.screen.clearHighlight = function() {
    s64.screen.mark = null;
    s64.screen.rePrintLine();
};

s64.screen.highlight = function() {
    if (s64.screen.mark == null) return;

    s64.screen.ctx.fillStyle = s64.screen.highlight_color;
    var x = s64.screen.ctx.measureText(s64.screen.getCurrentLine().substr(0, s64.screen.mark)).width + s64.screen.border_width;
    var y = s64.screen.getCursorYPosition();
    var w = s64.screen.getCursorXPosition() - x;
    if (w < 0) x += s64.screen.char_width;
    var h = s64.screen.line_height;
    s64.screen.ctx.fillRect(x, y, w, h);
};

s64.screen.PrioritySet = function() {

};
s64.screen.PrioritySet.prototype.list = [];
s64.screen.PrioritySet.prototype.set = {};
s64.screen.PrioritySet.prototype.add = function(item) {
    if (item in this.set) {
        this.set[item]++;
    } else {
        this.set[item] = 1;
    }
    if (this.list.indexOf(item) == -1) this.list.push(item);

    return this;
};
s64.screen.PrioritySet.prototype.sort = function() {
    var a = [];
    for (var key in this.set) {
        a.push({ key: key, value: this.set[key] });
    }
    a.sort(this.sortSet);
    this.list = [];
    for (var key in a) {
        this.list.push(a[key].key);
    }
    this.list.reverse();

    return this;
};
s64.screen.PrioritySet.prototype.sortSet = function(a, b) {
    return a['value'] - b['value'];
};
s64.screen.PrioritySet.prototype.match = function(text) {
    this.sort();

    var reg = new RegExp('^' + text + '.*');
    var matches = [];
    for (var i in this.list) {
        if (reg.test(this.list[i])) matches.push(this.list[i]);
    }

    var match = '';
    if (matches.length) {
        match = matches[0];
    }

    console.log(matches);
    console.log(match);
};