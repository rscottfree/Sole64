
"use strict";


s64.disk.prefix = 'S64disk*';
s64.disk.config_prefix = 'S64config*';
s64.disk.file_prefix = 'file*';
s64.disk.store_prefix = 'store*';
s64.disk.user_data_type = 'DAT';
s64.disk.program_type = 'PRG';
s64.disk.db = {};
s64.disk.configs = {};
s64.disk.default_config = 'terminal';
s64.disk.current_config = s64.disk.default_config;
s64.disk.temp_save_file_name = '';
s64.disk.temp_remove_file_name = '';
s64.disk.waiting_for_password = false;
s64.disk.sole64disk = null;

// window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

s64.disk.localStorage = window.localStorage; // chrome.storage.local;

s64.disk.setup = function() {
    s64.disk.openIndexedDB();
    setTimeout(function() {
        if (s64.disk.db == {}) {
            alert('error created database connection; try restarting your browser');
        }
    }, 5000);
};

s64.disk.openIndexedDB = function() {
    // var request = window.indexedDB.open("sole64", "main sole 64 database");
    var request = window.indexedDB.open("sole64");
    request.onsuccess = function(e) {
        console.log(e);
        var v = "3";
        var db = e.target.result;
        console.log(db);
        s64.disk.db = db;
        s64.kernal.contSetup();
    };

    request.onupgradeneeded = function(e) {
        console.log('upgrade');
        console.log(e);
        s64.disk.db = e.target.result;
        if(!s64.disk.db.objectStoreNames.contains("sole64disk")) {
          s64.disk.sole64disk = s64.disk.db.createObjectStore("sole64disk", { keyPath: "name" }, false);
        }
        // s64.kernal.contSetup();
    };

    // request.onfailure = s64.disk.onIndexedDBerror;
    request.onfailure = function(event) {
        console.log('failure?');
    };
    request.onerror = function(event) {
        console.log('error?');
    };
};

s64.disk.onIndexedDBerror = function(e) {
    console.log('error accessing disk');
    console.log(e);
};

s64.disk.save = function(name, data, callback, type) {
    type = type || s64.disk.program_type;

    if (s64.disk.db == {}) {
        console.log('db not setup');
        return;
    }

    try {
      // console.log('saving name: ' + name);
      var trans = s64.disk.db.transaction(["sole64disk"], "readwrite");
      trans.oncomplete = function(e){
          delete s64.disk.db.objectStore;
      };
      trans.onabort = function(e){
      };
      var store = trans.objectStore("sole64disk");
      var request = store.put({
          "name": s64.disk.prefix + name,
          "data": data,
          "type": type
      });

      request.onsuccess = function(e) {
          if (callback) {
              callback(e);
          }
      };

      request.onerror = function(e) {
          console.log('error saving');
          console.log(e);
          if (callback) {
              callback(e);
          }
      };

      request.onabort = s64.disk.onIndexedDBerror;
    } catch (e) {
      console.log('error saving');
    }
};

s64.disk.load = function(name, callback, returnDataOnly, type) {
    returnDataOnly = returnDataOnly || false;
    type = type || s64.disk.program_type;

    try {
      var trans = s64.disk.db.transaction(["sole64disk"], "readwrite");
      var store = trans.objectStore("sole64disk");

      var request = store.get(s64.disk.prefix + name);

      request.onsuccess = function(e) {
        var result = e.target.result;
        if(!!result == false) {
          callback(undefined);
        } else if (callback) {
          callback(returnDataOnly ? result.data : result);
        }
      };

      request.onerror = s64.disk.onIndexedDBerror;
      request.onabort = s64.disk.onIndexedDBerror;
    }
    catch (e) {
      console.log('error loading');
      console.log(e);
    }

    return true;
};

s64.disk.remove = function(name, callback) {
    try {
      var trans = s64.disk.db.transaction(["sole64disk"], "readwrite");
      var store = trans.objectStore("sole64disk");

      var request = store.delete(s64.disk.prefix + name);

      request.onsuccess = function(e) {
        var result = e.target.result;
        if(!!result == false) {
          callback('File not found');
          return;
        }

        if (callback) {
          callback('File removed');
        }
      };

      request.onerror = function(event) { callback("!File not found"); };
      request.onabort = function(event) { callback("!Remove operation aborted"); };
    }
    catch (e) {
      console.log('error removing the file');
      console.log(e);
    }
};

