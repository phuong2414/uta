require([], function() {
	Drcom.Ref = Drcom.Controller.extend({
		pluginName:"drcom_ref",
	    init: function(el, options) {
	    	this.super.init.apply(this,arguments);
	    	$.extend(this.options,{
	    		close : ".ref_close",
				scroller : ".ref_content",
				main : "#ref_main",
				effect : {
					name : "slide",
					options : {
						direction : "left"
					},
					duration : 1000
				},
				afterHide : function () {},
				afterShow : function () {},
				beforeHide : function () {},
				beforeShow : function () {}
			},this.options,options);
	    	this.set(this.options.main);
	    },
		set: function(selector) {
			if (this.container != null) {
				if ($(selector)[0] == this.container[0])
					return;
				this.container.hide();
				this.container.off("tapone.ref", this.options.close);
			}
			var instance = this;
			this.container = $(selector);
			this.container.on("tapone.ref", this.options.close, function (ev) {
				instance.toggle();
			});
			if ($(this.options.scroller, this.container).length > 0) {
				new IScroll($(this.options.scroller, this.container)[0], {
					zoom: false,
					scrollbar: true,
					hideScrollbar: false,
					useTransfrom: true,
					bounce: true
				});
				$(this.container).drcom_disableswipe();
			}
		},
		hide: function() {
			this.options.beforeHide.apply(this.container);
			this.container.hide(this.options.effect.name, this.options.effect.options, this.options.effect.duration, this.options.afterHide);
		},
		show: function() {
			this.options.beforeShow.apply(this.container);
			this.container.show(this.options.effect.name, this.options.effect.options, this.options.effect.duration, this.options.afterShow);
		},
		toggle: function() {
			if (this.container.is(":visible") == true)
				this.hide();
			else
				this.show();
		}
	});
	$.fn.drcom_ref = function (options) {
		$(this).each(function () {
			new Drcom.Ref($(this), options);
		});
		return $(this);
	};	
});