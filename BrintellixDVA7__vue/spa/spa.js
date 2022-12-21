require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){(function (){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this)}).call(this,require('_process'))
},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
var spa = require('spa'),
	slidePopup = require('slideshow-popup');

Object.defineProperties(exports, {
	main: {
		get: function(){
			return getChapter().main
		}
	},
	local: {
		get: function(){
			return getChapter().local
		}
	}
});

function getChapter(){
	return spa.current ? getSPAChapter() : getMPAChapter()
}

function getSPAChapter(){
	var popupViews = spa.popupViews,
		local, main;

	main = spa.current.chapter;
	local = getLocalChapter() || main;

	if(popupViews.length){
		local = {
			id: popupViews[popupViews.length - 1].chapter,
			name: "Collected Popup " + spa.collectedPopupsCount,
			content: popupViews[popupViews.length - 1].slides
		};
	}

	return {main: main, local: local};
}

function getMPAChapter(){
	var utils = require('utils'),
		structure = require('structure'),
		slide = require('slide').sid,
		main = {
			id: null,
			name: null,
			content: []
		};

	utils.mapToArray(structure.chapters).some(function(chapter){
		return chapter.content.indexOf(slide) > -1 && (main = chapter);
	});

	return {
		main: main,
		local: getLocalChapter() || main
	};
}

