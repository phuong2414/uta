var UNDEFINED,
	doc = document,
	win = window,
	math = Math,
	mathRound = math.round,
	mathFloor = math.floor,
	mathCeil = math.ceil,
	mathMax = math.max,
	mathMin = math.min,
	mathAbs = math.abs,
	mathCos = math.cos,
	mathSin = math.sin,
	mathPI = math.PI,

	// some variables
	SVG_NS = 'http://www.w3.org/2000/svg',
	M = 'M',
	L = 'L',
	NONE = 'none',
	PREFIX = 'drcom_svg_',
	Renderer,
	hasTouch,
	symbolSizes = {},
	idCounter = 0,
	pathAnim,
	timers = [],
	timerId,
	animSetters = {},
	Fx;

Math.easeInOutSine = function (t, b, c, d) {
	return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
};

pathAnim = {
	/**
	 * Prepare start and end values so that the path can be animated one to one
	 */
	init: function (elem, fromD, toD) {
		fromD = fromD || '';
		var shift = elem.shift,
			bezier = fromD.indexOf('C') > -1,
			numParams = bezier ? 7 : 3,
			endLength,
			slice,
			i,
			start = fromD.split(' '),
			end = [].concat(toD), // copy
			startBaseLine,
			endBaseLine,
			sixify = function (arr) { // in splines make move points have six parameters like bezier curves
				i = arr.length;
				while (i--) {
					if (arr[i] === M) {
						arr.splice(i + 1, 0, arr[i + 1], arr[i + 2], arr[i + 1], arr[i + 2]);
					}
				}
			};

		if (bezier) {
			sixify(start);
			sixify(end);
		}

		// pull out the base lines before padding
		if (elem.isArea) {
			startBaseLine = start.splice(start.length - 6, 6);
			endBaseLine = end.splice(end.length - 6, 6);
		}

		// if shifting points, prepend a dummy point to the end path
		if (shift <= end.length / numParams && start.length === end.length) {
			while (shift--) {
				end = [].concat(end).splice(0, numParams).concat(end);
			}
		}
		elem.shift = 0; // reset for following animations

		// copy and append last point until the length matches the end length
		if (start.length) {
			endLength = end.length;
			while (start.length < endLength) {

				//bezier && sixify(start);
				slice = [].concat(start).splice(start.length - numParams, numParams);
				if (bezier) { // disable first control point
					slice[numParams - 6] = slice[numParams - 2];
					slice[numParams - 5] = slice[numParams - 1];
				}
				start = start.concat(slice);
			}
		}

		if (startBaseLine) { // append the base lines for areas
			start = start.concat(startBaseLine);
			end = end.concat(endBaseLine);
		}
		return [start, end];
	},

	/**
	 * Interpolate each value of the path and return the array
	 */
	step: function (start, end, pos, complete) {
		var ret = [],
			i = start.length,
			startVal;

		if (pos === 1) { // land on the final path without adjustment points appended in the ends
			ret = complete;

		} else if (i === end.length && pos < 1) {
			while (i--) {
				startVal = parseFloat(start[i]);
				ret[i] =
					isNaN(startVal) ? // a letter instruction like M or L
						start[i] :
						pos * (parseFloat(end[i] - startVal)) + startVal;

			}
		} else { // if animation is finished or length not matching, land on right value
			ret = end;
		}
		return ret;
	}
};

/**
 * Extend an object with the members of another
 * @param {Object} a The object to be extended
 * @param {Object} b The object to add to the first one
 */
function extend(a, b) {
	var n;
	if (!a) {
		a = {};
	}
	for (n in b) {
		a[n] = b[n];
	}
	return a;
}
	
/**
 * Deep merge two or more objects and return a third object. If the first argument is
 * true, the contents of the second object is copied into the first object.
 * Previously this function redirected to jQuery.extend(true), but this had two limitations.
 * First, it deep merged arrays, which lead to workarounds in Highcharts. Second,
 * it copied properties from extended prototypes. 
 */
