require([], function() {
    Drcom.Drawing = Drcom.Controller.extend({
        pluginName: "drcom_drawing",
        init: function(el, options) {
            $.extend(this.options, {
                color: "#000",
                size: 1,
                background: "transparent",
                border: 0
            }, this.options, options);
            this.super.init.apply(this, arguments);

            this.canvas = this.element[0];
            this.element.attr("width", this.element.width());
            this.element.attr("height", this.element.height());
            this.pos = this.getPosition();
            
            this.x = null;
            this.y = null;
            this.render();
        },
        render: function() {
            this.context = this.canvas.getContext("2d");
            this.context.lineJoin = 'round';
            this.context.lineCap = 'round';

            this.context.beginPath();

            if (this.options.background != "transparent" && this.options.background != undefined) {


                if (this.options.background.indexOf("#") != -1) //color
                {
                    this.context.fillStyle = this.options.background;
                    this.context.fillRect(0, 0, this.element.width(), this.element.height());
                } else {
                    var img = new Image();
                    img.src = this.options.background;
                    this.context.drawImage(img, 0, 0);
                }

            }
            if (this.options.border != 0 && this.options.border != undefined) {
                var pattern = this.options.border.split(" ");
                var pixel = pattern[0];
                var color = pattern[1];
                this.context.lineWidth = parseInt(pixel);
                this.context.strokeStyle = color;
                this.context.strokeRect(0, 0, this.element.width(), this.element.height());
            }

            this.context.lineWidth = this.options.size;
            this.context.strokeStyle = this.options.color;

            var supportTouch = !drcom.isPhantom && "ontouchend" in document,
                touchStartEvent = supportTouch ? "touchstart" : "mousedown",
                touchEndEvent = supportTouch ? "touchend" : "mouseup",
                touchMoveEvent = supportTouch ? "touchmove" : "mousemove";

            this.bind(this.element, touchStartEvent, this.callbackEvent("vmousedown"));
            this.bind(this.element, touchMoveEvent, this.callbackEvent("vmousemove"));
            this.bind(this.element, touchEndEvent, this.callbackEvent("vmouseup"));
        },
        getPosition: function() {
            var element = this.canvas;
            var xPosition = 0;
            var yPosition = 0;

            while(element) {
                var style = getComputedStyle(element),
                    left = parseInt(style.getPropertyValue("left"), 10),
                    top = parseInt(style.getPropertyValue("top"), 10);
                if (isNaN(left)) left = 0;
                if (isNaN(top)) top = 0;
                xPosition += (left - element.scrollLeft + element.clientLeft);
                yPosition += (top - element.scrollTop + element.clientTop);
                element = element.parentElement;
            }
            return { x: xPosition, y: yPosition };
        },
        getPos: function(event) {
            this.x = event.originalEvent != null ? event.originalEvent.pageX : event.clientX;
            this.y = event.originalEvent != null ? event.originalEvent.pageY : event.clientY;
            this.x -= this.pos.x;
            this.y -= this.pos.y;
        },
        vmousedown: function(el, event) {
            this.getPos(event);
            this.context.moveTo(this.x, this.y);
        },
        vmouseup: function(el, event) {
            var e = event.originalEvent;
            this.x = null;
            this.y = null;
            return false;
        },
        vmousemove: function(el, event) {
            if (this.x == null || this.y == null) {
                return;
            }
            this.getPos(event);
            this.context.lineTo(this.x, this.y);
            this.context.stroke();
            this.context.moveTo(this.x, this.y);
        },
        exportBase64: function() {
            return this.canvas.toDataURL("image/png");
        },
        clear: function() {
            this.context.clearRect(0, 0, this.element.width(), this.element.height());
            this.context.beginPath();
        }
    });

    $.fn.drcom_drawing = function(options) {
        this.each(function() {
            new Drcom.Drawing($(this), options);
        });
        return this;
    }
});
