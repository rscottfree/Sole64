
"use strict";

s64.vic.color = 'black';
s64.vic.lineWidth = 1;

s64.vic.setup = function() {
    s64.vic.canvas = document.createElement('canvas');
    s64.vic.canvas.width = s64.screen.width - (s64.screen.border_width * 2);
    s64.vic.canvas.height = s64.screen.height - (s64.screen.border_width * 2);
    s64.vic.canvas.id = 'viccanvas';
    s64.vic.canvas.classList.add('graphicscanvas');

    if (!!(s64.vic.canvas.getContext && s64.vic.canvas.getContext('2d')) == false) {
        s64.screen.printLine('Canvas is not supported in your browser. No painting for you.');
        return;
    }

    s64.vic.ctx = s64.vic.canvas.getContext('2d');
    s64.vic.ctx.imageSmoothingEnabled = true;
    s64.vic.ctx.font = s64.screen.font_style + ' ' + s64.screen.font_height + "px '" + s64.screen.font_family + "', monospace";
    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
    s64.vic.ctx.textBaseline = 'top';

    document.getElementById('commodore').appendChild(s64.vic.canvas);

    document.getElementById('viccanvas').style.top = 10 + s64.screen.border_width + 'px';
    document.getElementById('viccanvas').style.left = 10 + s64.screen.border_width + 'px';
};

s64.vic.refresh = function() {
    s64.vic.canvas.width = s64.screen.width - (s64.screen.border_width * 2);
    s64.vic.canvas.height = s64.screen.height - (s64.screen.border_width * 2);
    document.getElementById('viccanvas').style.top = 10 + s64.screen.border_width + 'px';
    document.getElementById('viccanvas').style.left = 10 + s64.screen.border_width + 'px';

    s64.vic.ctx = s64.vic.canvas.getContext('2d');
    s64.vic.ctx.font = s64.screen.font_style + ' ' + s64.screen.font_height + "px '" + s64.screen.font_family + "', monospace";

    s64.vic.ctx.textBaseline = 'top';
};

s64.vic.setColor  = function(c) {
    s64.vic.color = c;
    s64.vic.ctx.fillStyle = c;
    s64.vic.ctx.strokeStyle = c;
};

s64.vic.setLineWidth = function(w) {
    s64.vic.lineWidth = w;
    s64.vic.ctx.lineWidth = w;
};

s64.vic.clear = function() {
    s64.vic.ctx.clearRect(0, 0, s64.vic.canvas.width, s64.vic.canvas.height);
};

s64.vic.Circle = function(x, y, d, f) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.f = f;
    this.color = s64.vic.color;
    this.lineWidth = s64.vic.lineWidth;
    this.draw();
};
s64.vic.Circle.prototype.x = 0;
s64.vic.Circle.prototype.y = 0;
s64.vic.Circle.prototype.d = 0;
s64.vic.Circle.prototype.f = false;
s64.vic.Circle.prototype.color = null;
s64.vic.Circle.prototype.lineWidth = 1;
s64.vic.Circle.prototype.draw = function() {
    s64.vic.ctx.beginPath();
    s64.vic.ctx.fillStyle = this.color;
    s64.vic.ctx.strokeStyle = this.color;
    s64.vic.ctx.lineWidth = this.lineWidth;
    s64.vic.ctx.arc(this.x, this.y, this.d, 0, Math.PI*2, true);
    s64.vic.ctx.closePath();
    if (this.f) s64.vic.ctx.fill();
    else s64.vic.ctx.stroke();
    s64.vic.ctx.fillStyle = s64.vic.color;
    s64.vic.ctx.strokeStyle = s64.vic.color;
    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
};


