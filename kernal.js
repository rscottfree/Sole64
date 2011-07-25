
"use strict";

function S64() {
    this.kernal = {};
    this.screen = {};
    this.interp = {};
    this.disk = {};
    this.help = {};
    this.vic = {};
    this.v3d = {};
    this.learn = {};
};

var s64 = new S64();

s64.kernal.VERSION = '0.1.0.6';

s64.kernal.max_lines = 1000000;//65534;

s64.kernal.keys = {};
s64.kernal.keys.BACKSPACE = 8;
s64.kernal.keys.DELETE = 46;
s64.kernal.keys.SPACE = 32;
s64.kernal.keys.ENTER = 13;
s64.kernal.keys.ENTER2 = 10;
s64.kernal.keys.TAB = 9;
s64.kernal.keys.LEFT_ARROW = 37;
s64.kernal.keys.RIGHT_ARROW = 39;
s64.kernal.keys.UP_ARROW = 38;
s64.kernal.keys.DOWN_ARROW = 40;
s64.kernal.keys.HOME = 36;
s64.kernal.keys.END = 35;
s64.kernal.keys.PAGE_UP = 33;
s64.kernal.keys.PAGE_DOWN = 34;
s64.kernal.keys.ESCAPE = 27;

s64.kernal.keys.D = 68;
s64.kernal.keys.S = 83;
s64.kernal.keys.C = 67;
s64.kernal.keys.Q = 81;
s64.kernal.keys.V = 86;
s64.kernal.keys.X = 88;
s64.kernal.keys.Y = 89;
s64.kernal.keys.Z = 90;
s64.kernal.keys.M = 13;
s64.kernal.keys.B = 2;


s64.kernal.memory = [];
s64.kernal.copy_buffers = [];
s64.kernal.delayedOperations = [];
s64.kernal.kill_ring = [];

s64.kernal.uplink_id = null;
s64.kernal.downlink_id = null;
s64.kernal.foreign_downlink_id = null;
s64.kernal.temp_lines = null;


s64.kernal.setup = function() {
    document.body.style.backgroundColor = "#111";
    s64.disk.setup();
};

s64.kernal.contSetup = function() {
    s64.disk.loadConfigs();
    s64.disk.loadCopyBuffers();

    s64.interp.loadHistory();
    s64.screen.setup();

    document.body.addEventListener('keypress', function(event) {
        s64.kernal.handleInput(event); }, true);
    document.body.addEventListener('keydown', function(event) {
        s64.kernal.filterInput(event); }, true);
    document.getElementById('commodore').
        addEventListener('mousewheel', function(event) {
            s64.kernal.handleMouseWheel(event); }, true);
    // chrome.runtime.onSuspend.addListener(function(event) {
    //     return s64.kernal.handleUnLoad(event);
    // });

    document.body.style.backgroundColor = "#111";
};

s64.kernal.handleUnLoad = function(event) {
    var session = {
        'memory': s64.kernal.memory,
    };
    s64.disk.saveToLocalStorage('session', JSON.stringify(session));
    // s64.disk.saveCopyBuffers();
};

s64.kernal.restoreSession = function() {
    s64.disk.loadFromLocalStorage('session', function(data) {
        data = data || null;
        console.log('session', data);
        var restoredata = JSON.parse(data);
        if (restoredata) {
            s64.kernal.memory = restoredata.memory || [];
            s64.interp.analyzeCode();
        } else {
            s64.disk.load('session', s64.kernal.handleRestoreSessionResponse);
        }

    });
};

s64.kernal.handleRestoreSessionResponse = function(result) {
    if (result && result.data) {
        var session = result.data;
        s64.kernal.memory = JSON.parse(session.memory) || [];
        s64.interp.analyzeCode();
    }
};