function getLocalChapter(){
	if(slidePopup.isPopup()){
		return slidePopup.getCurrentPopupChapter();
	}
}
},{"slide":24,"slideshow-popup":26,"spa":"spa","structure":"structure","utils":40}],4:[function(require,module,exports){
(function (process,global){(function (){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   v4.2.8+1e68dce6
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  var type = typeof x;
  return x !== null && (type === 'object' || type === 'function');
}

function isFunction(x) {
  return typeof x === 'function';
}



var _isArray = void 0;
if (Array.isArray) {
  _isArray = Array.isArray;
} else {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
}

var isArray = _isArray;

var len = 0;
var vertxNext = void 0;
var customSchedulerFn = void 0;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var vertx = Function('return this')().require('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = void 0;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;


  if (_state) {
    var callback = arguments[_state - 1];
    asap(function () {
      return invokeCallback(_state, child, callback, parent._result);
    });
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(2);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return resolve(promise, value);
    }, function (reason) {
      return reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    var then$$1 = void 0;
    try {
      then$$1 = value.then;
    } catch (error) {
      reject(promise, error);
      return;
    }
    handleMaybeThenable(promise, value, then$$1);
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;


  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = void 0,
      callback = void 0,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = void 0,
      error = void 0,
      succeeded = true;

  if (hasCallback) {
    try {
      value = callback(detail);
    } catch (e) {
      succeeded = false;
      error = e;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (succeeded === false) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    fulfill(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch (e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

var Enumerator = function () {
  function Enumerator(Constructor, input) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop);

    if (!this.promise[PROMISE_ID]) {
      makePromise(this.promise);
    }

    if (isArray(input)) {
      this.length = input.length;
      this._remaining = input.length;

      this._result = new Array(this.length);

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate(input);
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, validationError());
    }
  }

  Enumerator.prototype._enumerate = function _enumerate(input) {
    for (var i = 0; this._state === PENDING && i < input.length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
    var c = this._instanceConstructor;
    var resolve$$1 = c.resolve;


    if (resolve$$1 === resolve$1) {
      var _then = void 0;
      var error = void 0;
      var didError = false;
      try {
        _then = entry.then;
      } catch (e) {
        didError = true;
        error = e;
      }

      if (_then === then && entry._state !== PENDING) {
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof _then !== 'function') {
        this._remaining--;
        this._result[i] = entry;
      } else if (c === Promise$1) {
        var promise = new c(noop);
        if (didError) {
          reject(promise, error);
        } else {
          handleMaybeThenable(promise, entry, _then);
        }
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c(function (resolve$$1) {
          return resolve$$1(entry);
        }), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
    var promise = this.promise;


    if (promise._state === PENDING) {
      this._remaining--;

      if (state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = value;
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
    var enumerator = this;

    subscribe(promise, undefined, function (value) {
      return enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
      return enumerator._settledAt(REJECTED, i, reason);
    });
  };

  return Enumerator;
}();

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {Function} resolver
  Useful for tooling.
  @constructor
*/

var Promise$1 = function () {
  function Promise(resolver) {
    this[PROMISE_ID] = nextId();
    this._result = this._state = undefined;
    this._subscribers = [];

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise ? initializePromise(this, resolver) : needsNew();
    }
  }

  /**
  The primary way of interacting with a promise is through its `then` method,
  which registers callbacks to receive either a promise's eventual value or the
  reason why the promise cannot be fulfilled.
   ```js
  findUser().then(function(user){
    // user is available
  }, function(reason){
    // user is unavailable, and you are given the reason why
  });
  ```
   Chaining
  --------
   The return value of `then` is itself a promise.  This second, 'downstream'
  promise is resolved with the return value of the first promise's fulfillment
  or rejection handler, or rejected if the handler throws an exception.
   ```js
  findUser().then(function (user) {
    return user.name;
  }, function (reason) {
    return 'default name';
  }).then(function (userName) {
    // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    // will be `'default name'`
  });
   findUser().then(function (user) {
    throw new Error('Found user, but still unhappy');
  }, function (reason) {
    throw new Error('`findUser` rejected and we're unhappy');
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
  });
  ```
  If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
   ```js
  findUser().then(function (user) {
    throw new PedagogicalException('Upstream error');
  }).then(function (value) {
    // never reached
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // The `PedgagocialException` is propagated all the way down to here
  });
  ```
   Assimilation
  ------------
   Sometimes the value you want to propagate to a downstream promise can only be
  retrieved asynchronously. This can be achieved by returning a promise in the
  fulfillment or rejection handler. The downstream promise will then be pending
  until the returned promise is settled. This is called *assimilation*.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // The user's comments are now available
  });
  ```
   If the assimliated promise rejects, then the downstream promise will also reject.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // If `findCommentsByAuthor` fulfills, we'll have the value here
  }, function (reason) {
    // If `findCommentsByAuthor` rejects, we'll have the reason here
  });
  ```
   Simple Example
  --------------
   Synchronous Example
   ```javascript
  let result;
   try {
    result = findResult();
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
  findResult(function(result, err){
    if (err) {
      // failure
    } else {
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findResult().then(function(result){
    // success
  }, function(reason){
    // failure
  });
  ```
   Advanced Example
  --------------
   Synchronous Example
   ```javascript
  let author, books;
   try {
    author = findAuthor();
    books  = findBooksByAuthor(author);
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
   function foundBooks(books) {
   }
   function failure(reason) {
   }
   findAuthor(function(author, err){
    if (err) {
      failure(err);
      // failure
    } else {
      try {
        findBoooksByAuthor(author, function(books, err) {
          if (err) {
            failure(err);
          } else {
            try {
              foundBooks(books);
            } catch(reason) {
              failure(reason);
            }
          }
        });
      } catch(error) {
        failure(err);
      }
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findAuthor().
    then(findBooksByAuthor).
    then(function(books){
      // found books
  }).catch(function(reason){
    // something went wrong
  });
  ```
   @method then
  @param {Function} onFulfilled
  @param {Function} onRejected
  Useful for tooling.
  @return {Promise}
  */

  /**
  `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
  as the catch block of a try/catch statement.
  ```js
  function findAuthor(){
  throw new Error('couldn't find that author');
  }
  // synchronous
  try {
  findAuthor();
  } catch(reason) {
  // something went wrong
  }
  // async with promises
  findAuthor().catch(function(reason){
  // something went wrong
  });
  ```
  @method catch
  @param {Function} onRejection
  Useful for tooling.
  @return {Promise}
  */


  Promise.prototype.catch = function _catch(onRejection) {
    return this.then(null, onRejection);
  };

  /**
    `finally` will be invoked regardless of the promise's fate just as native
    try/catch/finally behaves
  
    Synchronous example:
  
    ```js
    findAuthor() {
      if (Math.random() > 0.5) {
        throw new Error();
      }
      return new Author();
    }
  
    try {
      return findAuthor(); // succeed or fail
    } catch(error) {
      return findOtherAuther();
    } finally {
      // always runs
      // doesn't affect the return value
    }
    ```
  
    Asynchronous example:
  
    ```js
    findAuthor().catch(function(reason){
      return findOtherAuther();
    }).finally(function(){
      // author was either found, or not
    });
    ```
  
    @method finally
    @param {Function} callback
    @return {Promise}
  */


  Promise.prototype.finally = function _finally(callback) {
    var promise = this;
    var constructor = promise.constructor;

    if (isFunction(callback)) {
      return promise.then(function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      }, function (reason) {
        return constructor.resolve(callback()).then(function () {
          throw reason;
        });
      });
    }

    return promise.then(callback, callback);
  };

  return Promise;
}();

Promise$1.prototype.then = then;
Promise$1.all = all;
Promise$1.race = race;
Promise$1.resolve = resolve$1;
Promise$1.reject = reject$1;
Promise$1._setScheduler = setScheduler;
Promise$1._setAsap = setAsap;
Promise$1._asap = asap;

/*global self*/
function polyfill() {
  var local = void 0;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }

  var P = local.Promise;

  if (P) {
    var promiseToString = null;
    try {
      promiseToString = Object.prototype.toString.call(P.resolve());
    } catch (e) {
      // silently ignored
    }

    if (promiseToString === '[object Promise]' && !P.cast) {
      return;
    }
  }

  local.Promise = Promise$1;
}

// Strange compat..
Promise$1.polyfill = polyfill;
Promise$1.Promise = Promise$1;

return Promise$1;

})));





}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":2}],5:[function(require,module,exports){
var utils = require('utils');

exports.load = function(url){
	return cache(url, loadData(url));
};

exports.loadWithoutCache = function(url){
	return loadData(url);
};

exports.loadSync = function(url){
	return cache(url, utils.load(url));
};

exports.loadJSON = function(url, reviver, cache){
	return utils.loadAsync(url, cache)
		.then(function(data){
			return JSON.parse(data, reviver);
		})
		.catch(function(){
			warn(url);
			return {};
		});
};

exports.loadJSONSync = function(url, reviver){
	try{
		return JSON.parse(exports.loadSync(url).responseText, reviver);
	}catch (err){
		warn(url);
		return {};
	}
};

function loadData(url){
	return new Promise(function(resolve, reject){
		utils.load(url, resolve, true);
	})
		.then(function(response){
			return response.target.responseText;
		});
}

function cache(url, value){
	if(cache[url]){
		return cache[url];
	}

	return cache[url] = value;
}

function warn(url){
	console.warn("File can't be loaded or parsed: " + url);
}

},{"utils":40}],6:[function(require,module,exports){
/**
 * @license
 * (c) 2012 Mikhail Davydov <http://azproduction.ru>
 * Lo-Dash 1.0.0-rc.3 <http://lodash.com>
 * (c) 2012 John-David Dalton <http://allyoucanleet.com/>
 * Based on Underscore.js 1.4.3 <http://underscorejs.org>
 * (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to detect template delimiter values that require a with-statement */
var reComplexDelimiter = /[-?+=!~*%&^<>|{(\/]|\[\D|\b(?:delete|in|instanceof|new|typeof|void)\b/;

/** Used to match empty string literals in compiled template source */
var reEmptyStringLeading = /\b__p \+= '';/g,
    reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

/** Used to insert the data object variable into compiled template source */
var reInsertVariable = /(?:__e|__t = )\(\s*(?![\d\s"']|this\.)/g;

/**
 * Used to match ES6 template delimiters
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
 */
var reEsTemplate = /\$\{((?:(?=\\?)\\?[\s\S])*?)}/g;

/** Used to match "interpolate" template delimiters */
var reInterpolate = /<%=([\s\S]+?)%>/g;

/** Used to ensure capturing order of template delimiters */
var reNoMatch = /($^)/;

/** Used to match HTML characters */
var reUnescapedHtml = /[&<>"']/g;

/** Used to match unescaped characters in compiled string literals */
var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

var settings = {

    /**
     * Used to detect `data` property values to be HTML-escaped.
     *
     * @memberOf settings
     * @type RegExp
     */
    'escape': /<%-([\s\S]+?)%>/g,

    /**
     * Used to detect code to be evaluated.
     *
     * @memberOf settings
     * @type RegExp
     */
    'evaluate': /<%([\s\S]+?)%>/g,

    /**
     * Used to detect `data` property values to inject.
     *
     * @memberOf settings
     * @type RegExp
     */
    'interpolate': reInterpolate,

    /**
     * Used to reference the data object in the template text.
     *
     * @memberOf settings
     * @type String
     */
    'variable': '',

    /**
     * Used to import variables into the compiled template.
     *
     * @memberOf settings
     * @type Object
     */
    'imports': {
        '__e': escape
    }
};

/** Used to escape characters for inclusion in compiled string literals */
var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};

/**
 * Used to convert characters to HTML entities:
 *
 * Though the `>` character is escaped for symmetry, characters like `>` and `/`
 * don't require escaping in HTML and have no special meaning unless they're part
 * of a tag or an unquoted attribute value.
 * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
 */
var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};

var keys = Object.keys;

/**
 * Creates an array composed of the own enumerable property values of `object`.
 *
 * @static
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns a new array of property values.
 * @example
 *
 * values({ 'one': 1, 'two': 2, 'three': 3 });
 * // => [1, 2, 3]
 */
function values(object) {
    var index = -1,
        props = keys(object),
        length = props.length,
        result = Array(length);

    while (++index < length) {
        result[index] = object[props[index]];
    }
    return result;
}

/**
 * Used by `template` to escape characters for inclusion in compiled
 * string literals.
 *
 * @private
 * @param {String} match The matched character to escape.
 * @returns {String} Returns the escaped character.
 */
function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
}

// Fill in a given object with default properties.
function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        if (source) {
            for (var prop in source) {
                if (obj[prop] == null) obj[prop] = source[prop];
            }
        }
    });

    return obj;
}

/**
 * Used by `escape` to convert characters to HTML entities.
 *
 * @private
 * @param {String} match The matched character to escape.
 * @returns {String} Returns the escaped character.
 */
function escapeHtmlChar(match) {
    return htmlEscapes[match];
}

/**
 * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
 * corresponding HTML entities.
 *
 * @static
 * @category Utilities
 * @param {String} string The string to escape.
 * @returns {String} Returns the escaped string.
 * @example
 *
 * _.escape('Moe, Larry & Curly');
 * // => 'Moe, Larry &amp; Curly'
 */
function escape(string) {
    return string == null ? '' : (string + '').replace(reUnescapedHtml, escapeHtmlChar);
}

/**
 * A micro-templating method that handles arbitrary delimiters, preserves
 * whitespace, and correctly escapes quotes within interpolated code.
 *
 * Note: In the development build `_.template` utilizes sourceURLs for easier
 * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
 *
 * Note: Lo-Dash may be used in Chrome extensions by either creating a `lodash csp`
 * build and avoiding `_.template` use, or loading Lo-Dash in a sandboxed page.
 * See http://developer.chrome.com/trunk/extensions/sandboxingEval.html
 *
 * @static
 * @category Utilities
 * @param {String} text The template text.
 * @param {Obect} data The data object used to populate the text.
 * @param {Object} options The options object.
 *  escape - The "escape" delimiter regexp.
 *  evaluate - The "evaluate" delimiter regexp.
 *  interpolate - The "interpolate" delimiter regexp.
 *  sourceURL - The sourceURL of the template's compiled source.
 *  variable - The data object variable name.
 *
 * @returns {Function|String} Returns a compiled function when no `data` object
 *  is given, else it returns the interpolated text.
 * @example
 *
 * // using a compiled template
 * var compiled = _.template('hello <%= name %>');
 * compiled({ 'name': 'moe' });
 * // => 'hello moe'
 *
 * var list = '<% _.forEach(people, function(name) { %><li><%= name %></li><% }); %>';
 * _.template(list, { 'people': ['moe', 'larry', 'curly'] });
 * // => '<li>moe</li><li>larry</li><li>curly</li>'
 *
 * // using the "escape" delimiter to escape HTML in data property values
 * _.template('<b><%- value %></b>', { 'value': '<script>' });
 * // => '<b>&lt;script&gt;</b>'
 *
 * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
 * _.template('hello ${ name }', { 'name': 'curly' });
 * // => 'hello curly'
 *
 * // using the internal `print` function in "evaluate" delimiters
 * _.template('<% print("hello " + epithet); %>!', { 'epithet': 'stooge' });
 * // => 'hello stooge!'
 *
 * // using custom template delimiters
 * _.templateSettings = {
   *   'interpolate': /{{([\s\S]+?)}}/g
   * };
 *
 * _.template('hello {{ name }}!', { 'name': 'mustache' });
 * // => 'hello mustache!'
 *
 * // using the `sourceURL` option to specify a custom sourceURL for the template
 * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
 * compiled(data);
 * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
 *
 * // using the `variable` option to ensure a with-statement isn't used in the compiled template
 * var compiled = _.template('hello <%= data.name %>!', null, { 'variable': 'data' });
 * compiled.source;
 * // => function(data) {
   *   var __t, __p = '', __e = _.escape;
   *   __p += 'hello ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
   *   return __p;
   * }
 *
 * // using the `source` property to inline compiled templates for meaningful
 * // line numbers in error messages and a stack trace
 * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
 *   var JST = {\
   *     "main": ' + _.template(mainText).source + '\
   *   };\
 * ');
 */
function template(text, data, options) {
    // based on John Resig's `tmpl` implementation
    // http://ejohn.org/blog/javascript-micro-templating/
    // and Laura Doktorova's doT.js
    // https://github.com/olado/doT
    text || (text = '');

    options = defaults({}, options, settings);

    var imports = defaults({}, options.imports, settings.imports),
        importsKeys = keys(imports),
        importsValues = values(imports);

    var index = 0,
        interpolate = options.interpolate || reNoMatch,
        isEvaluating = false,
        source = "__p += '";

    // compile regexp to match each delimiter
    var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
            interpolate.source + '|' +
            (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
            (options.evaluate || reNoMatch).source + '|$'
        , 'g');

    text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
            source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
            source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
            source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        isEvaluating || (isEvaluating = evaluateValue || reComplexDelimiter.test(escapeValue || interpolateValue));
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
    });

    source += "';\n";

    // if `variable` is not specified and the template contains "evaluate"
    // delimiters, wrap a with-statement around the generated code to add the
    // data object to the top of the scope chain
    var variable = options.variable,
        hasVariable = variable;

    if (!hasVariable) {
        variable = 'obj';
        if (isEvaluating) {
            source = 'with (' + variable + ') {\n' + source + '\n}\n';
        }
        else {
            // avoid a with-statement by prepending data object references to property names
            var reDoubleVariable = RegExp('(\\(\\s*)' + variable + '\\.' + variable + '\\b', 'g');
            source = source
                .replace(reInsertVariable, '$&' + variable + '.')
                .replace(reDoubleVariable, '$1__d');
        }
    }

    // cleanup code by stripping empty strings
    source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

    // frame code as the function body
    source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = ''" +
        (isEvaluating
            ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
            : (hasVariable ? '' : ', __d = ' + variable + '.' + variable + ' || ' + variable) + ';\n'
            ) +
        source +
        'return __p\n}';

    try {
        var result = Function(importsKeys, 'return ' + source).apply(void 0, importsValues);
    } catch(e) {
        e.source = source;
        throw e;
    }
    if (data) {
        return result(data);
    }
    // provide the compiled function's source via its `toString` method, in
    // supported environments, or the `source` property as a convenience for
    // inlining compiled templates during the build process
    result.source = source;
    return result;
}


module.exports = template;
module.exports.settings = settings;

},{}],7:[function(require,module,exports){
var spa = require('spa'),
	settings = require('settings'),
	utils = require('utils'),
	isNextLocked, isPrevLocked;

function spaSwipeBlocker(event){
	event.stopPropagation();
}

if(spa.goto){
	exports.onenter = function(callback){
		document.addEventListener('slideenter', callback);
	};

	exports.onleave = function(callback){
		document.addEventListener('slideleave', callback);
	};

	exports.goto = function(options){
		exports.observer.publish("willGoto", options);
		spa.goto(options);
	};

	exports.nextSlide = function(){
		spa.nextSlide();
	};

	exports.previousSlide = function(){
		spa.previousSlide();
	};

	exports.openPopup = function(opts){
		spa.openPopup(opts);
	};

	exports.closePopup = function(){
		spa.closePopup();
	};

	exports.collectPopup = function(slides, slide){
		spa.collectPopup(slides, slide);
	};

	exports.lockNext = function(){
		if(!isNextLocked){
			document.addEventListener('swipeleft', spaSwipeBlocker, true);
			isNextLocked = true;
		}
	};

	exports.lockPrev = function(){
		if(!isPrevLocked){
			document.addEventListener('swiperight', spaSwipeBlocker, true);
			isPrevLocked = true;
		}
	};

	exports.unlockNext = function(){
		document.removeEventListener('swipeleft', spaSwipeBlocker, true);
		isNextLocked = false;
	};

	exports.unlockPrev = function(){
		document.removeEventListener('swiperight', spaSwipeBlocker, true);
		isPrevLocked = false;
	};


	exports.lock = function(callback){
		exports.lockNext();
		exports.lockPrev();
	};

	exports.unlock = function(callback){
		exports.unlockNext();
		exports.unlockPrev();
	};

	exports.close = function(){
		spa.viewport.dispatchSlideLeaveForCurrentSlide();
		parent.location.href = "components/nav/src/closedialog.html";
	};
}else{
	exports.onenter = function(callback){
		setTimeout(callback, 100);
	};

	exports.onleave = function(callback){
		window.addEventListener('unload', callback);
	};

	exports.goto = function(options){
		if(options.slide){
			exports.observer.publish("willGoto", options);
			location.href = options.slide + '.html';
		}
	};
}

// Do not delete 'top'. This is a fix to open pdf on eWizard-Mobile
exports.openDocument = function(path){
	if(window.top !== window){
		window.top.open(path, "_blank");
	}else{
		window.open(path, "_blank");
	}
};

exports.sendMail = function(options){
	var utils = require('utils'),
		mailString = 'mailto:{to}?subject={subject}&body={body}&attachment={attachment}';
	mailString = utils.template(mailString, options);
	window.open(mailString, '_blank');
};

exports.observer = new utils.Observer();
},{"settings":"settings","spa":"spa","utils":40}],8:[function(require,module,exports){
// in MPA (viseven - structure) params are read from slide frame

var targetWindow = window.isSPA ? window : parent,
	search = targetWindow.location.search,
	params = {};

search && search.slice(1).split("&").forEach(function(pair){
	pair = pair.split("=");
	params[pair[0]] = getTypedValue(decodeURIComponent(pair[1]));
});

function getTypedValue(str){
	try{
		return JSON.parse(str);
	}catch(e){
		return str;
	}
}

module.exports = params;
},{}],9:[function(require,module,exports){
module.exports = {
	weakmap: require('./src/weakMap'),
	mutationObserver: require('./src/mutationObserver'),
	customEvent: require('./src/customEvent'),
	animationFrame: require('./src/animationFrame'),
	file: require('./src/file'),
	text: require('./src/text'),
	dataview: require('./src/dataview'),
	promise: require('es6-promise').polyfill(),
	contains: require('./src/contains')
};
},{"./src/animationFrame":10,"./src/contains":11,"./src/customEvent":12,"./src/dataview":13,"./src/file":14,"./src/mutationObserver":15,"./src/text":16,"./src/weakMap":17,"es6-promise":4}],10:[function(require,module,exports){
(function () {
  var lastTime = 0

  if (!window.hasOwnProperty('requestAnimationFrame')) {
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime()
      var timeToCall = Math.max(0, 16 - (currTime - lastTime))
      var id = window.setTimeout(function () { callback(currTime + timeToCall) },
              timeToCall)
      lastTime = currTime + timeToCall
      return id
    }

    window.cancelAnimationFrame = function (id) {
      clearTimeout(id)
    }
  }
}())

},{}],11:[function(require,module,exports){
(function(){
	var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

	function contains(node) {
		if (!(0 in arguments)) {
			throw new TypeError('1 argument is required');
		}

		do {
			if (this === node) {
				return true;
			}
		} while (node = node && node.parentNode);

		return false;
	}

	if(isIE11){
		
		if ('HTMLElement' in this && 'contains' in HTMLElement.prototype) {
			try {
				delete HTMLElement.prototype.contains;
			} catch (e) {}
		}

		if ('Node' in this) {
			Node.prototype.contains = contains;
		} else {
			document.contains = Element.prototype.contains = contains;
		}

	}
})();
},{}],12:[function(require,module,exports){
(function(){
	if(typeof window.CustomEvent !== "function"){
		window.CustomEvent = function(event, params){
			var evt = document.createEvent('CustomEvent');
			params = params || { bubbles: false, cancelable: false, detail: undefined };
			evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
			return evt;
		}
		window.CustomEvent.prototype = Object.create(Event.prototype);
	}
})();
},{}],13:[function(require,module,exports){
(function(){
	if(typeof window.DataView !== "function"){
		window.DataView = function(){};
	}
})();
},{}],14:[function(require,module,exports){
(function(){
	if(typeof window.File !== "function"){
		window.File = function(){};
	}
})();
},{}],15:[function(require,module,exports){
/*
 * Copyright 2012 The Polymer Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(global) {

  var registrationsTable = new WeakMap();

  // We use setImmediate or postMessage for our future callback.
  var setImmediate = window.msSetImmediate;

  // Use post message to emulate setImmediate.
  if (!setImmediate) {
    var setImmediateQueue = [];
    var sentinel = String(Math.random());
    window.addEventListener('message', function(e) {
      if (e.data === sentinel) {
        var queue = setImmediateQueue;
        setImmediateQueue = [];
        queue.forEach(function(func) {
          func();
        });
      }
    });
    setImmediate = function(func) {
      setImmediateQueue.push(func);
      window.postMessage(sentinel, '*');
    };
  }

  // This is used to ensure that we never schedule 2 callas to setImmediate
  var isScheduled = false;

  // Keep track of observers that needs to be notified next time.
  var scheduledObservers = [];

  /**
   * Schedules |dispatchCallback| to be called in the future.
   * @param {MutationObserver} observer
   */
  function scheduleCallback(observer) {
    scheduledObservers.push(observer);
    if (!isScheduled) {
      isScheduled = true;
      setImmediate(dispatchCallbacks);
    }
  }

  function wrapIfNeeded(node) {
    return window.ShadowDOMPolyfill &&
        window.ShadowDOMPolyfill.wrapIfNeeded(node) ||
        node;
  }

  function dispatchCallbacks() {
    // http://dom.spec.whatwg.org/#mutation-observers

    isScheduled = false; // Used to allow a new setImmediate call above.

    var observers = scheduledObservers;
    scheduledObservers = [];
    // Sort observers based on their creation UID (incremental).
    observers.sort(function(o1, o2) {
      return o1.uid_ - o2.uid_;
    });

    var anyNonEmpty = false;
    observers.forEach(function(observer) {

      // 2.1, 2.2
      var queue = observer.takeRecords();
      // 2.3. Remove all transient registered observers whose observer is mo.
      removeTransientObserversFor(observer);

      // 2.4
      if (queue.length) {
        observer.callback_(queue, observer);
        anyNonEmpty = true;
      }
    });

    // 3.
    if (anyNonEmpty)
      dispatchCallbacks();
  }

  function removeTransientObserversFor(observer) {
    observer.nodes_.forEach(function(node) {
      var registrations = registrationsTable.get(node);
      if (!registrations)
        return;
      registrations.forEach(function(registration) {
        if (registration.observer === observer)
          registration.removeTransientObservers();
      });
    });
  }

  /**
   * This function is used for the "For each registered observer observer (with
   * observer's options as options) in target's list of registered observers,
   * run these substeps:" and the "For each ancestor ancestor of target, and for
   * each registered observer observer (with options options) in ancestor's list
   * of registered observers, run these substeps:" part of the algorithms. The
   * |options.subtree| is checked to ensure that the callback is called
   * correctly.
   *
   * @param {Node} target
   * @param {function(MutationObserverInit):MutationRecord} callback
   */
  function forEachAncestorAndObserverEnqueueRecord(target, callback) {
    for (var node = target; node; node = node.parentNode) {
      var registrations = registrationsTable.get(node);

      if (registrations) {
        for (var j = 0; j < registrations.length; j++) {
          var registration = registrations[j];
          var options = registration.options;

          // Only target ignores subtree.
          if (node !== target && !options.subtree)
            continue;

          var record = callback(options);
          if (record)
            registration.enqueue(record);
        }
      }
    }
  }

  var uidCounter = 0;

  /**
   * The class that maps to the DOM MutationObserver interface.
   * @param {Function} callback.
   * @constructor
   */
  function JsMutationObserver(callback) {
    this.callback_ = callback;
    this.nodes_ = [];
    this.records_ = [];
    this.uid_ = ++uidCounter;
  }

  JsMutationObserver.prototype = {
    observe: function(target, options) {
      target = wrapIfNeeded(target);

      // 1.1
      if (!options.childList && !options.attributes && !options.characterData ||

          // 1.2
          options.attributeOldValue && !options.attributes ||

          // 1.3
          options.attributeFilter && options.attributeFilter.length &&
              !options.attributes ||

          // 1.4
          options.characterDataOldValue && !options.characterData) {

        throw new SyntaxError();
      }

      var registrations = registrationsTable.get(target);
      if (!registrations)
        registrationsTable.set(target, registrations = []);

      // 2
      // If target's list of registered observers already includes a registered
      // observer associated with the context object, replace that registered
      // observer's options with options.
      var registration;
      for (var i = 0; i < registrations.length; i++) {
        if (registrations[i].observer === this) {
          registration = registrations[i];
          registration.removeListeners();
          registration.options = options;
          break;
        }
      }

      // 3.
      // Otherwise, add a new registered observer to target's list of registered
      // observers with the context object as the observer and options as the
      // options, and add target to context object's list of nodes on which it
      // is registered.
      if (!registration) {
        registration = new Registration(this, target, options);
        registrations.push(registration);
        this.nodes_.push(target);
      }

      registration.addListeners();
    },

    disconnect: function() {
      this.nodes_.forEach(function(node) {
        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          var registration = registrations[i];
          if (registration.observer === this) {
            registration.removeListeners();
            registrations.splice(i, 1);
            // Each node can only have one registered observer associated with
            // this observer.
            break;
          }
        }
      }, this);
      this.records_ = [];
    },

    takeRecords: function() {
      var copyOfRecords = this.records_;
      this.records_ = [];
      return copyOfRecords;
    }
  };

  /**
   * @param {string} type
   * @param {Node} target
   * @constructor
   */
  function MutationRecord(type, target) {
    this.type = type;
    this.target = target;
    this.addedNodes = [];
    this.removedNodes = [];
    this.previousSibling = null;
    this.nextSibling = null;
    this.attributeName = null;
    this.attributeNamespace = null;
    this.oldValue = null;
  }

  function copyMutationRecord(original) {
    var record = new MutationRecord(original.type, original.target);
    record.addedNodes = original.addedNodes.slice();
    record.removedNodes = original.removedNodes.slice();
    record.previousSibling = original.previousSibling;
    record.nextSibling = original.nextSibling;
    record.attributeName = original.attributeName;
    record.attributeNamespace = original.attributeNamespace;
    record.oldValue = original.oldValue;
    return record;
  };

  // We keep track of the two (possibly one) records used in a single mutation.
  var currentRecord, recordWithOldValue;

  /**
   * Creates a record without |oldValue| and caches it as |currentRecord| for
   * later use.
   * @param {string} oldValue
   * @return {MutationRecord}
   */
  function getRecord(type, target) {
    return currentRecord = new MutationRecord(type, target);
  }

  /**
   * Gets or creates a record with |oldValue| based in the |currentRecord|
   * @param {string} oldValue
   * @return {MutationRecord}
   */
  function getRecordWithOldValue(oldValue) {
    if (recordWithOldValue)
      return recordWithOldValue;
    recordWithOldValue = copyMutationRecord(currentRecord);
    recordWithOldValue.oldValue = oldValue;
    return recordWithOldValue;
  }

  function clearRecords() {
    currentRecord = recordWithOldValue = undefined;
  }

  /**
   * @param {MutationRecord} record
   * @return {boolean} Whether the record represents a record from the current
   * mutation event.
   */
  function recordRepresentsCurrentMutation(record) {
    return record === recordWithOldValue || record === currentRecord;
  }

  /**
   * Selects which record, if any, to replace the last record in the queue.
   * This returns |null| if no record should be replaced.
   *
   * @param {MutationRecord} lastRecord
   * @param {MutationRecord} newRecord
   * @param {MutationRecord}
   */
  function selectRecord(lastRecord, newRecord) {
    if (lastRecord === newRecord)
      return lastRecord;

    // Check if the the record we are adding represents the same record. If
    // so, we keep the one with the oldValue in it.
    if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
      return recordWithOldValue;

    return null;
  }

  /**
   * Class used to represent a registered observer.
   * @param {MutationObserver} observer
   * @param {Node} target
   * @param {MutationObserverInit} options
   * @constructor
   */
  function Registration(observer, target, options) {
    this.observer = observer;
    this.target = target;
    this.options = options;
    this.transientObservedNodes = [];
  }

  Registration.prototype = {
    enqueue: function(record) {
      var records = this.observer.records_;
      var length = records.length;

      // There are cases where we replace the last record with the new record.
      // For example if the record represents the same mutation we need to use
      // the one with the oldValue. If we get same record (this can happen as we
      // walk up the tree) we ignore the new record.
      if (records.length > 0) {
        var lastRecord = records[length - 1];
        var recordToReplaceLast = selectRecord(lastRecord, record);
        if (recordToReplaceLast) {
          records[length - 1] = recordToReplaceLast;
          return;
        }
      } else {
        scheduleCallback(this.observer);
      }

      records[length] = record;
    },

    addListeners: function() {
      this.addListeners_(this.target);
    },

    addListeners_: function(node) {
      var options = this.options;
      if (options.attributes)
        node.addEventListener('DOMAttrModified', this, true);

      if (options.characterData)
        node.addEventListener('DOMCharacterDataModified', this, true);

      if (options.childList)
        node.addEventListener('DOMNodeInserted', this, true);

      if (options.childList || options.subtree)
        node.addEventListener('DOMNodeRemoved', this, true);
    },

    removeListeners: function() {
      this.removeListeners_(this.target);
    },

    removeListeners_: function(node) {
      var options = this.options;
      if (options.attributes)
        node.removeEventListener('DOMAttrModified', this, true);

      if (options.characterData)
        node.removeEventListener('DOMCharacterDataModified', this, true);

      if (options.childList)
        node.removeEventListener('DOMNodeInserted', this, true);

      if (options.childList || options.subtree)
        node.removeEventListener('DOMNodeRemoved', this, true);
    },

    /**
     * Adds a transient observer on node. The transient observer gets removed
     * next time we deliver the change records.
     * @param {Node} node
     */
    addTransientObserver: function(node) {
      // Don't add transient observers on the target itself. We already have all
      // the required listeners set up on the target.
      if (node === this.target)
        return;

      this.addListeners_(node);
      this.transientObservedNodes.push(node);
      var registrations = registrationsTable.get(node);
      if (!registrations)
        registrationsTable.set(node, registrations = []);

      // We know that registrations does not contain this because we already
      // checked if node === this.target.
      registrations.push(this);
    },

    removeTransientObservers: function() {
      var transientObservedNodes = this.transientObservedNodes;
      this.transientObservedNodes = [];

      transientObservedNodes.forEach(function(node) {
        // Transient observers are never added to the target.
        this.removeListeners_(node);

        var registrations = registrationsTable.get(node);
        for (var i = 0; i < registrations.length; i++) {
          if (registrations[i] === this) {
            registrations.splice(i, 1);
            // Each node can only have one registered observer associated with
            // this observer.
            break;
          }
        }
      }, this);
    },

    handleEvent: function(e) {
      // Stop propagation since we are managing the propagation manually.
      // This means that other mutation events on the page will not work
      // correctly but that is by design.
      e.stopImmediatePropagation();

      switch (e.type) {
        case 'DOMAttrModified':
          // http://dom.spec.whatwg.org/#concept-mo-queue-attributes

          var name = e.attrName;
          var namespace = e.relatedNode.namespaceURI;
          var target = e.target;

          // 1.
          var record = new getRecord('attributes', target);
          record.attributeName = name;
          record.attributeNamespace = namespace;

          // 2.
          var oldValue =
              e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;

          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 3.1, 4.2
            if (!options.attributes)
              return;

            // 3.2, 4.3
            if (options.attributeFilter && options.attributeFilter.length &&
                options.attributeFilter.indexOf(name) === -1 &&
                options.attributeFilter.indexOf(namespace) === -1) {
              return;
            }
            // 3.3, 4.4
            if (options.attributeOldValue)
              return getRecordWithOldValue(oldValue);

            // 3.4, 4.5
            return record;
          });

          break;

        case 'DOMCharacterDataModified':
          // http://dom.spec.whatwg.org/#concept-mo-queue-characterdata
          var target = e.target;

          // 1.
          var record = getRecord('characterData', target);

          // 2.
          var oldValue = e.prevValue;


          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 3.1, 4.2
            if (!options.characterData)
              return;

            // 3.2, 4.3
            if (options.characterDataOldValue)
              return getRecordWithOldValue(oldValue);

            // 3.3, 4.4
            return record;
          });

          break;

        case 'DOMNodeRemoved':
          this.addTransientObserver(e.target);
          // Fall through.
        case 'DOMNodeInserted':
          // http://dom.spec.whatwg.org/#concept-mo-queue-childlist
          var target = e.relatedNode;
          var changedNode = e.target;
          var addedNodes, removedNodes;
          if (e.type === 'DOMNodeInserted') {
            addedNodes = [changedNode];
            removedNodes = [];
          } else {

            addedNodes = [];
            removedNodes = [changedNode];
          }
          var previousSibling = changedNode.previousSibling;
          var nextSibling = changedNode.nextSibling;

          // 1.
          var record = getRecord('childList', target);
          record.addedNodes = addedNodes;
          record.removedNodes = removedNodes;
          record.previousSibling = previousSibling;
          record.nextSibling = nextSibling;

          forEachAncestorAndObserverEnqueueRecord(target, function(options) {
            // 2.1, 3.2
            if (!options.childList)
              return;

            // 2.2, 3.3
            return record;
          });

      }

      clearRecords();
    }
  };

  global.JsMutationObserver = JsMutationObserver;

  if (!global.MutationObserver)
    global.MutationObserver = JsMutationObserver;


