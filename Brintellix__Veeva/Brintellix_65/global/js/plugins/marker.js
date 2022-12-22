require([], function() {
    Drcom.Marker = Drcom.Controller.extend({
        pluginName: "drcom_marker",
        init: function (el, options) {
            this.super.init.apply(this, arguments);
            $.extend({
                lineWidth: 1,
                opacity: 1
            }, this.options, options);
            this.canvas = this.element[0];
            this.element.attr("width", this.element.width());
            this.element.attr("height", this.element.height());
            this.renderColorPicker();
            this.reset();
            this.render();
        },
        render: function () {
            this.context = this.canvas.getContext("2d");

            this.context.lineJoin = 'round';
            this.context.lineCap = 'round';
            this.context.lineWidth = this.options.lineWidth;

            var rgb = this.hexToRgb(this.options.optionPicker.colors[0]),
                color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + this.options.opacity + ")";

            this.context.strokeStyle = color;
            this.currentColor = color;
            this.bind(this.element, 'vmousedown', this.callbackEvent("vmousedown"));
        },
        renderColorPicker: function () {
            var defaults = {
                Effect: '',
                duration: 500
            };

            this.options.optionPicker = $.extend(defaults, this.options.optionPicker);

            // get colors from config first
            this.options.optionPicker.colors = (function (config) {
                if (config.colors && config.colors.length >= 6) {
                    return config.colors;
                }

                return ['#006dd6', '#96c93c', '#ea2920', '#f7ec5e', '#231f20', '#fff'];
            })(drcom.config.marker || {});

            if (!$('.colorPicker').length) {
                var colorHtml = '<div class="colorPicker"></div><ul class="color-list" style="display:none;">';

                this.options.optionPicker.colors.forEach(function (value) {
                    colorHtml += '<li class="color-item" style="background-color:' + value + '" data-color="' + value + '"></li>';
                });
                colorHtml += '</ul>';

                $(colorHtml).appendTo('body');
            } else {
                $('.colorPicker').find('.color-item').each(function(i, el) {
                    el = $(el);

                    var value = this.options.optionPicker.colors[i];
                    el.attr('style', 'background-color:"' + value + '" data-color="' + value + '"');
                });
            }
            
            var instance = this;

            this.bind($('.color-item'), 'tapone', function () {
                instance._setBackgroundColorForPicker.apply(instance, [$(this).attr('data-color')]);
            });

            this.bind($('.colorPicker'), 'tapone', function () {
                instance.element.toggle();
                $('.color-list').toggle();
                if (instance.element.css('display') == "none") {
                    instance.reset();
                    drcom.enableSwipe();
                } else {
                    drcom.disableSwipe();

                    // set default color for picker
                    instance._setBackgroundColorForPicker.apply(instance, [instance.options.optionPicker.colors[0]]);
                }
            });
        },
        _setBackgroundColorForPicker: function(hexColor) {
            var rgb = this.hexToRgb(hexColor),
                color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + this.options.opacity + ")";

            this.currentColor = color;
            $('.colorPicker').css('background-color', color);
        },
        hexToRgb: function (hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });

            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        addPoint: function (point) {
            this.points.push(point);
        },
        draw: function () {
            this.clear();
            for (var i = 0; i < this.lines.length; i++) {
                var points = this.lines[i];
                this.context.beginPath();
                this.context.moveTo(points[0].x, points[0].y);
                for (var j = 1; j < points.length; j++) {
                    this.context.lineTo(points[j].x, points[j].y);
                }
                this.context.strokeStyle = this.colors[i];
                this.context.stroke();
                this.context.closePath();
            }
        },
        vmousedown: function (el, e) {
            this.points = [];
            this.lines.push(this.points);
            this.colors.push(this.currentColor);
            this.addPoint({
                x: e.offsetX,
                y: e.offsetY
            });
            this.bind(this.element, 'vmousemove.' + this.pluginName, this.callbackEvent("vmousemove"));
            this.bind(this.element, 'vmouseup.' + this.pluginName, this.callbackEvent("vmouseup"));
        },
        vmousemove: function (el, e) {
            this.addPoint({
                x: e.offsetX,
                y: e.offsetY
            });
            this.draw();
        },
        vmouseup: function (el, e) {
            this.unbind(this.element, 'vmousemove.' + this.pluginName);
            this.unbind(this.element, 'vmouseup.' + this.pluginName);
        },
        exportBase64: function () {
            return this.canvas.toDataURL("image/png");
        },
        clear: function () {
            this.context.clearRect(0, 0, this.element.width(), this.element.height());
        },
        reset: function () {
            if (this.context)
                this.clear();
            this.points = [];
            this.lines = [];
            this.colors = [];
            var rgb = this.hexToRgb(this.options.optionPicker.colors[0]),
                color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + this.options.opacity + ")";
            if (this.context)
                this.context.strokeStyle = color;
            this.currentColor = color;
            $('.colorPicker').removeAttr('style');
        }
    });
    $.fn.drcom_marker = function (options) {
        this.each(function () {
            new Drcom.Marker($(this), options);
        });
        return this;
    };

    // if show marker then create it
    if (drcom.config.marker && drcom.config.marker.isShow) {
        var marker = $('#marker');
        if (!marker.length) {
            marker = $('<canvas id="marker"></canvas>').appendTo($(document.body));
        }

        // create controller
        marker.drcom_marker({
            lineWidth: 15,
            opacity: 0.5
        });
    }
});