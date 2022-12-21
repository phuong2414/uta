require([
	'slideshow'
], function() {
	Drcom.Carousel = Drcom.SlideShow.extend({
		pluginName: "drcom_carousel",
		init: function(el, options) {
			this.super.init.apply(this,arguments);
	    	$.extend(this.options,{
	    		effect:"slidein",
	    		cycle:false,
	    		direction:"leftright",//leftright||updown
	    		navigator:false,
	    		next:".jcarousel-control-next",
	    		prev:".jcarousel-control-prev"
			},this.options,options);
	    	
	    	if(this.options.navigator) {
	    		var navigator = $(this.options.navigator);
	    		var items = navigator.children();
	    		$(items[this.current]).addClass("active");
	    	}
	    	this.setStatusControl();
		},
		setStatusControl: function() {
			//next,prev
			$(this.options.next).removeClass("disable");
			$(this.options.prev).removeClass("disable");
			if (this.getNext() == -1) {
				$(this.options.next).addClass("disable");
			}
			if (this.getPrev() == -1) {
				$(this.options.prev).addClass("disable");
			}		
		},
		_bindEvents: function() {
			var instance = this;
			if (this.options.navigator) {
				var navigator=$(this.options.navigator);

				_.each(this.items, function(item, i) {
					$("<li></li>").attr("index", i).appendTo(navigator);
				});
				var items = navigator.children();
				this.bind(items,"tapone", function() {
					instance.change($(this).attr("index"));
				});
				this.element.bind("onBeforeShow", function(event, ui, current, index) {
					items.removeClass("active");
					$(items[index]).addClass("active");
				});
			}
			this.element.bind("onBeforeShow",this.callback("setStatusControl"));
			this.bind($(this.options.next),"tapone",this.callback("next"));
			this.bind($(this.options.prev),"tapone",this.callback("prev"));
			this.super._bindEvents.apply(this,arguments);
		},
		change: function(index) {
			if (this.options.direction=="leftright") {
				if (index > this.current)
					this.options.effectOptions.direction = "left";
				else
					this.options.effectOptions.direction = "right";				
			}
			if (this.options.direction == "updown") {
				if(index > this.current)
					this.options.effectOptions.direction = "up";
				else
					this.options.effectOptions.direction = "down";					
			}
			
			this.super.change.apply(this,arguments);
		}
	});
	
	$.fn.drcom_carousel = function(options) {
		$(this).each(function() {
			new Drcom.Carousel($(this),options);
		});
		return $(this);
	};
});
