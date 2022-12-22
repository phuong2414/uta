require([], function() {
	$.fn.changeEffect = function (effect, opts, duration, callback) {
		if (opts == null) opts = {};
		var change = this.data("effects.change");
		if (change == null)
			change = {
				current: 0,
				lock: false,
				next: 1,
				items: $(this).children()
			};
		var current = change.current,
			lock = change.lock,
			index = change.next,
			items = change.items;
		if (lock == true) return false;

		change.lock = true;
		this.data("effects.change", change);
		var defaultOptions = {
			changeParallel : 0,
			changeIncrease : 1,
			effect : "fade",
			duration : 1000,
			callback : function () {}
		};
		var options = $.extend(false, defaultOptions);
		if (duration != null)
			options.duration = duration;
		if (callback != null)
			options.callback = callback;
		if (effect != null)
			options.effect = effect;
		if (opts.changeParallel != null)
			options.changeParallel = opts.changeParallel;
		if (opts.changeIncrease != null)
			options.changeIncrease = opts.changeIncrease;
		
		function getNext(current) {
			var index = current;
			if (options.changeIncrease == 1) {
				if (current < items.length - 1) index++;
				else index = 0;
			} else {
				if (current > 0) index--;
				else index = items.length - 1;
			}
			return index;
		}
		function onEndChange(current, index) {
			var next = getNext(index);
			this.data("effects.change", {
				current : index,
				lock : false,
				next : next,
				items:items
			});
			options.callback.apply(this, [items[current], items[index]]);
		}
		var instance = this;
		var optsHide = $.extend(false, opts, {
				el : items[index]
			});
		var optsShow = $.extend(false, opts, {
				el : items[current]
			});
		if (options.changeParallel == 0) {
			$(items[current]).hide(options.effect, optsHide, options.duration, function () {
				$(items[index]).show(options.effect, optsShow, options.duration, function () {
					onEndChange.apply(instance, [current, index]);
				});
			});
		} else {
			var count = 0;
			$(items[current]).hide(options.effect, optsHide, options.duration, function () {
				count++;
				if (count == 2)
					onEndChange.apply(instance);
			});
			$(items[index]).show(options.effect, optsShow, options.duration, function () {
				count++;
				if (count == 2)
					onEndChange.apply(instance);
			});
		}
		return true;
	};

	Drcom.SlideShow = Drcom.Controller.extend({
		pluginName:"drcom_slideshow",
		init : function(el, options) {
			this.super.init.apply(this,arguments);
	    	$.extend(this.options, {
	    		delay : 500,
	    		effect : "fade",
	    		duration : 500,
	    		onBeforeShow : function(event, ui, current, next) {},
	    		onShow : function(event, ui, current, next) {},
	    		cycle : true,
	    		current : 0,
	    		effectOptions : {},
	    		events : [], // swipe
	    		disableSwipe : true
			}, this.options, options);
	
			this.current = this.options.current;
			this.items = this.element.children();
			this.timer = null;
			this.blocked = false;
			this.state = "";
			this._bindEvents();
		},
		_bindEvents : function() {
			var instance=this;
			if(this._checkEvents("left"))
			{
				this.bind(this.element,"swipeoneleft",function(){
					instance.next();
				});
			}
			if(this._checkEvents("right"))
			{
				this.bind(this.element,"swipeoneright",function(){
					instance.prev();
				});
			}
			if(this._checkEvents("up"))
			{
				this.bind(this.element,"swipeoneup",function(){
					instance.next();
				});			
			}
			if(this._checkEvents("down"))
			{
				this.bind(this.element,"swipeonedown",function(){
					instance.prev();
				});
			}
		},
		_checkEvents : function(name) {
			for ( var i = 0; i < this.options.events.length; i++) {
				if (this.options.events[i] == name)
					return true;
			}
			return false;
		},
		playpause:function(){
			if(this.state=="playing")
				this.pause();
			else
				this.play();
		},
		play : function() {
			this.state="playing";
			var instance = this;
			if (this.timer != null)
				clearInterval(this.timer);
			this.timer = setInterval(function() {
				if (instance.getNext() == -1) {
					instance.pause();
				}
				instance.next();
			}, this.options.delay);
		},
		pause : function() {
			this.state="paused";
			clearInterval(this.timer);
		},
		stop : function() {
			this.pause();
			if (this.blocked == true) {
				var instance = this;
				var hander = function() {
					instance.change(0);
					instance.element.unbind("slideshow.onShow");
				};
				this.element.bind("slideshow.onShow", hander);
			} else
				this.change(0);
		},
		/**
		 * Change slide, don't use ui.current
		 * 
		 */
		change : function(index) {
			index=parseFloat(index);
			if (this.blocked == true || this.current==index)
				return false;
			this.blocked = true;
			var current = this.current;
			var change = this.element.data("effects.change");
			if (change == null) {
				change = {
					current : current,
					lock : false,
					next : index,
					items:this.items
				};
			}
			change.current = current;
			change.next = index;
			this.element.data("effects.change", change);
	
			this.current = index; // set current
			var instance = this;
	
			this._trigger("onBeforeShow", null, [ this, current, index ]);
			this.element.changeEffect(this.options.effect, this.options.effectOptions,this.options.duration, function() {
					instance.blocked = false; // release lock
					instance._trigger("onShow", null, [ instance, current,index ]);
			});
			return true;
		},
		// next slide
		next : function() {
			var index = this.getNext();
			if (index != -1)
				this.change(index);
		},
		// prev sldie
		prev : function() {
			var index = this.getPrev();
			if (index != -1)
				this.change(index);
		},
		// get next slide
		getNext : function() {
			var index = this.current;
			if (this.current < this.items.length - 1)
				index = index + 1;
			else {
				if (this.options.cycle == true)
					index = 0;
				else
					index = -1;
			}
			return index;
		},
		// get prev slide
		getPrev : function() {
			var index = this.current;
			if (this.current > 0)
				index = index - 1;
			else {
				if (this.options.cycle == true)
					index = this.items.length - 1;
				else
					index = -1;
			}
			return index;
		},
		gotoSlide : function(index) {
			return this.change(index);
		},
		select : function(index) {
			return this.change(index);
		},
		destroy : function() {
			clearTimeout(this.timer);
			this._super();
		}
	});
	
	$.fn.drcom_slideshow = function(options) {
		$(this).each(function(){
			new Drcom.SlideShow($(this),options);
		});
		return $(this);
	};
});