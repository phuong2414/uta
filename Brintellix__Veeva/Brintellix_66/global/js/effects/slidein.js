require([
	'jquery'
], function($) {
	$.effects.effect.slidein = function(o,done ) {
		var el = $(this);
		var el2 = $(o.el);
		var mode = $.effects.setMode( el, o.mode || "effect" ),
		hide = mode === "hide",
		show = mode === "show";
		if (show) {
			done();
			return;
		}
		el.hide();
		var defaultOptions = {
			direction : "right"// down,up,left,right
		};
		o = $.extend(false, defaultOptions, o);
		// ------------Create Eelement-------------
		var container = $("<div></div>").appendTo(el.parent()).css(
		{
			width : el2.width(),
			height : el2.height(),
			"overflow" : "hidden"
		});
		var flipper = $.effects.createElementChange(el, el2,false).css({
			position : "relative"
		}).appendTo(container);
		if (o.direction == "left" || o.direction == "right")
			flipper.css({
				width : el2.width() * 2
			});
		if (o.direction == "up" || o.direction == "down")
			flipper.css({
				height : el2.height() * 2
			});

		var translateX = 0, translateY = 0, width = el2.width(), height = el2.height();
		switch (o.direction) {
		case "down":
			translateY = -height;
			break;
		case "up":
			translateY = height;
			break;
		case "left":
			translateX = width;
			break;
		case "right":
			translateX = -width;
			break;
		}
		var incoming = $(".incoming", container);
		var outgoing = $(".outgoing", container);
		if (o.direction == "left" || o.direction == "up") {
			incoming.css({
				transform : "translate3d(" + translateX + "px,"+ translateY + "px,0px)"
			});
		}
		if (o.direction == "right" || o.direction == "down") {
			incoming.css({
				transform : "translate3d(0px,0px,0px)"
			});
			outgoing.css({
				transform : "translate3d(" + -translateX + "px,"+ -translateY + "px,0px)"
			});
			flipper.css({
				transform : "translate3d(" + translateX + "px,"+ translateY + "px,0px)"
			});
			translateX = 0;
			translateY = 0;
		}
		flipper.animate({
			transform : "translate3d(-" + translateX + "px,-"+ translateY + "px,0px)"
		}, o.duration, function() {
			$.effects.removeElementChange(el, el2,false);
			container.remove();
			el2.show();
			done();	
		});	
	};
});