s64.vic.Oval = function(x, y, w, h, f) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.f = f;
    this.color = s64.vic.color;
    this.lineWidth = s64.vic.lineWidth;
    this.draw();
};
s64.vic.Oval.prototype.x = 0;
s64.vic.Oval.prototype.y = 0;
s64.vic.Oval.prototype.w = 0;
s64.vic.Oval.prototype.h = 0;
s64.vic.Oval.prototype.f = false;
s64.vic.Oval.prototype.color = null;
s64.vic.Oval.prototype.lineWidth = 1;
s64.vic.Oval.prototype.draw = function() {
    s64.vic.ctx.beginPath();
    s64.vic.ctx.fillStyle = this.color;
    s64.vic.ctx.strokeStyle = this.color;
    s64.vic.ctx.lineWidth = this.lineWidth;

    // ellipse code from:
    // williammalone.com/briefs/how-to-draw-ellipse-html5-canvas
    s64.vic.ctx.moveTo(this.x, this.y - this.h/2);

    s64.vic.ctx.bezierCurveTo(
        this.x + this.w/2, this.y - this.h/2,
        this.x + this.w/2, this.y + this.h/2,
        this.x, this.y + this.h/2);

    s64.vic.ctx.bezierCurveTo(
        this.x - this.w/2, this.y + this.h/2,
        this.x - this.w/2, this.y - this.h/2,
        this.x, this.y - this.h/2);

    if (this.f) s64.vic.ctx.fill();
    else s64.vic.ctx.stroke();
    s64.vic.ctx.closePath();
    s64.vic.ctx.moveTo(0, 0);

    s64.vic.ctx.fillStyle = s64.vic.color;
    s64.vic.ctx.strokeStyle = s64.vic.color;
    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
};


s64.vic.Line = function(x1, y1, x2, y2) {
    this.x = x1;
    this.y = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.lineWidth = s64.vic.lineWidth;
    this.color = s64.vic.color;
    this.draw();
};
s64.vic.Line.prototype.x = 0;
s64.vic.Line.prototype.y = 0;
s64.vic.Line.prototype.x2 = 0;
s64.vic.Line.prototype.y2 = 0;
s64.vic.Line.prototype.color = null;
s64.vic.Line.prototype.draw = function() {
    s64.vic.ctx.strokeStyle = this.color;
    s64.vic.ctx.lineWidth = this.lineWidth;
    s64.vic.ctx.beginPath();
    s64.vic.ctx.moveTo(this.x, this.y);
    s64.vic.ctx.lineTo(this.x2, this.y2);
    s64.vic.ctx.stroke();
    s64.vic.ctx.closePath();
    s64.vic.ctx.strokeStyle = s64.vic.color;
    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
};

s64.vic.Aline = function(x, y, l, a) {
    this.x = x;
    this.y = y;
    this.l = l;
    this.a = a;
    this.lineWidth = s64.vic.lineWidth;
    this.color = s64.vic.color;
    this.draw();
};
s64.vic.Aline.prototype.x = 0;
s64.vic.Aline.prototype.y = 0;
s64.vic.Aline.prototype.l = 0;
s64.vic.Aline.prototype.a = 0;
s64.vic.Aline.prototype.lineWidth = 1;
s64.vic.Aline.prototype.color = null;
s64.vic.Aline.prototype.draw = function() {
    var radian = this.a * Math.PI / 180;
    var neg_radian = (this.a + 180) * Math.PI/180;
    var x1 = this.x + this.l * Math.cos(radian);
    var x2 = this.x + this.l * Math.cos(neg_radian);
    var y1 = this.y + this.l * Math.sin(radian);
    var y2 = this.y + this.l * Math.sin(neg_radian);

    s64.vic.ctx.strokeStyle = this.color;
    s64.vic.ctx.lineWidth = this.lineWidth;
    s64.vic.ctx.beginPath();
    s64.vic.ctx.moveTo(x1, y1);
    s64.vic.ctx.lineTo(x2, y2);
    s64.vic.ctx.stroke();
    s64.vic.ctx.closePath();

    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
    s64.vic.ctx.strokeStyle = s64.vic.color;
};

s64.vic.Path = function(coords) {
    this.coords = coords;
    this.lineWidth = s64.vic.lineWidth;
    this.color = s64.vic.color;
    this.draw();
};
s64.vic.Path.prototype.coords = [];
s64.vic.Path.prototype.lineWidth = 1;
s64.vic.Path.prototype.color = null;
s64.vic.Path.prototype.draw = function() {
    s64.vic.ctx.strokeStyle = this.color;
    s64.vic.ctx.lineWidth = this.lineWidth;
    s64.vic.ctx.beginPath();
    s64.vic.ctx.moveTo(this.coords[0][0], this.coords[0][1]);
    for (var i = 1; i < this.coords.length; i++) {
        s64.vic.ctx.lineTo(this.coords[i][0], this.coords[i][1]);
    }
    s64.vic.ctx.stroke();
    s64.vic.ctx.closePath();

    s64.vic.ctx.strokeStyle = s64.vic.color;
    s64.vic.ctx.lineWidth = s64.vic.lineWidth;
};
