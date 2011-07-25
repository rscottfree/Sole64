"use strict";


s64.help.auto_hide = true;
s64.help.font_size = 12;

s64.help.show = function(topic) {
    s64.help.auto_hide = s64.disk.loadConfig('s64.help.auto_hide') == '0' ? false : true;

    if (!document.getElementById('help')) {
        var help = document.createElement('div');
        help.style.width = '550px';
        help.style.height = window.innerHeight - 30 + 'px';
        help.style.fontSize = s64.help.font_size + 'px';
        help.setAttribute('id', 'help');

        help.addEventListener('mouseover', s64.help.showHelpWindow, true);
        if (s64.help.auto_hide) {
            help.addEventListener('mouseout', s64.help.hideHelpWindow, true);
        }

        var closemark = new Image();
        closemark.src = 'closemark.png';
        closemark.setAttribute('id', 'closemark');
        closemark.addEventListener('click', s64.help.close, true);
        closemark.width = 12;
        help.appendChild(closemark);

        var menu = document.createElement('div');
        menu.setAttribute('id', 'helpmenu');
        help.appendChild(menu);

        var increase_font = document.createElement('a');
        increase_font.innerText = '+';
        increase_font.title = 'Increase font size';
        increase_font.className = 'fontchange';
        increase_font.addEventListener('click', function(event) {
            document.getElementById('help').style.fontSize = ++s64.help.font_size + 'px';
        }, true);
        menu.appendChild(increase_font);

        var decrease_font = document.createElement('a');
        decrease_font.innerText = '-';
        decrease_font.title = 'Decrease font size';
        decrease_font.className = 'fontchange';
        decrease_font.addEventListener('click', function(event) {
            document.getElementById('help').style.fontSize = --s64.help.font_size + 'px';
        }, true);
        menu.appendChild(decrease_font);

        var auto_hide = document.createElement('input');
        auto_hide.setAttribute('type', 'checkbox');
        auto_hide.checked = s64.help.auto_hide;

        auto_hide.addEventListener('change', function(event) {
            if (this.checked) {
                document.getElementById('help').addEventListener(
                    'mouseout', s64.help.hideHelpWindow, true);
                s64.disk.saveConfig('s64.help.auto_hide', 1);
                s64.help.auto_hide = true;
            } else {
                document.getElementById('help').removeEventListener(
                    'mouseout', s64.help.hideHelpWindow, true);
                s64.disk.saveConfig('s64.help.auto_hide', 0);
                s64.help.auto_hide = false;
            }
        }, true);

        menu.appendChild(auto_hide);

        var auto_hide_text = document.createElement('span');
        auto_hide_text.innerHTML = 'auto hide';
        menu.appendChild(auto_hide_text);

        var help_text = document.createElement('div');
        help_text.id = 'help_text';
        help.appendChild(help_text);
        help_text.style.height = (parseInt(help.style.height) - 24) + 'px';

        document.body.appendChild(help);

        var request = new XMLHttpRequest();
        request.open('GET', './help.html', true);
        request.onreadystatechange = function (e) {
            if (request.readyState == 4) {
                if(request.status == 200) {
                    help_text.innerHTML = request.responseText;
                    if (topic) {
                        s64.help.scrollToTopic(topic);
                    }

                    s64.help.setupLinks();
                } else {
                    console.log('Error', request.statusText);
                }
            }
        };
        request.send(null);

        s64.help.showHelpWindow();
    } else if (document.getElementById('help').style.display == 'none') {
        document.getElementById('help').style.display = 'block';
        s64.help.showHelpWindow();
        if (topic) {
            s64.help.scrollToTopic(topic);
        }
    } else {
        s64.help.showHelpWindow();
        if (topic) {
            s64.help.scrollToTopic(topic);
        }
    }
};

s64.help.hideHelpWindow = function(event) {
    document.getElementById('help').style.right =
        '-' + (parseInt(document.getElementById('help').style.width) - 30) + 'px';
};

s64.help.showHelpWindow = function(event) {
    document.getElementById('help').style.right = '-2px';
};

s64.help.close = function(event) {
    document.getElementById('help').style.display = 'none';
};

s64.help.scrollToTopic = function(topic) {
    topic = topic.toLowerCase();
    document.getElementById('help_text').scrollTop =
        document.getElementById('help:' + topic) ?
        document.getElementById('help:' + topic).offsetTop - 25 : 0;
};

s64.help.getObjectXY = function (obj) {
    var left, top;
    left = top = 0;
    if (obj.offsetParent) {
        do {
            left += obj.offsetLeft;
            top  += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return {
        x : left,
        y : top
    };
};

s64.help.setupLinks = function() {
    var links = document.getElementsByTagName('code');
    for (var i in links) {
        var link = links[i];
        var ih = link.innerHTML;
        if (s64.interp.commands.indexOf(ih) != -1) {
            link.innerHTML = '<a href="javascript:s64.help.show(\'' + ih + '\')">' + ih + '</a>';
        }
    }
};