s64.disk.saveToLocalStorage = function(name, data, callback) {
  callback = callback || function() {};
  setTimeout(() => {
      var tempkey = s64.disk.prefix + name;
    //   console.log('save', tempkey, data);
      s64.disk.localStorage.setItem(tempkey, data);
      callback();
  });
};

s64.disk.loadFromLocalStorage = function(name, callback) {
    callback = callback || function() {};
    let value = s64.disk.localStorage.getItem(s64.disk.prefix + name);
    // console.log('load', s64.disk.prefix + name, value);
    setTimeout(() => {
        callback(value);
    });

    return value;
};

s64.disk.deleteFromLocalStorage = function(name) {
    return s64.disk.localStorage.remove(s64.disk.prefix + name);
};

s64.disk.configs['c64'] = {
    's64.screen.background_color': '#3E3EE4',
    's64.screen.foreground_color': '#A5A5FF',
    's64.screen.border_color': '#A5A5FF',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['dark'] = {
    's64.screen.background_color': '#222',
    's64.screen.foreground_color': '#ddd',
    's64.screen.border_color': '#333',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['blue'] = {
    's64.screen.background_color': '#0000FF',
    's64.screen.foreground_color': '#fff',
    's64.screen.border_color': '#002aff',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['terminal'] = {
    's64.screen.background_color': '#111',
    's64.screen.foreground_color': '#009900',
    's64.screen.border_color': '#111',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

/*s64.disk.configs['terminaldarker'] = {
    's64.screen.background_color': '#000',
    's64.screen.foreground_color': '#008000',
    's64.screen.border_color': '#000',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};*/

s64.disk.configs['ubuntudark'] = {
    's64.screen.background_color': '#2c001e',
    's64.screen.foreground_color': '#ddd',
    's64.screen.border_color': '#2c001e',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['ubuntulight'] = {
    's64.screen.background_color': '#5e2750',
    's64.screen.foreground_color': '#eee',
    's64.screen.border_color': '#5e2750',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['solarlight'] = {
    's64.screen.background_color': '#eee8d5',
    's64.screen.foreground_color': '#586e75',
    's64.screen.border_color': '#eee8d5',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['solardark'] = {
    's64.screen.background_color': '#002b36',
    's64.screen.foreground_color': '#586e75',
    's64.screen.border_color': '#002b36',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['contrastlight'] = {
    's64.screen.background_color': '#fff',
    's64.screen.foreground_color': '#000',
    's64.screen.border_color': '#fff',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.configs['contrastdark'] = {
    's64.screen.background_color': '#000',
    's64.screen.foreground_color': '#fff',
    's64.screen.border_color': '#000',
    's64.screen.font_family': 'CousineRegular',
    's64.help.auto_hide': 0,
    's64.help.help_text_size': 12
};

s64.disk.saveConfig = function(name, data, callback) {
    return s64.disk.saveToLocalStorage(s64.disk.config_prefix + name, data);
};

s64.disk.loadConfig = function(name, callback) {
    return s64.disk.loadFromLocalStorage(s64.disk.config_prefix + name, callback);
};

s64.disk.saveFile = function(name, data, callback) {
    s64.disk.save(s64.disk.file_prefix + name, data, callback);
};

s64.disk.saveDataFile = function(name, data, callback) {
    s64.disk.save(s64.disk.file_prefix + name, data, callback, s64.disk.user_data_type);
};

s64.disk.loadFile = function(name, callback) {
    return s64.disk.load(s64.disk.file_prefix + name, callback);
};

s64.disk.loadDataFile = function(name, callback) {
    return s64.disk.load(s64.disk.file_prefix + name, callback, false, s64.disk.user_data_type);
};

s64.disk.removeFile = function(name, callback) {
    return s64.disk.remove(s64.disk.file_prefix + name, callback);
};

s64.disk.loadConfigs = function() {
    // make sure they are saved
    var current_config = s64.disk.configs[s64.disk.current_config];

    for (var key in current_config) {
        // for now, don't overwrite configs in localStorage
        if (!s64.disk.loadConfig(key)) {
            s64.disk.saveConfig(key, current_config[key]);
        }
        s64.disk.save(s64.disk.config_prefix + key, current_config[key]);
    }

    var font_size = s64.disk.loadConfig('s64.screen.font_height');
    if (!font_size) s64.disk.saveConfig('s64.screen.font_height', 14);
};

s64.disk.resetConfigsForTheme = function() {
    var default_config = s64.disk.configs[s64.disk.default_config];

    for (var key in default_config) {
        s64.disk.saveConfig(key, default_config[key]);
        s64.disk.save(s64.disk.config_prefix + key, default_config[key]);
    }
};

s64.disk.getPrograms = function(device_num) {
    var programs = [];
    var regex = /^S64disk\*file\*(\w+)$/;

    try {
        if (device_num == 8) {
            var trans = s64.disk.db.transaction(["sole64disk"], "readwrite");
            var store = trans.objectStore("sole64disk");

            // Get everything in the store;
            var keyRange = window.IDBKeyRange.lowerBound(s64.disk.prefix + s64.disk.file_prefix);
            var cursorRequest = store.openCursor(keyRange);

            cursorRequest.onsuccess = function(e) {
                var result = e.target.result;

                if(!!result == false) {
                    s64.interp.processListOfPrograms(programs, device_num);
                    return;
                }

                var program = result.value;
                var matches = regex.exec(program.name);
                var type = program.type || s64.disk.program_type;
                if (matches) {
                    programs.push([Math.ceil(s64.disk.roughSizeOfObject(program.data)/1024), matches[1], type]);
                }

                result.continue();
            };

            cursorRequest.onerror = s64.disk.onIndexedDBerror;
            cursorRequest.onabort = s64.disk.onIndexedDBerror;

            return;
        }
    } catch (e) {
        console.log('error loading programs');
        console.log(e);
    }
};


s64.disk.loadRemoteFile = function(file_name, device_num, callback) {
    var splits = file_name.split('@', 2);

    var author = '';

    if (splits.length == 1) {
        author = splits[0];
        file_name = '$';
    } else if (splits.length == 2) {
        author = splits[0];
        file_name = splits[1];
    } else {
        s64.screen.printLine('File not found');
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
        if (e.target.readyState == 4 && e.target.status == 200) {
            if (file_name == '$') {
                s64.disk.handleRemoteFileListRequest(e.target.response, author);
            } else {
                s64.disk.handleRemoteFileRequest(e.target.response);
            }
        } else if (e.target.readyState == 4 && e.target.status != 200) {
            s64.disk.handleRemoteFileRequest('');
        }
    };
    var url = 'https://sole64backup.appspot.com/get?name=' + file_name + '&author=' + author;
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.send();
};

s64.disk.handleRemoteFileRequest = function(response) {
    try {
        if (response == '0') {
            s64.screen.printLine('File not found or unreadable')
            return;
        }

        s64.kernal.memory = JSON.parse(response);
        s64.screen.printLine('Done reading file')
        s64.interp.analyzeCode();
    } catch(e) {
        console.log(e);
        console.log(response);
        s64.screen.printLine('Error reading file');
    }
};

s64.disk.handleRemoteFileListRequest = function(response, author) {
    try {
        response = JSON.parse(response);
        s64.interp.processListOfPrograms(response, 9, author);
    } catch(e) {
        console.log(e);
        console.log(response);
        s64.screen.printLine('Error fetching file list');
    }
};

s64.disk.saveRemoteFile = function(file_name, data, callback, password) {
    var splits = file_name.split('@', 2);

    if (splits.length < 2) {
        s64.screen.printLine('Invalid file name for this device');
        s64.screen.printLine('The correct format is "author@file_name"');
        return;
    }

    s64.screen.print('Saving...');

    var author = splits[0];
    file_name = splits[1];

    password = btoa(password);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
        if (e.target.readyState == 4) {
            if (callback) {
                callback(e);
            }
        }
    };
    var url = 'https://sole64backup.appspot.com/set';
    var params = 'name=' + file_name + '&author=' + author + '&data=' + encodeURIComponent(data)
        + '&password=' + password + '&ftype=' + s64.disk.program_type;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send(params);
};

s64.disk.removeRemoteFile = function(file_name, callback, password) {
    var splits = file_name.split('@', 2);

    if (splits.length < 2) {
        s64.screen.printLine('Invalid file name for this device');
        s64.screen.printLine('The correct format is "author@file_name"');
        return;
    }

    s64.screen.print('Removing...');

    var author = splits[0];
    file_name = splits[1];

    password = btoa(password);

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
        if (e.target.readyState == 4) {
            if (callback) {
                callback(e);
            }
        }
    };
    var url = 'https://sole64backup.appspot.com/remove';
    var params = 'name=' + file_name + '&author=' + author + '&password=' + password;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhr.send(params);
};

s64.disk.loadDroppedFile = function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        s64.screen.dropbox_file = { 'file': file, data: e.target.result };
        s64.screen.printLine('');
        s64.screen.printLine('Do you want to upload "' + file.name + '" (Y/N)?');
        s64.interp.getUserInput(s64.screen.confirmFileDropLoad);
    };

    reader.readAsText(file);
};

s64.disk.downloadFile = function(file_name, data, device_num, callback) {
    var uriContent = "data:application/octet-stream," + encodeURIComponent(data);
    // var newWindow = window.open(uriContent, file_name);
    window.location = uriContent;
    s64.screen.printLine('Downloading file');
};

s64.disk.saveCopyBuffers = function() {
    s64.disk.save('copybuffers', []);//s64.kernal.copy_buffers);
};

s64.disk.loadCopyBuffers = function() {
    s64.disk.load('copybuffers', s64.disk.handleCopyBuffersResponse);
};

s64.disk.handleCopyBuffersResponse = function(result) {
    if (result) {
        s64.kernal.copy_buffers = result.data || [];
    }
};

s64.disk.put = function(name, data, callback) {
    // s64.disk.saveToLocalStorage(s64.disk.store_prefix + name, JSON.stringify(json));
    s64.disk.save(s64.disk.store_prefix + name, data, callback);
};

s64.disk.get = function(name, callback) {
    // return JSON.parse(s64.disk.loadFromLocalStorage(s64.disk.store_prefix + name));
    return s64.disk.load(s64.disk.store_prefix + name, callback, true);
};

s64.disk.returnJSON = function(json, callback) {

};

s64.disk.saveWithPassword = function(password) {
    if (s64.disk.temp_save_file_name != '' && s64.disk.waiting_for_password == true) {
        s64.disk.saveRemoteFile(s64.disk.temp_save_file_name, JSON.stringify(s64.kernal.memory), s64.screen.saveRemoteFileCallback, password);
        s64.disk.waiting_for_password = false;
    }
};

s64.disk.removeWithPassword = function(password) {
    if (s64.disk.temp_remove_file_name != ''
        && s64.disk.waiting_for_password == true) {
        s64.disk.removeRemoteFile(s64.disk.temp_remove_file_name,
                                  s64.screen.removeRemoteFileCallback, password);
        s64.disk.waiting_for_password = false;
    }
};

// thanks to user tomwrong at http://stackoverflow.com/questions/1248302/javascript-object-size/6351386#6351386
s64.disk.roughSizeOfObject = function(object) {
    var objectList = [];
    var recurse = function(value) {
        var bytes = 0;

        if (typeof value === 'boolean') {
            bytes = 4;
        }
        else if (typeof value === 'string') {
            bytes = value.length * 2;
        }
        else if (typeof value === 'number') {
            bytes = 8;
        }
        else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
            objectList[objectList.length] = value;

            for(var i in value) {
                bytes+= 8; // an assumed existence overhead
                bytes+= recurse(value[i])
            }
        }

        return bytes;
    }

    return recurse(object);
}
