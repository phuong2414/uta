require([], function() {
	Drcom.Circle = Drcom.Controller.extend({
		pluginName: "drcom_circle",

		init: function(el, options) {
			this.super.init.apply(this, arguments);
			$.extend(this.options, {
				src: "",
				fill: "",
				angle: 0,
				rotation: -90,
				duration: 2000,
				disabled: false,
				control: false,
				release: function (event, ui) { },
				change: function (event, ui, value) { },
				loadCompleted: function (event, ui) { },
			}, this.options, options);

			this.initCircle();
			this.animating = false;
			this.disabled = this.options.disabled;

			var el = this.options.control || this.element;
			this.bind(el, "vmousedown.circle", this.callbackEvent("mousedown"));
		},

		initCircle: function(callback) {
			var w = this.element.width(),
				h = this.element.height(),
				r = w/2,
				fill = this.options.fill,
				src = this.options.src,
				renderer = new Renderer(this.element[0], w, h);

			var shape = null;
			if (fill && fill !== "") {
				shape = renderer.circle(w/2, h/2, r).attr('fill', fill).add();
			} else {
				shape = renderer.image(src, 0, 0, w, h).add();
			}

			this.circle = renderer.clipArc(w/2, h/2, r, 0, 0, 0);
			this.circle.rotate(this.options.rotation, w/2, h/2);
			shape.clip(this.circle); // clip the shape

			this._trigger("loadCompleted", null, [this]);
		},

		mousedown: function(el, ev) {
			if (this.animating || this.disabled) return;

			this.bind(window, "vmousemove.circle", this.callbackEvent("mousemove"));
			this.bind(window, "vmouseup.circle", this.callbackEvent("mouseup"));
		},

		mousemove: function(el, ev) {
			var pos = {
				x: ev.pageX - this.element.offset().left,
				y: ev.pageY - this.element.offset().top
			};
			var deg = this.getAngleFromPoint(parseInt(pos.x), parseInt(pos.y));
			
			this.change(deg*100/360);
		},

		mouseup: function(el, ev) {
			this.unbind(window, "vmousemove.circle");
			this.unbind(window, "vmouseup.circle");
			this._trigger("release", null, [this]);
		},

		getDeg: function() {
			var end = this.circle.attr('end');
			return end*180/Math.PI;
		},

		scrollTo: function(percent, callback) {
			this.animating = true;

			var deg = percent*3.6,
				self = this;
			this.circle.animate({
				end: (deg * Math.PI/180),
			}, { 
				duration: this.options.duration,
				step: function(value) {
					var deg = value *180/Math.PI,
						percent = deg *100/360,
						point = self.getPointFromAngle(deg);
					self._trigger("change", null, [self, percent, point]);
				},
				complete: function() {
					self.animating = false;
					if (callback) callback.apply(self, [deg]);
				}
			});
		},

		change: function(percent) {
			var deg = percent * 3.6,
				point = this.getPointFromAngle(deg);
			if (this._trigger("change", null, [this, percent, point]) == false) return false;

			this.circle.attr({
				end: deg * Math.PI/180,
			});
		},

		getPointFromAngle: function(deg) {
			var radian = (deg + this.options.rotation) * Math.PI/180,
				r = cx = cy = this.element.width()/2,
				x = cx + r * Math.cos(radian),
				y = cy + r * Math.sin(radian);
			return {x: x, y: y};
		},

		getAngleFromPoint: function(mouseX, mouseY) {
			var cx, cy;
			cx = cy = this.element.width() / 2;
			var radian = Math.atan2(mouseY - cy, mouseX - cx);
			var deg = radian * (180 / Math.PI) - this.options.rotation;
			if (deg < 0) deg = 360 + deg;
			
			return deg;
		},

		enable: function() {
			this.disabled = false;
		},

		disable: function() {
			this.disabled = true;
		},

		destroy: function() {
			this.super.destroy.apply(this,arguments);
			this.element.empty();
			this.circle = null;
		}
	});

	$.fn.drcom_circle = function(options) {
		$(this).each(function(){
			new Drcom.Circle($(this),options);
		});
		return $(this);
	};
});