s64.kernal.filterInput = function(event) {
    // console.log(event);

    if (event.keyCode == s64.kernal.keys.UP_ARROW) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressUpArrow(event);
    }

    if (event.keyCode == s64.kernal.keys.DOWN_ARROW) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressDownArrow(event);
    }

    if (event.keyCode == s64.kernal.keys.PAGE_UP) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressPageUp(event);
    }

    if (event.keyCode == s64.kernal.keys.PAGE_DOWN) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressPageDown(event);
    }

    // keyboard shortcuts
    if (event.ctrlKey == true) {
        // ctrl-d = clear line
        if (event.keyCode == s64.kernal.keys.D) {
            event.preventDefault();
	    event.stopPropagation();
            s64.screen.clearLine();
        }

        // ctrl-s = save
        if (event.keyCode == s64.kernal.keys.S) {
            event.preventDefault();
	    event.stopPropagation();
            s64.screen.showLastSave();
        }

        // ctrl-q = stop
        if (event.keyCode == s64.kernal.keys.Q) {
            event.preventDefault();
            event.stopPropagation();
            s64.kernal.stop();
        }

        // ctrl-x = cut
        if (event.keyCode == s64.kernal.keys.X) {
            s64.screen.cut();
        }

        // ctrl-c = copy
        if (event.keyCode == s64.kernal.keys.C) {
            s64.screen.copy();
        }

	// ctrl-v = paste
	if (event.keyCode == s64.kernal.keys.V) {
            s64.screen.paste();
	    // event.preventDefault();
	    // event.stopPropagation();
	}

        // ctrl-z
        if (event.keyCode == s64.kernal.keys.Z) {
            event.preventDefault();
	    event.stopPropagation();
            s64.screen.undo();
        }

        // ctrl-y
        if (event.keyCode == s64.kernal.keys.Y) {
            event.preventDefault();
	    event.stopPropagation();
            s64.screen.redo();
        }

        if (event.shiftKey == true) {
            // ctrl-shift-space = set mark
            if (event.keyCode == s64.kernal.keys.SPACE) {
                // event.preventDefault();
	        // event.stopPropagation();
                // s64.screen.setKillMark();
            }
        }
    }

    // shift key shortcuts
    if (event.shiftKey == true) {

    }

    if (event.keyCode == s64.kernal.keys.BACKSPACE) {
	event.preventDefault();
	event.stopPropagation();

	s64.screen.pressBackspace(event);
    }

    if (event.keyCode == s64.kernal.keys.DELETE) {
        event.preventDefault();
	event.stopPropagation();

	s64.screen.pressDelete(event);
    }

    if (event.keyCode == s64.kernal.keys.TAB) {
	event.preventDefault();
	event.stopPropagation();

	s64.screen.pressTab(event);
    }

    if (event.keyCode == s64.kernal.keys.LEFT_ARROW) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressLeftArrow(event);
    }

    if (event.keyCode == s64.kernal.keys.RIGHT_ARROW) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressRightArrow(event);
    }

    if (event.keyCode == s64.kernal.keys.HOME) {
        event.preventDefault();
	event.stopPropagation();

        s64.screen.pressHomeKey(event);
    }

    if (event.keyCode == s64.kernal.keys.END) {
	event.preventDefault();
	event.stopPropagation();

        s64.screen.pressEndKey(event);
    }

    if (event.keyCode == s64.kernal.keys.ESCAPE) {
        s64.screen.mark = null;
        s64.screen.rePrintLine();
    }
};

s64.kernal.handleInput = function(event) {
    // console.log(event);

    if (event.charCode == s64.kernal.keys.SPACE) {
	event.preventDefault();
    }

    if (event.charCode == s64.kernal.keys.ENTER || event.charCode == s64.kernal.keys.ENTER2) {
	s64.screen.pressEnter(event.ctrlKey, event.shiftKey);

	return;
    }

    if (event.charCode == s64.kernal.keys.TAB) {

    }

    s64.screen.print(String.fromCharCode(event.charCode), false, true);

};

s64.kernal.handleMouseWheel = function(event) {
    var distance = Math.floor(Math.abs(event.wheelDeltaY) / s64.screen.getScreenHeightLines());
    if (event.wheelDeltaY < 0) { // down
        for (var i = 0; i < distance; i++) s64.screen.pressDownArrow();
    } else if (event.wheelDeltaY > 0) { // up
        for (var i = 0; i < distance; i++) s64.screen.pressUpArrow();
    }
};

s64.kernal.reset = function() {
    s64.kernal.memory = [];
    s64.screen.reset();
};

