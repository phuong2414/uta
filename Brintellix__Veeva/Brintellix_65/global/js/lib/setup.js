require([], function() {
	window.drcom = window.drcom || {};

	var userAgent = window.navigator.userAgent.toLowerCase(),
		player = "Browser";

	$.extend(drcom, {
		isPhantom: /phantomjs/.test(userAgent),
		standalone: window.navigator.standalone,
		isIOS: /iphone|ipod|ipad/i.test(userAgent),
		//isMobile: /android|webos|iphone|ipad|macintosh|ipod|blackberry|iemobile|webview|touch|tablet|opera mini/i.test(userAgent),
		isMultiFlow: ( Object.prototype.toString.call(menudata) === '[object Object]')
	});

	var players = ["MI", "OCE", "HarVie", "Engage", "Browser", "Agnitio", "ShowImpact", "Veeva", "Exploria"];

	// detect player
	if (!drcom.config.player || players.indexOf(drcom.config.player) < 0) {
		try { 
			if (window.parent.navigateToSequence) player = "MI";
			else if (window.CLMPlayer) player = "OCE";
			else if (window.SystemBridge) player = "HarVie";
			else if (drcom && drcom.showimpact && drcom.showimpact.clm && drcom.showimpact.clm.isShowImpact()) player = "ShowImpact";
			else if (com && com.veeva && com.veeva.clm) player = "Veeva";
			else if (com && com.veeva && com.veeva.clm && com.veeva.clm.isEngage()) player = "Engage";
			//else if (!drcom.isMobile) player = "Browser";
		} catch(err) { 
			console.log(err); 
		} finally {
			if (drcom.config.isAgnitio) player = "Agnitio";
			else if (drcom.config.isExploria) player = "Exploria";
			drcom.config.player = player;
		}
	}

	(function () {
		function concat() {
			var list = [];
			_.each(arguments, function(argument) {
				_.each(argument, function(arg) {
					list.push(arg);
				});
			});
			return list;
		}
		function checkMove(events) {
			var list = [],
				moved = false;
			if ($.support.touch == false) {
				events.touches = [];
				events.changedTouches = [];
				events.targetTouches = [];
				list = [events]
			}
			list = concat(events.touches, events.targetTouches, events.changedTouches, list);
			_.each(list, function(item) {
				_.each($.jGestures.touches, function(touch) {
					if (touch.identifier == item.identifier) {
						if (Math.abs(item.screenX - touch.screenX) > $.jGestures.defaults.thresholdMove ||
							Math.abs(item.screenY - touch.screenY) > $.jGestures.defaults.thresholdMove)
							moved = true;
					}
				});
			});
			return moved;
		}
		function getEvents() {
			var _events = {};
			$.extend(_events, $.event.global);
			_.each(ignoreEvents, function(e) {
				delete _events[e];
			});

			_.each(_events, function(ev, name) {
				var found = _.find(events, function(e) {
					return e == name;
				});

				if (found) {
					delete _events[name];
				}
			});

			return _events;
		}
		function checkSwipe(events) {
			var touchobj = $.support.touch ? events.changedTouches[0] : events;
			distX = Math.abs(touchobj.pageX - startX);
			distY = Math.abs(touchobj.pageY - startY);
			return (distX >= $.jGestures.defaults.thresholdSwipe || distY >= $.jGestures.defaults.thresholdSwipe);
		}
		function checkGetsure(event) {
			if (isAndroid) return false;
			var scale = Math.abs(1-event.scale);
			return !(scale < $.jGestures.defaults.thresholdGetsure)
		}
		function checkAreas(point1, point2, areas) {
			var point = {x: point2.x-point1.x, y: point2.y-point1.y},
				x = point.x,
				y = -point.y,
				ax = Math.abs(x),
				ay = Math.abs(y),
				conditions=[x>0&&y>0&&ax<ay,x>0&&y>0&&ax>ay,x>0&&y<0&&ax>ay,x>0&&y<0&&ax<ay,x<0&&y<0&&ax<ay,x<0&&y<0&&ax>ay,x<0&&y>0&&ax>ay,x<0&&y>0&&ax<ay,x==0&&y>0,x>0&&y>0&&x==y,x>0&&y==0,x<0&&y<0&&ax==ay,x==0&&y<0,x<0&&y<0&&ax==ay,x<0&&y==0];

			for (var i = 0; i < areas.length; i++) {
				if (conditions[areas[i]] == true) {
					return areas[i];
				}
			}
			return -1;
		}
		function triggerEvent(el, type, params) {
			var properties = ["charCode", "clientX", "clientY", "ctrlKey", "layerX", "layerY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "x", "y"]
				options = {};

			_.each(properties, function(pro) {
				options[pro] = params[pro];
			});
			try {
				$(el).trigger($.Event(type, options));
			} catch (e) {
				console.log(e.stack);
			}
		}
		function triggerMouseEvent(el, type, event) {
			var simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent(type, true, true, window, 1, event.screenX, event.screenY, event.clientX, event.clientY, false, false, false, false, 0, null);
			try {
				$(el)[0].dispatchEvent(simulatedEvent);
			} catch (e) {
				console.log(e.stack);
			}
		}
		function _onTouchstart(event_) {
			try {
				if ($.support.touch) {
					document.addEventListener("touchmove", _onTouchmove, false);
					document.addEventListener("touchend", _onTouchend, false);
				} else {
					document.addEventListener("mousemove", _onTouchmove, false);
					document.addEventListener("mouseup", _onTouchend, false);
				}

				// touch obj
				var touchobj = $.support.touch ? event_.changedTouches[0] : event_;
				
				dist = 0;
				startX = touchobj.pageX;
				startY = touchobj.pageY;

				touching = true;
				var list = [];
				if ($.support.touch == false) {
					event_.touches = [event_];
				}
				_.each(event_.touches, function(touch) {
					list.push({
						screenX : touch.screenX,
						screenY : touch.screenY,
						identifier : touch.identifier,
						event : touch,
						timestamp : (new Date).getTime()
					});
				});
				$.jGestures.touches = list;
				if ($.jGestures.touches.length == 1) {
					triggerMouseEvent($($.jGestures.touches[0].event.target), "vmousedown", event_.touches[0]);
				}
			} catch (e) {
				console.log(e);
			}
		}
		function _onTouchmove(event_) {
			if ($.support.touch == false) {
				event_.touches = [event_];
			}
			if ($.jGestures.touches.length == 1) {
				triggerMouseEvent($($.jGestures.touches[0].event.target), "vmousemove", event_.touches[0]);
			}
		}
		function _onTouchend(event_) {
			var firstEvent = $.jGestures.touches[0],
				_$element = $(firstEvent.event.target);
			if ($.support.touch == false) {
				event_.changedTouches = [event_];
			}
			if ($.jGestures.touches.length == 1) {
				triggerMouseEvent(_$element, "vmouseup", event_.changedTouches[0]);
			}
			if ($.support.touch) {
				if (event_.touches.length == 0) {
					triggerMouseEvent(_$element, "release", event_.changedTouches[0]);
				}
			}
			if (event_.target.nodeType == 3) {
				_$element = $(event_.target).parent();
			}
			var _bHasTouches = $.support.touch;
				_iTouches = _bHasTouches ? $.jGestures.touches.length : "1",
				events = getEvents(),
				_bHasMoved = checkMove(event_),
				_oEventData = firstEvent,
				_iScreenX = (_bHasTouches) ? event_.changedTouches[0].screenX : event_.screenX,
				_iScreenY = (_bHasTouches) ? event_.changedTouches[0].screenY : event_.screenY, 
				_bHasSwipeGesture = 0;

			if (_iTouches == 2) _bHasSwipeGesture = !checkGetsure(event_);
			else _bHasSwipeGesture = checkSwipe(event_);

			var areas = {
				//one
				swipeoneleft:[5,6,14],
				swipeoneright:[1,2,10],
				swipeoneup:[0,7,8],
				swipeonedown:[3,4,12],
				//two
				swipetwoleft:[5,6,14],
				swipetworight:[1,2,10],
				swipetwoup:[0,7,8],
				swipetwodown:[3,4,12],
				//three
				swipethreeleft:[5,6,14],
				swipethreeright:[1,2,10],
				swipethreeup:[0,7,8],
				swipethreedown:[3,4,12],

				swipeone:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				swipetwo:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				swipethree:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
			}; 
			for (var _sType in events) {
				var inArea = -1;
				if (_iTouches > 0 && areas[_sType] != null && _bHasMoved === true) {
					inArea = checkAreas({
						x: _oEventData.screenX,
						y: _oEventData.screenY
					}, {
						x: _iScreenX,
						y: _iScreenY					
					}, areas[_sType]);
					if (inArea == -1) continue;
				}

				var _bIsSwipe = false;
				switch (_sType) {
					case "swipeoneup":
					case "swipeonedown":
					case "swipeoneright":
					case "swipeoneleft":
						if (  _bHasMoved === true && _bHasSwipeGesture === true && _iTouches == 1) { 
							_bIsSwipe = true; 
							return triggerEvent(_$element, _sType, firstEvent.event); 
						}                        
						break;
					case "tapone":
						if (((_bHasMoved !== true && _bIsSwipe !== true) || (_bHasMoved === true && distX <= 20 && distY <= 20)) && _iTouches == 1) {
							triggerEvent(_$element, "tapone", firstEvent.event);
						}
						break;
				}
			};
			if ($.support.touch) {
				document.removeEventListener("touchmove", _onTouchmove, false);
				document.removeEventListener("touchend", _onTouchend, false);
			} else {
				document.removeEventListener("mousemove", _onTouchmove, false);
				document.removeEventListener("mouseup", _onTouchend, false);
			}
		}
		
		var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1,
			ignoreEvents = ["destroyed", "ready", "remove", "selectstart"],
			jGestures = {
				defaults : {
					thresholdMove : 1,
					thresholdSwipe : 50,
					thresholdDbtap : 300,
					thresholdTapHold : 500,
					thresholdGetsure : 0.3,
				},
				touches : []
			};
		$.jGestures = jGestures;
		$.support.touch = "ontouchend" in document;
		var events = [],
			startX, startY, distX, distY;

		if ($.support.touch) {
			document.addEventListener("touchstart", _onTouchstart, false)
		} else {
			document.addEventListener("mousedown", _onTouchstart, false)
		}
		$(["vmousedown", "vmousemove", "vmouseup", "tapone"]).each(function(name) {
			$.event.fixHooks[this + ""] = $.event.mouseHooks
		});
		$("<div></div>").bind("tapone", function () {});
	})();

	window.cssTransitions = window.cssTransitions || [];

	// customize jquery
	var _delay = $.fn.delay;
	$.fn.delay = function () {
		window.cssTransitions.push({
			el: this,
			type: "jquery"
		});
		_delay.apply(this, arguments);
		return this;
	};

	// customize jquery
	var _animate = $.fn.animate;
	$.fn.animate = function (prop, speed, easing, callback) {
		var tempProp = {};
		$.each(prop, function (key, val) {
			if (key == "_")
				return;
			tempProp[key] = val;
		});
		prop = tempProp;
		if (window.cssTransitions == null)
			window.cssTransitions = [];
		window.cssTransitions.push({
			el: $(this),
			type: "jquery"
		});
		_animate.apply(this, arguments);
	};

	// stop keyframe
	window.stopKeyframeAnimation = function (selector) {
		$(selector).css("-webkit-animation-play-state", "paused");
	};

	// stop css transition
	$.fn.stopCssTransition = function () {
		var transtionProperty = ["left", "top", "right", "bottom", "-webkit-transform", "opacity", "width", "height"];
		$(this).each(function () {
			var el = $(this);
			for (var i = 0; i < transtionProperty.length; i++) {
				var name = transtionProperty[i];
				el.css(name, el.css(name));
			}
			el.unbind("webkitTransitionEnd");
			el.css("transition", "all 0s linear 0s");
		});
	};

	$.cssHooks.webkitTransform = {
		get : function (el) {
			function getComputedPosition() {
				var matrix = window.getComputedStyle(el, null), x, y;
				matrix = matrix["webkitTransform"].split(')')[0].split(', ');
				x =  + (matrix[12] || matrix[4]);
				y =  + (matrix[13] || matrix[5]);
				return {
					x : x,
					y : y
				};
			};
			return getComputedPosition().y;
		},
	};

	// add resize event for element
	(function($,h,c){var a=$([]),e=$.resize=$.extend($.resize,{}),i,k="setTimeout",j="resize",d=j+"-special-event",b="delay",f="throttleWindow";e[b]=250;e[f]=true;$.event.special[j]={setup:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.add(l);$.data(this,d,{w:l.width(),h:l.height()});if(a.length===1){g()}},teardown:function(){if(!e[f]&&this[k]){return false}var l=$(this);a=a.not(l);l.removeData(d);if(!a.length){clearTimeout(i)}},add:function(l){if(!e[f]&&this[k]){return false}var n;function m(s,o,p){var q=$(this),r=$.data(this,d);r.w=o!==c?o:q.width();r.h=p!==c?p:q.height();n.apply(this,arguments)}if($.isFunction(l)){n=l;return m}else{n=l.handler;l.handler=m}}};function g(){i=h[k](function(){a.each(function(){var n=$(this),m=n.width(),l=n.height(),o=$.data(this,d);if(m!==o.w||l!==o.h){n.trigger(j,[o.w=m,o.h=l])}});g()},e[b])}})(jQuery,this);
});
