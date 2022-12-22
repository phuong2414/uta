require([], function() {
	Drcom.Cover = Drcom.SlideShow.extend({
		pluginName: "drcom_cover",
		init : function(el, options) {
			this.super.init.apply(this,arguments);
	    	$.extend(this.options,{
	    		events : [],
				click : function (event, ui, current) {},
				distance : 145,
				z : 100,
				distanceleft : 0,
				distancelright : 0,
				cycle : false,
				change : function () {}
			},this.options,options);
	    	
			this.changeByPercent(0);
			var height = parseFloat((this.items.length - 1) * this.options.distance);
			this.element.height(height + $(this.items[0]).height());
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
				"-webkit-transform" : "translate3d(0px," + y + "px,0px)"
			});
		},
		scrollTo : function (x, y, newDuration) {
			var instance = this;
			var height = parseFloat((this.items.length - 1) * this.options.distance);
			var percent = 1 - Math.abs(y / height);
			this.animating = true;
			this.x = x;
			this.y = y;
			this.element.animate({
				webkitTransform : y
			}, {
				duration : newDuration,
				complete : function () {
					instance.animating = false;
					instance.options.change(percent);
				},
				step : function (now, tween) {
					if (isNaN(now)) {
						instance.animating = false;
						return;
					}
					instance.changeByPosition(0, now);
				},
				easing:"linear"
			});
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
		"vmousedown" : function (e) {
			if (this.animating == true) {
				this.element.stop();
			}
			var that = this,
			point = e;
			this.startTime = Date.now();
			that.moved = false;
			this.startX = this.x;
			this.startY = this.y;
			this.pageX = point.pageX;
			this.pageY = point.pageY;
			this.firstX = this.x;
			this.firstY = this.y;
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
			this.moved = true;
			if (timestamp - this.startTime > 300) {
				this.startTime = timestamp;
				this.startX = this.x;
				this.startY = this.y;
			}
		},
		_mouseup : function (e) {
			var that = this,
			duration = Date.now() - that.startTime;
			if (that.moved == true) {
				if (duration < 300 && this.y != this.startY) {
					var wrapperH = $(".cf").height();
					var scrollerH = this.element.height();
					var momentumY = this.momentum(this.y, this.startY, duration, wrapperH - scrollerH - $(this.items[0]).height(), wrapperH);
					var newY = momentumY.destination;
					var time = momentumY.duration;
					if (newY != this.y) {
						this.scrollTo(0, newY, time);
					}
				}
			}
			$(window).unbind("vmousemove.coverflow");
			$(window).unbind("vmouseup.coverflow");
		},
		momentum : function (current, start, time, lowerMargin, wrapperSize) {
			var distance = current - start,
			speed = Math.abs(distance) / time,
			destination,
			duration,
			deceleration = 0.0006;
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
			//this.bind(this.items, "tapone", "item_click");
		},
		"item_click" : function (el, ev) {
			if (this.lock == true)
				return;
			this.blocked = true;
			for (var i = 0; i < this.items.length; i++) {
				if (this.items[i] == el[0] && i == this.current) {
					this.blocked = false;
					this._trigger("click", null, [this, i]);
					return;
				}
				if (this.items[i] == el[0]) {
					//this.change(i);
					return;
				}
			}
		},
		changeByPosition : function (x, y) {
			var height = parseFloat((this.items.length - 1) * this.options.distance);
			var h3 = parseFloat(3 * this.options.distance);
			if (y > -h3)
				y = -h3;
			if (y < -height)
				y = -height;
			var percent = 1 - Math.abs(y / height);
			//console.log(percent)
			this.changeByPercent(percent);
		},
		changeByPercent : function (percent) {
			var height = parseFloat((this.items.length - 1) * this.options.distance);
			var scaleStep = 0.06;
			var scale = 0;
			var index = 0;
			var h = height - height * percent;
			for (var i = 0; i < this.items.length; i++) {
				if (h > this.options.distance * i && h <= this.options.distance * (i + 1)) {
					index = i + 1;
					break;
				}
			}
			var c = ((height + height * percent) / this.options.distance);
			
			if (Math.floor(c) == c)
			{
				if(percent==0)
					c=0;
				else
					c=1;
			}
			else
				c = c - Math.floor(c);
			//console.log(c)
			var scaleList = [];
			for (var i = index; i >= 0; i--) {
				scaleList.push(1 - (scale - scaleStep * c));
				scale = scale + scaleStep;
			}
			scaleList.reverse();
			for (var i = index - 4; i < this.items.length; i++) {
				scaleList.push(1.2);
			}
			for (var i = 0; i < this.items.length; i++) {
				var c = scaleList[i];
				$(this.items[i]).css({
					"-webkit-transform" : "translate3d(0px," + i * this.options.distance + "px,0px) rotateX(-47deg)   scale(" + c + ")   "
				});
			}
			this.items.removeClass('active');
			$(this.items[index]).addClass("active");
			var s = height - height * percent;
			this._setPos(0, -s);
			this.options.change(percent);
		},
		change : function (index) {

			var top = 0;
			var currentPos = 0;
			var scale = 1;
			var scaleList = [];
			for (var i = 0; i < index; i++) {
				scale = Math.round(((scale - 0.06) * 1000)) / 1000;
				scaleList.push(scale);
			}
			for (var i = 0; i < this.items.length; i++) {
				if (i < index) {
					$(this.items[i]).css({
						"-webkit-transform" : "translate3d(0px," + top + "px,0px) rotateX(-47deg) scale(" + scaleList[index - 1 - i] + ")"
					});
				}
				if (i == index) {
					top = top + this.options.distanceleft;
					currentPos = top;
					$(this.items[i]).css({
						"-webkit-transform" : "translate3d(0px," + top + "px," + this.options.z + "px) rotateX(-47deg)   scale(1)"
					});
					top = top + this.options.distancelright;
					this.items.removeClass("active");
					$(this.items[index]).addClass("active");
				}
				if (i > index) {
					$(this.items[i]).css({
						"-webkit-transform" : "translate3d(0px," + top + "px,0px) rotateX(-47deg) scale(1.2)"
					});
				}
				top = top + this.options.distance;
			}
			this._setPos(0, -currentPos);
			this.lock = false;
			this.current = index;
			this.options.change(index);
		}
	});

	$.fn.drcom_cover = function(options) {
		$(this).each(function(){
			new Drcom.Cover($(this),options);
		});
		return $(this);
	};
});