function merge() {
	var i,
		args = arguments,
		len,
		ret = {},
		doCopy = function (copy, original) {
			var value, key;

			// An object is replacing a primitive
			if (typeof copy !== 'object') {
				copy = {};
			}

			for (key in original) {
				if (original.hasOwnProperty(key)) {
					value = original[key];

					// Copy the contents of objects, but not arrays or DOM nodes
					if (value && typeof value === 'object' && Object.prototype.toString.call(value) !== '[object Array]'
							&& key !== 'renderTo' && typeof value.nodeType !== 'number') {
						copy[key] = doCopy(copy[key] || {}, value);
				
					// Primitives and arrays are copied over directly
					} else {
						copy[key] = original[key];
					}
				}
			}
			return copy;
		};

	// If first argument is true, copy into the existing object. Used in setOptions.
	if (args[0] === true) {
		ret = args[1];
		args = Array.prototype.slice.call(args, 2);
	}

	// For each argument, extend the return
	len = args.length;
	for (i = 0; i < len; i++) {
		ret = doCopy(ret, args[i]);
	}

	return ret;
}

/**
 * Shortcut for parseInt
 * @param {Object} s
 * @param {Number} mag Magnitude
 */
function pInt(s, mag) {
	return parseInt(s, mag || 10);
}

/**
 * Check for string
 * @param {Object} s
 */
function isString(s) {
	return typeof s === 'string';
}

/**
 * Check for object
 * @param {Object} obj
 */
function isObject(obj) {
	return obj && typeof obj === 'object';
}

/**
 * Check for array
 * @param {Object} obj
 */
function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * Returns true if the object is not null or undefined. Like MooTools' $.defined.
 * @param {Object} obj
 */
function defined(obj) {
	return obj !== UNDEFINED && obj !== null;
}

/**
 * Set or get an attribute or an object of attributes. Can't use jQuery attr because
 * it attempts to set expando properties on the SVG element, which is not allowed.
 *
 * @param {Object} elem The DOM element to receive the attribute(s)
 * @param {String|Object} prop The property or an abject of key-value pairs
 * @param {String} value The value if a single property is set
 */
function attr(elem, prop, value) {
	var key,
		ret;

	// if the prop is a string
	if (isString(prop)) {
		// set the value
		if (defined(value)) {
			elem.setAttribute(prop, value);

		// get the value
		} else if (elem && elem.getAttribute) { // elem not defined when printing pie demo...
			ret = elem.getAttribute(prop);
		}

	// else if prop is defined, it is a hash of key/value pairs
	} else if (defined(prop) && isObject(prop)) {
		for (key in prop) {
			elem.setAttribute(key, prop[key]);
		}
	}
	return ret;
}

/**
 * Return the first value that is defined. Like MooTools' $.pick.
 */
function pick() {
	var args = arguments,
		i,
		arg,
		length = args.length;
	for (i = 0; i < length; i++) {
		arg = args[i];
		if (arg !== UNDEFINED && arg !== null) {
			return arg;
		}
	}
}

/**
 * Set CSS on a given element
 * @param {Object} el
 * @param {Object} styles Style object with camel case property names
 */
function css(el, styles) {
	extend(el.style, styles);
}

/**
 * Utility function to create element with attributes and styles
 * @param {Object} tag
 * @param {Object} attribs
 * @param {Object} styles
 * @param {Object} parent
 * @param {Object} nopad
 */
