
"use strict";


s64.interp.program_regex = /^(\*?\d+\s|\*?\d+$)((\s+)?.*)?/;

s64.interp.input_queue = [];
s64.interp.functions = {};
s64.interp.history = [];
s64.interp.current_history = 0;
s64.interp.max_history = 1000;
s64.interp.worker = null;

// ALL COMMANDS
s64.interp.commands = ['list', 'listf', 'run', 'new', 'save', 'load', 'history', 'clear history',
    'help', 'renumber', 'insert', 'delete', 'move', 'copy', 'paste',
    'listb', 'cls', 'search', 'settheme', 'setfontsize', 'uplink',
    'clear uplink', 'printjscode'];

s64.interp.exits = [
    "Where would you go?",
    "I'm never going to leave here ever, ever again, because I love you all.",
    "If you leave, where shall I go? What shall I do?",
    "Every exit is an entrace somewhere else",
    "Didn't we just leave this party?",
    "I do. I got to leave this place too.",
    "Okay. Take care of yourself, Han. I guess that's what you're best at isn't it?",
    "If you leave me now, you'll take away the biggest part of me",
    "Don't leave me now, don't say it's the end of the road",
    "You're fired.",
    "Don't cry because it's over. Smile because it happened.",
    "Only in the agony of parting do we look into the depths of love.",
    "You know that you are in love when the hardest thing to do is say good-bye",
    "Here's looking at you, kid.",
    "I'll be right here",
    "Remember me and smile, for it's better to forget than remember me and cry."
];


s64.interp.process = function (code, fromHistory) {
    if (undefined == fromHistory) {
        fromHistory = false;
    }

    code = code.trim();

    var was_waiting_for_password = s64.disk.waiting_for_password;
    var had_input = s64.interp.input_queue.length > 0;

    // if code begins with a number, it's a program, else it's a command
    var is_program = s64.interp.program_regex.test(code) && !had_input;

    if (is_program) {
        var matches = s64.interp.program_regex.exec(code)

        if (matches) {
            var line_num = matches[1].trim();
            var is_insert = false;
            if (line_num[0] == '*') {
                is_insert = true;
                line_num = line_num.substr(1);
            }

            line_num = parseInt(line_num);
            if (is_insert) {
                s64.kernal.insertLines(1, line_num);
            }

            if (null == line_num || undefined == line_num) {
                return false;
            }

            if (line_num > s64.kernal.max_lines) {
                s64.screen.printLine('!Error: Maximum line number is '
                    + s64.kernal.max_lines);
            } else {
                if (matches[2]) {
                    if (matches[2].trim() == '') {
                        matches[2] = '';
                    }
                    s64.kernal.memory[line_num] = matches[2];
                } else {
                    s64.kernal.memory[line_num] = '';
                }

                s64.interp.analyzeCode();
            }
        }

    } else { // it's a command
        var is_user_input = false;

        if (s64.interp.input_queue.length > 0) { // waiting for input
            is_user_input = true;
            var callback = s64.interp.input_queue.pop();

            if (s64.disk.waiting_for_password) {
                s64.screen.setCurrentLine('?*****', -1);
                s64.screen.undos[s64.screen.cloc + s64.screen.first_line - 1] = undefined;
                s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line - 1, s64.screen.cloc - 1);
            }

            callback(code.substr(1));
        }

        if (!is_user_input) {
            var is_internal = s64.interp.handleInternalCommand(code);

            if (!is_internal) {
                // run the code after it has been processed, but do not save the processed code here.
                // (processing it is really only useful for the delayed function)
                s64.interp.runCode(s64.interp.processCodeLine(code));
            }
        }
    }

    if (code != '' && !fromHistory && !was_waiting_for_password) {
        var inhist = code;
        if (had_input) {
            inhist = code.substr(1);
        }
        if (s64.interp.history[s64.interp.history.length - 1] != inhist) {
            s64.interp.history.push(inhist);
            s64.interp.current_history++;

            if (s64.interp.history.length > s64.interp.max_history) {
                s64.interp.history = s64.interp.history.slice(s64.interp.history.length - s64.interp.max_history);
                s64.interp.current_history = s64.interp.history.length;
            }

            s64.interp.saveHistory();
        }
    }

    return true;
};


