/*!
 * No Framework v1.0.4
 */

(function() {
	window.drcom = window.drcom || {};
	if (!drcom.ready) {
		drcom.readyTmp = [];
		drcom.ready = function() {
			var args = Array.prototype.slice.call(arguments),
				len = args.length,
				required, func;
			
			switch (len) {
				case 1:
					func = args[0];
					required = [];
					break;
				default:
					required = args[0];
					func = args[1];
					break;
			}

			if (this.readyComplete) {
				require(required, func);
			} else {
				this.readyTmp.push({
					func: func,
					required: required
				});
			}
		};

		drcom.readyExecute = function() {
			this.readyComplete = true;
			var requiredList = [];
			for (var i = 0; i < this.readyTmp.length; i++) {
				requiredList = requiredList.concat(this.readyTmp[i].required);
			}
			
			require(requiredList, function() {
				var args = arguments;
				for (var i = 0; i < drcom.readyTmp.length; i++) {
					drcom.readyTmp[i].func.apply(window, arguments);
				}
			});
		};
	}
})();

(function(doc) {
	var head = doc.head,
		body = doc.body,
		link = doc.getElementsByTagName('link')[0],
		isProduction = (link.href.indexOf('production.css') >= 0);

	// prevent user from dragging
	doc.addEventListener('touchmove', function(e) { e.preventDefault(); });

	// add debug function
	window.debug = {
		init: function() {
			if (drcom.config.debug) {
				this.element = doc.querySelector('.debug');
				if (!this.element) {
					this.element = doc.createElement('div');
					this.element.setAttribute('class', 'debug');
					this.element.setAttribute('style', 'position: absolute; padding: 10px; top: 0; right: 0; background: black; color: white; width: 400px; max-height: 200px; overflow: auto; word-wrap: break-word; z-index: 999999;');
					body.appendChild(this.element);
				}
			}
		},

		log: function() {
			if (this.element) {
				var args = Array.prototype.slice.call(arguments),
					logRow = '<div style="margin: 2px;">',
					checkType = Object.prototype.toString,
					joins = [];
				for (var i = 0; i < args.length; i++) {
					var ar = args[i],
						type = checkType.call(ar);
					if (type === '[object Object]' || type === '[object Array]') {
						try { ar = JSON.stringify(ar); } 
						catch (e) { ar = ar.toString(); }
						finally { joins.push(ar); }
					} else if (type === '[object String]') {
						joins.push(ar);
					} else if (type === '[object Function]' || type === '[object global]') {
						joins.push(ar.toString());
					}
				}
				logRow += joins.join(', ') + '</div>';
				this.element.innerHTML += logRow;
			}
		},
	};

	debug.init();

	function writeFramework() {
		var path = drcom.config.share ? '../shared/' : '',
			script = doc.createElement('script');
		if (isProduction) {
			script.src = path + 'global/production.js';
		} else {
			script.setAttribute('data-main', path + 'global/js/loader.js');
			script.src = path + 'global/js/vendor/require.js';
		}

		script.async = true;
		head.appendChild(script);
	}

	setTimeout(writeFramework, 0);
})(document);