// })(this);
})(window);
},{}],16:[function(require,module,exports){
(function(){
	if(typeof window.Text !== "function"){
		window.Text = function(){};
	}
})();
},{}],17:[function(require,module,exports){
/*
 * Copyright 2012 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

if (typeof WeakMap === 'undefined') {
  (function() {
    var defineProperty = Object.defineProperty;
    var counter = Date.now() % 1e9;

    var WeakMap = function() {
      this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
    };

    WeakMap.prototype = {
      set: function(key, value) {
        var entry = key[this.name];
        if (entry && entry[0] === key)
          entry[1] = value;
        else
          defineProperty(key, this.name, {value: [key, value], writable: true});
      },
      get: function(key) {
        var entry;
        return (entry = key[this.name]) && entry[0] === key ?
            entry[1] : undefined;
      },
      delete: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        var hasValue = entry[0] === key;
        entry[0] = entry[1] = undefined;
        return hasValue;
      },
      has: function(key) {
        var entry = key[this.name];
        if (!entry) return false;
        return entry[0] === key;
      }
    };

    window.WeakMap = WeakMap;
  })();
}
},{}],18:[function(require,module,exports){
function getSupportedProperty(featureName){
	var domPrefixes = 'Webkit Moz ms O'.split(' '),
		element = document.createElement('div'),
		featurenameCapital;

	if(element.style[featureName] !== undefined){
		return featureName;
	}else{
		featurenameCapital = featureName.charAt(0).toUpperCase() + featureName.substr(1);
		for(var i = 0; i < domPrefixes.length; i++){
			if(element.style[domPrefixes[i] + featurenameCapital] !== undefined){
				return domPrefixes[i] + featurenameCapital;
			}
		}
	}
	return featureName;
}

function getSupportedEvent(map){
	var element = document.createElement('div');

	for(var key in map){
		if(map.hasOwnProperty(key) && element.style[key] !== undefined){
			return map[key];
		}
	}
}

exports.getSupportedProperty = getSupportedProperty;

exports.setStyle = function(element, property, value){
	element.style[getSupportedProperty(property)] = value;
};

exports.events = {
	transitionend: getSupportedEvent({
		'transition'       : 'transitionend',
		'WebkitTransition' : 'webkitTransitionEnd'
	}),
	animationend: getSupportedEvent({
		'animation'       : 'animationend',
		'WebkitAnimation' : 'webkitAnimationEnd'
	}),
	animationstart: getSupportedEvent({
		'animation'       : 'animationstart',
		'WebkitAnimation' : 'webkitAnimationStart'
	})
};

},{}],19:[function(require,module,exports){
var settings = require('settings');

module.exports = settings.id || settings.name;
},{"settings":"settings"}],20:[function(require,module,exports){
/*!
 * routie - a tiny hash router
 * v0.3.2
 * http://projects.jga.me/routie
 * copyright Greg Allen 2014
 * MIT License
*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['exports'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		module.exports = factory(window);
	} else {
		// Browser globals
		root.routie = factory(window);
	}
}(typeof window !== "undefined" ? window : this, function (w){
	var routes = [];
	var map = {};

	var Route = function(path, name) {
		this.name = name;
		this.path = path;
		this.keys = [];
		this.fns = [];
		this.params = {};
		this.regex = pathToRegexp(this.path, this.keys, false, false);

	};

	Route.prototype.addHandler = function(fn) {
		this.fns.push(fn);
	};

	Route.prototype.removeHandler = function(fn) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			var f = this.fns[i];
			if (fn == f) {
				this.fns.splice(i, 1);
				return;
			}
		}
	};

	Route.prototype.run = function(params) {
		for (var i = 0, c = this.fns.length; i < c; i++) {
			this.fns[i].apply(this, params);
		}
	};

	Route.prototype.match = function(path, params){
		var m = this.regex.exec(path);

		if (!m) return false;


		for (var i = 1, len = m.length; i < len; ++i) {
			var key = this.keys[i - 1];

			var val = ('string' == typeof m[i]) ? decodeURIComponent(m[i]) : m[i];

			if (key) {
				this.params[key.name] = val;
			}
			params.push(val);
		}

		return true;
	};

	Route.prototype.toURL = function(params) {
		var path = this.path;
		for (var param in params) {
			path = path.replace('/:'+param, '/'+params[param]);
		}
		path = path.replace(/\/:.*\?/g, '/').replace(/\?/g, '');
		if (path.indexOf(':') != -1) {
			throw new Error('missing parameters for url: '+path);
		}
		return path;
	};

	var pathToRegexp = function(path, keys, sensitive, strict) {
		if (path instanceof RegExp) return path;
		if (path instanceof Array) path = '(' + path.join('|') + ')';
		path = path
			.concat(strict ? '' : '/?')
			.replace(/\/\(/g, '(?:/')
			.replace(/\+/g, '__plus__')
			.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
				keys.push({ name: key, optional: !! optional });
				slash = slash || '';
				return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
			})
			.replace(/([\/.])/g, '\\$1')
			.replace(/__plus__/g, '(.+)')
			.replace(/\*/g, '(.*)');
		return new RegExp('^' + path + '$', sensitive ? '' : 'i');
	};

	var addHandler = function(path, fn) {
		var s = path.split(' ');
		var name = (s.length == 2) ? s[0] : null;
		path = (s.length == 2) ? s[1] : s[0];

		if (!map[path]) {
			map[path] = new Route(path, name);
			routes.push(map[path]);
		}
		map[path].addHandler(fn);
	};

	var routie = function(path, fn) {
		if (typeof fn == 'function') {
			addHandler(path, fn);
			routie.reload();
		} else if (typeof path == 'object') {
			for (var p in path) {
				addHandler(p, path[p]);
			}
			routie.reload();
		} else if (typeof fn === 'undefined') {
			routie.navigate(path);
		}
	};

	routie.lookup = function(name, obj) {
		for (var i = 0, c = routes.length; i < c; i++) {
			var route = routes[i];
			if (route.name == name) {
				return route.toURL(obj);
			}
		}
	};

	routie.remove = function(path, fn) {
		var route = map[path];
		if (!route)
			return;
		route.removeHandler(fn);
	};

	routie.removeAll = function() {
		map = {};
		routes = [];
	};

	routie.navigate = function(path, options) {
		options = options || {};
		var silent = options.silent || false;

		if (silent) {
			removeListener();
		}
		setTimeout(function() {
			window.location.hash = path;

			if (silent) {
				setTimeout(function() {
					addListener();
				}, 1);
			}

		}, 1);
	};

	routie.noConflict = function() {
		return routie;
	};

	var getHash = function() {
		return window.location.hash.substring(1);
	};

	var checkRoute = function(hash, route) {
		var params = [];
		if (route.match(hash, params)) {
			route.run(params);
			return true;
		}
		return false;
	};

	var hashChanged = routie.reload = function() {
		var hash = getHash();
		for (var i = 0, c = routes.length; i < c; i++) {
			var route = routes[i];
			if (checkRoute(hash, route)) {
				return;
			}
		}
	};

	var addListener = function() {
		if (w.addEventListener) {
			w.addEventListener('hashchange', hashChanged, false);
		} else {
			w.attachEvent('onhashchange', hashChanged);
		}
	};

	var removeListener = function() {
		if (w.removeEventListener) {
			w.removeEventListener('hashchange', hashChanged);
		} else {
			w.detachEvent('onhashchange', hashChanged);
		}
	};
	addListener();

	return routie;

}));

},{}],21:[function(require,module,exports){
var utils = require('utils')
var interpolate = require('./interpolate')

function getExternalChapterId(structure, chapter) {
  if (chapter) {
    return structure.chapters[chapter] ? structure.chapters[chapter].chapterExternalId : ''
  }
}

function getChapter(structure, slideId) {
  var chapterId = Object.keys(structure.chapters)
    .find(function (chapter) {
      return structure.chapters[chapter].content.includes(slideId) || structure.chapters[chapter].content.includes('!' + slideId)
    })

  if (chapterId) {
    return Object.assign({}, structure.chapters[chapterId], {
      id: chapterId
    })
  }

  return {}
}

function mixinIrepFormat(settings, irepFormat) {
  irepFormat = irepFormat || 'crm'
  var mixinedSettings = Object.assign({}, settings)

  if (mixinedSettings.clms && mixinedSettings.clms.irep && typeof mixinedSettings.clms.irep[irepFormat] === 'object') {
    Object.keys(mixinedSettings.clms.irep[irepFormat]).map(function (key) {
      if (key !== 'sharedResourceName') {
        mixinedSettings.clms.irep[key] = mixinedSettings.clms.irep[irepFormat][key]
      }
    })
  }

  return mixinedSettings
}

module.exports = function (settings, structure) {
  function createTemplate(slideId) {
    var chapter = getChapter(structure, slideId) || {
      id: '',
      chapterExternalId: ''
    }
    var slideIndex = chapter && chapter.content && chapter.content.indexOf(slideId) + 1
    var chapterIndex = (chapter && chapter.index) || structure.storyboard.indexOf(chapter.id) + 1

    chapter.chapterExternalId = chapter.chapterExternalId || chapter.id
    return {
      settings: settings,
      structure: {
        slide: utils.mixin({
          id: slideId,
          index: slideIndex
        }, structure.slides[slideId] || {}),
        chapter: utils.mixin({
          id: chapter.id,
          index: chapterIndex
        }, chapter || {})
      }
    }
  }

  return {
    slide: function slide(slideId, irepFormat) {
      var interpolatedSettings = slideId ? interpolate(settings, createTemplate(slideId)) :
        settings
      return mixinIrepFormat(interpolatedSettings, irepFormat)
    },
    createTemplate: createTemplate,
    getClmPresentationSettings: function (options) {
      var mixinedFormatSettings = mixinIrepFormat(settings, options.irepFormat)
      var existClmPresentation = mixinedFormatSettings.clms && mixinedFormatSettings.clms[options.clm] && mixinedFormatSettings.clms[options.clm].presentation

      return existClmPresentation ? interpolateSettings(settings, options.irepFormat).clms[options.clm].presentation : {}
    },
    interpolateSettings: function (settings) {
      return interpolate(settings, {
        settings: settings
      }, irepFormat)
    },
    template: function (options) {
      var chapter = structure.chapters[options.chapter]
      var slideIndex = chapter && chapter.content && chapter.content.indexOf(options.slide) + 1
      var chapterIndex = (chapter && chapter.index) || structure.storyboard.indexOf(options.chapter) + 1

      var dynamicSettings = interpolate(settings, {
        settings: settings,
        structure: {
          slide: utils.mixin({
            id: options.slide,
            index: slideIndex
          }, structure.slides[options.slide] || {}),
          chapter: utils.mixin({
            id: options.chapter,
            index: chapterIndex
          }, chapter || {})
        }
      })

      dynamicSettings.clms = dynamicSettings.clms || {}
      dynamicSettings.clms.irep = dynamicSettings.clms.irep || {}

      dynamicSettings = mixinIrepFormat(dynamicSettings, options.irepFormat)

      dynamicSettings.clms.irep.chapterExternalId = dynamicSettings.clms.irep.chapterExternalId || getExternalChapterId(structure, options.chapter)

      return dynamicSettings
    },
    allSlides: function allSlides() {
      return this.getStructureSlides().map(slide)
    },
    getStructureSlides: function getStructureSlides() {
      return Object.keys(structure.slides)
    }
  }
}

},{"./interpolate":23,"utils":40}],22:[function(require,module,exports){
// implementation is copied from npm module 'dot-prop' which is not available for installation via bower

module.exports = function (obj, path, value) {
  if (!isObj(obj) || typeof path !== 'string') {
    return obj
  }

  var pathArr = getPathSegments(path)

  for (var i = 0; i < pathArr.length; i++) {
    if (!Object.prototype.propertyIsEnumerable.call(obj, pathArr[i])) {
      return value
    }

    obj = obj[pathArr[i]]

    if (obj === undefined || obj === null) {
      if (i !== pathArr.length - 1) {
        return value
      }

      break
    }
  }

  return obj
}

function getPathSegments (path) {
  var pathArr = path.split('.')
  var parts = []

  for (var i = 0; i < pathArr.length; i++) {
    var p = pathArr[i]

    while (p[p.length - 1] === '\\' && pathArr[i + 1] !== undefined) {
      p = p.slice(0, -1) + '.'
      p += pathArr[++i]
    }

    parts.push(p)
  }

  return parts
}

function isObj (x) {
  var type = typeof x
  return x !== null && (type === 'object' || type === 'function')
}

},{}],23:[function(require,module,exports){
var template = require('lodash-template')
var getValueByKeypath = require('./get-by-keypath')

module.exports = function (obj, data) {
  var ROOT_KEYPATH = 'settings'
  var keypathStack = []
  var objCopy = copyObject(obj)

  data[ROOT_KEYPATH] = objCopy

  return processObject(objCopy, data, ROOT_KEYPATH, keypathStack)
}

function processObject(obj, data, keypath, keypathStack) {
  return Object.keys(obj).reduce(function (result, key) {
    var value = obj[key]
    var templateDelimiter = /\{([^\}]+)\}/

    if (isString(value)) {
      keypathStack = [concatKeypath(keypath, key)]
      result[key] = processString(value, data, templateDelimiter, keypathStack)
    } else if (isObject(value)) {
      result[key] = processObject(value, data, concatKeypath(keypath, key), keypathStack)
    }

    return result
  }, obj);
}

function processString(string, data, delimiter, keypathStack) {
  var match = string.match(delimiter)

  if (!match) {
    return string
  }

  var nextKeypath = match[1]
  var startingKeypath = keypathStack[0]

  string = applyMasks(string, data)

  if (keypathStack.indexOf(nextKeypath) >= 0) {
    return getValueByKeypath(data, startingKeypath)
  }

  keypathStack.push(nextKeypath)

  try {
    return processString(template(string, data, {
      interpolate: delimiter
    }), data, delimiter, keypathStack)
  } catch (err) {
    return string
  }
}

function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function isString(value) {
  return typeof value === 'string'
}

function isObject(value) {
  return typeof value === 'object'
}

function concatKeypath(keypath, key) {
  return keypath + '.' + key
}

function applyMasks(string, data) {
  var allKeypaths = string.match(/\{([^\}]+)\}/g)

  allKeypaths.forEach(function (keypath) {
    if (hasMask(keypath)) {
      var newKeypath = randomstring();
      var maskedKeyRE = /{(.+)\|(.+)}/
      var match = keypath.match(maskedKeyRE)
      var keypathWithoutMask = match[1]
      var mask = match[2]
      var value = getValueByKeypath(data, keypathWithoutMask)
      var stringifiedValue = value === undefined ? '' : value.toString()
      data[newKeypath] = applyMask(mask, stringifiedValue)
      string = string.replace(keypath, '{' + newKeypath + '}')
    };
  })

  return string
}

