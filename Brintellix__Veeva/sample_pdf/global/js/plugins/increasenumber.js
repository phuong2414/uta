require([], function() {
	Drcom.IncreaseNumber = Drcom.Controller.extend({
		pluginName: "drcom_increasenumber",
		init: function(el, options) {
			this.super.init.apply(this, arguments);

			this.options = $.extend({}, {
				from: 0,
				to: 100,
				delay: 80,
				increase: 1,
				percent: "%",
				format: ".",
				complete: function (ui, number) {},
				step: function (ui, number) {},
				customize: false
			}, this.options, options);
			
			this.reset();
			this.pauseTimer = false;
		},
		val: function(value) {
			this.current = value;
			if (!this.options.customize) {
				var strvalue = value + "";
				if (value < 10) strvalue = "0" + strvalue;
				strvalue = strvalue.replace(".", this.options.format);
				this.element.html(strvalue + this.options.percent);			
			}

			this.options.step.apply(this.element, [this, value]);
		},
		step: function(number) {
			var to = this.options.to;
			if (number >= to) {
				this.val(to);
				this.complete(to);
				return;
			} else this.val(number);
		},
		resume: function() {
			this.pauseTimer = false;
			this.increase(this.current + instance.options.increase);
		},
		pause: function() {
			this.pauseTimer = true;
			if (this.timer != null)
				clearTimeout(this.timer);
		},
		reset: function() {
			this.pause();
			this.pauseTimer = false;
			var from = this.options.from;
			this.val(this.options.from);
			this.increase(from + this.options.increase);
		},
		complete: function(number) {
			this.pause();
			this.options.complete.apply(this.element[0], [this, number]);
		},
		increase: function(number) {
			var instance = this;
			this.timer = setTimeout(function () {
				instance.step(number);
				if (instance.pauseTimer == false) {
					var v = number + instance.options.increase;
					v = Math.round(v*100)/100;//round number
					instance.increase(v);
				}	
			}, this.options['delay']);
		},
		destroy: function() {
			this.pause();
			this.super.destroy.apply(this, arguments);
		}
	});
	$.fn.drcom_increasenumber = function(options) {
		$(this).each(function() {
			new Drcom.IncreaseNumber($(this), options);
		});
		return $(this);
	};
});