function createElement(tag, attribs, styles, parent, nopad) {
	var el = doc.createElement(tag);
	if (attribs) {
		extend(el, attribs);
	}
	if (nopad) {
		css(el, {padding: 0, border: NONE, margin: 0});
	}
	if (styles) {
		css(el, styles);
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

Fx = function (elem, options, prop) {
	this.options = options;
	this.elem = elem;
	this.prop = prop;
};
Fx.prototype = {
	
	update: function () {
		var styles,
			paths = this.paths,
			elem = this.elem,
			elemelem = elem.element; // if destroyed, it is null

		// Animation setter defined from outside
		if (animSetters[this.prop]) {
			animSetters[this.prop](this);

		// Animating a path definition on SVGElement
		} else if (paths && elemelem) {
			elem.attr('d', pathAnim.step(paths[0], paths[1], this.now, this.toD));

		// Other animations on SVGElement
		} else if (elem.attr) {
			if (elemelem) {
				elem.attr(this.prop, this.now);
			}

		// HTML styles
		} else {
			styles = {};
			styles[this.prop] = this.now + this.unit;
			css(elem, styles);
		}
		
		if (this.options.step) {
			this.options.step.call(this.elem, this.now, this);
		}

	},
	custom: function (from, to, unit) {
		var self = this,
			t = function (gotoEnd) {
				return self.step(gotoEnd);
			},
			i;

		this.startTime = +new Date();
		this.start = from;
		this.end = to;
		this.unit = unit;
		this.now = this.start;
		this.pos = this.state = 0;

		t.elem = this.elem;

		if (t() && timers.push(t) === 1) {
			timerId = setInterval(function () {
				
				for (i = 0; i < timers.length; i++) {
					if (!timers[i]()) {
						timers.splice(i--, 1);
					}
				}

				if (!timers.length) {
					clearInterval(timerId);
				}
			}, 13);
		}
	},
	
	step: function (gotoEnd) {
		var t = +new Date(),
			ret,
			done,
			options = this.options,
			elem = this.elem,
			i;
		
		if (elem.stopAnimation || (elem.attr && !elem.element)) { // #2616, element including flag is destroyed
			ret = false;

		} else if (gotoEnd || t >= options.duration + this.startTime) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[this.prop] = true;

			done = true;
			for (i in options.curAnim) {
				if (options.curAnim[i] !== true) {
					done = false;
				}
			}

			if (done) {
				if (options.complete) {
					options.complete.call(elem);
				}
			}
			ret = false;

		} else {
			var n = t - this.startTime;
			this.state = n / options.duration;
			this.pos = options.easing(n, 0, 1, options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);
			this.update();
			ret = true;
		}
		return ret;
	}
};

/**
 * The adapter animate method
 */
function animate(el, prop, opt) {
	var start,
		unit = '',
		end,
		fx,
		args,
		name;

	el.stopAnimation = false; // ready for new

	if (typeof opt !== 'object' || opt === null) {
		args = arguments;
		opt = {
			duration: args[2],
			easing: args[3],
			complete: args[4]
		};
	}
	if (typeof opt.duration !== 'number') {
		opt.duration = 400;
	}
	opt.easing = Math[opt.easing] || Math.easeInOutSine;
	opt.curAnim = extend({}, prop);
	
	for (name in prop) {
		fx = new Fx(el, opt, name);
		end = null;
		
		if (name === 'd') {
			fx.paths = pathAnim.init(
				el,
				el.d,
				prop.d
			);
			fx.toD = prop.d;
			start = 0;
			end = 1;
		} else if (el.attr) {
			start = el.attr(name);
		} else {
			start = parseFloat(getStyle(el, name)) || 0;
			if (name !== 'opacity') {
				unit = 'px';
			}
		}

		if (!end) {
			end = prop[name];
		}
		fx.custom(start, end, unit);
	}	
}

/**
 * Internal method to return CSS value for given element and property
 */
function getStyle(el, prop) {
	return window.getComputedStyle(el, undefined).getPropertyValue(prop);
}

/**
 * Stop running animation
 */
function stop(el) {
	el.stopAnimation = true;
}

/**
 * Utility for iterating over an array. Parameters are reversed compared to jQuery.
 * @param {Array} arr
 * @param {Function} fn
 */
function each(arr, fn) { // modern browsers
	return Array.prototype.forEach.call(arr, fn);
}

/**
 * A wrapper object for SVG elements
 */
function SVGElement() {}

SVGElement.prototype = {
	
	// Default base for animation
	opacity: 1,
	// For labels, these CSS properties are applied to the <text> node directly
	textProps: ['fontSize', 'fontWeight', 'fontFamily', 'color', 
		'lineHeight', 'width', 'textDecoration', 'textShadow', 'HcTextStroke'],
	
	/**
	 * Initialize the SVG renderer
	 * @param {Object} renderer
	 * @param {String} nodeName
	 */
	init: function (renderer, nodeName) {
		var wrapper = this;
		wrapper.element = nodeName === 'span' ?
			createElement(nodeName) :
			doc.createElementNS(SVG_NS, nodeName);
		wrapper.renderer = renderer;
	},
	
	/**
	 * Animate a given attribute
	 * @param {Object} params
	 * @param {Number} options The same options as in jQuery animation
	 * @param {Function} complete Function to perform at the end of animation
	 */
	animate: function (params, options, complete) {
		var animOptions = pick(options, true);
		stop(this); // stop regardless of animation actually running, or reverting to .attr (#607)
		if (animOptions) {
			animOptions = merge(animOptions, {}); //#2625
			if (complete) { // allows using a callback with the global animation without overwriting it
				animOptions.complete = complete;
			}
			animate(this, params, animOptions);
		} else {
			this.attr(params);
			if (complete) {
				complete();
			}
		}
		return this;
	},

	/**
	 * Set or get a given attribute
	 * @param {Object|String} hash
	 * @param {Mixed|Undefined} val
	 */
	attr: function (hash, val) {
		var key,
			value,
			element = this.element,
			hasSetSymbolSize,
			ret = this,
			skipAttr;

		// single key-value pair
		if (typeof hash === 'string' && val !== UNDEFINED) {
			key = hash;
			hash = {};
			hash[key] = val;
		}

		// used as a getter: first argument is a string, second is undefined
		if (typeof hash === 'string') {
			ret = (this[hash + 'Getter'] || this._defaultGetter).call(this, hash, element);
		
		// setter
		} else {

			for (key in hash) {
				value = hash[key];
				skipAttr = false;



				if (this.symbolName && /^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)/.test(key)) {
					if (!hasSetSymbolSize) {
						this.symbolAttr(hash);
						hasSetSymbolSize = true;
					}
					skipAttr = true;
				}

				if (this.rotation && (key === 'x' || key === 'y')) {
					this.doTransform = true;
				}
				
				if (!skipAttr) {
					(this[key + 'Setter'] || this._defaultSetter).call(this, value, key, element);
				}
			}

			// Update transform. Do this outside the loop to prevent redundant updating for batch setting
			// of attributes.
			if (this.doTransform) {
				this.updateTransform();
				this.doTransform = false;
			}

		}

		return ret;
	},

	/**
	 * If one of the symbol size affecting parameters are changed,
	 * check all the others only once for each call to an element's
	 * .attr() method
	 * @param {Object} hash
	 */
	symbolAttr: function (hash) {
		var wrapper = this;

		each(['x', 'y', 'r', 'start', 'end', 'width', 'height', 'innerR', 'anchorX', 'anchorY'], function (key) {
			wrapper[key] = pick(hash[key], wrapper[key]);
		});

		wrapper.attr({
			d: wrapper.renderer.symbols[wrapper.symbolName](
				wrapper.x,
				wrapper.y,
				wrapper.width,
				wrapper.height,
				wrapper
			)
		});
	},

	/**
	 * Apply a clipping path to this object
	 * @param {String} id
	 */
	clip: function (clipRect) {
		return this.attr('clip-path', clipRect ? 'url(#' + clipRect.id + ')' : NONE);
	},

	/**
	 * Set styles for the element
	 * @param {Object} styles
	 */
	css: function (styles) {
		var elemWrapper = this,
			oldStyles = elemWrapper.styles,
			newStyles = {},
			elem = elemWrapper.element,
			textWidth,
			n,
			serializedCss = '',
			hyphenate,
			hasNew = !oldStyles;

		// convert legacy
		if (styles && styles.color) {
			styles.fill = styles.color;
		}

		// Filter out existing styles to increase performance (#2640)
		if (oldStyles) {
			for (n in styles) {
				if (styles[n] !== oldStyles[n]) {
					newStyles[n] = styles[n];
					hasNew = true;
				}
			}
		}
		if (hasNew) {
			textWidth = elemWrapper.textWidth = styles && styles.width && elem.nodeName.toLowerCase() === 'text' && pInt(styles.width);

			// Merge the new styles with the old ones
			if (oldStyles) {
				styles = extend(
					oldStyles,
					newStyles
				);
			}		

			// store object
			elemWrapper.styles = styles;

			if (textWidth && (useCanVG || (!hasSVG && elemWrapper.renderer.forExport))) {
				delete styles.width;
			}

			// serialize and set style attribute
			/*jslint unparam: true*/
			hyphenate = function (a, b) { return '-' + b.toLowerCase(); };
			/*jslint unparam: false*/
			for (n in styles) {
				serializedCss += n.replace(/([A-Z])/g, hyphenate) + ':' + styles[n] + ';';
			}
			attr(elem, 'style', serializedCss); // #1881


			// re-build text
			if (textWidth && elemWrapper.added) {
				elemWrapper.renderer.buildText(elemWrapper);
			}
		}

		return elemWrapper;
	},

	/**
	 * Add an event listener
	 * @param {String} eventType
	 * @param {Function} handler
	 */
	on: function (eventType, handler) {
		var svgElement = this,
			element = svgElement.element;
		
		// touch
		if (hasTouch && eventType === 'click') {
			element.ontouchstart = function (e) {			
				svgElement.touchEventFired = Date.now();				
				e.preventDefault();
				handler.call(element, e);
			};
			element.onclick = function (e) {												
				if (userAgent.indexOf('Android') === -1 || Date.now() - (svgElement.touchEventFired || 0) > 1100) { // #2269
					handler.call(element, e);
				}
			};			
		} else {
			// simplest possible event model for internal use
			element['on' + eventType] = handler;
		}
		return this;
	},

	/**
	 * Move an object and its children by x and y values
	 * @param {Number} x
	 * @param {Number} y
	 */
	translate: function (x, y) {
		return this.attr({
			translateX: x,
			translateY: y
		});
	},

	/**
	 * Rotate an object and its children by deg value
	 * @param {Number} deg
	 * @param {Number} x
	 * @param {Number} y
	 */
	rotate: function(deg, x, y) {
		this.attr('transform', 'rotate(' + deg + ' ' + x + ' ' + y + ')');
	},

	/**
	 * Invert a group, rotate and flip
	 */
	invert: function () {
		var wrapper = this;
		wrapper.inverted = true;
		wrapper.updateTransform();
		return wrapper;
	},

	/**
	 * Private method to update the transform attribute based on internal
	 * properties
	 */
	updateTransform: function () {
		var wrapper = this,
			translateX = wrapper.translateX || 0,
			translateY = wrapper.translateY || 0,
			scaleX = wrapper.scaleX,
			scaleY = wrapper.scaleY,
			inverted = wrapper.inverted,
			rotation = wrapper.rotation,
			element = wrapper.element,
			transform;

		// flipping affects translate as adjustment for flipping around the group's axis
		if (inverted) {
			translateX += wrapper.attr('width');
			translateY += wrapper.attr('height');
		}

		// Apply translate. Nearly all transformed elements have translation, so instead
		// of checking for translate = 0, do it always (#1767, #1846).
		transform = ['translate(' + translateX + ',' + translateY + ')'];

		// apply rotation
		if (inverted) {
			transform.push('rotate(90) scale(-1,1)');
		} else if (rotation) { // text rotation
			transform.push('rotate(' + rotation + ' ' + (element.getAttribute('x') || 0) + ' ' + (element.getAttribute('y') || 0) + ')');
		}

		// apply scale
		if (defined(scaleX) || defined(scaleY)) {
			transform.push('scale(' + pick(scaleX, 1) + ' ' + pick(scaleY, 1) + ')');
		}

		if (transform.length) {
			element.setAttribute('transform', transform.join(' '));
		}
	},

	/**
	 * Show the element
	 */
	show: function (inherit) {
		// IE9-11 doesn't handle visibilty:inherit well, so we remove the attribute instead (#2881)
		if (inherit && this.element.namespaceURI === SVG_NS) {
			this.element.removeAttribute('visibility');
		} else {
			this.attr({ visibility: inherit ? 'inherit' : VISIBLE });
		}
		return this;
	},

	/**
	 * Hide the element
	 */
	hide: function () {
		return this.attr({ visibility: HIDDEN });
	},

	fadeOut: function (duration) {
		var elemWrapper = this;
		elemWrapper.animate({
			opacity: 0
		}, {
			duration: duration || 150,
			complete: function () {
				elemWrapper.attr({ y: -9999 }); // #3088, assuming we're only using this for tooltips
			}
		});
	},

	/**
	 * Add the element
	 * @param {Object|Undefined} parent Can be an element, an element wrapper or undefined
	 *    to append the element to the renderer.box.
	 */
	add: function (parent) {

		var renderer = this.renderer,
			parentWrapper = parent || renderer,
			parentNode = parentWrapper.element || renderer.box,
			childNodes,
			element = this.element,
			zIndex = this.zIndex,
			otherElement,
			otherZIndex,
			i,
			inserted;

		if (parent) {
			this.parentGroup = parent;
		}

		// mark as inverted
		this.parentInverted = parent && parent.inverted;

		// build formatted text
		if (this.textStr !== undefined) {
			renderer.buildText(this);
		}

		// mark the container as having z indexed children
		if (zIndex) {
			parentWrapper.handleZ = true;
			zIndex = pInt(zIndex);
		}

		// insert according to this and other elements' zIndex
		if (parentWrapper.handleZ) { // this element or any of its siblings has a z index
			childNodes = parentNode.childNodes;
			for (i = 0; i < childNodes.length; i++) {
				otherElement = childNodes[i];
				otherZIndex = attr(otherElement, 'zIndex');
				if (otherElement !== element && (
						// insert before the first element with a higher zIndex
						pInt(otherZIndex) > zIndex ||
						// if no zIndex given, insert before the first element with a zIndex
						(!defined(zIndex) && defined(otherZIndex))

						)) {
					parentNode.insertBefore(element, otherElement);
					inserted = true;
					break;
				}
			}
		}

		// default: append at the end
		if (!inserted) {
			parentNode.appendChild(element);
		}

		// mark as added
		this.added = true;

		// fire an event for internal hooks
		if (this.onAdd) {
			this.onAdd();
		}

		return this;
	},

	xGetter: function (key) {
		if (this.element.nodeName === 'circle') {
			key = { x: 'cx', y: 'cy' }[key] || key;
		}
		return this._defaultGetter(key);
	},

	/** 
	 * Get the current value of an attribute or pseudo attribute, used mainly
	 * for animation.
	 */
	_defaultGetter: function (key) {
		var ret = pick(this[key], this.element ? this.element.getAttribute(key) : null, 0);

		if (/^[\-0-9\.]+$/.test(ret)) { // is numerical
			ret = parseFloat(ret);
		}
		return ret;
	},


	dSetter: function (value, key, element) {
		if (value && value.join) { // join path
			value = value.join(' ');
		}
		if (/(NaN| {2}|^$)/.test(value)) {
			value = 'M 0 0';
		}
		element.setAttribute(key, value);

		this[key] = value;
	},
	fillSetter: function (value, key, element) {
		if (typeof value === 'string') {
			element.setAttribute(key, value);
		} else if (value) {
			this.colorGradient(value, key, element);
		}
	},
	_defaultSetter: function (value, key, element) {
		element.setAttribute(key, value);
	}
};