function hasMask(string) {
  return string.split('|').length === 2
}

function applyMask(mask, value) {
  var match = mask.match(/#+/)

  if (match && value.length <= match[0].length) {
    return mask.replace(match[0], value.padStart(match[0].length, '0'))
  }

  return value
}

function randomstring() {
  var length = 8
  var alphabet = 'abcdefghijklmnopqrstuvwxyz'
  var string = ''

  for (var i = 0; i < length; i++) {
    string += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return string
}

},{"./get-by-keypath":22,"lodash-template":6}],24:[function(require,module,exports){
var spa = require('spa');

exports.id = location.pathname.split(/\/+/).pop().slice(0, -5);
// structure id
exports.sid = spa.current ? getSPASid() : exports.id;

function getSPASid(){
	var popupViews = spa.popupViews,
		sid = spa.current.slide.id;

	if(popupViews.length){
		sid = popupViews[popupViews.length - 1].slide;
	}

	return sid;
}
},{"spa":"spa"}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.SlideshowPopup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('utils');

var utils = _interopRequireWildcard(_utils);

var _structure = require('structure');

var _structure2 = _interopRequireDefault(_structure);

var _settings = require('settings');

var _settings2 = _interopRequireDefault(_settings);

var _nav = require('nav');

var _nav2 = _interopRequireDefault(_nav);

var _slide = require('slide');

var _presentationIdentifier = require('presentation-identifier');

var _presentationIdentifier2 = _interopRequireDefault(_presentationIdentifier);

var _validateNav = require('validate-nav');

var _validateNav2 = _interopRequireDefault(_validateNav);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var storageKey = _presentationIdentifier2.default + 'SlideshowPopup';

var SlideshowPopup = exports.SlideshowPopup = function () {
	function SlideshowPopup() {
		var _this = this;

		_classCallCheck(this, SlideshowPopup);

		this.chapters = [];
		this.history = [];
		this.number = 0;
		this.load();

		_nav2.default.onenter(this.load.bind(this));

		_nav2.default.observer.subscribe("willGoto", function (options) {
			!options.presentation && _validateNav2.default.validate(options);
			if (_this.isExitingDynamicChapters(options)) {
				_this.clearHistory();
			}
		});
	}

	_createClass(SlideshowPopup, [{
		key: 'collectPopup',
		value: function collectPopup(slides, slide) {
			var newChapter = {
				id: 'dynamic-content-' + (this.number + 1),
				name: 'Dynamic Content ' + (this.number + 1),
				content: slides,
				collected: true
			};

			_structure2.default.chapters[newChapter.id] = newChapter;
			_structure2.default.publish('update');

			this.openPopup({ chapter: newChapter.id, slide: slide });
		}
	}, {
		key: 'openPopup',
		value: function openPopup(options) {
			this.insertChapter(_structure2.default.chapters[options.chapter]);
			this.save();

			_nav2.default.goto(options);
		}
	}, {
		key: 'closePopup',
		value: function closePopup() {
			_nav2.default.goto(this.history.pop());
		}
	}, {
		key: 'clearStructure',
		value: function clearStructure() {
			var chapter = this.chapters.pop();
			if (chapter.collected) {
				delete _structure2.default.chapters[chapter.id];
				_structure2.default.publish('update');
			}
			this.number--;
			this.save();
		}
	}, {
		key: 'clearHistory',
		value: function clearHistory() {
			while (!!this.chapters.length) {
				this.clearStructure();
			}
			this.history = [];
			this.save();
		}
	}, {
		key: 'isPopup',
		value: function isPopup() {
			return !!this.history.length;
		}
	}, {
		key: 'isExitingDynamicChapters',
		value: function isExitingDynamicChapters(options) {
			if (!this.chapters.length) {
				return false;
			}
			return options.chapter !== require('chapter').local.id && !_structure2.default.chapters[options.chapter].collected;
		}
	}, {
		key: 'getCurrentPopupChapter',
		value: function getCurrentPopupChapter() {
			return this.chapters[this.chapters.length - 1];
		}
	}, {
		key: 'insertChapter',
		value: function insertChapter(chapter) {
			this.chapters.push(chapter);
			this.history.push({ slide: _slide.sid, chapter: require('chapter').local.id });
			this.number++;
		}
	}, {
		key: 'save',
		value: function save() {
			sessionStorage.setItem(storageKey, JSON.stringify(this));
		}
	}, {
		key: 'load',
		value: function load() {
			utils.mixin(this, JSON.parse(sessionStorage.getItem(storageKey)) || {});
		}
	}]);

	return SlideshowPopup;
}();
},{"chapter":3,"nav":7,"presentation-identifier":19,"settings":"settings","slide":24,"structure":"structure","utils":40,"validate-nav":44}],26:[function(require,module,exports){
var SlideshowPopup = require('./dist/js/slideshow-popup').SlideshowPopup;

module.exports = new SlideshowPopup();
},{"./dist/js/slideshow-popup":25}],27:[function(require,module,exports){
var ViewPort = require('./viewport.js').ViewPort
var routie = require('routie')
var structure = require('structure')
var params = require('params')
var utils = require('utils')
var settings = require('settings')

var getFirstEnabledSlide = require('./utils').getFirstEnabledSlide
var getFirstNotEmptyChapter = require('./utils').getFirstNotEmptyChapter
var isEnableSlide = require('./utils').isEnableSlide;

var NEXT = 'next'
var PREV = 'prev'

var DIRECTIONS = {
  'horizontal': {
    prev: 'left',
    next: 'right'
  },
  'vertical': {
    prev: 'up',
    next: 'down'
  }
}

//This constant has to be synchronized with the same one in module 'build-nav', 'mitouch-spa/index.js' file.
var launchOptionsKey = 'presentationLaunchOptions'

function Navigator (viewId) {
  this.viewport = new ViewPort(document.getElementById(viewId))
  this.popupViews = []
  this.collectedPopupsCount = 0
  this.current = {}
  this.storage = {}

  this.viewport.subscribe('slidechange', function () {
    var currentFrame = this.viewport.currentFrame

    this.current.chapter = structure.chapters[this.viewport.chapter]
    this.current.slide = {
      id: this.viewport.slide,
      element: currentFrame.element,
      frame: currentFrame.iframe
    }
    this.current.index = this.viewport.index

    this.changing = true
    this.routeTo({chapter: this.viewport.chapter, slide: this.viewport.slide})
  }.bind(this))

  this.popupLeave = this.closePopup.bind(this)
  this.addLoader()

  this.start()
}

Navigator.prototype.start = function () {
  var firstChapterId, firstSlideId
  var launchOptions, startChapter, startSlide

  routie('/:chapter/:slide?', function (chapter, slide) {
    if (!this.changing) {
      this.viewport.start({chapter: chapter, slide: slide})
    }

    this.changing = false
  }.bind(this))

  if (hasLaunchOptions()) {
    launchOptions = getLaunchOptions()

    removeLaunchOptions()

    startChapter = launchOptions.chapter
    startSlide = launchOptions.slide
  }

  if (!this.current.slide) {
    var presentationStart = getStart(startChapter, startSlide, structure);

    this.viewport.start(this.getSlidesData(presentationStart.chapter, presentationStart.slide))
  }
}

Navigator.prototype.getSlidesData = function(chapter, slide){
  if(params.callNumber){
    return this.getStartSlideDataForScenarios();
  }

  if(params.division && structure.chapters[params.division]){
    return this.getFirstSlideByChapter(params.division);
  }

  return {
    chapter: chapter,
    slide: slide
  };
}

Navigator.prototype.getStartSlideDataForScenarios = function(){
  var chapterId = params.callNumber,
    visitMode = params.visitMode;

  if(visitMode === 'short'){
    return this.getFirstSlideDataByDivision(chapterId, visitMode);
  }

  return {
    slide: structure.chapters[chapterId].content[0],
    chapter: chapterId.toString()
  }
}

Navigator.prototype.getFirstSlideDataByDivision = function(chapterId, visitMode){
  var visitChapterId = [chapterId, visitMode].join('_');

  return {
    slide: structure.chapters[visitChapterId].content[0],
    chapter: visitChapterId
  }
}

Navigator.prototype.getFirstSlideByChapter = function(chapterId){
  return {
    slide: structure.chapters[chapterId].content[0],
    chapter: chapterId
  }
}

function getStart (launchChapter, launchSlide, structure) {
  var startChapter = launchChapter || (isStart(structure) && structure.start.chapter);
  var startSlide = launchSlide || (isStart(structure) && structure.start.slide);
  
  if (!startChapter && !startSlide) {
    return getAvailableChapter(structure);
  }

  if (startChapter && !chapterExists(startChapter, structure)) {
    return getAvailableChapter(structure);
  }

  if (startChapter && emptyChapter(startChapter, structure)) {
    return getAvailableChapter(structure, startChapter);
  }

  if (startChapter && startSlide) {
    return {
      chapter: startChapter,
      slide: structure.chapters[startChapter].content.includes(startSlide) ? startSlide : getFirstEnabledSlide(structure, startChapter)
    }
  }

  return getStartBySlide(startSlide, structure);
}

function getStartBySlide (slide, structure) {
  if (!structure.slides[slide]) {
    return getAvailableChapter(structure);
  }
  return {
    slide: slide
  };
}

function getAvailableChapter (structure, startChapter) {
  var chapter = getFirstNotEmptyChapter(structure, startChapter);
  return {
    chapter: chapter,
    slide: getFirstEnabledSlide(structure, chapter)
  };
}

function chapterExists (chapter, structure) {
  return !!structure.chapters[chapter] && structure.storyboard.includes(chapter);
}

function emptyChapter (chapter, structure) {
  var chapterSlides = structure.chapters[chapter].content.filter(isEnableSlide);
  return !chapterSlides.length;
}

function isStart (structure) {
  return structure.start && !!Object.keys(structure.start).length
}

function getLaunchOptions() {
  var launchOptions = sessionStorage.getItem(launchOptionsKey)
  if (launchOptions) {
    return JSON.parse(launchOptions);
  }
}

function removeLaunchOptions() {
  sessionStorage.removeItem(launchOptionsKey)
}

function hasLaunchOptions() {
  var launchOptions = getLaunchOptions();
  return !!launchOptions;
}


Navigator.prototype.goto = function (options) {
  var popupView = this.popupViews.length && this.getLastPopupView()

  if (popupView && popupView.chapter === options.chapter) {
    popupView.goto(options)
  } else {
    this.viewport.goto(options)
  }
}

Navigator.prototype.isPopup = function () {
  return !!this.popupViews.length
}

Navigator.prototype.nextChapter = function () {
  this.viewport.goToSibling(DIRECTIONS[this.viewport.chapterDirection][NEXT])
}

Navigator.prototype.previousChapter = function () {
  this.viewport.goToSibling(DIRECTIONS[this.viewport.chapterDirection][PREV])
}

Navigator.prototype.nextSlide = function () {
  this.viewport.goToSibling(DIRECTIONS[this.viewport.slideDirection][NEXT])
}

Navigator.prototype.previousSlide = function () {
  this.viewport.goToSibling(DIRECTIONS[this.viewport.slideDirection][PREV])
}

Navigator.prototype.moveRight = function () {
  this.viewport.goToSibling('right')
}

Navigator.prototype.moveLeft = function () {
  this.viewport.goToSibling('left')
}

Navigator.prototype.moveDown = function () {
  this.viewport.goToSibling('down')
}

Navigator.prototype.moveUp = function () {
  this.viewport.goToSibling('up')
}

Navigator.prototype.routeTo = function (options) {
  routie('/' + options.chapter + '/' + (options.slide || ''))
}

Navigator.prototype.getCurrentViewPort = function () {
  return this.popupViews.length ? this.getLastPopupView() : this.viewport
}

Navigator.prototype.getLastPopupView = function () {
  return this.popupViews[this.popupViews.length - 1];
}

Navigator.prototype.createPopup = function (options, parameters) {
  var popupElement
  var popupViewPort
  parameters = parameters || {}

  this.getCurrentViewPort().dispatchSlideLeaveForCurrentSlide()

  parameters.isPopup = true
  popupElement = document.createElement('div')
  popupViewPort = new ViewPort(popupElement, parameters)

  popupElement.className = 'popup loaded'

  this.viewport.subscribe('slidechange', this.popupLeave)

  this.pushPopupView(popupViewPort)
  document.body.appendChild(popupElement)

  utils.once(document, 'slideenter', function() {
    popupElement.className = 'popup'
	popupViewPort.dispatchSlideEvent('open-collect-popup', popupViewPort.frames.current)
  })
  popupViewPort.goto(options)
}

Navigator.prototype.openPopup = function (options) {
  if (validateChapter(options.chapter)) {
    this.createPopup(options)
  } else {
    console.log('Popup has incorrect structure.')
  }
}

function validateChapter (chapterId) {
  var chapter = structure.chapters[chapterId]
  return chapter && validateContent(chapter.content)
}

function validateContent (content) {
  return content.every(function (slide) {
    return structure.slides[slide]
  })
}

Navigator.prototype.closePopup = function () {
  var popupViewPort = this.popPopupView()

  if (popupViewPort) {
    popupViewPort.dispatchSlideEvent('close-collect-popup', popupViewPort.frames.current);
    popupViewPort.dispatchSlideEvent('slideleave', popupViewPort.frames.current)

    popupViewPort.element.parentNode.removeChild(popupViewPort.element)
    if (popupViewPort.isCollectPopup) {
      delete structure.chapters[popupViewPort.chapter];
    }
  }

  this.getCurrentViewPort().dispatchSlideEnterToCurrentSlide()
  this.viewport.unsubscribe('slidechange', this.popupLeave)
}

Navigator.prototype.collectPopup = function (slides, slide) {
  var id = 'collected-popup-' + (++this.collectedPopupsCount);

  if(settings.isScenario && !isSlideInStructure(slide)){
    slides = this.setPresentationIdToSlides(slides)
    slide = this.setPresentationIdToSlide(slide)
  }

  if (validateContent(slides)) {
    structure.chapters[id] = {
      id: id,
      name: 'Collected Popup ' + this.collectedPopupsCount,
      content: slides
    }
    this.createPopup({
      chapter: id,
      slide: slide,
      noTransition: true,
    }, {isCollectPopup: true})
  } else {
    console.log('Collect Popup has incorrect structure.')
  }
}

Navigator.prototype.addLoader = function(){
  var loader = getLoader();

  if(this.isShowLoader()){
    document.addEventListener('willgoto', function() {
      loader.classList.add('active');
    })

    document.addEventListener('slideenter', function() {
      loader.classList.remove('active');
    })
  }
}

Navigator.prototype.setPresentationIdToSlides = function(slides){
  return slides.map(function(slide) {
    return this.setPresentationIdToSlide(slide)
  }.bind(this));
}

Navigator.prototype.setPresentationIdToSlide = function(slideId){
  return [
    this.getSettingsId(),
    slideId
  ].join('_')
}

Navigator.prototype.getSettingsId = function(){
  var settings = this.viewport.currentFrame.iframe.contentWindow.require('settings')

  return settings.id
}

Navigator.prototype.isShowLoader = function(){
  var clm = settings._env.currentClm === 'dev' ? 'spa' : settings._env.currentClm
  return settings.clms && settings.clms[clm] && settings.clms[clm].showLoader
}

function getLoader(){
  return document.getElementsByClassName('loader-wrapper')[0];
}

function isSlideInStructure(slideId){
  return !!structure.slides[slideId]
}

Navigator.prototype.pushPopupView = function (popupViewPort) {
  markViewAsDisable(this.getCurrentViewPort())
  this.popupViews.push(popupViewPort)
}

Navigator.prototype.popPopupView = function () {
  var removedView = this.popupViews.pop();
  removeDisableMarkFromView(this.getCurrentViewPort())
  return removedView;
}

function markViewAsDisable(view) {
  view.element.classList.add("disable");
}

function removeDisableMarkFromView(view) {
  view.element.classList.remove("disable");
}

module.exports = Navigator

},{"./utils":28,"./viewport.js":29,"params":8,"routie":20,"settings":"settings","structure":"structure","utils":40}],28:[function(require,module,exports){
exports.getFirstEnabledSlide = function (structure, chapter) {
  return getChapterContent(structure, chapter)
    .filter(isEnableSlide)[0]
}

exports.getFirstNotEmptyChapter = function (structure, chapter) {
  var startIndex = chapter ? structure.storyboard.indexOf(chapter) : 0;
  return structure.storyboard.slice(startIndex)
    .filter(isEnableChapter)
    .filter(isEnableSlidesInChapter(structure))[0]
}

exports.isEnableSlide = isEnableSlide;

function isEnableSlidesInChapter(structure, chapter){
  return function (chapter){
    return getChapterContent(structure, chapter).some(isEnableSlide)
  }
}

function getChapterContent(structure, chapter) {
  try {
    return structure.chapters[chapter].content
  } catch(e) {
    throw new Error('The chapter ' + chapter + ' is absent in the structure.');
  }
}

function isEnableChapter (chapter){
  return isEnableStructureEntity(chapter)
}

function isEnableSlide(slide){
  return isEnableStructureEntity(slide)
}

function isEnableStructureEntity (entity){
  var DISABLE_LABEL = "!";
  return !!entity.indexOf(DISABLE_LABEL)
}
},{}],29:[function(require,module,exports){
var utils = require('utils')
var Observer = utils.Observer
var structure = require('structure')
var spaSettings = require('spa-ctl')
var settings = require('settings')
var validate = require('validate-nav').validate
var prefixer = require('prefixer')
var touch = require('touch')
var touchCount = +spaSettings.navTouchCount || 1
var path = require('path')
var slideDir = settings.slides
var presentationIndentifier = require('presentation-identifier')
var storageStructureKey = presentationIndentifier + 'Structure'

var HORIZONTAL_DIRECTION = 'horizontal'
var VERTICAL_DIRECTION = 'vertical'

var DIRECTIONS = {
  'horizontal': ['left', 'right'],
  'vertical': ['up', 'down']
}

var ANIMATION_NEXT = 'next'
var ANIMATION_PREV = 'prev'
var ANIMATION_DIRECTIONS = {
  'horizontal': {
    prev: 'left',
    next: 'right'
  },
  'vertical': {
    prev: 'up',
    next: 'down'
  }
}

var EVENT_DIRECTION_MAP = {
  'swipeup': 'down',
  'swipedown': 'up',
  'swipeleft': 'right',
  'swiperight': 'left'
}

var NEXT = 1
var PREV = -1


var STEP = {
  'up': PREV,
  'down': NEXT,
  'left': PREV,
  'right': NEXT
}

var HORIZONTAL_EVENTS = ['swipeleft', 'swiperight']
var VERTICAL_EVENTS = ['swipeup', 'swipedown']

var REVERSE_DIRECTIONS = {
  right: 'left',
  left: 'right',
  up:'down',
  down: 'up'
}

function createFrames (ctx) {
  return ['current', 'next'].reduce(function (frames, frame) {
    var wrapper = document.createElement('div')
    var iframe = document.createElement('iframe')

    wrapper.className = 'slide ' + frame

    wrapper.appendChild(iframe)
    ctx.element.appendChild(wrapper)

    frames[frame] = {
      element: wrapper,
      iframe: iframe
    }

    return frames
  }, {})
}

function ViewPort (element, options) {
  var chapter
  var slide
  var that = this

  this.element = element
  this.canGoto = true
  this.viewport = document.getElementById('viewport')

  utils.mixin(this, options || {})

  Observer.call(this)

  Object.defineProperties(this, {
    'chapter': {
      set: function (value) {
        chapter = value
        that.slides = structure.chapters[chapter].content
        that.publish('chapterchange')
      },
      get: function () {
        return chapter
      }
    },
    'slide': {
      set: function (value) {
        slide = value
        that.index = that.slides.indexOf(slide)
        that.publish('slidechange', slide)
      },
      get: function () {
        return slide
      }
    }
  })

  this.frames = createFrames(this)

  // for navigator

  this.currentFrame = this.frames.current

  this.slideDirection = this.getDirection(settings.slide)
  this.chapterDirection = this.getDirection(settings.chapter)

  this.slideSwipeEvents = this.getActualSwipeEvents(this.slideDirection)
  this.chapterSwipeEvents = this.getActualSwipeEvents(this.chapterDirection)

  this.handlersMap = this.buildHandlersMap()
}

ViewPort.prototype = Object.create(Observer.prototype)
ViewPort.prototype.isPointerEvent = touch.isPointerEvent
ViewPort.prototype.isTouch = touch.isTouch

ViewPort.prototype.buildHandlersMap = function () {
  if (this.slideDirection === this.chapterDirection) {
    return this.setHandlersMap(this.slideSwipeEvents)
  }

  var slideHandlersMap = this.setHandlersMap(this.slideSwipeEvents)
  var chapterHandlersMap = this.setHandlersMap(this.chapterSwipeEvents)

  return utils.mixin(slideHandlersMap, chapterHandlersMap)
}

ViewPort.prototype.getDirection = function (node) {
  if (node && Boolean(node.direction)) {
    return node.direction
  }

  return HORIZONTAL_DIRECTION
}

ViewPort.prototype.getActualSwipeEvents = function (direction) {
  if (direction === HORIZONTAL_DIRECTION) {
    return HORIZONTAL_EVENTS
  } else if (direction === VERTICAL_DIRECTION) {
    return VERTICAL_EVENTS
  }
}

ViewPort.prototype.start = function (options) {
  sessionStorage.removeItem(storageStructureKey)
  validate(options)
  utils.mixin(this, options, ['chapter', 'slide'])
  this.loadFrame('current', this.slide, function () {
    this.currentFrame.iframe.contentDocument.addEventListener('slidedataloaded', this.enter.bind(this))
  }.bind(this))
}

ViewPort.prototype.enter = function () {
  this.slideReady()
  this.dispatchSlideEvent('slideenter', this.frames.current)
  this.addListeners(this.handlersMap)
}
ViewPort.prototype.exit = function () {
  this.dispatchSlideEvent('slideleave', this.frames.next)
  this.removeListeners(this.handlersMap)
}

ViewPort.prototype.change = function () {
  this.exit()
  this.enter()
  this.unloadPrevFrame();
}

ViewPort.prototype.dispatchSlideEnterToCurrentSlide = function () {
  this.dispatchSlideEvent('slideenter', this.frames.current)
}

ViewPort.prototype.dispatchSlideLeaveForCurrentSlide = function () {
  this.dispatchSlideEvent('slideleave', this.frames.current)
}

ViewPort.prototype.dispatchSlideEvent = function (event, frame) {
  var details = {detail: {slide: frame.element}}

  if (frame.iframe.id) {
    utils.dispatchEvent(frame.iframe.contentDocument, event, details)
    // TODO: describe this implicitness
    utils.dispatchEvent(document, event, details)
  }
}

ViewPort.prototype.loadFrame = function (frame, slide, onload) {
  var template

  frame = this.frames[frame].iframe
  onload = onload.bind(this)

  // TODO: maybe we should unload frame
  if (frame.id !== slide) {
    template = structure.slides[slide].template

    utils.once(frame, 'load', onload)

    frame.src = path.join(slideDir, template)
    frame.id = slide
  } else {
    this.swapFrames()
  }
}

ViewPort.prototype.goto = function (options) {
  validate(options)
  if ((this.chapter !== options.chapter || this.slide !== options.slide) && this.canGoto) {
    this.canGoto = false
    this.setAnimation(options)
    this.actualGoto(options)
  }
}

ViewPort.prototype.setAnimation = function(options){
  options.animation = !options.noTransition;

  if(options.animation){
    options.direction = this.getAnimationDirection(options);
  }
}

ViewPort.prototype.getAnimationDirection = function(options){
  var currSlide = this.slides.indexOf(this.slide)
  var targetSlide = this.slides.indexOf(options.slide)
  var chapters = structure.storyboard
  var currChapter = chapters.indexOf(this.chapter)
  var targetChapter = chapters.indexOf(options.chapter)
  var targetDirections

  if(isCurrChapter(this.chapter, options.chapter)){
    targetDirections = ANIMATION_DIRECTIONS[this.slideDirection]
    return targetDirections[targetSlide - currSlide < 0 ? ANIMATION_PREV : ANIMATION_NEXT]
  } else {
    targetDirections = ANIMATION_DIRECTIONS[this.chapterDirection]
    return targetDirections[targetChapter - currChapter < 0 ? ANIMATION_PREV : ANIMATION_NEXT]
  }
}

function isCurrChapter(current, target){
  return current === target;
}

ViewPort.prototype.actualGoto = function (options) {
  var eventOptions = {
    detail: {
      chapter: options.chapter,
      slide: options.slide
    }
  }

  this.setNavDirection(options)

  utils.dispatchEvent(this.currentFrame.iframe.contentDocument, 'willgoto', eventOptions)
  utils.dispatchEvent(document, 'willgoto', eventOptions)

  this.currentFrame = this.frames.next
  utils.mixin(this, options, ['chapter', 'slide', 'animation', 'direction'])
  this.removeListeners(this.handlersMap)
  this.prepareNextFrame()
  // TODO: it would be nice place for promises
  this.loadFrame('next', this.slide, function () {
    if (isProdClm()) {
      this.swapFrames()
    } else {
      this.onSlideDataLoaded()
    }
  }.bind(this))
}

ViewPort.prototype.onSlideDataLoaded = function() {
  this.currentFrame.iframe.contentDocument.addEventListener('slidedataloaded', function () {
    this.swapFrames()
  }.bind(this))
}

ViewPort.prototype.slideReady = function () {
  var mainSlideArticle = this.currentFrame.iframe.contentDocument.querySelector('article.slide')

  mainSlideArticle.classList.add('ready')
}

ViewPort.prototype.prepareNextFrame = function () {
  var next = this.frames.next.element

  next.classList.remove('prev')
  next.classList.remove('next')

  next.classList.add('no-trans')
  next.classList.add(STEP[this.direction] < 0 ? 'prev' : 'next')
}

ViewPort.prototype.unloadPrevFrame = function () {
  var iframe = this.frames.next.iframe;
  iframe.src = isiPlanner() ? 'data:text/html,' : '';
  iframe.id = '';
  this.canGoto = false;
  var unload = function() {
    this.canGoto = true;
  }.bind(this);

  utils.once(iframe.contentWindow, 'unload', unload)
}

ViewPort.prototype.swapFrames = function (options) {
  this.defineTransition()
  this.swapClasses()
  this.swapObjects()
  this.onSwapEnd()
}

ViewPort.prototype.defineTransition = function () {
  var method = this.animation ? 'remove' : 'add'

  this.frames.next.element.classList[method]('no-trans')
  this.frames.current.element.classList[method]('no-trans')
}

ViewPort.prototype.swapClasses = function () {
  var current = this.frames.current.element
  var next = this.frames.next.element

  current.classList.remove('current')

  this.removeEnterClass(current);

  next.classList.add('current')

  next.classList.add(this.generateEnterClass(REVERSE_DIRECTIONS[this.direction]))

  current.classList.add(STEP[this.direction] < 0 ? 'next' : 'prev')
  next.classList.remove(STEP[this.direction] < 0 ? 'prev' : 'next')
}

ViewPort.prototype.removeEnterClass = function (el) {
  Object.keys(STEP)
    .forEach(function(direction) {
      var enterClass = this.generateEnterClass(direction);

      if(el.classList.contains(enterClass)){
        el.classList.remove(enterClass);
      }
    }, this);
}

ViewPort.prototype.generateEnterClass = function (direction) {
  var way = 'enter';
  return direction + '-' + way;
}

ViewPort.prototype.swapObjects = function () {
  var temp = this.frames.current
  this.frames.current = this.frames.next
  this.frames.next = temp
}

ViewPort.prototype.onSwapEnd = function () {
  var change = this.change.bind(this)
  var current = this.frames.current.element

  if (this.animation) {
    window.getComputedStyle(current)[prefixer.getSupportedProperty('transitionDuration')] // true hack \m/
    utils.once(current, prefixer.events.animationend, change)
  } else {
    setTimeout(change, 0)
  }
}

ViewPort.prototype.setNavDirection = function (options) {
  if (!options.animation) {
    this.viewport.classList.remove(this.slideDirection)
    this.viewport.classList.remove(this.chapterDirection)
  } else if (!this.viewport.classList.contains(this.chapterDirection)) {
    this.viewport.classList.add(this.slideDirection)
  } else {
    this.setSwipeDirection(this.getSlideTransitionDirection(options))
  }
}

ViewPort.prototype.goToSibling = function (direction) {
  var isCorrectDirection = this.isCorrectDirection(direction)
  var sibling = this.getNextSibling(direction)
  var defaultOptions = {animation: true, direction: direction}

  if (sibling && this.canGoto && isCorrectDirection) {
    this.setSwipeDirection(this.getSlideTransitionDirection(sibling))
    this.canGoto = false
    this.actualGoto(utils.mixin(sibling, defaultOptions))
  } else {
    this.addListeners(this.handlersMap)
  }
}

ViewPort.prototype.isCorrectDirection = function (direction) {
  return this.isSlideDirection(direction) || this.isChapterDirection(direction)
}

ViewPort.prototype.isSlideDirection = function (direction) {
  return checkDirection(this.slideDirection, direction)
}

ViewPort.prototype.isChapterDirection = function (direction) {
  return checkDirection(this.chapterDirection, direction)
}

function checkDirection (type, direction) {
  return utils.contains(DIRECTIONS[type], direction)
}

ViewPort.prototype.getSlideTransitionDirection = function (sibling) {
  if (sibling.chapter === this.chapter) {
    return this.slideDirection
  }

  return this.chapterDirection
}

ViewPort.prototype.getNextSibling = function (direction) {
  var localSibling = this.getLocalSibling(direction)
  var isChapterFlow = this.isChapterFlow(direction)
  var isSlideFlow = this.isSlideDirection(direction)
  var crossChapterSibling = this.getCrossChapterSibling(direction, isChapterFlow)

  if (isChapterFlow) {
    return crossChapterSibling
  }

  if (localSibling) {
    return localSibling
  }

  if (isSlideFlow) {
    return crossChapterSibling
  }
}

ViewPort.prototype.isChapterFlow = function (direction) {
  return this.slideDirection !== this.chapterDirection && this.isChapterDirection(direction)
}

ViewPort.prototype.setSwipeDirection = function (direction) {
  var adverseDirection = this.getAdverseDirection(direction)

  if (this.slideDirection !== this.chapterDirection) {
    this.viewport.classList.remove(adverseDirection)
    this.viewport.classList.add(direction)
  } else {
    this.viewport.classList.add(direction)
  }
}

ViewPort.prototype.getAdverseDirection = function (direction) {
  if (direction === this.slideDirection) {
    return this.chapterDirection
  }

  return this.slideDirection
}

ViewPort.prototype.isChapterSwipe = function (eventName) {
  return !utils.contains(this.slideSwipeEvents, eventName) && utils.contains(this.chapterSwipeEvents, eventName)
}

ViewPort.prototype.getLocalSibling = function (direction) {
  var siblingSlide = this.slides[this.index + STEP[direction]]

  return siblingSlide ? {chapter: this.chapter, slide: siblingSlide} : null
}

ViewPort.prototype.getCrossChapterSibling = function (direction, isThroughChapters) {
  return this.isCrossChapterSwipe(isThroughChapters) ? this.getCrossChapterSlide(direction, isThroughChapters) : null
}

ViewPort.prototype.isCrossSiblingExists = function (isThroughChapters) {
  return !(this.slideDirection !== this.chapterDirection && !isThroughChapters)
}

// TODO: must be refactored
ViewPort.prototype.getCrossChapterSlide = function (direction, isThroughChapters) {
  var chapter = this.getCrossChapter(direction)

  if (chapter) {
    return {
      chapter: chapter.id,
      slide: this.getCrossSlide(chapter, direction, isThroughChapters)
    }
  }
}

ViewPort.prototype.isCrossChapterSwipe = function (isThroughChapters) {
  return (settings.isCrossChapterSwipe && utils.contains(structure.storyboard, this.chapter)) &&
  (this.isCrossSiblingExists(isThroughChapters) && !this.isPopup)
}

ViewPort.prototype.getCrossChapter = function (direction, stepCount) {
  var targetChapterId
  var targetChapter
  var chapterIndex

  stepCount = stepCount || STEP[direction]
  chapterIndex = structure.storyboard.indexOf(this.chapter)
  targetChapterId = structure.storyboard[chapterIndex + stepCount]
  targetChapter = structure.chapters[targetChapterId]

  if (!targetChapter) {
    return null
  }

  if (!targetChapter.content.length) {
    stepCount += STEP[direction]
    return this.getCrossChapter(direction, stepCount)
  }

  return targetChapter
}

ViewPort.prototype.getCrossSlide = function (chapter, direction, isThroughChapters) {
  if (isThroughChapters) {
    return getFirstChapterSlide(chapter)
  }

  return STEP[direction] > 0 ? getFirstChapterSlide(chapter) : getLastChapterSlide(chapter)
}

function getFirstChapterSlide (chapter) {
  return chapter.content[0]
}

function getLastChapterSlide (chapter) {
  return chapter.content[chapter.content.length - 1]
}

function isInputElementsOnSlide () {
  // fix bug in .ipa offset the input element by swipe
  var inputTags = ['INPUT', 'TEXTAREA']
  return [].some.call(document.getElementsByTagName('iframe'), function (iframe) {
    return inputTags.some(function (tag) {
      return iframe.contentDocument.getElementsByTagName(tag).length
    })
  })
}

ViewPort.prototype.swipe = function (event) {
  var direction = this.getDirectionByEvent(event)
  if (this.isRequiredTouchesCount(event.detail.touchesCount)) {
    if (this.isTouch && isInputElementsOnSlide()) {
      setTimeout(function () {
        this.goToSibling(direction)
      }.bind(this), 100)
    } else {
      this.goToSibling(direction)
    }
  }
}

ViewPort.prototype.getDirectionByEvent = function (event) {
  return EVENT_DIRECTION_MAP[event.type]
}

ViewPort.prototype.setHandlersMap = function (events) {
  var handlers = this.getMapHandlers()

  return this.getMapEvents(events)
    .reduce(function (map, event, index) {
      map[event] = handlers[index]
      return map
    }, {})
}

ViewPort.prototype.getMapHandlers = function () {
  var handlers = [
    this.swipe.bind(this),
    this.swipe.bind(this)]

  return !isMitouchSPA() ? handlers : handlers.concat([
    this.startEventHandler.bind(this),
    this.endEventHandler.bind(this),
    this.tapHandler.bind(this)
  ])
}

ViewPort.prototype.getMapEvents = function (events) {
  return !isMitouchSPA() ? events : events.concat([touch.events.start, touch.events.end, 'tap'])
}

ViewPort.prototype.startEventHandler = function (event) {
  setTimeout(function () {
    redispatchEvent(createFakeElement(event.target), event)
  }, 0)
}

ViewPort.prototype.endEventHandler = function (event) {
  this.endEvent = event
}

ViewPort.prototype.tapHandler = function (event) {
  setTimeout(function () {
    redispatchEvent(createFakeElement(event.target), this.endEvent)
  }.bind(this), 0)
}

function isMitouchSPA () {
  return settings._env.currentClm === 'mitouch-spa'
}

function isiPlanner(){
  var userAgent = navigator.userAgent
  var isiPlannerBuild = settings._env.currentClm === 'iplanner'
  var isiPad = /iPad/i.test(userAgent)
  var isSafari = userAgent.match(/Safari/i) != null
  
  return isiPlannerBuild && isiPad && !isSafari;
}

function isProdClm () {
  return settings._env.currentClm !== 'dev';
}

function createFakeElement (baseElement) {
  var fakeElement = document.createElement(baseElement.nodeName)

  Object.keys(baseElement.dataset).forEach(function (key) {
    fakeElement.dataset[key] = baseElement.dataset[key]
  })

  fakeElement.style.display = 'none'

  return fakeElement
}

function redispatchEvent (element, event) {
  var newEvent;

  if (event.touches) {
    newEvent = createTouchEvent(event);
  } else {
    newEvent = createCustomEvent(event);
  }

  document.body.appendChild(element);

  utils.once(window, event.type, function (event) {
    if (event.target === element) {
      event.stopPropagation();
    }
  })

  element.dispatchEvent(newEvent);

  setTimeout(function () {
    document.body.removeChild(element);
  }, 400)
}

function createTouchEvent (event) {
  var touchEvent
  if (window.TouchEvent instanceof Function) {
    // iOs 10
    touchEvent = new window.TouchEvent(event.type, event)
  } else {
    // iOs 9
    touchEvent = initTouchEvent(event.type)
    touchEvent.touches = event.touches
    touchEvent.changedTouches = event.changedTouches
  }
  return touchEvent
}

function initTouchEvent (eventType) {
  var newEvent
  try {
    newEvent = document.createEvent('TouchEvent')
    newEvent.initTouchEvent(eventType, true, true)
  } catch (err) {
    try {
      newEvent = document.createEvent('UIEvent')
      newEvent.initUIEvent(eventType, true, true)
    } catch (err) {
      newEvent = document.createEvent('Event')
      newEvent.initEvent(eventType, true, true)
    }
  }
  return newEvent
}

function createCustomEvent (event) {
  var newEvent;
  var eventType = event.type;

  if(eventType === 'pointerdown'){
    eventType = 'mousedown';
  }else if(eventType === 'pointerup'){
    eventType = 'mouseup';
  }

  if (typeof window.CustomEvent === 'function'){
    newEvent = new window.CustomEvent(eventType, event);
  }else{
    newEvent = document.createEvent('CustomEvent');
    newEvent.initCustomEvent(eventType, true, true);
  }

  return utils.mixin(newEvent, {
    clientX: event.clientX,
    clientY: event.clientY,
    x: event.x,
    y: event.y,
    pageX: event.pageX,
    pageY: event.pageY,
    screenX: event.screenX,
    screenY: event.screenY,
  })
}

ViewPort.prototype.addListeners = function (handlersMap) {
  this._processListeners('add', handlersMap)
}

ViewPort.prototype.removeListeners = function (handlersMap) {
  this._processListeners('remove', handlersMap)
}

ViewPort.prototype._processListeners = function (action, handlersMap) {
  var doc = this.currentFrame.iframe.contentDocument
  var events = Object.keys(handlersMap)
  var method = action + 'EventListener'

  events.forEach(function (event) {
    // doc[method](event, handlersMap[event].bind(this)); // fix bug by double swipe on android - bind() return new function
    doc[method](event, handlersMap[event])
  }, this)
}

ViewPort.prototype.isRequiredTouchesCount = function (count) {
  return !this.isTouch || count === touchCount
}

exports.ViewPort = ViewPort

},{"path":1,"prefixer":18,"presentation-identifier":19,"settings":"settings","spa-ctl":45,"structure":"structure","touch":39,"utils":40,"validate-nav":44}],30:[function(require,module,exports){
var settings = require('settings');

module.exports = function(structure){
	var thumbnailsPath = settings.thumbnails || 'media/images/common/thumbs/';

	Object.keys(structure.slides).forEach(function(slideId){
		var slide = structure.slides[slideId],
			location = isAbsolutePath(slide.template) ? getLocation(slide.template) : '';

		slide.thumbnail = location + settings.media + thumbnailsPath + getScenarioPath(slide.thumbnail) + getThumbnailName(slide) + '.jpg'
	});

	return structure;
};

function getScenarioPath(thumbnailPath){
	if(settings.isScenario){
		return thumbnailPath || '';
	}

	return '';
}

function getThumbnailName(slide){
	return isBuilt(slide) ? getProdSlideId(slide) : getDevSlideId(slide);
}

function getDevSlideId(slide){
	var path = slide.template;

	return path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
}

function getProdSlideId(slide){
	var path = slide.template.split('/');

	return path[path.length - 2];
}

function isBuilt(slide){
	return /slides\/[^\/]+\/index.html/.test(slide.template);
}

function isAbsolutePath(path){
	return /^((file|http|https):\/\/)|^\//.test(path);
}

function getLocation(file){
	return file.substring(file.lastIndexOf("/") + 1, 0);
}
},{"settings":"settings"}],31:[function(require,module,exports){
module.exports = function(structure){
	structure.storyboard = structure.storyboard.filter(isEnable);

	Object.keys(structure.chapters).forEach(function(chapterId){
		var chapter = structure.chapters[chapterId];

		chapter.content = chapter.content.filter(isEnable);
		chapter.id = chapterId;
	});

	return structure;
};

function isEnable(id){
	return id.charAt(0) !== "!";
}
},{}],32:[function(require,module,exports){
var utils = require('utils'),
	params = require('params');

module.exports = function(){
	var structure = loadTheOne();

	return JSON.parse(structure);
};

// its always hard to find the one
function loadTheOne(){
	var structures = [],
		theOne;

	structures.unshift(params.structure || "structure.json");

	structures.some(function(structure){
		var xhr = utils.load(structure);

		return xhr.response && (theOne = xhr.response);
	});

	return theOne;
}
},{"params":8,"utils":40}],33:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Event = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Event = exports.Event = function () {
	function Event() {
		var _this = this;

		_classCallCheck(this, Event);

		this.sensitivity = 50;
		this.start = function (event) {
			return _this.startHandler(event);
		};
		this.move = function (event) {
			return _this.moveHandler(event);
		};
		this.end = function (event) {
			return _this.endHandler(event);
		};
		this.numOfTouches = 0;
	}

	_createClass(Event, [{
		key: 'init',
		value: function init(root) {
			var _this2 = this;

			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			Object.keys(this.events).forEach(function (eventName) {
				root.addEventListener(_this2.events[eventName], function (event) {
					return _this2[eventName](event);
				});
			});
		}
	}, {
		key: 'setStartPosition',
		value: function setStartPosition(event) {
			this.startTime = Date.now();
			this.startX = event.screenX;
			this.startY = event.screenY;
		}
	}, {
		key: 'getFinalPosition',
		value: function getFinalPosition(event) {
			this.endX = event.screenX;
			this.endY = event.screenY;
		}
	}, {
		key: 'startHandler',
		value: function startHandler(event) {
			this.target = event.target;
			this.setStartPosition(event);
			this.getFinalPosition(event);
		}
	}, {
		key: 'moveHandler',
		value: function moveHandler(event) {
			this.getFinalPosition(event);
		}
	}, {
		key: 'endHandler',
		value: function endHandler(event) {
			var timeDiff = Date.now() - this.startTime,
			    diffX = this.endX - this.startX,
			    diffY = this.endY - this.startY;

			this.absX = Math.abs(diffX);
			this.absY = Math.abs(diffY);

			if (this.absX < 5 && this.absY < 5) {
				this.dispatchEvent(this.target, timeDiff < 300 ? 'tap' : 'hold', { pageX: this.endX, pageY: this.endY });
			} else if (timeDiff < 500) {

				if (this.absX >= this.absY) {
					if (this.absX >= this.sensitivity) {
						this.dispatchEvent(this.target, diffX > 0 ? 'swiperight' : 'swipeleft', this.options);
					}
				} else {
					if (this.absY >= this.sensitivity) {
						this.dispatchEvent(this.target, diffY > 0 ? 'swipedown' : 'swipeup', this.options);
					}
				}
			}
		}
	}, {
		key: 'getOriginalEvent',
		value: function getOriginalEvent(event) {
			return event;
		}
	}, {
		key: 'dispatchEvent',
		value: function dispatchEvent(target, eventType, options) {
			(0, _utils.dispatchEvent)(target, eventType, {
				detail: options || {}
			});
		}
	}, {
		key: 'events',
		get: function get() {
			return {
				start: '',
				move: '',
				end: ''
			};
		}
	}, {
		key: 'options',
		get: function get() {
			return {
				lengthX: this.absX,
				lengthY: this.absY,
				startX: this.startX,
				startY: this.startY,
				endX: this.endX,
				endY: this.endY,
				touchesCount: this.numOfTouches
			};
		}
	}]);

	return Event;
}();
},{"utils":40}],34:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.MouseEvent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Event2 = require('./Event');

