onmessage = function(event) {
    var reservedWords = ['readFile', 'writeFile', 'paintPath', 
                         'paintAngleLine', 'paintLine', 'clearGraphics', 'clearPaint', 'paintCircle', 
                         'setColor', 'setPaintColor', 'include', 'poke', 'range', 'random',
                         'get', 'put', 'clear', 'input', 'print', 'printr',
                         'printc', 'prin', 'show', 'hide', 'startAnimation', 'stopAnimation',
                         'collideMeshes', 'cylinder', 'sphere', 'cube', 'setLineWidth', 'setPaintWidth'];
    
    var memory = event.data['memory'];
    var current_line = event.data['current_line'];
    var current_function = null;
    var regex_oneline_function = /^DEF\s(.+)(\((.*)\)):\s?(.*)/;
    var regex_begin_function = /^DEF\s(.+)(\((.*)\))/;
    var regex_end_function = /^END\s(.+)/;
    var functions = [];
    var errors = [];

    for (var i = 0; i < memory.length; i++) {
        var thisfunc = null;

        if (regex_oneline_function.test(memory[i])) {
            var matches = regex_oneline_function.exec(memory[i]);
            thisfunc = matches[1];
            if (!functions[matches[1]]) {
                functions[matches[1]] = {};
            }
            functions[matches[1]].start = i;
        } else if (regex_begin_function.test(memory[i])) {
            var matches = regex_begin_function.exec(memory[i]);
            thisfunc = matches[1];
            if (!functions[matches[1]]) {
                functions[matches[1]] = {};
            }
            functions[matches[1]].start = i;
        } else if (regex_end_function.test(memory[i])) {
            var matches = regex_end_function.exec(memory[i]);
            thisfunc = matches[1];
            if (!functions[matches[1]]) {
                functions[matches[1]] = {};
            }
            
            if (undefined == functions[matches[1]].start && current_line.indexOf('END') != -1) {
                errors.push('!Error: You ended the ' + matches[1] + ' function before you started it.');
            } else {
                functions[matches[1]].end = i;
            }
        }

        if (reservedWords.indexOf(thisfunc) != -1 && current_line.indexOf('DEF ' + thisfunc) != -1) {
            errors.push('!Warning: The use of ' + thisfunc + ' is overwriting an existing system function.');
        }
    }

    postMessage({'functions': functions, 'error':(errors.length > 0 ? errors : null)});
};