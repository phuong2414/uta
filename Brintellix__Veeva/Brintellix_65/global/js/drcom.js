require([], function() {
	// drcom configuration
	window.Drcom = window.Drcom || {};
	window.drcom = window.drcom || {};

	var swipeLeftEnable = true,
		swipeRightEnable = true,
		swipeUpEnable = true,
		swipeDownEnable = true,
		isDisabled = false;

	$.extend(drcom, {
		disableSwipeNotChangeState: function() {
			swipeLeftEnable = false;
			swipeRightEnable = false;
			swipeUpEnable = false;
			swipeDownEnable = false;
		},

		enableSwipeNotChangeState: function() {
			if (!isDisabled) {
				swipeLeftEnable = true;
				swipeRightEnable = true;
				swipeUpEnable = true;
				swipeDownEnable = true;
			}
		},

		disableSwipe: function() {
			this.disableSwipeNotChangeState();
			isDisabled = true;
		},
		enableSwipe: function() {
			isDisabled = false;
			this.enableSwipeNotChangeState();
		},
		disableSwipeLeft: function() {
			swipeLeftEnable = false;
		},
		disableSwipeRight: function() {
			swipeRightEnable = false;
		},
		disableSwipeUp: function() {
			swipeUpEnable = false;
		},
		disableSwipeDown: function() {
			swipeDownEnable = false;
		},
		enableSwipeLeft: function() {
			swipeLeftEnable = true;
		},
		enableSwipeRight:function() {
			swipeRightEnable = true;
		},
		enableUpLeft: function() {
			swipeUpEnable = true;
		},
		enableDownRight: function() {
			swipeDownEnable = true;
		},
		isSwipeEnable: function() {
			return swipeLeftEnable && swipeRightEnable && swipeUpEnable && swipeDownEnable;
		},
		isSwipeLeft: function() {
			return swipeLeftEnable;
		},
		isSwipeRight: function() {
			return swipeRightEnable;
		},
		isSwipeUp: function() {
			return swipeUpEnable;
		},
		isSwipeDown: function() {
			return swipeDownEnable;
		},

		timer: {
			timeOutList: [],
			intervalList: [],
			setTimeout: function() {
				var timer = setTimeout.apply(window, arguments);
				this.timeOutList.push(timer);
				return timer;
			},
			clearTimeOut: function(timer) {
				clearTimeout(timer);
				var i = _.indexOf(this.timeOutList, timer);
				if (i >= 0) this.timeOutList.splice(i, 1);
			},
			clearAllTimeOut: function() {
			    _.each(this.timeOutList, function (timer) {
			        clearTimeout(timer);
				});
				this.timeOutList = [];
			},
			setInterval: function() {
				var timer = setInterval.apply(window, arguments);
				this.intervalList.push(timer);
				return timer;
			},
			clearInterval: function(timer) {
				clearInterval(timer);
				var i = _.indexOf(this.intervalList, timer);
				if (i >= 0) this.intervalList.splice(i, 1);
			},
			clearAllInterval: function() {
			    _.each(this.intervalList, function (timer) {
					clearInterval(timer);
				});
				this.intervalList = [];
			}
		},

		storage: {
			type: drcom.config.storageType || 'sessionStorage',
			name: drcom.config.presentationName,

			get: function(key) {
				var data = null;
				try {
					data = JSON.parse(window[this.type].getItem("drcom:" + this.name + ":" + key));
				} catch (ex) { console.log(ex); }

				return data;
			},
			set: function(key, value) {
				try {
					window[this.type].setItem("drcom:" + this.name + ":" + key, JSON.stringify(value));
				} catch (ex) { console.log(ex); }
			},
			remove: function(key) {
				try {
					window[this.type].removeItem("drcom:" + this.name + ":" + key);
				} catch (ex) { console.log(ex); }
			},
			clear: function() {
				var storage = window[this.type],
					pattern = "drcom:" + this.name;
				for (var name in storage) {
					if (name.indexOf(pattern) >= 0) {
						try {
							storage.removeItem(name);
						} catch (ex) { console.log(ex); }
					}
				}
			}
		}
	});
	
	//disble swipe on element
	$.fn.drcom_disableswipe = function () {
		this.unbind("swipeoneleft swipeoneright swipeoneup swipeonedown");
		this.bind("swipeoneleft swipeoneright swipeoneup swipeonedown", function() {
			drcom.check_disableswipe = true;
		
			drcom.disableSwipeNotChangeState();

			// remove timer if any
			var list = drcom.timer.timeOutList;
			if (list.length > 0) drcom.timer.clearTimeOut(list[list.length - 1]);

			// enable swipe
			drcom.timer.setTimeout(function() {
				drcom.check_disableswipe = false;
			
				drcom.enableSwipeNotChangeState();
			}, 300);
		});

		return this;
	};
	
	// remove some special elements before gotoslide
	$(document).bind("beforeGotoSlide", function() {
		// save tracking for agnitio
		var player = drcom.config.player;
		if (player === "Agnitio") {
			drcom.saveAgSlideExit();
		}

		if (drcom.config.stopAnimationBeforeGotoSlide) {
			//remove video
			$(".drcom_video").each(function() {
				$(this).controller().destroy();
			});
			$('video').remove();

			$('menu ul').removeAttr('style');

			//clear interval,timeOut
			drcom.timer.clearAllTimeOut();
			drcom.timer.clearAllInterval();

			if (player == "Veeva" || player == "HarVie" || player == "Browser") {
				$(".transform,.transition,.keyframe").remove();
			} else {
				//stop keyframe
				$(".keyframe").each(function(){
					stopKeyframeAnimation($(this));
				});

				//stop transition
				$(".transition").stopCssTransition();			
			}
			
			//stop dom css transition
			var cssTransitions = window.cssTransitions || [];
			_.each(cssTransitions, function(transit) {
				var el = transit.el,
					type = transit.type;
				if (type == "jquery") {
					el.stop(true, false);
				}
			});
		}
	});
	
	drcom.ready(function() {
		//show measure speed
	    if (drcom.config.visibleMeasure && window.startTime) {
		    var ul = $("<ul style='position:absolute;z-index:100;background:#000;color:red;left:0px;top:0px;margin:0px;padding:0px'></ul>").appendTo("body");
			$("<li></li>").appendTo(ul).html(new Date().getTime() - startTime);		    	
	    }
	   
		if (!drcom.config.useSystemSwipe) {
			if (!drcom.config.swipeInFourDirections) {
				//swipe left, swipe right to next,prev slide
				$(window).bind("swipeoneleft", function() {
					if (swipeLeftEnable) {
			    		drcom.nextSlide();
			    	}
				});
				$(window).bind("swipeoneright", function() {
					if (swipeRightEnable) {
			    		drcom.prevSlide();
			    	}
				});
			} else {
				$(window).bind("swipeoneleft swipeoneright swipeoneup swipeonedown", function(e) {
					switch (e.type) {
						case "swipeoneleft": if (swipeLeftEnable) drcom.nextMainSlide(); break;
						case "swipeoneright": if (swipeRightEnable) drcom.prevMainSlide(); break;
						case "swipeoneup": if (swipeDownEnable) drcom.nextSubSlide(); break;
						case "swipeonedown": if (swipeUpEnable) drcom.prevSubSlide(); break;
					}
				});
			}
		}	
	});
});