s64.interp.handleInternalCommand = function (command) {
    command = command.trim();

    // list
    // groups 0:all 1: 2: 3:100 4:100-200 5:100- 6:-100
    s64.interp.list_regex = /^(list|ls)(\s((\d+)|(\d+-\d+)|(\d+-)|(-\d+)))?$/;
    if (s64.interp.list_regex.test(command)) {
        s64.screen.printLine('');
        var matches = s64.interp.list_regex.exec(command);

        if (matches[7]) {
            s64.screen.listMemory(0, parseInt(matches[7].replace(/-/, '')));
        } else if (matches[6]) {
            s64.screen.listMemory(parseInt(matches[6]), s64.kernal.memory.length);
        } else if (matches[5]) {
            var nums = matches[5].split('-');
            s64.screen.listMemory(nums[0], nums[1]);
        } else if (matches[4]) {
            s64.screen.listMemory(parseInt(matches[4]), parseInt(matches[4]));
        } else {
            s64.screen.listMemory(0, s64.kernal.memory.length);
        }

        return true;
    }

    // listf
    s64.interp.listf_regex = /^(listf|lf)(\s(\w+)(\(\))?)?$/;
    if (s64.interp.listf_regex.test(command)) {
        s64.screen.printLine('');
        var matches = s64.interp.listf_regex.exec(command);

        if (matches[3]) {
            var fname = matches[3];
            try {
                s64.screen.listMemory(s64.interp.functions[fname].start,
                    s64.interp.functions[fname].end);
            } catch (e) {
                s64.screen.printLine('"' + fname + '" function not found');

                var myreg = new RegExp('.*' + fname + '.*', 'i');
                var possible_names = [];
                for (var name in s64.interp.functions) {
                    if (name.indexOf(fname) == 0) {
                        possible_names.push(name);
                    } else if (fname.length >= 2) {
                        if (myreg.test(name)) {
                            possible_names.push(name);
                        }
                    }
                }
                if (possible_names.length > 0) {
                    s64.screen.printLine('Maybe you meant...');
                    for (var i in possible_names) {
                        s64.screen.printLine(possible_names[i]);
                    }
                }
            }
        } else if (matches[0]) {
            var i = 0;
            for (var name in s64.interp.functions) {
                s64.screen.listMemory(s64.interp.functions[name].start, s64.interp.functions[name].start);
                i++;
            }
            if (i == 0) {
                s64.screen.printLine('No functions found');
            } else {
            }
        }

        return true;
    }

    // run
    s64.interp.run_regex = /^run$/;
    if (s64.interp.run_regex.test(command)) {
        s64.vic.clear();
        s64.kernal.clearDelayedOperations();

        var code = s64.interp.getCode();
        s64.interp.runCode(code);

        return true;
    }

    // new
    s64.interp.new_regex = /^new$/;
    if (s64.interp.new_regex.test(command)) {
        s64.kernal.memory = [];
        s64.interp.analyzeCode();

        s64.screen.printLine('Memory cleared');

        return true;
    }

    // save
    s64.interp.save_regex = /^save\s(\w+|\w+@\w+)(,(\d+))?$/;
    if (s64.interp.save_regex.test(command)) {
        var matches = s64.interp.save_regex.exec(command);

        if (matches) {
            var device_num = matches[3] ? matches[3] : 8;
            var file_name = matches[1];

            if (file_name.indexOf('@') != -1) device_num = 9;

            s64.screen.printLine('');

            if (device_num == 8) { // local disk
                s64.disk.saveFile(file_name, JSON.stringify(s64.kernal.memory), s64.screen.saveFileCallback);
            } else if (device_num == 9) { // remote
                s64.screen.printLine('Please enter your password');

                s64.interp.getUserInput(s64.disk.saveWithPassword);

                s64.disk.temp_save_file_name = file_name;
                s64.disk.waiting_for_password = true;
            } else if (device_num == 7) { // hard copy
                s64.disk.downloadFile(file_name, JSON.stringify(s64.kernal.memory), device_num);
            } else {
                s64.screen.printLine('?Device not found');
            }
        }

        return true;
    }

    // load
    s64.interp.load_regex = /^load(\s(\w+|\$|\w+@\w+)(,(\d+))?)?$/;
    if (s64.interp.load_regex.test(command)) {
        var matches = s64.interp.load_regex.exec(command);
        if (matches) {
            s64.screen.printLine('');

            var device_num = matches[4] ? matches[4] : 8;
            var file_name = matches[2] ? matches[2] : '$';

            if (file_name.indexOf('@') != -1) device_num = 9;

            if (device_num == 8) { // local disk
                if (file_name == '$') {
                    s64.screen.printLine('Searching for $');
                    s64.disk.getPrograms(device_num);
                } else {
                    s64.screen.printLine('Searching for "' + file_name + '"');
                    s64.disk.loadFile(file_name, s64.interp.processLoadedFile);
                }
            } else if (device_num == 9) {
                if (file_name == '$') {
                    s64.screen.printLine('Searching for $');
                    s64.disk.getPrograms(device_num);
                } else {
                    s64.screen.printLine('Searching for "' + file_name + '"');
                    s64.disk.loadRemoteFile(file_name, device_num);
                }
            } else {
                s64.screen.printLine('?Device not found');
            }
        }

        return true;
    }

    // remove
    s64.interp.remove_regex = /^remove\s(\w+|\$|\w+@\w+)(,(\d+))?$/;
    if (s64.interp.remove_regex.test(command)) {
        var matches = s64.interp.remove_regex.exec(command);
        if (matches) {
            s64.screen.printLine('');

            var device_num = matches[3] ? matches[3] : 8;
            var file_name = matches[1];

            if (file_name.indexOf('@') != -1) device_num = 9;

            if (device_num == 8) { // local disk
                s64.screen.printLine('Searching for "' + file_name + '"');
                s64.disk.removeFile(file_name, s64.interp.processRemovedFile);
            } else if (device_num == 9) {
                s64.screen.printLine('Please enter your password for this file');

                s64.interp.getUserInput(s64.disk.removeWithPassword);

                s64.disk.temp_remove_file_name = file_name;
                s64.disk.waiting_for_password = true;
            } else {
                s64.screen.printLine('?Device not found');
            }
        }

        return true;
    }

    // history
    s64.interp.history_regex = /^history$/;
    if (s64.interp.history_regex.test(command)) {
        s64.screen.printLine('');
        s64.screen.listHistory();

        return true;
    }

    // clear history
    s64.interp.clear_history_regex = /^clear history$/;
    if (s64.interp.clear_history_regex.test(command)) {
        var matches = s64.interp.clear_history_regex.exec(command);
        s64.interp.history = [];
        s64.interp.current_history = s64.interp.history.length;
        s64.screen.printLine('History is clear');

        return true;
    }

    // clear uplink
    s64.interp.clear_uplink_regex = /^clear uplink$/;
    if (s64.interp.clear_uplink_regex.test(command)) {
        var matches = s64.interp.clear_uplink_regex.exec(command);

        s64.kernal.killUplink();

        return true;
    }

    // uplink
    s64.interp.uplink_regex = /^uplink$/;
    if (s64.interp.uplink_regex.test(command)) {
        var matches = s64.interp.uplink_regex.exec(command);

        s64.kernal.startUplink();

        return true;
    }

    // downlink
    s64.interp.downlink_regex = /^downlink\s(\w{6})$/;
    if (s64.interp.downlink_regex.test(command)) {
        var matches = s64.interp.downlink_regex.exec(command);
        var downlink_id = matches[1];

        s64.kernal.startDownlink(downlink_id);

        return true;
    }

    // help
    s64.interp.help_regex = /^help(\s(\w+))?$/;
    if (s64.interp.help_regex.test(command)) {
        var matches = s64.interp.help_regex.exec(command);

        s64.help.show(matches[2]);

        return true;
    }

    // learn
    s64.interp.learn_regex = /^learn\s?(\d+)?$/;
    if (s64.interp.learn_regex.test(command)) {
        var matches = s64.interp.learn_regex.exec(command);

        s64.screen.printLine('');

        if (matches.length > 1) s64.learn.go(matches[1]);
        else s64.learn.go();

        return true;
    }

    // renumber
    s64.interp.renumber_regex = /^renumber(\s(\d+))?$/;
    if (s64.interp.renumber_regex.test(command)) {
        var matches = s64.interp.renumber_regex.exec(command);

        var spacing = matches[2] ? parseInt(matches[2]) : 10;

        if (spacing < 1) {
            s64.screen.printLine('!Error: The spacing must be a number greater than 0');
            return true;
        }

        s64.kernal.renumberMemory(spacing);

        s64.screen.printLine('');
        s64.screen.printLine('Renumbered your code with a line spacing of ' + spacing);

        s64.interp.analyzeCode();

        return true;
    }

    // insert
    s64.interp.insert_regex = /^insert (\d+) at (\d+)$/;
    if (s64.interp.insert_regex.test(command)) {
        var matches = s64.interp.insert_regex.exec(command);
        var how_many = parseInt(matches[1]);
        var where = parseInt(matches[2]);
        s64.kernal.insertLines(how_many, where);

        s64.screen.printLine('');
        s64.screen.printLine('Inserted ' + how_many + ' line' + (how_many != 1 ? 'S' : '') + ' at line ' + where);

        return true;
    }

    // delete
    // groups 0:all 1: 2: 3:100 4:100-200 5:100- 6:-100
    s64.interp.delete_regex = /^(delete|del)(\s((\d+)|(\d+-\d+)|(\d+-)|(-\d+)))$/;
    if (s64.interp.delete_regex.test(command)) {
        var matches = s64.interp.delete_regex.exec(command);
        var start = 0;
        var finish = s64.kernal.memory.length;

        if (matches[7]) {
            start = 0;
            finish = parseInt(matches[7].replace(/-/, ''));
        } else if (matches[6]) {
            start = parseInt(matches[6]);
            finish = s64.kernal.memory.length;
        } else if (matches[5]) {
            var nums = matches[5].split('-');
            start = parseInt(nums[0]);
            finish = parseInt(nums[1]);
        } else if (matches[4]) {
            start = parseInt(matches[4]);
            finish = parseInt(matches[4]);
        }

        s64.kernal.deleteLines(start, finish);

        s64.screen.printLine('');
        s64.screen.printLine('Deleted line' + (finish - start > 0 ? 's ' : ' ')
            + start + (finish - start > 0 ? ' through ' + finish : ''));

        return true;
    }

    // move
    // groups 0:all 1: 2: 3:100 4:100-200 5:100- 6:-100
    s64.interp.move_regex = /^move\s((\d+)|(\d+-\d+)|(\d+-)|(-\d+))\sto\s(\d+)$/;
    if (s64.interp.move_regex.test(command)) {
        var matches = s64.interp.move_regex.exec(command);
        var where = parseInt(matches[6]);
        var from = null;
        var to = null;

        s64.screen.printLine('');

        if (matches[5]) {
            from = 0;
            to = parseInt(matches[5].replace('-', ''));
        } else if (matches[4]) {
            from = parseInt(matches[4].replace('-', ''));
            to = s64.kernal.memory.length - 1;
        } else if (matches[3]) {
            from = parseInt(matches[3].split('-', 2)[0]);
            to = parseInt(matches[3].split('-', 2)[1]);
        } else if (matches[2]) {
            from = parseInt(matches[2]);
            to = parseInt(matches[2]);
        }

        if (null != from && null != to && null != where) {
            if (from > s64.kernal.memory.length - 1 || to > s64.kernal.memory.length - 1) {
                s64.screen.printLine('Lines to move not found in memory');
            } else {
                s64.kernal.moveLines(from, to, where);
                if (from == to) {
                    s64.screen.printLine('Removed line ' + from + ' and inserted it at line ' + where);
                } else {
                    s64.screen.printLine('removed lines ' + from + ' through ' + to + ' and inserted them at line ' + where);
                }
            }

        } else {
            s64.screen.printLine("I'm sorry, what were you trying to do?");
        }

        return true;
    }

    // copy
    // groups 0:all 1: 2: 3:100 4:100-200 5:100- 6:-100
    s64.interp.copy_regex = /^copy\s((\d+)|(\d+-\d+)|(\d+-)|(-\d+))\sto\s(buffer\s\d+|\d+)$/;
    if (s64.interp.copy_regex.test(command)) {
        var buffer_regex = /^buffer\s(\d+)$/;

        var matches = s64.interp.copy_regex.exec(command);
        var where = null;
        if (buffer_regex.test(matches[6])) {
            where = matches[6];
        } else {
            where = parseInt(matches[6]);
        }
        var from = null;
        var to = null;

        s64.screen.printLine('');

        if (matches[5]) {
            from = 0;
            to = parseInt(matches[5].replace('-', ''));
        } else if (matches[4]) {
            from = parseInt(matches[4].replace('-', ''));
            to = s64.kernal.memory.length - 1;
        } else if (matches[3]) {
            from = parseInt(matches[3].split('-', 2)[0]);
            to = parseInt(matches[3].split('-', 2)[1]);
        } else if (matches[2]) {
            from = parseInt(matches[2]);
            to = parseInt(matches[2]);
        }

        if (null != from && null != to && null != where) {
            if (from > s64.kernal.memory.length - 1 || to > s64.kernal.memory.length - 1) {
                s64.screen.printLine('Lines to copy not found in memory');
            } else {
                var copy_results = s64.kernal.copyLines(from, to, where);
                if (copy_results == true) {
                    if (from == to) {
                        if (where == 'memory') {
                            s64.screen.printLine('Copied line ' + from + ' into the copy buffer');
                        } else {
                            s64.screen.printLine('Copied line ' + from + ' and inserted it at line ' + where);
                        }
                    } else {
                        if (where == 'memory') {
                            s64.screen.printLine('Copied lines ' + from + ' through ' + to + ' into the copy buffer');
                        } else {
                            s64.screen.printLine('Copied lines ' + from + ' through ' + to + ' and inserted them at line ' + where);
                        }
                    }
                } else if (copy_results != undefined) {
                    s64.screen.printLine(copy_results);
                }
            }

        } else {
            s64.screen.printLine("I'm sorry, what were you trying to do?");
        }

        return true;
    }

    // paste
    s64.interp.paste_regex = /^paste\sbuffer(\d+)\sat\s(\d+)$/;
    if (s64.interp.paste_regex.test(command)) {
        s64.screen.printLine('');

        var matches = s64.interp.paste_regex.exec(command);
        var buffer_num = parseInt(matches[1]);
        var line_num = parseInt(matches[2]);

        var paste_results = s64.kernal.pasteLines(buffer_num, line_num);
        if (paste_results != undefined) {
            s64.screen.printLine(paste_results);
        }

        return true;
    }

    // listb
    s64.interp.listb_regex = /^listb\s(\d+)$/;
    if (s64.interp.listb_regex.test(command)) {
        s64.screen.printLine('');

        var matches = s64.interp.listb_regex.exec(command);
        var buffer_num = parseInt(matches[1]);

        if (s64.kernal.copy_buffers[buffer_num]) {
            var line_num = 1;
            s64.kernal.copy_buffers[buffer_num].forEach(function (line) {
                s64.screen.printLine(line_num + ' ' + line);
                line_num++;
            });
        } else {
            s64.screen.printLine('Buffer ' + buffer_num + ' is empty');
        }

        return true;
    }

    // cls
    s64.interp.cls_regex = /^(cls|clear)$/;
    if (s64.interp.cls_regex.test(command)) {
        s64.screen.clearScreen();
        s64.vic.clear();
        s64.kernal.clearDelayedOperations();

        return true;
    }

    // search
    s64.interp.search_regex = /^search\s?["'](.+)["'](\sin\s(\w+))?$/;
    if (s64.interp.search_regex.test(command)) {
        s64.screen.printLine('');

        var matches = s64.interp.search_regex.exec(command);

        var where = matches[3] || 'memory';
        var what = matches[1];

        var no_where = false;

        var results = [];
        if (where == 'history') {
            for (var i = 0; i < s64.interp.history.length; i++) {
                if (s64.interp.history[i] != null && s64.interp.history[i].indexOf(what) != -1) {
                    results.push(i + ' ' + s64.interp.history[i]);
                }
            }
        } else if (where == 'memory') {
            for (var i = 0; i < s64.kernal.memory.length; i++) {
                if (s64.kernal.memory[i] != null && s64.kernal.memory[i].indexOf(what) != -1) {
                    results.push(i + ' ' + s64.kernal.memory[i]);
                }
            }
        } else if (where == 'buffers') {
            for (var i = 0; i < s64.kernal.copy_buffers.length; i++) {
                if (Array.isArray(s64.kernal.copy_buffers[i])) {
                    for (var j = 0; j < s64.kernal.copy_buffers[i].length; j++) {
                        if (s64.kernal.copy_buffers[i][j] != null
                            && s64.kernal.copy_buffers[i][j].indexOf(what) != -1) {
                            if (j == 0) {
                                var heading = 'Copy buffer ' + i + (i == 0 ? ' (default)' : '');
                                var underline = '';
                                for (var c in heading) {
                                    underline += '_';
                                }
                                results.push(underline);
                                results.push(heading);
                            }
                            results.push(j + ' ' + s64.kernal.copy_buffers[i][j]);
                        }
                    }
                }
            }
        } else {
            no_where = true;
            s64.screen.printLine('Not sure how to search in ' + where);
        }

        if (results.length > 0) {
            results.forEach(function (item) {
                s64.screen.printLine(item);
            });
        } else if (!no_where) {
            s64.screen.printLine('Could not find "' + what + '" in ' + where);
        }

        return true;
    }

    /*
    // restore
    s64.interp.restore_regex = /^restore$/;
    if (s64.interp.restore_regex.test(command)) {
        s64.kernal.restoreSession();

        return true;
    }
    */

    // settheme
    s64.interp.settheme_regex = /^settheme$/;
    if (s64.interp.settheme_regex.test(command)) {
        for (var i = 1; i < s64.screen.themes.length; i++) {
            s64.screen.printLine(i + '. ' + s64.screen.themes[i - 1]);
        }

        s64.interp.getUserInput(s64.screen.setTheme);

        return true;
    }

    // setfontsize
    s64.interp.setfontsize_regex = /^setfontsize$/;
    if (s64.interp.setfontsize_regex.test(command)) {
        s64.screen.printLine('Enter a font size and press return');
        s64.interp.getUserInput(s64.screen.setFontSize);

        return true;
    }

    // setfont
    s64.interp.setfont_regex = /^setfont\s(\w+)$/;
    if (s64.interp.setfont_regex.test(command)) {
        var matches = s64.interp.setfont_regex.exec(command);
        s64.screen.setFontFamily(matches[1]);

        return true;
    }

    // exit
    s64.interp.exit_regex = /^exit$/;
    if (s64.interp.exit_regex.test(command)) {
        s64.screen.printLine(s64.interp.exits.splice(
            Math.floor(Math.random() * s64.interp.exits.length), 1)[0] || function () {
                var iid = setInterval(function () {
                    s64.screen.clearScreen();
                    s64.screen.setCurrentLine('s0l3$1%7yf@µr¿'[Math.floor(Math.random() * 14)]);
                    s64.screen.rePrintLine(s64.screen.cloc + s64.screen.first_line);
                }, 15); setTimeout(function () { clearInterval(iid); s64.screen.clearScreen(); }, 6400);
            }());
        return true;
    }

    // printjscode
    s64.interp.printjscode_regex = /^printjscode$/;
    if (s64.interp.printjscode_regex.test(command)) {
        var code = s64.interp.getCode();
        console.log(code);
        code = code.split('\n');
        for (var line in code) {
            s64.screen.printLine(code[line]);
        }

        return true;
    }

    // def
    s64.interp.define_regex = /^def\s(\w+)$/;
    if (s64.interp.define_regex.test(command)) {
        s64.screen.stopCursor();
        var matches = s64.interp.define_regex.exec(command);
        var start = s64.kernal.memory.length + 9;
        var line = start + ' DEF ' + matches[1] + '(): ';
        s64.screen.print(line);
        s64.screen.goBuffer(true);
        s64.screen.rePrintLine();
        s64.screen.cloch = line.length;
        s64.screen.printCursor();
        s64.screen.startCursor();
        return true;
    }

    // stop
    s64.interp.stop_regex = /^stop$/;
    if (s64.interp.stop_regex.test(command)) {
        s64.kernal.stop();
        return true;
    }

    var the_command_regex = /^(\w+)\s?.*$/;
    if (the_command_regex.test(command)) {
        var the_command = the_command_regex.exec(command)[1];

        for (var i in s64.interp.commands) {
            if (s64.interp.commands[i] == the_command) {
                s64.screen.printLine('Type "help ' + the_command + '" to get help with this command');
                return false;
            }
        }
    }


    return false;
};

s64.interp.processListOfPrograms = function (programs, device_num, author) {
    author = author || '';
    if (programs.length <= 0) {
        s64.screen.printLine('No programs found');
        return;
    }

    s64.screen.printLine('Found');

    var max = 0;
    s64.screen.printLine('\u2588 Programs from device '
        + device_num + (author ? (' author "' + author + '"') : '') + ' \u2588');

    // determine the longest number (in digits)
    programs.forEach(function (program) {
        if ((program[0] + '').length > max) {
            max = (program[0] + '').length;
        }
    });

    var lines = [];
    var maxlength = 0;
    programs.forEach(function (program) {
        var line = s64.screen.padNumber(program[0], max) + '   "' + program[1] + '" ' + (program[2] || s64.disk.program_type);
        if (line.length > maxlength) maxlength = line.length;
        lines.push(line);
    });

    var maxreg = /(.*)(\s\w{3})$/;

    lines.forEach(function (program) {
        var matches = maxreg.exec(program);
        var spaces = maxlength - matches[0].length + 3;
        program = matches[1];
        for (var i = 0; i < spaces; i++) {
            program += ' ';
        }
        program += matches[2];
        s64.screen.printLine(program);
    });
}

s64.interp.processLoadedFile = function (result) {
    if (!result) {
        s64.screen.printLine('!File not found');
        return;
    }

    result.type = result.type || s64.disk.program_type;

    if (result.type != s64.disk.program_type) {
        s64.screen.printLine('This file does not have a file type of "' + s64.disk.program_type + '"');
        s64.screen.printLine('Cannot load this file');
        return;
    }

    try {
        var loaded = JSON.parse(result.data);

        if (loaded) {
            s64.kernal.memory = loaded;
            s64.screen.printLine('Found file');
            s64.interp.analyzeCode();
        } else {
            s64.screen.printLine('!File is corrupted');
        }
    } catch (e) {
        s64.screen.printLine('!File is corrupted');
    }

};

s64.interp.processRemovedFile = function (result) {
    if (result) {
        s64.screen.printLine(result);
        return;
    } else {
        s64.screen.printLine('FILE REMOVED');
        return;
    }
};


// if you change these regexes, change them in analyzecode.js as well.
s64.interp.regex_oneline_function = /^DEF\s(.+)(\((.*)\)):\s?(.*)/;
s64.interp.regex_begin_function = /^DEF\s(.+)(\((.*)\))/;
s64.interp.regex_end_function = /^END\s(.+)/;
s64.interp.regex_delay_function = /^@(\d+):(.*)$/;
s64.interp.regex_quit = /^quit$/;
s64.interp.processCodeLine = function (line) {
    if (s64.interp.regex_oneline_function.test(line)) {
        var matches = s64.interp.regex_oneline_function.exec(line);
        line = 'function ' + matches[1] + matches[2] + ' {';
        line += ' try { ';
        line += matches[4] + ';';
        line += '} catch(e) { throw(e); } ';
        line += '}; // end ' + matches[1];
    } else if (s64.interp.regex_begin_function.test(line)) {
        var matches = s64.interp.regex_begin_function.exec(line);
        line = 'function ' + matches[1] + matches[2] + ' {';
        line += ' try {';
    } else if (s64.interp.regex_end_function.test(line)) {
        var matches = s64.interp.regex_end_function.exec(line);
        line = '} catch(e) { throw(e); }';
        line += '}; // end ' + matches[1];
    } else if (s64.interp.regex_delay_function.test(line)) {
        var matches = s64.interp.regex_delay_function.exec(line);
        line = 's64.kernal.delayedOperations.push(setTimeout(function() { ' + matches[2] + '}, ' + matches[1] + '));';
    } else if (line.substr(-1) === '{' || line.substr(-1) === '}') {
        // pass
    } else {
        line += ';';
    }

    return line;
};


s64.interp.analyzeCode = function () {
    if (s64.interp.worker != null) {
        s64.interp.worker.terminate();
    }

    s64.interp.worker = new Worker('analyzecode.js');
    s64.interp.worker.addEventListener('message', function (event) {
        if (event.data['error'] != null) {
            for (var i in event.data['error']) {
                s64.screen.printLine(event.data['error'][i]);
            }
        }
        s64.interp.functions = event.data['functions'];
        s64.kernal.trimMemory();
    }, false);

    s64.interp.worker.postMessage(
        {
            'memory': s64.kernal.memory,
            'current_line': s64.screen.getCurrentLine(-1)
        }
    );
};

s64.interp.saveHistory = function () {
    s64.disk.saveConfig('history', JSON.stringify(s64.interp.history));
};

s64.interp.loadHistory = function () {
    s64.disk.loadConfig('history', function (config) {
        console.log(config);
        config = config || null;
        var history = JSON.parse(config);
        if (history) {
            s64.interp.history = history;
            s64.interp.current_history = s64.interp.history.length;
        }
    })
};

s64.interp.getUserInput = function (callback) {
    s64.interp.input_queue.push(callback);
    s64.screen.setCurrentLine('');
    s64.screen.cloch = 0;
    s64.screen.print(s64.screen.PROMPT, false, true);
};

s64.interp.getCode = function (incode) {
    if (undefined == incode) {
        incode = s64.kernal.memory;
    }

    var code = 'var $_intern4l = (function(){"use strict";';

    for (var i = 0; i < incode.length; i++) {
        if (incode[i]) {
            code += '\n' + s64.interp.processCodeLine(incode[i]);
        }
    }

    code += '\n});$_intern4l();';

    return code;
};


s64.interp.runCode = function (code) {
    function prin(text) {
        s64.screen.print(String(text));
    }

    function print(text) {
        s64.screen.printLine(String(text));
    }

    function printc(text) {
        s64.screen.printLine(String(text), undefined, s64.screen.ALIGN_CENTER);
    }

    function printr(text) {
        s64.screen.printLine(String(text), undefined, s64.screen.ALIGN_RIGHT);
    }

    function input(callback, prompt) {
        if (s64.interp.input_queue.length > 0) {
            s64.screen.throwFit('!Error: Cannot use the input function again until the previous function has returned');
            return;
        }
        if (undefined != prompt) s64.screen.printLine(prompt);
        s64.screen.goBuffer(true);
        s64.interp.getUserInput(callback);
    }

    function clear() {
        s64.screen.clearScreen();
    }

    function put(name, json, callback) {
        s64.disk.put(name, json, callback);
    }

    function get(name, callback) {
        s64.disk.get(name, callback);
    }

    function random(a, b) {
        return Math.floor(Math.random() * (b - a + 1) + a);
    }

    // inclusive
    function range(a, b, s) {
        s = s || 1;
        var r = [];
        if (undefined != b) {
            for (var i = a; i < b + 1; i += s) {
                r.push(i);
            }
        } else {
            for (var i = 0; i < a + 1; i += s) {
                r.push(i);
            }
        }

        return r;
    }

    function poke(what, value) {
        switch (what) {
            case 'bg':
                s64.screen.background_color = value;
                break;
            case 'fg':
                s64.screen.foreground_color = value;
                break;
            case 'border':
                s64.screen.border_color = value;
                break;
            case 'blink_rate':
                s64.screen.blink_rate = value;
                s64.screen.stopCursor();
                s64.screen.printCursor();
                s64.screen.startCursor();
                break;
            case 'tts':
                s64.screen.tts = value;
                break;
            case 'tts_enqueue':
                s64.screen.tts_enqueue = value;
                break;
            case 'tts_rate':
                s64.screen.tts_rate = value;
                break;
        }

        var cloc_old = s64.screen.cloc;
        s64.screen.rePrintScreen();
        s64.screen.cloc = cloc_old;
        s64.screen.printCursor();
    }

    function include(filename, callback) {
        function includeCallback(result) {
            try {
                var includedCode = s64.interp.getCode(JSON.parse(result.data))
                s64.interp.runCode(includedCode);
                if (callback) {
                    callback(true);
                }
            } catch (e) {
                console.log(e);
                callback(false);
            }
        }
        s64.disk.loadFile(filename, includeCallback);
    }

    // paint
    function setPaintColor(color) {
        s64.vic.setColor(color);
    }

    function setPaintWidth(width) {
        s64.vic.setLineWidth(width);
    }

    function paintCircle(x, y, diameter, fill) {
        return new s64.vic.Circle(x, y, diameter, fill);
    }

    function paintOval(x, y, width, height, fill) {
        return new s64.vic.Oval(x, y, width, height, fill);
    }

    function clearPaint() {
        s64.vic.clear();
    }

    function paintLine(x1, y1, x2, y2) {
        return new s64.vic.Line(x1, y1, x2, y2)
    }

    function paintAngleLine(x, y, length, angle) {
        return new s64.vic.Aline(x, y, length, angle);
    }

    function paintPath(coords, width) {
        return new s64.vic.Path(coords, width);
    }

    // v3d
    function setColor(color) {
        s64.v3d.setColor(color);
    }

    function clearGraphics() {
        s64.v3d.clear();
    }

    function cube(width, height, depth) {
        return s64.v3d.cube(width, height, depth);
    }

    function sphere(radius, segmentsWidth, segmentsHeight) {
        return s64.v3d.sphere(radius, segmentsWidth, segmentsHeight);
    }

    function cylinder(radTop, radBottom, height, segRad, segHeight, open) {
        return s64.v3d.cylinder(radTop, radBottom, height, segRad, segHeight, open);
    }

    function show(mesh) {
        return s64.v3d.show(mesh);
    }

    function hide(mesh) {
        return s64.v3d.hide(mesh);
    }

    function startAnimation(context) {
        return s64.v3d.startAnimation(context);
    }

    function collideMeshes(mesh, others) {
        return s64.v3d.collide(mesh, others);
    }

    function stopAnimation() {
        s64.v3d.stopAnimation();
    }

    function writeFile(file_name, data, callback) {
        s64.disk.saveDataFile(file_name, data, callback);
    }

    function readFile(file_name, callback) {
        // console.log('readFile', file_name, callback);
        if (undefined == callback) {
            s64.screen.throwFit('!No callback given in "readFile" command');
            return;
        }

        function includeCallback(result) {
            var data = null;

            if (undefined == result) {
                callback(data);
            } else {
                try {
                    data = JSON.parse(result.data);
                    callback(data);
                } catch (e) {
                    try {
                        data = result.data;
                        callback(data);
                    } catch (e) {
                        console.log(e);
                        callback(data);
                    }
                }
            }
        }

        s64.disk.loadDataFile(file_name, includeCallback);
    }

    try {
        // mess with the user's text ftw!
        code = code.replace(/\\/g, '\\\\');
        eval(code);
    } catch (error) {
        console.log(error);
        console.log(error.stack);
        s64.screen.throwFit('!' + error);
    }
};