// Some shared setters and getters
SVGElement.prototype.yGetter = SVGElement.prototype.xGetter;
SVGElement.prototype.translateXSetter = SVGElement.prototype.translateYSetter = 
		SVGElement.prototype.rotationSetter = SVGElement.prototype.verticalAlignSetter = 
		SVGElement.prototype.scaleXSetter = SVGElement.prototype.scaleYSetter = function (value, key) {
	this[key] = value;
	this.doTransform = true;
};

// WebKit and Batik have problems with a stroke-width of zero, so in this case we remove the 
// stroke attribute altogether. #1270, #1369, #3065, #3072.
SVGElement.prototype['stroke-widthSetter'] = SVGElement.prototype.strokeSetter = function (value, key, element) {
	this[key] = value;
	// Only apply the stroke attribute if the stroke width is defined and larger than 0
	if (this.stroke && this['stroke-width']) {
		this.strokeWidth = this['stroke-width'];
		SVGElement.prototype.fillSetter.call(this, this.stroke, 'stroke', element); // use prototype as instance may be overridden
		element.setAttribute('stroke-width', this['stroke-width']);
		this.hasStroke = true;
	} else if (key === 'stroke-width' && value === 0 && this.hasStroke) {
		element.removeAttribute('stroke');
		this.hasStroke = false;
	}
};


