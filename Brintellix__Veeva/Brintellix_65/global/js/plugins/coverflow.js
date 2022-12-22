require([], function () {
	Drcom.CoverFlow = Drcom.SlideShow.extend({
			pluginName : "drcom_coverflow",
			init : function (el, options) {
				this.super.init.apply(this, arguments);
				$.extend(this.options, {
					events : [],
					click : function (event, ui, current) {},
					distance : 150,
					z : 100,
					rotateY : 0,
					distanceleft : 0,
					distancelright : 0,
					cycle : false,
					change : function (ui, index, x) {},
					beforeChange : function (ui, index) {},
					duration : 1200,
					scale : 0,
					opacity : 0,
					draggable : true
				}, this.options, options);
				var width = parseFloat((this.items.length - 1) * this.options.distance) + $(this.items[0]).width();
				this.element.width(width);
				this.changeByPercent(0);
				if (this.options.draggable)
					this.element.bind("vmousedown", this.callback("vmousedown"));
			},
			_getPos : function () {
				return {
					x : x,
					y : y
				};
			},
			_setPos : function (x, y) {
				this.x = x;
				this.y = y;
				this.element.css({
					"-webkit-transform" : "translate3d(" + x + "px,0px,0px)"
				});
			},
			_setPosAni : function (x, y, callback) {
				this.x = x;
				this.y = y;
				this.element.animate({
					"transform" : "translate3d(" + x + "px,0px,0px)"
				}, this.options.duration, callback);
			},
			getComputedPosition : function () {
				var matrix = window.getComputedStyle(this.element[0], null),
				x,
				y;
				matrix = matrix["webkitTransform"].split(')')[0].split(', ');
				x =  + (matrix[12] || matrix[4]);
				y =  + (matrix[13] || matrix[5]);
				return {
					x : x,
					y : y
				};
			},
			scrollTo : function (x, y, newDuration, callback) {
				var instance = this;
				var height = parseFloat((this.items.length - 1) * this.options.distance);
				var percent = 1 - Math.abs(x / height);
				this.x = x;
				this.y = y;
				var properties = {
					translateX : this.getComputedPosition().x
				};
				TweenLite.to(properties, this.options.duration / 1000, {
					'translateX' : x,
					onComplete : function () {
						if (callback)
							callback();
					},
					onUpdate : function (now) {
						instance.changeByPosition(properties.translateX, 0);
					},
					onUpdateParams : [properties.translateX]
				});
			},
			checkMove : function (ev1, ev2) {
				var moved = false;
				if (Math.abs(ev1.screenX - ev2.screenX) > 1)
					moved = true;
				if (Math.abs(ev1.screenY - ev2.screenY) > 1)
					moved = true;
				return moved;
			},
			"vmousedown" : function (e) {
				if (this.blocked == true)
					return;
				this.blocked = true;
				var point = e;
				this.startTime = Date.now();
				this.startX = this.x;
				this.startY = this.y;
				this.pageX = point.pageX;
				this.pageY = point.pageY;
				this.firstX = this.x;
				this.firstY = this.y;
				this.startEvent = e;
				$(window).bind("vmousemove.coverflow", this.callback("_mousemove"));
				$(window).bind("vmouseup.coverflow", this.callback("_mouseup"));
			},
			_mousemove : function (e) {
				var point = e,
				deltaX = point.pageX - this.pageX,
				deltaY = point.pageY - this.pageY,
				newX = this.firstX + deltaX,
				newY = this.firstY + deltaY;
				timestamp = Date.now();
				this.changeByPosition(newX, newY);
				if (timestamp - this.startTime > 300) {
					this.startTime = timestamp;
					this.startX = this.x;
					this.startY = this.y;
				}
			},
			_mouseup : function (e) {
				$(window).unbind("vmousemove.coverflow");
				$(window).unbind("vmouseup.coverflow");
				var that = this,
				duration = Date.now() - that.startTime,
				x = this.x;
				if (duration < 300 && x != this.startX) {
					var wrapperH = this.element.parent().width();
					var scrollerH = this.element.width();
					var momentum = this.momentum(x, this.startX, duration, -scrollerH, 0);
					var destination = momentum.destination;
					var time = momentum.duration;
					if (destination != x) {
						this.scrollTo(destination, 0, time, function () {
							that.blocked = false;
						});
						return;
					}
				}
				this.blocked = false;
			},
			momentum : function (current, start, time, lowerMargin, wrapperSize, deceleration) {
				var distance = current - start,
				speed = Math.abs(distance) / time,
				destination,
				duration;
				deceleration = deceleration === undefined ? 0.0006 : deceleration;
				destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
				duration = speed / deceleration;
				if (destination < lowerMargin) {
					destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
					distance = Math.abs(destination - current);
					duration = distance / speed;
				} else if (destination > 0) {
					destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
					distance = Math.abs(current) + destination;
					duration = distance / speed;
				}
				return {
					destination : Math.round(destination),
					duration : duration
				};
			},
			_bindEvents : function () {
				this.bind(this.items, "tapone", this.callbackEvent("item_click"));
			},
			"item_click" : function (el, ev) {
				if (this.blocked == true)
					return;
				for (var i = 0; i < this.items.length; i++) {
					if (this.items[i] == el[0] && i == this.current) {
						this._trigger("click", null, [this, i]);
						return;
					}
					if (this.items[i] == el[0]) {
						this.change(i);
						return;
					}
				}
			},
			changeByPosition : function (x, y) {
				var height = parseFloat((this.items.length - 1) * this.options.distance);
				var h3 = parseFloat(0 * this.options.distance);
				if (x > -h3)
					x = -h3;
				if (x < -height)
					x = -height;
				var percent = Math.abs(x / height);
				this.changeByPercent(percent);
			},
			changeByPercent : function (percent) {
				var index = Math.floor((this.items.length - 1) * percent);
				this.options.beforeChange(this, index);
				var height = parseFloat((this.items.length - 1) * this.options.distance);
				var top = 0;
				var currentPos = 0;
				var scale = 1,
				opacity = 1;
				var scaleList = [],
				opacityList = [];
				var scaleStep = this.options.scale;
				var opacityStep = this.options.opacity;
				var c = (this.items.length - 1) * percent;
				c = c - Math.floor(c);
				for (var i = 0; i < this.items.length; i++) {
					scale = scale - scaleStep;
					opacity = opacity - opacityStep;
					scaleList.push(scale);
					opacityList.push(opacity);
				}
				if (this.current != index)
					this.prevIndex = this.current;
				this.items.not(this.items[index]).removeClass("ani");
				$(this.items[this.prevIndex]).addClass("ani");
				for (var i = 0; i < this.items.length; i++) {
					if (i < index) {
						var scale = scaleList[index - i - 1];
						var a = scale - scaleStep;
						var b = scale + (a - scale) * c;
						var o = opacityList[index - i - 1];
						var d = o - opacityStep;
						var e = o + (d - o) * c;
						var t = $(this.items[0]).width() - $(this.items[0]).width() * b - top;
						$(this.items[i]).css({
							"-webkit-transform" : "translate3d(" + -t + "px,0px,0px)  scale(" + b + ")  rotateY(" + this.options.rotateY + "deg) ",
							"z-index" : i,
							opacity : e
						});
					}
					if (i == index) {
						top = top + this.options.distanceleft;
						currentPos = top;
						$(this.items[i]).css({
							"-webkit-transform" : "translate3d(" + top + "px,0px," + this.options.z + "px)   scale(1)",
							"z-index" : this.items.length,
							opacity : 1
						});
						top = top + this.options.distancelright;
					}
					if (i > index) {
						var scale = scaleList[i - index - 1];
						var a = scale - scaleStep;
						var b = scale - (a - scale) * c;
						var o = opacityList[index - i - 1];
						var d = o - opacityStep;
						var e = o - (d - o) * c;
						$(this.items[i]).css({
							"-webkit-transform" : "translate3d(" + top + "px,0px,0px)    scale(" + b + ") rotateY(-" + this.options.rotateY + "deg)",
							"z-index" : this.items.length - i - 1,
							opacity : e
						});
					}
					top = top + this.options.distance;
				}
				this.items.not($(this.items[index])).removeClass('active');
				$(this.items[index]).addClass("active");
				this._setPos(-height * percent, 0);
				this.current = index;
				this.options.change(this, index, height * percent);
			},
			change : function (index) {
				if (this.blocked == true)
					return;
				this.blocked = true;
				this.options.beforeChange(this, index);
				this.items.stop();
				this.element.stop();
				var top = 0;
				var currentPos = 0;
				var scale = 1,
				opacity = 1;
				var scaleList = [],
				opacityList = [];
				var scaleStep = this.options.scale;
				var opacityStep = this.options.opacity;
				for (var i = 0; i < this.items.length; i++) {
					scale = Math.round(((scale - scaleStep) * 1000)) / 1000;
					scaleList.push(scale);
					opacity = Math.round(((opacity - opacityStep) * 1000)) / 1000;
					opacityList.push(opacity);
				}
				for (var i = 0; i < this.items.length; i++) {
					if (i < index) {
						var t = $(this.items[0]).width() - $(this.items[0]).width() * scaleList[index - i - 1] - top;
						$(this.items[i]).css({
							"transform" : "translate3d(" + (-t) + "px,0px,0px)   scale(" + scaleList[index - i - 1] + ")  rotateY(" + this.options.rotateY + "deg)",
							"-webkit-transform" : "translate3d(" + (-t) + "px,0px,0px)   scale(" + scaleList[index - i - 1] + ")  rotateY(" + this.options.rotateY + "deg)",
							opacity : opacityList[index - i - 1],
							"-webkit-transition" : "all " + (this.options.duration / 1.5) / 1000 + 's'
						});
						$(this.items[i]).css({
							"z-index" : i
						});
					}
					if (i == index) {
						top = top + this.options.distanceleft;
						currentPos = top;
						console.log('item class', $(this.items[i]), -t, scaleList[index - i - 1], this.options.rotateY)
						$(this.items[i]).css({
							"transform" : "translate3d(" + top + "px,0px," + this.options.z + "px) scale(1)",
							"-webkit-transform" : "translate3d(" + top + "px,0px," + this.options.z + "px) scale(1)",
							opacity : 1,
							"-webkit-transition" : "all " + (this.options.duration / 1.5) / 1000 + 's'
						});
						$(this.items[i]).css({
							"z-index" : this.items.length
						});
						top = top + this.options.distancelright;
						this.items.removeClass("active");
						$(this.items[index]).addClass("active");
					}
					if (i > index) {
						$(this.items[i]).css({
							"transform" : "translate3d(" + top + "px,0px,0px)    scale(" + scaleList[i - index - 1] + ") rotateY(-" + this.options.rotateY + "deg)",
							"-webkit-transform" : "translate3d(" + top + "px,0px,0px)    scale(" + scaleList[i - index - 1] + ") rotateY(-" + this.options.rotateY + "deg)",
							opacity : opacityList[i - index - 1],
							"-webkit-transition" : "all " + (this.options.duration / 1.5) / 1000 + 's'
						});
						$(this.items[i]).css({
							"z-index" : this.items.length - i - 1
						});
					}
					top = top + this.options.distance;
				}
				this.items.removeClass('active');
				$(this.items[index]).addClass("active");
				var self = this;
				this._setPosAni(-currentPos, 0, function () {
					self.blocked = false;
					self.current = index;
					self.options.change(self, index, currentPos);
				});
			}
		});
	$.fn.drcom_coverflow = function (options) {
		$(this).each(function () {
			new Drcom.CoverFlow($(this), options);
		});
		return $(this);
	};
});
