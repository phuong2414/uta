require([], function () {
	Drcom.Expose = Drcom.Controller.extend({
		pluginName:"drcom_expose",
		
		init : function (el, options) {
			this.super.init.apply(this,arguments);
	    	this.options=$.extend({},{
	    		effect : "fade",
				duration : 500,
				color : "#fff",
				opacity : 0.8,
				zIndex : 101,
				className : "expose",
				onBeforeShow : function (ui) {},
				onBeforeHide : function (ui) {},
				onShow : function (ui) {},
				onHide : function (ui) {},
				parent : "body"
			},this.options,options);
			this.createElements();
		},
		createElements : function () {
			this.mask = $("<div></div>").css({
					position : "absolute",
					left : 0,
					top : 0,
					right : 0,
					bottom : 0,
					"z-index" : this.options.zIndex,
					"background-color" : this.options.color,
					opacity : this.options.opacity,
					display : "none"
				}).addClass(this.options.className).appendTo(this.options.parent);
		},
		isVisible : function () {
			if (this.mask.css("display") == "none")
				return 0;
			return 1;
		},
		show : function () {
			$.effects.save(this.element, ['z-index']);
			this.element.css({
				"z-index" : this.options.zIndex + 1
			});
			this.onBeforeShow();
			var instance = this;
			this.mask.show(this.options.effect, null, this.options.duration, function () {
				instance.onShow();
			});
		},
		hide : function () {
			this.onBeforeHide();
			var instance = this;
			this.mask.hide(this.options.effect, null, this.options.duration, function () {
				$.effects.restore(instance.element, ['z-index']);
				instance.onHide();
			});
		},
		toggle : function () {
			if (this.isVisible() == true)
				this.hide();
			else
				this.show();
		},
		onHide : function () {
			this.options.onHide.apply(this.mask, [this]);
		},
		onShow : function () {
			this.options.onShow.apply(this.mask, [this]);
		},
		onBeforeShow : function () {
			this.options.onBeforeShow.apply(this.mask, [this]);
		},
		onBeforeHide : function () {
			this.options.onBeforeHide.apply(this.mask, [this]);
		},
		destroy : function () {
			this.mask.remove();
			this._super("destroy");
		}
	});
	$.fn.drcom_expose = function(options) {
		$(this).each(function() {
			new Drcom.Expose($(this),options);
		});
		return $(this);
	};

	Drcom.Popup = Drcom.Controller.extend({
		pluginName:"drcom_popup",
		init : function (el, options) {
			this.super.init.apply(this,arguments);
	    	this.options=$.extend({},{
				close : ".close",
				closeInside : true,
				closeOutside : false,
				effect : "fade",
				duration : 500,
				mask : false,
				oneInstance : true,
				position : null,
				wrapper : false,
				classWrapper : "",
				classContainer : "",
				zIndex : 102,
				window : window,
				container : "",
				onShow : function () {},
				onHide : function () {},
				onBeforeShow : function () {},
				onBeforeHide : function () {}
			},this.options,options);
			
			this.triggerInside = false;
			this.mask = null;
			this.wrapper = null;
			this.preventDefault = false;
			var rel = this.element.attr("rel");
			if (rel.indexOf(".html") != -1) {
				this.container = $("<div style='display:none;position:absolute;left:0px;top:0px;z-index:" + this.options.zIndex + "'></div>");
				var parent = this.element.attr("parent");
				if (parent == undefined)
					parent = $("body");
				else
					parent = $(parent);
				parent.append(this.container);
				var instance = this;
				instance.beforeCreateContainer();
				this.container.attr("loadeddata", 0);
			} else {
				this.container = $(rel);
				this.beforeCreateContainer();
				this.bindEvents();
			}
			this.container.addClass(this.options.classContainer);
			this.options.container = this.container;

			this.bind(window,"tapone",this.callbackEvent("{window} tapone"));
			this.bind(this.element,"tapone",this.callbackEvent("tapone"));

			
		},
		
		
		
	     bindEvents : function () {
				var instance = this;
				var close = $(this.options.close, this.container);
				if (close.length > 0) {
					this.bind(close, "tapone", function () {
						instance.hide();
					});
				}
				if (this.options.closeInside == true) {
					this.bind(this.container, "tapone", function () {
						instance.hide();
					});
				};

		},
		beforeCreateContainer : function () {
			if (this.options.mask == true) {
				this.mask = this.container.drcom_expose({
						color : "#000",
						zIndex : this.options.zIndex
					}).controller();
			};
			if (typeof this.options.mask == "object") {
				this.mask = this.container.drcom_expose(this.options.mask).controller();
			};
			if (this.options.wrapper == true) {
				this.wrapper = $("<div></div>");
				this.wrapper.css({
					"z-Index" : this.options.zIndex,
					position : "absolute",
					left : 0,
					top : 0
				});
				this.wrapper.addClass(this.options.classWrapper);
				this.wrapper.append(this.container);
				var parent = this.element.attr("parent");
				if (parent == undefined)
					parent = $("body");
				else
					parent = $(parent);
				parent.append(this.wrapper);
			}
		},
		"{window} tapone" : function () {
			if (this.options.closeOutside == true && this.triggerInside == true) {
				if (this.container[0] !== event.target && !this.container.has(event.target).length && this.element[0] !== event.target && !this.container.has(event.target).length) {
					this.hide();
				}
			}
		},
		
		"tapone" : function (el, ev) {
			this.toggle();
		},
		closeAllPopup : function (ignore) {
			var popups = $(".drcom_popup");
			for (var i = 0; i < popups.length; i++) {
				var exist = false;
				for (var j = 0; j < ignore.length; j++) {
					if (ignore[j] == popups[i]) {
						exist = true;
						break;
					}
				}
				if (exist == true)
					continue;
				var popup = $(popups[i]).controller();
				if (popup.isVisible() == true)
					popup.hide();
			}
		},
		isVisible : function () {
			if (this.container.css("display") == "none")
				return 0;
			return 1;
		},
		setPosition : function () {
			var position = {
				of : this.element
			};
			position = $.extend(false, position, this.options.position);
			if (this.options.position != null) {
				$.effects.save(this.container, ['top', 'bottom', 'left', 'right']);
				this.container.position(position);
			}
		},
		onAfterShow : function () {
			this.element.trigger("drcom:showPopup");
			this.options.onShow.apply();
		},
		show : function () {
			function showPopup() {
                this.options.onBeforeShow.apply();
                this.triggerInside = true;
                if (this.options.oneInstance == true)
                    this.closeAllPopup([this.element[0]]);
                this.setPosition();
                var instance = this;
                if (!this.options.slide) {                    
                        this.container.show(this.options.effect, null, this.options.duration, function() {
                            instance.onAfterShow();
                        });                    
                }
                else {
                    this.container.css('-webkit-transform', 'translateX(-1024px)');
                    this.container.css('-webkit-transition', 'all '+this.options.duration+'ms linear');
                    this.container.show(5, function() {
                        $(instance.container).css('-webkit-transform', 'translateX(0px)');
                    });
                }
                if (this.mask != null) {
                    this.mask.show();
                }

            }
			if (this.element.attr("rel").indexOf(".html") != -1) {
				var instance = this;
				var reload = 0;
				var arel = this.element.attr("rel").split("#");
				if (arel.length >= 2)
					reload = arel[1];
				if (this.container.attr("loadeddata") == "0" || reload == 1) {
					this.container.empty();
					this.container.load(this.element.attr("rel"), function () {
						instance.bindEvents();
						showPopup.apply(instance);
					});
					this.container.attr("loadeddata", 1);
				} else {
					showPopup.apply(this);
				}
			} else
				showPopup.apply(this);
		},
		onAfterHide : function () {
			if (this.element.attr("rel").indexOf(".html") != -1) {
				var reload = 0;
				var arel = this.element.attr("rel").split("#");
				if (arel.length >= 2)
					reload = arel[1];
				if (reload == 1)
					this.container.empty();
			}
			this.options.onHide.apply();
			this.element.trigger("drcom:hidePopup");
		},
		hide: function() {
            this.options.onBeforeHide.apply(this);
            if (this.preventDefault == true)
                return;
            this.triggerInside = false;
            if (!this.options.slide) {
                this.container.hide();
                this.onAfterHide();
            }
            else {
                this.container.css('-webkit-transform', 'translateX(-1024px)');
                var instance = this;
                setTimeout(function() {
                    instance.container.hide();
                    instance.onAfterHide();
                }, instance.options.duration);
            }

            if (this.options.position != null) {
                $.effects.restore(this.container, ['top', 'bottom', 'left', 'right']);
            }

            if (this.mask != null) {
                this.mask.hide();
            }
        },
		toggle : function () {
			if (this.isVisible() == true)
				this.hide();
			else
				this.show();
		},

		destroy : function () {
			var rel = this.element.attr("rel");
			if (rel.indexOf(".html") != -1) {
				this.container.remove();
			}
			this.super.destroy.apply(this,arguments);
		}
	});
	$.fn.drcom_popup = function(options) {
		$(this).each(function() {
			new Drcom.Popup($(this),options);
		});
		return $(this);
	};
});