/**
 * The default SVG renderer
 */
var SVGRenderer = function () {
	this.init.apply(this, arguments);
};
SVGRenderer.prototype = {
	Element: SVGElement,

	/**
	 * Initialize the SVGRenderer
	 * @param {Object} container
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Boolean} forExport
	 */
	init: function (container, width, height, style) {
		var renderer = this,
			loc = location,
			boxWrapper,
			element,
			desc;

		boxWrapper = renderer.createElement('svg')
			.attr({
				version: '1.1'
			})
			.css(this.getStyle(style));
		element = boxWrapper.element;
		container.appendChild(element);

		// For browsers other than IE, add the namespace attribute (#1978)
		if (container.innerHTML.indexOf('xmlns') === -1) {
			attr(element, 'xmlns', SVG_NS);
		}

		// object properties
		renderer.isSVG = true;
		renderer.box = element;
		renderer.boxWrapper = boxWrapper;

		renderer.defs = this.createElement('defs').add();
		renderer.setSize(width, height, false);
	},

	getStyle: function (style) {
		return (this.style = extend({
			fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif', // default font
			fontSize: '12px'
		}, style));
	},

	/**
	 * Create a wrapper for an SVG element
	 * @param {Object} nodeName
	 */
	createElement: function (nodeName) {
		var wrapper = new this.Element();
		wrapper.init(this, nodeName);
		return wrapper;
	},

	/**
	 * Dummy function for use in canvas renderer
	 */
	draw: function () {},

	/**
	 * Draw a path
	 * @param {Array} path An SVG path in array form
	 */
	path: function (path) {
		var attr = {
			fill: NONE
		};
		if (isArray(path)) {
			attr.d = path;
		} else if (isObject(path)) { // attributes
			extend(attr, path);
		}
		return this.createElement('path').attr(attr);
	},

	/**
	 * Draw and return an SVG circle
	 * @param {Number} x The x position
	 * @param {Number} y The y position
	 * @param {Number} r The radius
	 */
	circle: function (x, y, r) {
		var attr = isObject(x) ?
			x :
			{
				x: x,
				y: y,
				r: r
			},
			wrapper = this.createElement('circle');

		wrapper.xSetter = function (value) {
			this.element.setAttribute('cx', value);
		};
		wrapper.ySetter = function (value) {
			this.element.setAttribute('cy', value);
		};
		return wrapper.attr(attr);
	},

	/**
	 * Draw and return an arc
	 * @param {Number} x X position
	 * @param {Number} y Y position
	 * @param {Number} r Radius
	 * @param {Number} innerR Inner radius like used in donut charts
	 * @param {Number} start Starting angle
	 * @param {Number} end Ending angle
	 */
	arc: function (x, y, r, innerR, start, end) {
		var arc;

		if (isObject(x)) {
			y = x.y;
			r = x.r;
			innerR = x.innerR;
			start = x.start;
			end = x.end;
			x = x.x;
		}

		// Arcs are defined as symbols for the ability to set
		// attributes in attr and animate
		arc = this.symbol('arc', x || 0, y || 0, r || 0, r || 0, {
			innerR: innerR || 0,
			start: start || 0,
			end: end || 0
		});
		arc.r = r; // #959
		return arc;
	},

	/**
	 * Resize the box and re-align all aligned elements
	 * @param {Object} width
	 * @param {Object} height
	 * @param {Boolean} animate
	 *
	 */
	setSize: function (width, height, animate) {
		var renderer = this;

		renderer.width = width;
		renderer.height = height;

		renderer.boxWrapper[pick(animate, true) ? 'animate' : 'attr']({
			width: width,
			height: height
		});
	},

	/**
	 * Create a group
	 * @param {String} name The group will be given a class name of 'highcharts-{name}'.
	 *     This can be used for styling and scripting.
	 */
	g: function (name) {
		var elem = this.createElement('g');
		return defined(name) ? elem.attr({ 'class': PREFIX + name }) : elem;
	},

	/**
	 * Display an image
	 * @param {String} src
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	image: function (src, x, y, width, height) {
		var attribs = {},
			elemWrapper;

		// optional properties
		if (arguments.length > 1) {
			extend(attribs, {
				x: x,
				y: y,
				width: width,
				height: height
			});
		}

		elemWrapper = this.createElement('image').attr(attribs);

		// set the href in the xlink namespace
		if (elemWrapper.element.setAttributeNS) {
			elemWrapper.element.setAttributeNS('http://www.w3.org/1999/xlink',
				'href', src);
		} else {
			// could be exporting in IE
			// using href throws "not supported" in ie7 and under, requries regex shim to fix later
			elemWrapper.element.setAttribute('hc-svg-href', src);
		}
		return elemWrapper;
	},

	/**
	 * Draw a symbol out of pre-defined shape paths from the namespace 'symbol' object.
	 *
	 * @param {Object} symbol
	 * @param {Object} x
	 * @param {Object} y
	 * @param {Object} radius
	 * @param {Object} options
	 */
	symbol: function (symbol, x, y, width, height, options) {

		var obj,

			// get the symbol definition function
			symbolFn = this.symbols[symbol],

			// check if there's a path defined for this symbol
			path = symbolFn && symbolFn(
				mathRound(x),
				mathRound(y),
				width,
				height,
				options
			),

			imageElement,
			imageRegex = /^url\((.*?)\)$/,
			imageSrc,
			imageSize,
			centerImage;

		if (path) {

			obj = this.path(path);
			// expando properties for use in animate and attr
			extend(obj, {
				symbolName: symbol,
				x: x,
				y: y,
				width: width,
				height: height
			});
			if (options) {
				extend(obj, options);
			}


		// image symbols
		} else if (imageRegex.test(symbol)) {

			// On image load, set the size and position
			centerImage = function (img, size) {
				if (img.element) { // it may be destroyed in the meantime (#1390)
					img.attr({
						width: size[0],
						height: size[1]
					});

					if (!img.alignByTranslate) { // #185
						img.translate(
							mathRound((width - size[0]) / 2), // #1378
							mathRound((height - size[1]) / 2)
						);
					}
				}
			};

			imageSrc = symbol.match(imageRegex)[1];
			imageSize = symbolSizes[imageSrc] || (options && options.width && options.height && [options.width, options.height]);

			// Ireate the image synchronously, add attribs async
			obj = this.image(imageSrc)
				.attr({
					x: x,
					y: y
				});
			obj.isImg = true;

			if (imageSize) {
				centerImage(obj, imageSize);
			} else {
				// Initialize image to be 0 size so export will still function if there's no cached sizes.
				obj.attr({ width: 0, height: 0 });

				// Create a dummy JavaScript image to get the width and height. Due to a bug in IE < 8,
				// the created element must be assigned to a variable in order to load (#292).
				imageElement = createElement('img', {
					onload: function () {
						centerImage(obj, symbolSizes[imageSrc] = [this.width, this.height]);
					},
					src: imageSrc
				});
			}
		}

		return obj;
	},

	/**
	 * An extendable collection of functions for defining symbol paths.
	 */
	symbols: {
		'circle': function (x, y, w, h) {
			var cpw = 0.166 * w;
			return [
				M, x + w / 2, y,
				'C', x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h,
				'C', x - cpw, y + h, x - cpw, y, x + w / 2, y,
				'Z'
			];
		},
		'arc': function (x, y, w, h, options) {
			var start = options.start,
				radius = options.r || w || h,
				end = options.end - 0.001, // to prevent cos and sin of start and end from becoming equal on 360 arcs (related: #1561)
				innerRadius = options.innerR,
				open = options.open,
				cosStart = mathCos(start),
				sinStart = mathSin(start),
				cosEnd = mathCos(end),
				sinEnd = mathSin(end),
				longArc = options.end - start < mathPI ? 0 : 1;

			return [
				M,
				x + radius * cosStart,
				y + radius * sinStart,
				'A', // arcTo
				radius, // x radius
				radius, // y radius
				0, // slanting
				longArc, // long or short arc
				1, // clockwise
				x + radius * cosEnd,
				y + radius * sinEnd,
				open ? M : L,
				x + innerRadius * cosEnd,
				y + innerRadius * sinEnd,
				'A', // arcTo
				innerRadius, // x radius
				innerRadius, // y radius
				0, // slanting
				longArc, // long or short arc
				0, // clockwise
				x + innerRadius * cosStart,
				y + innerRadius * sinStart,

				open ? '' : 'Z' // close
			];
		},
	},

	/**
	 * Define a clipping rectangle
	 * @param {String} id
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	clipCircle: function (x, y, r) {
		var wrapper,
			id = PREFIX + idCounter++,

			clipPath = this.createElement('clipPath').attr({
				id: id
			}).add(this.defs);

		wrapper = this.circle(x, y, r).add(clipPath);
		wrapper.id = id;
		wrapper.clipPath = clipPath;

		return wrapper;
	},

	clipArc: function (x, y, r, innerR, start, end) {
		var wrapper,
			id = PREFIX + idCounter++,

			clipPath = this.createElement('clipPath').attr({
				id: id
			}).add(this.defs);

		wrapper = this.arc(x, y, r, innerR, start, end).add(clipPath);
		wrapper.id = id;
		wrapper.clipPath = clipPath;

		return wrapper;
	}
}; // end SVGRenderer


// general renderer
Renderer = SVGRenderer;