require([
	'jquery',
	'drcom'
], function($) {
	//Defines the top level Class
	function Class() {}
	Class.prototype.construct = function() {};
	Class.__asMethod__ = function(func, superClass) {  
	    return function() {
	        var currentSuperClass = this.super;
	        this.super = superClass;
	        var ret = func.apply(this, arguments);      
	        this.super = currentSuperClass;
	        return ret;
	    };
	};

	Class.extend = function(def) {
	    var classDef = function() {
	        if (arguments[0] !== Class) { this.construct.apply(this, arguments); }
	    };

	    var proto = new this(Class);
	    var superClass = this.prototype;

	    for (var n in def) {
	        var item = def[n];

	        if (item instanceof Function) {
	            item = Class.__asMethod__(item, superClass);
	        }

	        proto[n] = item;
	    }

	    proto.super = superClass;
	    classDef.prototype = proto;

	    //Give this new class the same static extend method    
	    classDef.extend = this.extend;
	    return classDef;
	};

	//Hey, this class definition approach
	//looks much cleaner than then others.
	var Controller = Class.extend({
		pluginName: "controller",
		events: [],
		delegate: [],
		construct:function() {
			this.init.apply(this, arguments);
		},
		init : function(el, options) {
			this.events = [];
			this.delegate = [];
			this.element = el;
			this.options = $.extend(this.options||{}, options);
			var controllerData = this.element.data("controller")||{};
			controllerData[this.pluginName] = this;
			this.element.data("controller", controllerData);
			this.element.addClass(this.pluginName);
		},
		bind: function(el, eventName, callback) {
			this.events.push({
				el : $(el),
				eventName : eventName
			});
			return $(el).bind(eventName, callback);
		},
		unbind: function(el,eventName) {
			$(el).unbind(eventName);
		},
		on: function(eventName, parent, selector, callback) {
			this.delegate.push({
				parent : $(parent),
				selector : selector,
				eventName : eventName
			});
			$(parent).on(eventName, selector, callback);
		},
		callback : function(functionName) {
			var instance = this;
			return function(event, data) {
				return instance[functionName].apply(instance, arguments);
			};
		},
		callbackEvent: function(functionName) {
			var instance = this;
			return function(event, data) {
				var args = [ $(this) ];
				for ( var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}
				return instance[functionName].apply(instance, args);
			};
		},
		_super: function (name, args) {
			this.super[name].apply(this,args);
		},
		destroy: function() {
			for ( var i = 0; i < this.events.length; i++) {
				this.events[i].el.unbind(this.events[i].eventName);
			}
			for ( var i = 0; i < this.delegate.length; i++) {
				this.delegate[i].parent.off(this.delegate[i].eventName,
						this.delegate[i].selector);
			}
			this.element.removeData("controller");
			this.element.removeClass(this.pluginName);
			delete this;
		},
		_trigger: function( type, event, data ) {
			var callback = this.options[ type ],args;
			event = $.Event(event);
			event.type = type;//( type === this.Class._fullName ? type :this.Class._fullName + type ).toLowerCase();
			data = data || {};
			// copy original event properties over to the new event
			// this would happen if we could call $.event.fix instead of $.Event
			// but we don't have a way to force an event to be fixed multiple times
			if ( event.originalEvent ) {
				for ( var i = $.event.props.length, prop; i; ) {
					prop = $.event.props[ --i ];
					event[ prop ] = event.originalEvent[ prop ];
				}
			}
			this.element.trigger( event, data );
			args = $.isArray( data ) ?
				[ event ].concat( data ) :
				[ event, data ];

			return !( $.isFunction( callback ) &&
				callback.apply( this.element[0], args ) === false ||
				event.isDefaultPrevented() );
		}
	});
	
	Drcom = window.Drcom || {};
	Drcom.Controller = Controller;
	
	$.fn.controller = function(namespace) {
		if (namespace)
			return $(this).data("controller")[namespace];
		else {
			var controllerData = $(this).data("controller");
			for (var controller in controllerData)
				return controllerData[controller];
		}
	};
});