var _utils = require('utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isMouse = !!window.MouseEvent;

var MouseEvent = exports.MouseEvent = function (_Event) {
	_inherits(MouseEvent, _Event);

	function MouseEvent() {
		_classCallCheck(this, MouseEvent);

		var _this = _possibleConstructorReturn(this, (MouseEvent.__proto__ || Object.getPrototypeOf(MouseEvent)).apply(this, arguments));

		_this.isMouse = isMouse;
		_this.numOfTouches = 1;
		return _this;
	}

	_createClass(MouseEvent, [{
		key: 'moveHandler',
		value: function moveHandler(event) {
			this.event = event;
			_get(MouseEvent.prototype.__proto__ || Object.getPrototypeOf(MouseEvent.prototype), 'moveHandler', this).call(this, event);
		}
	}, {
		key: 'events',
		get: function get() {
			return {
				start: 'mousedown',
				move: 'mousemove',
				end: 'mouseup'
			};
		}
	}, {
		key: 'options',
		get: function get() {
			return (0, _utils.mixin)(_get(MouseEvent.prototype.__proto__ || Object.getPrototypeOf(MouseEvent.prototype), 'options', this), {
				mouseEvent: this.event
			});
		}
	}], [{
		key: 'isMouse',
		get: function get() {
			return isMouse;
		}
	}]);

	return MouseEvent;
}(_Event2.Event);
},{"./Event":33,"utils":40}],35:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PointerEvent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _TouchEvent2 = require('./TouchEvent');