s64.kernal.insertLines = function(number, where) {
    var first = s64.kernal.memory.slice(0, where);
    var last = s64.kernal.memory.slice(where)
    var middle = new Array(number);

    s64.kernal.memory = [].concat(first, middle, last);

    s64.kernal.trimMemory();
};

//inclusive
s64.kernal.deleteLines = function(start, stop) {
    start = parseInt(start);
    stop = parseInt(stop);

    var first = s64.kernal.memory.slice(0, start);
    var middle = new Array((stop - start) + 1);
    var last = s64.kernal.memory.slice(stop+1);
    s64.kernal.memory = [].concat(first, middle, last);

    s64.kernal.trimMemory();
};

s64.kernal.moveLines = function(from, to, where) {
    from = parseInt(from);
    to = parseInt(to);
    where = parseInt(where);

    var lines = s64.kernal.memory.slice(from, to+1);
    s64.kernal.deleteLines(from, to);
    s64.kernal.insertLines(lines.length, where);
    var which_line = 0;
    for (var i = where; i < where + lines.length; i++) {
        s64.kernal.memory[i] = lines[which_line];
        which_line += 1;
    }

    s64.kernal.trimMemory();
};

s64.kernal.copyLines = function(from, to, where) {
    from = parseInt(from);
    to = parseInt(to);

    var lines = s64.kernal.memory.slice(from, to+1);
    s64.kernal.copy_buffers[0] = lines;

    var buffer_regex = /^buffer\s(\d+)$/;
    if (buffer_regex.test(where)) {
        var matches = buffer_regex.exec(where);
        var buffer_num = parseInt(matches[1]);
        if (buffer_num != 0 && buffer_num <= 100) {
            s64.kernal.copy_buffers[buffer_num] = lines;
            s64.disk.saveCopyBuffers();
        } else if (buffer_num > 100) {
            return 'Buffer ' + buffer_num + ' is not available. Please choose a number from 1 through 100.';
        } else {
            return 'Buffer 0 is write only. Please choose another buffer.';
        }

        return;
    }

    s64.disk.saveCopyBuffers();

    where = parseInt(where);

    s64.kernal.insertLines(lines.length, where);
    var which_line = 0;
    for (var i = where; i < where + lines.length; i++) {
        s64.kernal.memory[i] = lines[which_line];
        which_line += 1;
    }

    s64.kernal.trimMemory();

    return true;
};

s64.kernal.pasteLines = function(buffer_num, where) {
    buffer_num = parseInt(buffer_num);
    where = parseInt(where);
    var lines = s64.kernal.copy_buffers[buffer_num];
    if (!lines) {
        return 'Buffer ' + buffer_num + ' is empty';
    }

    s64.kernal.insertLines(lines.length, where);
    var which_line = 0;
    for (var i = where; i < where + lines.length; i++) {
        s64.kernal.memory[i] = lines[which_line];
        which_line += 1;
    }

    s64.kernal.trimMemory();
};

s64.kernal.trimMemory = function() {
    // trim blank lines off of end of memory
    for (var i = s64.kernal.memory.length - 1; i > -1; i--) {
        if (s64.kernal.memory[i] == '' || s64.kernal.memory[i] == undefined || s64.kernal.memory[i] == null) {
            s64.kernal.memory.pop();
        } else {
            return;
        }
    }
};

s64.kernal.startUplink = function() {
    s64.screen.printLine('');

    var first = false;
    if (s64.kernal.uplink_id != null && s64.kernal.downlink_id != null) {
        s64.screen.printLine('Uplink already established with downlink ID: ' + s64.kernal.downlink_id);
        return;
    } else {
        first = true;
        s64.screen.print('Initiating uplink...');
    }

    s64.kernal.uplink_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    s64.kernal.sendUplinkData();
};

