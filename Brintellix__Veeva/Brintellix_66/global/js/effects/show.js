require([
	'jquery'
], function($) {
	$.effects.effect.show = function(o, done) {
		var el = $(this);
		var mode = $.effects.setMode(el, o.mode || "effect"), hide = mode === "hide", show = mode === "show";
		var duration=o.duration;
		setTimeout(function(){
			if (show)
				el.show();
			else
				el.hide();
			done();			
		}, duration);
	};
});