var _utils = require('utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isPointerEvent = !!window.PointerEvent;

var PointerEvent = exports.PointerEvent = function (_TouchEvent) {
	_inherits(PointerEvent, _TouchEvent);

	function PointerEvent() {
		_classCallCheck(this, PointerEvent);

		var _this = _possibleConstructorReturn(this, (PointerEvent.__proto__ || Object.getPrototypeOf(PointerEvent)).apply(this, arguments));

		_this.isPointerEvent = isPointerEvent;
		_this.pointerEvents = [];
		_this.countTouches = 0;
		_this.maxCountTouches = 0;
		return _this;
	}

	_createClass(PointerEvent, [{
		key: 'startHandler',
		value: function startHandler(event) {
			this.savedPointerID = event.pointerId;
			this.prevEvent = null;
			_get(PointerEvent.prototype.__proto__ || Object.getPrototypeOf(PointerEvent.prototype), 'startHandler', this).call(this, event);
		}
	}, {
		key: 'moveHandler',
		value: function moveHandler(event) {
			this.updatePointerEvent(event);
			_get(PointerEvent.prototype.__proto__ || Object.getPrototypeOf(PointerEvent.prototype), 'moveHandler', this).call(this, event);
		}
	}, {
		key: 'endHandler',
		value: function endHandler(event) {
			_get(PointerEvent.prototype.__proto__ || Object.getPrototypeOf(PointerEvent.prototype), 'endHandler', this).call(this, event);
			this.prevEvent = null;
			this.removePointerEvent(event);
		}
	}, {
		key: 'updatePointerEvent',
		value: function updatePointerEvent(event) {
			this.removeCurrentPointerEvent(event);
			this.removeOutdatedPointerEvents();
			this.pushPointerEvent(event);
			this.countTouches = this.getCountTouches();
			if (this.maxCountTouches < this.countTouches) {
				this.maxCountTouches = this.countTouches;
			}
		}
	}, {
		key: 'pushPointerEvent',
		value: function pushPointerEvent(event) {
			event.pushTime = Date.now();
			this.pointerEvents.push(event);
		}
	}, {
		key: 'removePointerEvent',
		value: function removePointerEvent(event) {
			this.removeCurrentPointerEvent(event);
			this.countTouches = this.getCountTouches();
			if (this.countTouches === 0) {
				this.maxCountTouches = 0;
			}
		}
	}, {
		key: 'removeCurrentPointerEvent',
		value: function removeCurrentPointerEvent(event) {
			if (this.isTouchEvent(event)) {
				this.pointerEvents = this.pointerEvents.filter(function (pointerEvent) {
					return !(pointerEvent.pointerId === event.pointerId);
				});
			} else {
				this.pointerEvents = [];
			}
		}
	}, {
		key: 'removeOutdatedPointerEvents',
		value: function removeOutdatedPointerEvents() {
			var currentTime = Date.now();
			var timeLimit = 2500;

			this.pointerEvents = this.pointerEvents.filter(function (pointerEvent) {
				return currentTime - pointerEvent.pushTime < timeLimit;
			});
		}
	}, {
		key: 'getCountTouches',
		value: function getCountTouches() {
			return this.pointerEvents.length;
		}
	}, {
		key: 'setNumTouhces',
		value: function setNumTouhces() {
			this.numOfTouches = this.maxCountTouches;
		}
	}, {
		key: 'getOriginalEvent',
		value: function getOriginalEvent(event) {
			if (!this.isTouchEvent(event)) {
				return event;
			}
			if (event.pointerId === this.savedPointerID) {
				this.prevEvent = event;
				return event;
			} else {
				return this.prevEvent || event;
			}
		}
	}, {
		key: 'isTouchEvent',
		value: function isTouchEvent(event) {
			return event.pointerType === 'touch';
		}
	}, {
		key: 'events',
		get: function get() {
			return {
				start: 'pointerdown',
				move: 'pointermove',
				end: 'pointerup'
			};
		}
	}, {
		key: 'options',
		get: function get() {
			return (0, _utils.mixin)(_get(PointerEvent.prototype.__proto__ || Object.getPrototypeOf(PointerEvent.prototype), 'options', this), {
				touchEvents: this.pointerEvents
			});
		}
	}], [{
		key: 'isTouch',
		get: function get() {
			return false;
		}
	}, {
		key: 'isPointerEvent',
		get: function get() {
			return isPointerEvent;
		}
	}]);

	return PointerEvent;
}(_TouchEvent2.TouchEvent);
},{"./TouchEvent":36,"utils":40}],36:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.TouchEvent = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Event2 = require('./Event');

