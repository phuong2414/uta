require([
	'text!plugins/template/related.html'
], function(template) {
	Drcom.Related = Drcom.Controller.extend({
		pluginName: "drcom_related",
		init: function (el, options) {
			this.super.init.apply(this,arguments);
	    	$.extend(this.options, {
	    		template: template,
				showTitle: true,
				showImage: true,
				effect: {
					name: "slide",
					options: {
						direction: "down"
					},
					duration: 500
				},
				afterHide: function() {},
				afterShow: function() {},
				beforeHide: function() {},
				beforeShow: function() {},
				gotoSlide: function(id) {}
			}, this.options, options);
	    	this.bindEvents();
		},
		bindEvents: function() {
			this.on("tapone", this.element, "li:not(.disabled)", this.callbackEvent("li:not(.disabled) tapone"));
			this.bind(window, "tapone", this.callbackEvent("{window} tapone"));
		},
		load: function() {
			var related = drcom.getCurrentSlide().related,
				slides = [];
			for(var i = 0; i < related.length; i++) {
				slides.push(drcom.getSlide(related[i]));
			}
			this.element.empty().append(_.template(this.options.template)({
				slides:slides,
				showTitle : this.options.showTitle,
				showImage : this.options.showImage,
				thumbnailPath : this.options.thumbnailPath,
			}));

		},
		'li:not(.disabled) tapone': function (el, ev) {
			var id=el.attr("menu-id");
			this.options.gotoSlide(id);
			return false;
		},
		hide: function() {
			this.options.beforeHide.apply(this.container);
			this.element.hide(this.options.effect.name,this.options.effect.options,this.options.effect.duration,this.options.afterHide);
		},
		show: function() {
			this.options.beforeShow.apply(this.container);
			this.element.show(this.options.effect.name,this.options.effect.options,this.options.effect.duration,this.options.afterShow);
		},
		"{window} tapone": function() {
			this.stop();
			if(this.element.is(":visible")==true)
				this.hide();
		},
		toggle: function() {
			if(this.element.is(":visible")==true)
				this.hide();
			else
				this.show();
		},
		stop: function() {
			this.element.stop(true,true);
		}
	});
	$.fn.drcom_related = function (options) {
		$(this).each(function () {
			new Drcom.Related($(this), options);
		});
		return $(this);
	};

	if (drcom.config.related && drcom.config.related.isShow) {
		//add related button
		drcom.button.add("related", function (actived, el, event) {
			//stop event
			drcom.related.stop();
			if (actived == true) {
				drcom.related.hide();
			} else {
				drcom.related.show();
			}
		});
		drcom.related = $("<div id='related'></div>")
		.appendTo("#container")
		.drcom_related({
			beforeShow: function() {
				drcom.button.active("related");
			},
			beforeHide: function() {
				drcom.button.deactive("related");
			},
			gotoSlide: function(id) {
				drcom.gotoSlide(id);
			}
		}).controller();
		drcom.button.deactive("related");

		var exits = false;
		if (drcom.config.menu) {
			var related = drcom.getCurrentSlide().related;
			if (related && related.length) exits = true;
		}

		if (exits) {
			drcom.button.enable("related");
			drcom.related.load();
		} else {
			drcom.button.disable("related");
		}
	}
});
