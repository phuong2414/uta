require([], function() {
	Drcom.Button = Drcom.Controller.extend({
		pluginName: "drcom_button",
	    init: function(el, options){
	    	$.extend(this.options,{},this.options,options);
	    	this.super.init.apply(this, [el, options]);
			this.on("tapone", this.element, ".button", this.callbackEvent(".button tapone"));
	    },
		".button tapone" : function (el, ev) {
			var button = el;
			if (button.hasClass("disable")) return;

			button.data("tapone").apply(this, [button.hasClass("active"), button, ev]);
			return false;
		},
		add: function (buttonId, buttonFunction) {
			$('<div class="button ' + buttonId + '" ></div>').data("tapone", buttonFunction).appendTo(this.element);
		},
		remove: function (buttonId) {
			$("." + buttonId, this.element).remove();
		},
		active: function (buttonId) {
			$("." + buttonId, this.element).addClass("active");
		},
		deactive: function (buttonId) {
			$("." + buttonId, this.element).removeClass("active");
		},
		enable: function (buttonId) {
			$("." + buttonId, this.element).removeClass("disable");
		},
		disable: function (buttonId) {
			$("." + buttonId, this.element).addClass("disable");
		}
	});
	$.fn.drcom_button = function (options) {
		$(this).each(function () {
			new Drcom.Button($(this), options);
		});
		return $(this);
	};
	
	// create controller
	var menu = $('#menu');
	if (!menu.length) menu = $('<div id="menu"></div>').appendTo('body');
	
	var buttonsBar = menu.find('.buttons');
	if (!buttonsBar.length) buttonsBar = $("<div class='buttons'></div>").appendTo(menu);
	
	drcom.button = buttonsBar.drcom_button().controller();
});