var _utils = require('utils');

var _mobileTabletCheck = require('./mobile-tablet-check');

var _mobileTabletCheck2 = _interopRequireDefault(_mobileTabletCheck);

var _passiveOptionCheck = require('./passive-option-check');

var _passiveOptionCheck2 = _interopRequireDefault(_passiveOptionCheck);

var _settings = require('settings');

var _settings2 = _interopRequireDefault(_settings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var isTouch = (window.hasOwnProperty('ontouchstart') || 'ontouchstart' in window) && _mobileTabletCheck2.default;

var TouchEvent = exports.TouchEvent = function (_Event) {
	_inherits(TouchEvent, _Event);

	function TouchEvent() {
		_classCallCheck(this, TouchEvent);

		var _this = _possibleConstructorReturn(this, (TouchEvent.__proto__ || Object.getPrototypeOf(TouchEvent)).apply(this, arguments));

		_this.isTouch = isTouch;
		_this.numOfTouches = 0;
		return _this;
	}

	_createClass(TouchEvent, [{
		key: 'init',
		value: function init(root) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { preserveDefaultMovementBehavior: false };

			_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'init', this).call(this, root, options);

			root.addEventListener('touchmove', function (event) {
				if (!options.preserveDefaultMovementBehavior && !~["VIDEO", "TEXTAREA"].indexOf(event.target.tagName)) {
					event.preventDefault();
				}
			}, _passiveOptionCheck2.default ? { passive: false } : false);
		}
	}, {
		key: 'setStartPosition',
		value: function setStartPosition(event) {
			_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'setStartPosition', this).call(this, event);
			this.duration = 0;
		}
	}, {
		key: 'startHandler',
		value: function startHandler(event) {
			var _this2 = this;

			var touchTarget = event.target;
			this.numOfTouches = 0;
			event = this.getOriginalEvent(event);
			_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'startHandler', this).call(this, event);
			if (!this.target) {
				this.target = touchTarget; //fix iOs10
			}

			this.timer = setInterval(function () {
				//TODO
				_this2.duration++;
				if (_this2.numOfTouches === 2 && _this2.duration > 500) {
					_this2.dispatchEvent(_this2.target, 'doublehold');
					clearInterval(_this2.timer);
				}
			}, 1);
		}
	}, {
		key: 'moveHandler',
		value: function moveHandler(event) {
			this.event = event;
			this.setNumTouhces(event);
			event = this.getOriginalEvent(event);
			_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'moveHandler', this).call(this, event);
		}
	}, {
		key: 'endHandler',
		value: function endHandler(event) {
			_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'endHandler', this).call(this, event);
			clearInterval(this.timer);
		}
	}, {
		key: 'setNumTouhces',
		value: function setNumTouhces(event) {
			var length = event.touches.length;
			if (this.numOfTouches < length) {
				this.numOfTouches = length;
			}
		}
	}, {
		key: 'getOriginalEvent',
		value: function getOriginalEvent(event) {
			return event.touches[0] || event.changedTouches[0];
		}
	}, {
		key: 'events',
		get: function get() {
			return {
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend'
			};
		}
	}, {
		key: 'options',
		get: function get() {
			return (0, _utils.mixin)(_get(TouchEvent.prototype.__proto__ || Object.getPrototypeOf(TouchEvent.prototype), 'options', this), {
				touchesCount: this.numOfTouches,
				touchEvents: this.event.touches ? (0, _utils.toArray)(this.event.touches) : []
			});
		}
	}], [{
		key: 'isTouch',
		get: function get() {
			return isTouch;
		}
	}]);

	return TouchEvent;
}(_Event2.Event);
},{"./Event":33,"./mobile-tablet-check":37,"./passive-option-check":38,"settings":"settings","utils":40}],37:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var hasTouchScreen = false;
  if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
      hasTouchScreen = !!mQ.matches;
    } else if ('orientation' in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      // Only as a last resort, fall back to user agent sniffing
      var UA = navigator.userAgent;
      hasTouchScreen = /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}();
},{}],38:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (global) {
	var supportsPassiveOption = false;

	try {
		global.addEventListener('test', null, Object.defineProperty({}, 'passive', {
			get: function get() {
				supportsPassiveOption = true;
			}
		}));

		return supportsPassiveOption;
	} catch (e) {
		return supportsPassiveOption;
	}
}(window);
},{}],39:[function(require,module,exports){
var MouseEvent = require('./dist/js/MouseEvent.js').MouseEvent,
	TouchEvent = require('./dist/js/TouchEvent.js').TouchEvent,
	PointerEvent = require('./dist/js/PointerEvent.js').PointerEvent;

function createEvent(){ 

	if(PointerEvent.isPointerEvent){
		return new PointerEvent;
	}

	if(TouchEvent.isTouch){
		return new TouchEvent;
	}

	if(MouseEvent.isMouse){
		return new MouseEvent;
	}
};

module.exports = createEvent();

},{"./dist/js/MouseEvent.js":34,"./dist/js/PointerEvent.js":35,"./dist/js/TouchEvent.js":36}],40:[function(require,module,exports){
exports.mixin = function (target, source, args) {
  var keys = args instanceof Array ? args : Object.keys(source)

  keys.forEach(function (key) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key]
    }
  })

  return target
}