s64.kernal.sendUplinkData = function() {
    if (s64.kernal.uplink_id == null) return;

    setTimeout(function() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(e) {
            if (e.target.readyState == 4 && e.target.status == 200) {
                if (s64.kernal.downlink_id == null) {
                    if (e.target.response.length == 1) {
                        return;
                    }
                    s64.kernal.downlink_id = e.target.response || s64.kernal.downlink_id;

                    s64.screen.printLine(' done');
                    s64.screen.printLine('Downlink code is ' + s64.kernal.downlink_id);
                }

                s64.kernal.sendUplinkData();
            } else if (e.target.readyState == 4 && e.target.status != 200) {
            }
        };
        var start = s64.screen.first_line;
        var end = s64.screen.first_line + s64.screen.getScreenHeightLines();
        var url = 'https://sole64backup.appspot.com/uplink?uplink_id=' + s64.kernal.uplink_id + '&data='
            + encodeURIComponent(JSON.stringify(s64.screen.lines.slice(start, end)));
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.send();
    }, 100);
};

s64.kernal.killUplink = function() {
    s64.screen.printLine('');
    s64.screen.print('Terminating uplink...');

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
        if (e.target.readyState == 4 && e.target.status == 200 && e.target.response == '2') {
            s64.screen.printLine(' done');
        } else if (e.target.readyState == 4 && e.target.status != 200) {
            s64.screen.printLine(' finished with error. You are no longer transmitting.');
        }
    };
    var url = 'https://sole64backup.appspot.com/uplink?uplink_id=' + s64.kernal.uplink_id + '&data=no&clear=1';
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.send();

    s64.kernal.uplink_id = null;
    s64.kernal.downlink_id = null;
};

s64.kernal.startDownlink = function(downlink_id) {
    s64.screen.printLine('');

    s64.screen.print('Initiating downlink...');
    s64.screen.printLine(' done');
    s64.screen.stopCursor();

    s64.kernal.foreign_downlink_id = downlink_id;

    s64.kernal.getDownlinkData();
};

s64.kernal.getDownlinkData = function() {
    if (s64.kernal.foreign_downlink_id == null) return;

    setTimeout(function() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(e) {
            if (e.target.readyState == 4 && e.target.status == 200) {
                var data = e.target.response;
                if (data != '0') {
                    if (data == '2') {
                        // no uplink id
                        s64.kernal.killDownlink();
                        return;
                    }
                    if (s64.kernal.foreign_downlink_id != null) {
                        if (s64.screen.saved_lines == null) {
                            s64.screen.saved_lines = s64.screen.lines;
                        }

                        try {
                            s64.screen.lines = JSON.parse(data);
                            s64.screen.rePrintScreen();
                            s64.screen.stopCursor();

                            s64.kernal.getDownlinkData();
                        } catch (e) {
                            console.log(e);
                            s64.kernal.killDownlink();
                        }
                    }
                } else {
                    console.log('fail downlink');
                }
            } else if (e.target.readyState == 4 && e.target.status != 200) {
            }
        };
        var url = 'https://sole64backup.appspot.com/downlink?downlink_id=' + s64.kernal.foreign_downlink_id;
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.send();
    }, 100);
};

s64.kernal.killDownlink = function() {
    if (s64.kernal.foreign_downlink_id == null) return;
    s64.screen.lines = s64.screen.saved_lines;
    s64.screen.rePrintScreen();
    s64.screen.saved_lines = null;
    s64.kernal.foreign_downlink_id = null;
    s64.screen.stopCursor();
    s64.screen.startCursor();
};

s64.kernal.clearDelayedOperations = function() {
    for (var i in s64.kernal.delayedOperations) {
        clearTimeout(s64.kernal.delayedOperations[i]);
    }
};

s64.kernal.stop = function() {
    s64.screen.stopCursor();
    s64.screen.buffer = [];
    s64.kernal.killDownlink();
    s64.vic.clear();
    s64.v3d.clear();
    s64.learn.stop();
    s64.kernal.clearDelayedOperations();
    s64.screen.throwFit();
    s64.screen.printLine('Stopped!');
    s64.screen.startCursor();
};

s64.kernal.renumberMemory = function(spacing) {
    var new_memory = [];
    var current_position = spacing;
    for (var line_num in s64.kernal.memory) {
        if (s64.kernal.memory[line_num] != undefined
            && s64.kernal.memory[line_num] != null
            && s64.kernal.memory[line_num] != '') {
            new_memory[current_position] = s64.kernal.memory[line_num];
            current_position += spacing;
        }
    }

    s64.kernal.memory = new_memory;
    s64.kernal.trimMemory();
};