exports.template = function (string, data) {
  return string.replace(/\{([^\}]+)\}/g, function (match, key) {
    return data[key.trim()]
  })
}

exports.dispathEvent = function (target, event, options) {
  options = exports.mixin({ bubbles: true, cancelable: false }, options || {})
  target.dispatchEvent(new CustomEvent(event, options))
}

exports.dispatchEvent = exports.dispathEvent

exports.rangeValue = function (value, min, max) {
  if (value < min) {
    return min
  }

  if (value > max) {
    return max
  }

  return value
}

exports.load = function (url, callback, async) {
  var request = new XMLHttpRequest()

  request.onload = callback

  request.open('GET', url, !!async)
  request.send()

  return request
}

exports.loadAsync = function (url, useCache) {
  return new Promise(function (resolve, reject) {
    var request;

    request = new XMLHttpRequest();

    request.open('GET', modifyUrlByCacheDepend(url, useCache), true);

    request.onload = function () {
      if (request.status === 200 || checkApplicationStatus(request.readyState)) {
        resolve(request.response);
      } else {
        reject(Error(request.statusText));
      }
    };

    request.onerror = function () {
      reject(Error('Network Error'));
    };

    request.send();
  });
};

exports.getTimeStamp = function () {
  return (new Date()).getTime()
}

function modifyUrlByCacheDepend(url, useCache){
  if(useCache){
    return url;
  }

  return url + getUrlSeparator(url) + exports.getTimeStamp();
}

function getUrlSeparator(url) {
  var conditionToSeparate  =  /\?/;

  if(conditionToSeparate.test(url)){
    return '&';
  }

  return '?'
}

function checkApplicationStatus (state) {
  var DONE = 4
  return !document.domain && state === DONE
}

// mapToArray :: Object -> Array
// Convert Object properties to Array's item and extending them with property's key
exports.mapToArray = function (map) {
  return Object.keys(map).map(function (id) {
    var item = map[id],
      obj = Object.create(item)
    obj.id = id
    return obj
  })
}

// toObject :: Array -> Array -> Object
exports.toObject = function (keys, values) {
  var object = {}

  keys.forEach(function (key, index) {
    object[key] = values[index]
  })

  return object
}

// HTMLCollection -> Array
exports.toArray = function (collection) {
  return Array.prototype.slice.call(collection, 0)
}

exports.revive = function (str) {
  try {
    return JSON.parse(str)
  } catch (e) {
    return str
  }
}

exports.once = function (element, event, callback, isOnCapturing) {
  var func

  element.addEventListener(event, func = function () {
    callback.apply(this, arguments)

    element.removeEventListener(event, func, isOnCapturing)
  }, isOnCapturing)
}

exports.inherits = function (ctor, superCtor) {
  ctor.super_ = superCtor
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })
}

// TODO document the function
exports.contains = function (haystack, needle) {
  var isObject = Object.prototype.toString.call(haystack) === '[object Object]'
  var searchInItem = isObject ? Object.keys(haystack) : haystack

  return searchInItem.indexOf(needle) > -1
}

exports.toCamelCaseObject = function (obj) {
  return Object.keys(obj).reduce(function (accum, property) {
    accum[exports.toCamelCase(property)] = obj[property]
    return accum
  }, {})
}

exports.toCamelCase = function (string) {
  return string.replace(/-([a-z])/g, function (delimiter) {
    return delimiter[1].toUpperCase()
  })
}

exports.startsWith = function (string, symbol) {
  return string.indexOf(symbol) === 0
}

exports.reviveByType = function (value, type) {
  if (type === Number || type === Boolean) {
    return exports.revive(value)
  }

  return value
}

exports.deepMixin = function (target, source) {
  if (exports.isObject(target) && exports.isObject(source)) {
    Object.keys(source)
			.forEach(function (property) {
  if (!target[property]) {
    target[property] = source[property]
  }
  if (exports.isObject(target[property]) && exports.isObject(source[property])) {
    exports.deepMixin(target[property], source[property])
  } else if (exports.isArray(target[property]) && exports.isArray(source[property])) {
    exports.mixinArrays(target[property], source[property])
  } else {
    target[property] = source[property]
  }
})
  }
  return target
}

exports.mixinArrays = function (target, source) {
  source.forEach(function (item, index) {
    if (!defined(target[index])) {
      target.push(source[index])
    }
    if (exports.isObject(target[index]) && exports.isObject(source[index])) {
      exports.deepMixin(target[index], source[index])
    } else if (exports.isArray(target[index]) && exports.isArray(source[index])) {
      exports.mixinArrays(target[index], source[index])
    } else {
      target[index] = source[index]
    }
  })

  if (target.length > source.length) {
    var diff = target.length - source.length
    target.splice(source.length, diff)
  }
}

exports.debounce = function (fn, throttle) {
  var timer = null
  return function () {
    var context = this,
      args = arguments
    clearTimeout(timer)
    timer = setTimeout(function () {
      fn.apply(context, args)
    }, throttle)
  }
}

exports.isArray = function (array) {
  return Array.isArray(array)
}

exports.isObject = function (obj) {
  return obj && typeof obj === 'object' && !exports.isArray(obj)
}

exports.parse = function (obj) {
  return JSON.parse(JSON.stringify(obj))
}

exports.isUnique = function (item, index, array) {
  return array.indexOf(item) === index
}

exports.prependChild = function (parent, child) {
  const firstChild = parent.children[0]

  if (firstChild) {
    parent.insertBefore(child, firstChild)
  } else {
    parent.appendChild(child)
  }
}

exports.flattenArray = function (array) {
  return array.reduce(function (acc, next) {
    return acc.concat(next)
  }, [])
}

exports.jsonOrText = function (str) {
  var res

  try {
    res = JSON.parse(str)
  } catch (e) {
    res = str
  }

  return res
}

function defined (value) {
  return value !== undefined && value !== null
}

exports.difference = require('./src/diff.js')
exports.isEquals = require('./src/is-equals.js')
exports.Observer = require('./src/observer.js')

},{"./src/diff.js":41,"./src/is-equals.js":42,"./src/observer.js":43}],41:[function(require,module,exports){
function difference (obj1, obj2) {
  var diff = {}

  for (var prop in obj1) {
    if (obj1.hasOwnProperty(prop)) {
      if (!obj2.hasOwnProperty(prop)) {
        diff[prop] = obj1[prop]
      } else if (isObject(obj1[prop])) {
        var diffObj = difference(obj1[prop], obj2[prop])
        if (Object.keys(diffObj).length) {
          diff[prop] = diffObj
        }
      } else if (obj1[prop] !== obj2[prop]) {
        diff[prop] = obj1[prop]
      }
    }
  }

  return diff
}

// TODO: remove duplication with index.js (solve circular dependencies)
function isObject (obj) {
  return obj && (typeof obj === 'object' || isArray(obj))
}

function isArray (array) {
  return Array.isArray(array)
}

module.exports = difference

},{}],42:[function(require,module,exports){
// TODO: leave to QAP guidelines
function isEquals (x, y) {
  'use strict'

  if (x === null || x === undefined || y === null || y === undefined) { return x === y }
	// after this just checking type of one would be enough
  if (x.constructor !== y.constructor) { return false }
	// if they are functions, they should exactly refer to same one (because of closures)
  if (x instanceof Function) { return x === y }
	// if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
  if (x instanceof RegExp) { return x === y }
  if (x === y || x.valueOf() === y.valueOf()) { return true }
  if (Array.isArray(x) && x.length !== y.length) { return false }

	// if they are dates, they must had equal valueOf
  if (x instanceof Date) { return false }

	// if they are strictly equal, they both need to be object at least
  if (!(x instanceof Object)) { return false }
  if (!(y instanceof Object)) { return false }

	// recursive object equality check
  var p = Object.keys(x)
  return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1 }) &&
		p.every(function (i) { return isEquals(x[i], y[i]) })
}

module.exports = isEquals

},{}],43:[function(require,module,exports){
function Observer () {
  this.listeners = {}
}

Observer.prototype.subscribe = function (event, callback) {
  if (!this.listeners.hasOwnProperty(event)) {
    this.listeners[event] = []
  }

  this.listeners[event].push(callback)
}

Observer.prototype.unsubscribe = function (event, callback) {
  var listeners = this.listeners[event]
  var index

  if (listeners) {
    index = listeners.indexOf(callback)

    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

Observer.prototype.publish = function (event, data) {
  var listeners = this.listeners[event]
  var index

  if (listeners) {
    for (index = 0; index < listeners.length; index++) {
      listeners[index](data)
    }
  }
}

Observer.prototype.destroy = function () {
  Object
    .keys(this.listeners)
    .forEach(function (event) {
      delete this.listeners[event]
    }, this)
}

module.exports = Observer

},{}],44:[function(require,module,exports){
// Если чаптера нету в structure.storyboard, на него все равно можно перейти - это нужно как минимум для визарда
var structure = require('structure'),
	utils = require('utils');

function validate(options){
	if(options.slide){
		validateSlide(options.slide);
	}

	if(options.chapter){
		validateChapter(options.chapter);
	}

	if(options.chapter && options.slide){
		validateSlideInChapter(options.chapter, options.slide);
	}

	complete(options);
}

function validateSlide(slide){
	if(!utils.contains(structure.slides, slide)){
		throw new Error("Slide \"" + slide + "\" is not described.");
	}
}

function validateChapter(chapter){
	if(!utils.contains(structure.chapters, chapter)){
		throw new Error("There is no \"" + chapter + "\" chapter.");
	}
}

function validateSlideInChapter(chapter, slide){
	if(!utils.contains(structure.chapters[chapter].content, slide)){
		throw new Error("There is no slide \"" + slide + "\" in chapter \"" + chapter + '\".');
	}
}

function complete(options){
	if(!options.chapter){
		options.chapter = getChapterBySlideId(options.slide);
	}

	if(!options.slide){
		options.slide = structure.chapters[options.chapter].content[0];
	}
}

function getChapterBySlideId(slideId){
	var slideShowPopup = require('slideshow-popup'),
		chapterId = findChapterId(slideId, slideShowPopup.chapters) || findChapterId(slideId, utils.mapToArray(structure.chapters));

	if(!chapterId){
		throw new Error("Any chapter contains slide \"" + slideId);
	}

	return chapterId;
}

function findChapterId(slideId, chapters){
	var chapterId;

	chapters.some(function(chapter){
		return ~chapter.content.indexOf(slideId) && (chapterId = chapter.id)
	});

	return chapterId;
}

function setAnimation(options, current){
	options.animation = !(options.noTransition || !isCurrChapter(current.chapter, options.chapter));

	if(!current.isPopup){
		options.direction = getDirection(options, current);
	}
}

function getDirection(options, current){
	var currSlide = current.slides.indexOf(current.slide),
		targetSlide = current.slides.indexOf(options.slide),
		chapters = structure.storyboard,
		currChapter = chapters.indexOf(current.chapter),
		targetChapter = chapters.indexOf(options.chapter);

	if(isCurrChapter(current.chapter, options.chapter)){
		return targetSlide - currSlide;
	}else{
		return targetChapter - currChapter;
	}
}

function isCurrChapter(current, target){
	return current === target;
}

module.exports.validate = validate;
module.exports.setAnimation = setAnimation;
},{"slideshow-popup":26,"structure":"structure","utils":40}],45:[function(require,module,exports){
module.exports={
	"navTouchCount": 1,
	"dest": "./spa"
}
},{}],"settings":[function(require,module,exports){
var loader = require('loader')
var params = require('params')
var utils = require('utils')
var structureJSON = params.structure || 'structure.json'
var appJSON = params.settings || 'app/settings/app.json'
var settings = loader.loadJSONSync(appJSON)
var structure = loader.loadJSONSync(structureJSON)
var api = require('./api')

if (params.settings) {
  settings.slides = ''
}

module.exports = settings
module.exports._api = api(settings, structure)
module.exports._env = utils.mixin({
  currentClm: 'dev'
}, settings._env || {})

},{"./api":21,"loader":5,"params":8,"utils":40}],"spa":[function(require,module,exports){
window.isSPA = true

var presentationIdentifier = require('presentation-identifier')
var initialCommonModelKey = presentationIdentifier + '-initialCommonModel'
var slideshowPopupKey = presentationIdentifier + 'SlideshowPopup'
var structure = require('structure')
var storageKeyboardNavKey = 'keyboard-navigation'
var Navigator

window.addEventListener('DOMContentLoaded', function () {
  window.sessionStorage.removeItem(slideshowPopupKey)
  window.sessionStorage.removeItem(presentationIdentifier)
  window.sessionStorage.removeItem(initialCommonModelKey)
  window.sessionStorage.removeItem(storageKeyboardNavKey)
})

if (structure.loadJSONStructure) {
  structure.loadJSONStructure()
  structure.publish('update')
}

Navigator = require('./src/navigator.js')
require('polyfill')

module.exports = new Navigator('viewport')

},{"./src/navigator.js":27,"polyfill":9,"presentation-identifier":19,"structure":"structure"}],"structure":[function(require,module,exports){
var utils = require('utils'),
	filterStructure = require('./src/filter-structure.js'),
	addThumbnailPath = require('./src/add-thumbnail-path.js'),
	loadStructure = require('./src/load-structure.js'),
	params = require('params'),
	loader = require('loader'),
	presentationIdentifier = require('presentation-identifier'),
	storageKey = presentationIdentifier + 'Structure';

function Structure(){
	utils.Observer.call(this);

	this.loadJSONStructure();

	this.loadStorageStructure();
	this.subscribe('update', this.save.bind(this));
}

utils.inherits(Structure, utils.Observer);

Structure.prototype.loadJSONStructure = function(){
	if(params.structure || params.callNumber || params.division){
		utils.mixin(this, filterStructure(addThumbnailPath(loadStructure())));
	}else{
		utils.mixin(this, filterStructure(addThumbnailPath(loader.loadJSONSync('structure.json'))));
	}
};

Structure.prototype.save = function(){
	sessionStorage.setItem(storageKey, JSON.stringify(this));
};

Structure.prototype.loadStorageStructure = function(){
	var savedStructure = JSON.parse(sessionStorage.getItem(storageKey)) || {},
		props = Object.keys(savedStructure).filter(function(key){ return key !== 'listeners' });

	utils.mixin(this, savedStructure, props);
};

module.exports = new Structure();
},{"./src/add-thumbnail-path.js":30,"./src/filter-structure.js":31,"./src/load-structure.js":32,"loader":5,"params":8,"presentation-identifier":19,"utils":40}]},{},["spa"]);
