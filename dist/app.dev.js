(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":3}],2:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');
var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || require('./../helpers/btoa');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();
    var loadEvent = 'onreadystatechange';
    var xDomain = false;

    // For IE 8/9 CORS support
    // Only supports POST and GET calls and doesn't returns the response headers.
    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
    if (process.env.NODE_ENV !== 'test' &&
        typeof window !== 'undefined' &&
        window.XDomainRequest && !('withCredentials' in request) &&
        !isURLSameOrigin(config.url)) {
      request = new window.XDomainRequest();
      loadEvent = 'onload';
      xDomain = true;
      request.onprogress = function handleProgress() {};
      request.ontimeout = function handleTimeout() {};
    }

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request[loadEvent] = function handleLoad() {
      if (!request || (request.readyState !== 4 && !xDomain)) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
        status: request.status === 1223 ? 204 : request.status,
        statusText: request.status === 1223 ? 'No Content' : request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
          cookies.read(config.xsrfCookieName) :
          undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

}).call(this,require('_process'))
},{"../core/createError":9,"./../core/settle":12,"./../helpers/btoa":16,"./../helpers/buildURL":17,"./../helpers/cookies":19,"./../helpers/isURLSameOrigin":21,"./../helpers/parseHeaders":23,"./../utils":25,"_process":41}],3:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(utils.merge(defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":4,"./cancel/CancelToken":5,"./cancel/isCancel":6,"./core/Axios":7,"./defaults":14,"./helpers/bind":15,"./helpers/spread":24,"./utils":25}],4:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],5:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":4}],6:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],7:[function(require,module,exports){
'use strict';

var defaults = require('./../defaults');
var utils = require('./../utils');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var isAbsoluteURL = require('./../helpers/isAbsoluteURL');
var combineURLs = require('./../helpers/combineURLs');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = utils.merge({
      url: arguments[0]
    }, arguments[1]);
  }

  config = utils.merge(defaults, this.defaults, { method: 'get' }, config);
  config.method = config.method.toLowerCase();

  // Support baseURL config
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"./../defaults":14,"./../helpers/combineURLs":18,"./../helpers/isAbsoluteURL":20,"./../utils":25,"./InterceptorManager":8,"./dispatchRequest":10}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":25}],9:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":11}],10:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":6,"../defaults":14,"./../utils":25,"./transformData":13}],11:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }
  error.request = request;
  error.response = response;
  return error;
};

},{}],12:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  // Note: status is not exposed by XDomainRequest
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":9}],13:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

},{"./../utils":25}],14:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this,require('_process'))
},{"./adapters/http":2,"./adapters/xhr":2,"./helpers/normalizeHeaderName":22,"./utils":25,"_process":41}],15:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],16:[function(require,module,exports){
'use strict';

// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function E() {
  this.message = 'String contains an invalid character';
}
E.prototype = new Error;
E.prototype.code = 5;
E.prototype.name = 'InvalidCharacterError';

function btoa(input) {
  var str = String(input);
  var output = '';
  for (
    // initialize result and counter
    var block, charCode, idx = 0, map = chars;
    // if the next str index does not exist:
    //   change the mapping table to "="
    //   check if d has no fractional digits
    str.charAt(idx | 0) || (map = '=', idx % 1);
    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
  ) {
    charCode = str.charCodeAt(idx += 3 / 4);
    if (charCode > 0xFF) {
      throw new E();
    }
    block = block << 8 | charCode;
  }
  return output;
}

module.exports = btoa;

},{}],17:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      }

      if (!utils.isArray(val)) {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":25}],18:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],19:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
  (function standardBrowserEnv() {
    return {
      write: function write(name, value, expires, path, domain, secure) {
        var cookie = [];
        cookie.push(name + '=' + encodeURIComponent(value));

        if (utils.isNumber(expires)) {
          cookie.push('expires=' + new Date(expires).toGMTString());
        }

        if (utils.isString(path)) {
          cookie.push('path=' + path);
        }

        if (utils.isString(domain)) {
          cookie.push('domain=' + domain);
        }

        if (secure === true) {
          cookie.push('secure');
        }

        document.cookie = cookie.join('; ');
      },

      read: function read(name) {
        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return (match ? decodeURIComponent(match[3]) : null);
      },

      remove: function remove(name) {
        this.write(name, '', Date.now() - 86400000);
      }
    };
  })() :

  // Non standard browser env (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return {
      write: function write() {},
      read: function read() { return null; },
      remove: function remove() {}
    };
  })()
);

},{"./../utils":25}],20:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],21:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
  (function standardBrowserEnv() {
    var msie = /(msie|trident)/i.test(navigator.userAgent);
    var urlParsingNode = document.createElement('a');
    var originURL;

    /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
    function resolveURL(url) {
      var href = url;

      if (msie) {
        // IE needs attribute set twice to normalize properties
        urlParsingNode.setAttribute('href', href);
        href = urlParsingNode.href;
      }

      urlParsingNode.setAttribute('href', href);

      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
      return {
        href: urlParsingNode.href,
        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
        host: urlParsingNode.host,
        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
        hostname: urlParsingNode.hostname,
        port: urlParsingNode.port,
        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                  urlParsingNode.pathname :
                  '/' + urlParsingNode.pathname
      };
    }

    originURL = resolveURL(window.location.href);

    /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
    return function isURLSameOrigin(requestURL) {
      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
      return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
    };
  })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return function isURLSameOrigin() {
      return true;
    };
  })()
);

},{"./../utils":25}],22:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":25}],23:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
};

},{"./../utils":25}],24:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],25:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');
var isBuffer = require('is-buffer');

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object' && !isArray(obj)) {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim
};

},{"./helpers/bind":15,"is-buffer":30}],26:[function(require,module,exports){

},{}],27:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

'use strict';

/**
 * @file Embedded JavaScript templating engine. {@link http://ejs.co}
 * @author Matthew Eernisse <mde@fleegix.org>
 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
 * @project EJS
 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
 */

/**
 * EJS internal functions.
 *
 * Technically this "module" lies in the same file as {@link module:ejs}, for
 * the sake of organization all the private functions re grouped into this
 * module.
 *
 * @module ejs-internal
 * @private
 */

/**
 * Embedded JavaScript templating engine.
 *
 * @module ejs
 * @public
 */

var fs = require('fs');
var path = require('path');
var utils = require('./utils');

var scopeOptionWarned = false;
var _VERSION_STRING = require('../package.json').version;
var _DEFAULT_DELIMITER = '%';
var _DEFAULT_LOCALS_NAME = 'locals';
var _NAME = 'ejs';
var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
var _OPTS = ['delimiter', 'scope', 'context', 'debug', 'compileDebug',
  'client', '_with', 'rmWhitespace', 'strict', 'filename'];
// We don't allow 'cache' option to be passed in the data obj
// for the normal `render` call, but this is where Express puts it
// so we make an exception for `renderFile`
var _OPTS_EXPRESS = _OPTS.concat('cache');
var _BOM = /^\uFEFF/;

/**
 * EJS template function cache. This can be a LRU object from lru-cache NPM
 * module. By default, it is {@link module:utils.cache}, a simple in-process
 * cache that grows continuously.
 *
 * @type {Cache}
 */

exports.cache = utils.cache;

/**
 * Custom file loader. Useful for template preprocessing or restricting access
 * to a certain part of the filesystem.
 *
 * @type {fileLoader}
 */

exports.fileLoader = fs.readFileSync;

/**
 * Name of the object containing the locals.
 *
 * This variable is overridden by {@link Options}`.localsName` if it is not
 * `undefined`.
 *
 * @type {String}
 * @public
 */

exports.localsName = _DEFAULT_LOCALS_NAME;

/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * @param {String}  name     specified path
 * @param {String}  filename parent file path
 * @param {Boolean} isDir    parent file path whether is directory
 * @return {String}
 */
exports.resolveInclude = function(name, filename, isDir) {
  var dirname = path.dirname;
  var extname = path.extname;
  var resolve = path.resolve;
  var includePath = resolve(isDir ? filename : dirname(filename), name);
  var ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
};

/**
 * Get the path to the included file by Options
 *
 * @param  {String}  path    specified path
 * @param  {Options} options compilation options
 * @return {String}
 */
function getIncludePath(path, options) {
  var includePath;
  var filePath;
  var views = options.views;

  // Abs path
  if (path.charAt(0) == '/') {
    includePath = exports.resolveInclude(path.replace(/^\/*/,''), options.root || '/', true);
  }
  // Relative paths
  else {
    // Look relative to a passed filename first
    if (options.filename) {
      filePath = exports.resolveInclude(path, options.filename);
      if (fs.existsSync(filePath)) {
        includePath = filePath;
      }
    }
    // Then look in any views directories
    if (!includePath) {
      if (Array.isArray(views) && views.some(function (v) {
        filePath = exports.resolveInclude(path, v, true);
        return fs.existsSync(filePath);
      })) {
        includePath = filePath;
      }
    }
    if (!includePath) {
      throw new Error('Could not find include include file.');
    }
  }
  return includePath;
}

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `template` is not set, the file specified in `options.filename` will be
 * read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @memberof module:ejs-internal
 * @param {Options} options   compilation options
 * @param {String} [template] template source
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned.
 * @static
 */

function handleCache(options, template) {
  var func;
  var filename = options.filename;
  var hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!filename) {
      throw new Error('cache option requires a filename');
    }
    func = exports.cache.get(filename);
    if (func) {
      return func;
    }
    if (!hasTemplate) {
      template = fileLoader(filename).toString().replace(_BOM, '');
    }
  }
  else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!filename) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fileLoader(filename).toString().replace(_BOM, '');
  }
  func = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(filename, func);
  }
  return func;
}

/**
 * Try calling handleCache with the given options and data and call the
 * callback with the result. If an error occurs, call the callback with
 * the error. Used by renderFile().
 *
 * @memberof module:ejs-internal
 * @param {Options} options    compilation options
 * @param {Object} data        template data
 * @param {RenderFileCallback} cb callback
 * @static
 */

function tryHandleCache(options, data, cb) {
  var result;
  try {
    result = handleCache(options)(data);
  }
  catch (err) {
    return cb(err);
  }
  return cb(null, result);
}

/**
 * fileLoader is independent
 *
 * @param {String} filePath ejs file path.
 * @return {String} The contents of the specified file.
 * @static
 */

function fileLoader(filePath){
  return exports.fileLoader(filePath);
}

/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned
 * @static
 */

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options);
  opts.filename = getIncludePath(path, opts);
  return handleCache(opts);
}

/**
 * Get the JavaScript source of an included file.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {Object}
 * @static
 */

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options);
  var includePath;
  var template;
  includePath = getIncludePath(path, opts);
  template = fileLoader(includePath).toString().replace(_BOM, '');
  opts.filename = includePath;
  var templ = new Template(template, opts);
  templ.generateSource();
  return {
    source: templ.source,
    filename: includePath,
    template: template
  };
}

/**
 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
 * `lineno`.
 *
 * @implements RethrowCallback
 * @memberof module:ejs-internal
 * @param {Error}  err      Error object
 * @param {String} str      EJS source
 * @param {String} filename file name of the EJS file
 * @param {String} lineno   line number of the error
 * @static
 */

function rethrow(err, str, flnm, lineno, esc){
  var lines = str.split('\n');
  var start = Math.max(lineno - 3, 0);
  var end = Math.min(lines.length, lineno + 3);
  var filename = esc(flnm); // eslint-disable-line
  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
}

function stripSemi(str){
  return str.replace(/;(\s*$)/, '$1');
}

/**
 * Compile the given `str` of ejs into a template function.
 *
 * @param {String}  template EJS template
 *
 * @param {Options} opts     compilation options
 *
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `opts.client`, either type might be returned.
 * @public
 */

exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned){
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};

/**
 * Render the given `template` of ejs.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}   template EJS template
 * @param {Object}  [data={}] template data
 * @param {Options} [opts={}] compilation and rendering options
 * @return {String}
 * @public
 */

exports.render = function (template, d, o) {
  var data = d || {};
  var opts = o || {};

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    utils.shallowCopyFromList(opts, data, _OPTS);
  }

  return handleCache(opts, template)(data);
};

/**
 * Render an EJS file at the given `path` and callback `cb(err, str)`.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}             path     path to the EJS file
 * @param {Object}            [data={}] template data
 * @param {Options}           [opts={}] compilation and rendering options
 * @param {RenderFileCallback} cb callback
 * @public
 */

exports.renderFile = function () {
  var filename = arguments[0];
  var cb = arguments[arguments.length - 1];
  var opts = {filename: filename};
  var data;

  if (arguments.length > 2) {
    data = arguments[1];

    // No options object -- if there are optiony names
    // in the data, copy them to options
    if (arguments.length === 3) {
      // Express 4
      if (data.settings) {
        if (data.settings['view options']) {
          utils.shallowCopyFromList(opts, data.settings['view options'], _OPTS_EXPRESS);
        }
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
      }
      // Express 3 and lower
      else {
        utils.shallowCopyFromList(opts, data, _OPTS_EXPRESS);
      }
    }
    else {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, arguments[2]);
    }

    opts.filename = filename;
  }
  else {
    data = {};
  }

  return tryHandleCache(opts, data, cb);
};

/**
 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
 * @public
 */

exports.clearCache = function () {
  exports.cache.reset();
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  this.dependencies = [];
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options.strict = opts.strict || false;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  options.root = opts.root;
  options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
  options.views = opts.views;

  if (options.strict) {
    options._with = false;
  }
  else {
    options._with = typeof opts._with != 'undefined' ? opts._with : true;
  }

  this.opts = options;

  this.regex = this.createRegex();
}

Template.modes = {
  EVAL: 'eval',
  ESCAPED: 'escaped',
  RAW: 'raw',
  COMMENT: 'comment',
  LITERAL: 'literal'
};

Template.prototype = {
  createRegex: function () {
    var str = _REGEX_STRING;
    var delim = utils.escapeRegExpChars(this.opts.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  },

  compile: function () {
    var src;
    var fn;
    var opts = this.opts;
    var prepended = '';
    var appended = '';
    var escapeFn = opts.escapeFunction;

    if (!this.source) {
      this.generateSource();
      prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
      if (opts._with !== false) {
        prepended +=  '  with (' + opts.localsName + ' || {}) {' + '\n';
        appended += '  }' + '\n';
      }
      appended += '  return __output.join("");' + '\n';
      this.source = prepended + this.source + appended;
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' + '\n'
          + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
          + '  , __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') + ';' + '\n'
          + 'try {' + '\n'
          + this.source
          + '} catch (e) {' + '\n'
          + '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
          + '}' + '\n';
    }
    else {
      src = this.source;
    }

    if (opts.client) {
      src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
      }
    }

    if (opts.strict) {
      src = '"use strict";\n' + src;
    }
    if (opts.debug) {
      console.log(src);
    }

    try {
      fn = new Function(opts.localsName + ', escapeFn, include, rethrow', src);
    }
    catch(e) {
      // istanbul ignore else
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs\n\n';
        e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
        e.message += 'https://github.com/RyanZim/EJS-Lint';
      }
      throw e;
    }

    if (opts.client) {
      fn.dependencies = this.dependencies;
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    // Adds a local `include` function which allows full recursive include
    var returnedFn = function (data) {
      var include = function (path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn.apply(opts.context, [data || {}, escapeFn, include, rethrow]);
    };
    returnedFn.dependencies = this.dependencies;
    return returnedFn;
  },

  generateSource: function () {
    var opts = this.opts;

    if (opts.rmWhitespace) {
      // Have to use two separate replace here as `^` and `$` operators don't
      // work well with `\r`.
      this.templateText =
        this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
    }

    // Slurp spaces and tabs before <%_ and after _%>
    this.templateText =
      this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

    var self = this;
    var matches = this.parseTemplateText();
    var d = this.opts.delimiter;

    if (matches && matches.length) {
      matches.forEach(function (line, index) {
        var opening;
        var closing;
        var include;
        var includeOpts;
        var includeObj;
        var includeSrc;
        // If this is an opening tag, check for closing tags
        // FIXME: May end up with some false positives here
        // Better to store modes as k/v with '<' + delimiter as key
        // Then this can simply check against the map
        if ( line.indexOf('<' + d) === 0        // If it is a tag
          && line.indexOf('<' + d + d) !== 0) { // and is not escaped
          closing = matches[index + 2];
          if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>')) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        // HACK: backward-compat `include` preprocessor directives
        if ((include = line.match(/^\s*include\s+(\S+)/))) {
          opening = matches[index - 1];
          // Must be in EVAL or RAW mode
          if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_')) {
            includeOpts = utils.shallowCopy({}, self.opts);
            includeObj = includeSource(include[1], includeOpts);
            if (self.opts.compileDebug) {
              includeSrc =
                  '    ; (function(){' + '\n'
                  + '      var __line = 1' + '\n'
                  + '      , __lines = ' + JSON.stringify(includeObj.template) + '\n'
                  + '      , __filename = ' + JSON.stringify(includeObj.filename) + ';' + '\n'
                  + '      try {' + '\n'
                  + includeObj.source
                  + '      } catch (e) {' + '\n'
                  + '        rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
                  + '      }' + '\n'
                  + '    ; }).call(this)' + '\n';
            }else{
              includeSrc = '    ; (function(){' + '\n' + includeObj.source +
                  '    ; }).call(this)' + '\n';
            }
            self.source += includeSrc;
            self.dependencies.push(exports.resolveInclude(include[1],
                includeOpts.filename));
            return;
          }
        }
        self.scanLine(line);
      });
    }

  },

  parseTemplateText: function () {
    var str = this.templateText;
    var pat = this.regex;
    var result = pat.exec(str);
    var arr = [];
    var firstPos;

    while (result) {
      firstPos = result.index;

      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }

      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }

    if (str) {
      arr.push(str);
    }

    return arr;
  },

  _addOutput: function (line) {
    if (this.truncate) {
      // Only replace single leading linebreak in the line after
      // -%> tag -- this is the single, trailing linebreak
      // after the tag that the truncation mode replaces
      // Handle Win / Unix / old Mac linebreaks -- do the \r\n
      // combo first in the regex-or
      line = line.replace(/^(?:\r\n|\r|\n)/, '');
      this.truncate = false;
    }
    else if (this.opts.rmWhitespace) {
      // rmWhitespace has already removed trailing spaces, just need
      // to remove linebreaks
      line = line.replace(/^\n/, '');
    }
    if (!line) {
      return line;
    }

    // Preserve literal slashes
    line = line.replace(/\\/g, '\\\\');

    // Convert linebreaks
    line = line.replace(/\n/g, '\\n');
    line = line.replace(/\r/g, '\\r');

    // Escape double-quotes
    // - this will be the delimiter during execution
    line = line.replace(/"/g, '\\"');
    this.source += '    ; __append("' + line + '")' + '\n';
  },

  scanLine: function (line) {
    var self = this;
    var d = this.opts.delimiter;
    var newLineCount = 0;

    newLineCount = (line.split('\n').length - 1);

    switch (line) {
    case '<' + d:
    case '<' + d + '_':
      this.mode = Template.modes.EVAL;
      break;
    case '<' + d + '=':
      this.mode = Template.modes.ESCAPED;
      break;
    case '<' + d + '-':
      this.mode = Template.modes.RAW;
      break;
    case '<' + d + '#':
      this.mode = Template.modes.COMMENT;
      break;
    case '<' + d + d:
      this.mode = Template.modes.LITERAL;
      this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
      break;
    case d + d + '>':
      this.mode = Template.modes.LITERAL;
      this.source += '    ; __append("' + line.replace(d + d + '>', d + '>') + '")' + '\n';
      break;
    case d + '>':
    case '-' + d + '>':
    case '_' + d + '>':
      if (this.mode == Template.modes.LITERAL) {
        this._addOutput(line);
      }

      this.mode = null;
      this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
      break;
    default:
        // In script mode, depends on type of tag
      if (this.mode) {
          // If '//' is found without a line break, add a line break.
        switch (this.mode) {
        case Template.modes.EVAL:
        case Template.modes.ESCAPED:
        case Template.modes.RAW:
          if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
            line += '\n';
          }
        }
        switch (this.mode) {
            // Just executing code
        case Template.modes.EVAL:
          this.source += '    ; ' + line + '\n';
          break;
            // Exec, esc, and output
        case Template.modes.ESCAPED:
          this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
          break;
            // Exec and output
        case Template.modes.RAW:
          this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
          break;
        case Template.modes.COMMENT:
              // Do nothing
          break;
            // Literal <%% mode, append as raw output
        case Template.modes.LITERAL:
          this._addOutput(line);
          break;
        }
      }
        // In string mode, just add the output
      else {
        this._addOutput(line);
      }
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += '    ; __line = ' + this.currentLine + '\n';
    }
  }
};

/**
 * Escape characters reserved in XML.
 *
 * This is simply an export of {@link module:utils.escapeXML}.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @public
 * @func
 * */
exports.escapeXML = utils.escapeXML;

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */

exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if (require.extensions) {
  require.extensions['.ejs'] = function (module, flnm) {
    var filename = flnm || /* istanbul ignore next */ module.filename;
    var options = {
      filename: filename,
      client: true
    };
    var template = fileLoader(filename).toString();
    var fn = exports.compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

/**
 * Version of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.VERSION = _VERSION_STRING;

/**
 * Name for detection of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.name = _NAME;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}

},{"../package.json":29,"./utils":28,"fs":26,"path":39}],28:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

/**
 * Private utility functions
 * @module utils
 * @private
 */

'use strict';

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

/**
 * Escape characters reserved in regular expressions.
 *
 * If `string` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} string Input string
 * @return {String} Escaped string
 * @static
 * @private
 */
exports.escapeRegExpChars = function (string) {
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
};

var _ENCODE_HTML_RULES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;'
};
var _MATCH_HTML = /[&<>\'"]/g;

function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
}

/**
 * Stringified version of constants used by {@link module:utils.escapeXML}.
 *
 * It is used in the process of generating {@link ClientFunction}s.
 *
 * @readonly
 * @type {String}
 */

var escapeFuncStr =
  'var _ENCODE_HTML_RULES = {\n'
+ '      "&": "&amp;"\n'
+ '    , "<": "&lt;"\n'
+ '    , ">": "&gt;"\n'
+ '    , \'"\': "&#34;"\n'
+ '    , "\'": "&#39;"\n'
+ '    }\n'
+ '  , _MATCH_HTML = /[&<>\'"]/g;\n'
+ 'function encode_char(c) {\n'
+ '  return _ENCODE_HTML_RULES[c] || c;\n'
+ '};\n';

/**
 * Escape characters reserved in XML.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @implements {EscapeCallback}
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @static
 * @private
 */

exports.escapeXML = function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(_MATCH_HTML, encode_char);
};
exports.escapeXML.toString = function () {
  return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr;
};

/**
 * Naive copy of properties from one object to another.
 * Does not recurse into non-scalar properties
 * Does not check to see if the property has a value before copying
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopy = function (to, from) {
  from = from || {};
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

/**
 * Naive copy of a list of key names, from one object to another.
 * Only copies property if it is actually defined
 * Does not recurse into non-scalar properties
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @param  {Array} list List of properties to copy
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopyFromList = function (to, from, list) {
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    if (typeof from[p] != 'undefined') {
      to[p] = from[p];
    }
  }
  return to;
};

/**
 * Simple in-process cache implementation. Does not implement limits of any
 * sort.
 *
 * @implements Cache
 * @static
 * @private
 */
exports.cache = {
  _data: {},
  set: function (key, val) {
    this._data[key] = val;
  },
  get: function (key) {
    return this._data[key];
  },
  reset: function () {
    this._data = {};
  }
};

},{}],29:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "raw": "ejs",
        "scope": null,
        "escapedName": "ejs",
        "name": "ejs",
        "rawSpec": "",
        "spec": "latest",
        "type": "tag"
      },
      "/home/k1r0s/Works/cmp-full-test"
    ]
  ],
  "_from": "ejs@latest",
  "_id": "ejs@2.5.7",
  "_inCache": true,
  "_location": "/ejs",
  "_nodeVersion": "6.9.1",
  "_npmOperationalInternal": {
    "host": "s3://npm-registry-packages",
    "tmp": "tmp/ejs-2.5.7.tgz_1501385411193_0.3807816591579467"
  },
  "_npmUser": {
    "name": "mde",
    "email": "mde@fleegix.org"
  },
  "_npmVersion": "3.10.8",
  "_phantomChildren": {},
  "_requested": {
    "raw": "ejs",
    "scope": null,
    "escapedName": "ejs",
    "name": "ejs",
    "rawSpec": "",
    "spec": "latest",
    "type": "tag"
  },
  "_requiredBy": [
    "#USER",
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/ejs/-/ejs-2.5.7.tgz",
  "_shasum": "cc872c168880ae3c7189762fd5ffc00896c9518a",
  "_shrinkwrap": null,
  "_spec": "ejs",
  "_where": "/home/k1r0s/Works/cmp-full-test",
  "author": {
    "name": "Matthew Eernisse",
    "email": "mde@fleegix.org",
    "url": "http://fleegix.org"
  },
  "bugs": {
    "url": "https://github.com/mde/ejs/issues"
  },
  "contributors": [
    {
      "name": "Timothy Gu",
      "email": "timothygu99@gmail.com",
      "url": "https://timothygu.github.io"
    }
  ],
  "dependencies": {},
  "description": "Embedded JavaScript templates",
  "devDependencies": {
    "browserify": "^13.0.1",
    "eslint": "^3.0.0",
    "git-directory-deploy": "^1.5.1",
    "istanbul": "~0.4.3",
    "jake": "^8.0.0",
    "jsdoc": "^3.4.0",
    "lru-cache": "^4.0.1",
    "mocha": "^3.0.2",
    "uglify-js": "^2.6.2"
  },
  "directories": {},
  "dist": {
    "shasum": "cc872c168880ae3c7189762fd5ffc00896c9518a",
    "tarball": "https://registry.npmjs.org/ejs/-/ejs-2.5.7.tgz"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/mde/ejs",
  "keywords": [
    "template",
    "engine",
    "ejs"
  ],
  "license": "Apache-2.0",
  "main": "./lib/ejs.js",
  "maintainers": [
    {
      "name": "mde",
      "email": "mde@fleegix.org"
    }
  ],
  "name": "ejs",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git://github.com/mde/ejs.git"
  },
  "scripts": {
    "coverage": "istanbul cover node_modules/mocha/bin/_mocha",
    "devdoc": "jake doc[dev]",
    "doc": "jake doc",
    "lint": "eslint \"**/*.js\" Jakefile",
    "test": "jake test"
  },
  "version": "2.5.7"
}

},{}],30:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],31:[function(require,module,exports){
module.exports = require("./lib/index").Advices;

},{"./lib/index":33}],32:[function(require,module,exports){
module.exports = require("./lib/index").Class;

},{"./lib/index":33}],33:[function(require,module,exports){
var Class = require("./src/Class");
var Advices = require("./src/Advices");
var UseExternal = require("./src/UseExternal");

var lib = {
    Class: Class,
    Advices: Advices,
    use: UseExternal
};

if (typeof module === "object") {
    module.exports = lib;
} else if (window) {
    window.kaop = lib;
}

/**
 * built in Advices
 */

 /* istanbul ignore next */
Advices.add(
    function override() {
        meta.args.unshift(meta.parentScope[meta.methodName].bind(this));
    }
);

},{"./src/Advices":34,"./src/Class":35,"./src/UseExternal":37}],34:[function(require,module,exports){
var Iteration = require("./Iteration");
var Utils = require("./Utils");

module.exports = Advices = {
    locals: {},
    pool: [],
    add: function() {
        for (var i = 0; i < arguments.length; i++) {
            Advices.pool.push(arguments[i]);
        }
    },
    bootstrap: function(config) {
        if (!(
                config.propertyValue &&
                Utils.isValidStructure(config.propertyValue) &&
                Utils.isRightImplemented(config.propertyValue, Advices.pool)
            )) {
            return config.propertyValue;
        }

        return function() {

            var executionProps = {
                method: Utils.getMethod(config.propertyValue),
                methodName: config.propertyName,
                scope: this,
                parentScope: config.sourceClass.prototype,
                args: Array.prototype.slice.call(arguments),
                result: undefined
            };

            new Iteration(config.propertyValue, executionProps, Advices.pool, Advices.locals);

            return executionProps.result;
        };
    }
};

},{"./Iteration":36,"./Utils":38}],35:[function(require,module,exports){
var Advices = require("./Advices");

var Class = function(sourceClass, extendedProperties, _static) {

    var inheritedProperties = Object.create(sourceClass.prototype);

    for (var propertyName in extendedProperties) {
        inheritedProperties[propertyName] = Advices.bootstrap({
            sourceClass: sourceClass,
            propertyName: propertyName,
            propertyValue: extendedProperties[propertyName]
        });
    }

    if (!_static) {
        var extendedClass = function() {
            try {
                for (var propertyName in this) {
                    if (Utils.isFunction(this[propertyName])) {
                        this[propertyName] = this[propertyName].bind(this);
                    } else if (extendedProperties.hasOwnProperty(propertyName)) {
                        // FIXME https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
                        // clone js objects, avoid reference point
                        var tmp = JSON.parse(JSON.stringify(extendedProperties[propertyName]));
                        this[propertyName] = tmp;
                    }
                }
            } finally {
                if (typeof this.constructor === "function") this.constructor.apply(this, arguments);
                return this;
            }
        };

        extendedClass.prototype = inheritedProperties;
        return extendedClass;
    } else {
        return inheritedProperties;
    }
};

var exp = function(mainProps) {
    return Class(function() {}, mainProps);
};
exp.inherits = Class;
exp.static = function(mainProps) {
    return Class(function() {}, mainProps, true);
};

module.exports = exp;

},{"./Advices":34}],36:[function(require,module,exports){
var Utils = require("./Utils");

module.exports = Iteration = function(definitionArray, props, pool, locals) {
    if (!definitionArray.length) {
        return;
    }
    this.index = -1;
    this.step = function() {
        this.index++;
        var currentStep = definitionArray[this.index];
        if (typeof currentStep === "function") {
            props.result = currentStep.apply(props.scope, props.args);
            this.step();
        } else if (typeof currentStep === "string") {
            var step = Utils.getAdviceImp(currentStep);
            var rawAdviceFn = Utils.getAdviceFn(step.name, pool);
            var transpiledMethod = Utils.transpileMethod(rawAdviceFn, props, arguments.callee.bind(this), locals);
            if (step.args) {
                eval("transpiledMethod.call(props.scope, " + step.args + ")");
            } else {
                eval("transpiledMethod.call(props.scope)");
            }
        }
    };
    this.step();
};

},{"./Utils":38}],37:[function(require,module,exports){
var Advices = require("./Advices");

module.exports = UseExternal = function(module){
    function checkDependency(dep){
        if(!Advices.locals[dep]) throw new Error("unmet dependency: " + dep);
    }

    module.dependencies.forEach(checkDependency);

    module.advices.forEach(Advices.add, Advices);
};

},{"./Advices":34}],38:[function(require,module,exports){
module.exports = Utils = {
    transpileMethod: function(method, meta, next, locals) {
        var methodToString = method.toString();
        var functionBody = methodToString
            .substring(methodToString.indexOf("{") + 1, methodToString.lastIndexOf("}"));
        var functionArguments = methodToString
            .substring(methodToString.indexOf("(") + 1, methodToString.indexOf(")"));

        if (!functionBody.match(/[^a-zA-Z_$]next[^a-zA-Z_$0-9]/g)) {
            functionBody += "\nnext();";
        }

        var transpiledFunction = "(function(" + functionArguments + ")\n{ " + functionBody + " \n})";
        var names = Object.keys(locals);
        for (var i = 0; i < names.length; i++) {
            eval("var " + names[i] + " = locals[names[i]]");
        }
        return eval(transpiledFunction);
    },
    getAdviceImp: function(rawAdviceCall) {
        return {
            name: rawAdviceCall.split(":")[0],
            args: rawAdviceCall.split(":")[1]
        };
    },
    isRightImplemented: function(array, advicePool) {
        var completeAdviceNameList = advicePool
            .map(function(advice) {
                return advice.name;
            });
        var implementedNames = array.filter(Utils.isString)
                    .map(function(adviceImplementation){
                        return adviceImplementation.split(":").shift().trim();
                    });

        return implementedNames.every(function(adviceName) {
                                return completeAdviceNameList.indexOf(adviceName) > -1;
                            });
    },
    isValidStructure: function(implementation) {
        return implementation instanceof Array && implementation.some(Utils.isFunction);
    },
    getMethod: function(array) {
        return array.find(function(item) {
            return typeof item === "function";
        });
    },
    isFunction: function(item) {
        return typeof item === "function";
    },
    isString: function(item) {
        return typeof item === "string";
    },
    getAdviceFn: function(fname, advicePool) {
        return advicePool.find(function(adv) {
            return adv.name === fname;
        });
    }
};

},{}],39:[function(require,module,exports){
(function (process){
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

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

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

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
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

}).call(this,require('_process'))
},{"_process":41}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _searchParams = require('search-params');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultOrConstrained = function defaultOrConstrained(match) {
    return '(' + (match ? match.replace(/(^<|>$)/g, '') : '[a-zA-Z0-9-_.~%\':]+') + ')';
};

var rules = [{
    // An URL can contain a parameter :paramName
    // - and _ are allowed but not in last position
    name: 'url-parameter',
    pattern: /^:([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
    regex: function regex(match) {
        return new RegExp(defaultOrConstrained(match[2]));
    }
}, {
    // Url parameter (splat)
    name: 'url-parameter-splat',
    pattern: /^\*([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/,
    regex: /([^\?]*)/
}, {
    name: 'url-parameter-matrix',
    pattern: /^\;([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(<(.+?)>)?/,
    regex: function regex(match) {
        return new RegExp(';' + match[1] + '=' + defaultOrConstrained(match[2]));
    }
}, {
    // Query parameter: ?param1&param2
    //                   ?:param1&:param2
    name: 'query-parameter-bracket',
    pattern: /^(?:\?|&)(?:\:)?([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})(?:\[\])/
}, {
    // Query parameter: ?param1&param2
    //                   ?:param1&:param2
    name: 'query-parameter',
    pattern: /^(?:\?|&)(?:\:)?([a-zA-Z0-9-_]*[a-zA-Z0-9]{1})/
}, {
    // Delimiter /
    name: 'delimiter',
    pattern: /^(\/|\?)/,
    regex: function regex(match) {
        return new RegExp('\\' + match[0]);
    }
}, {
    // Sub delimiters
    name: 'sub-delimiter',
    pattern: /^(\!|\&|\-|_|\.|;)/,
    regex: function regex(match) {
        return new RegExp(match[0]);
    }
}, {
    // Unmatched fragment (until delimiter is found)
    name: 'fragment',
    pattern: /^([0-9a-zA-Z]+)/,
    regex: function regex(match) {
        return new RegExp(match[0]);
    }
}];

var exists = function exists(val) {
    return val !== undefined && val !== null;
};

var tokenise = function tokenise(str) {
    var tokens = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    // Look for a matching rule
    var matched = rules.some(function (rule) {
        var match = str.match(rule.pattern);
        if (!match) return false;

        tokens.push({
            type: rule.name,
            match: match[0],
            val: match.slice(1, 2),
            otherVal: match.slice(2),
            regex: rule.regex instanceof Function ? rule.regex(match) : rule.regex
        });

        if (match[0].length < str.length) tokens = tokenise(str.substr(match[0].length), tokens);
        return true;
    });

    // If no rules matched, throw an error (possible malformed path)
    if (!matched) {
        throw new Error('Could not parse path.');
    }
    // Return tokens
    return tokens;
};

var optTrailingSlash = function optTrailingSlash(source, trailingSlash) {
    if (!trailingSlash) return source;
    return source.replace(/\\\/$/, '') + '(?:\\/)?';
};

var upToDelimiter = function upToDelimiter(source, delimiter) {
    if (!delimiter) return source;

    return (/(\/)$/.test(source) ? source : source + '(\\/|\\?|\\.|;|$)'
    );
};

var appendQueryParam = function appendQueryParam(params, param) {
    var val = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    if (/\[\]$/.test(param)) {
        param = (0, _searchParams.withoutBrackets)(param);
        val = [val];
    }
    var existingVal = params[param];

    if (existingVal === undefined) params[param] = val;else params[param] = Array.isArray(existingVal) ? existingVal.concat(val) : [existingVal, val];

    return params;
};

var parseQueryParams = function parseQueryParams(path) {
    var searchPart = (0, _searchParams.getSearch)(path);
    if (!searchPart) return {};

    return (0, _searchParams.toObject)((0, _searchParams.parse)(searchPart));
};

function _serialise(key, val) {
    if (Array.isArray(val)) {
        return val.map(function (v) {
            return _serialise(key, v);
        }).join('&');
    }

    if (val === true) {
        return key;
    }

    return key + '=' + val;
}

var Path = function () {
    _createClass(Path, null, [{
        key: 'createPath',
        value: function createPath(path) {
            return new Path(path);
        }
    }, {
        key: 'serialise',
        value: function serialise(key, val) {
            return _serialise(key, val);
        }
    }]);

    function Path(path) {
        _classCallCheck(this, Path);

        if (!path) throw new Error('Please supply a path');
        this.path = path;
        this.tokens = tokenise(path);

        this.hasUrlParams = this.tokens.filter(function (t) {
            return (/^url-parameter/.test(t.type)
            );
        }).length > 0;
        this.hasSpatParam = this.tokens.filter(function (t) {
            return (/splat$/.test(t.type)
            );
        }).length > 0;
        this.hasMatrixParams = this.tokens.filter(function (t) {
            return (/matrix$/.test(t.type)
            );
        }).length > 0;
        this.hasQueryParams = this.tokens.filter(function (t) {
            return (/^query-parameter/.test(t.type)
            );
        }).length > 0;
        // Extract named parameters from tokens
        this.spatParams = this._getParams('url-parameter-splat');
        this.urlParams = this._getParams(/^url-parameter/);
        // Query params
        this.queryParams = this._getParams('query-parameter');
        this.queryParamsBr = this._getParams('query-parameter-bracket');
        // All params
        this.params = this.urlParams.concat(this.queryParams).concat(this.queryParamsBr);
        // Check if hasQueryParams
        // Regular expressions for url part only (full and partial match)
        this.source = this.tokens.filter(function (t) {
            return t.regex !== undefined;
        }).map(function (r) {
            return r.regex.source;
        }).join('');
    }

    _createClass(Path, [{
        key: '_getParams',
        value: function _getParams(type) {
            var predicate = type instanceof RegExp ? function (t) {
                return type.test(t.type);
            } : function (t) {
                return t.type === type;
            };

            return this.tokens.filter(predicate).map(function (t) {
                return t.val[0];
            });
        }
    }, {
        key: '_isQueryParam',
        value: function _isQueryParam(name) {
            return this.queryParams.indexOf(name) !== -1 || this.queryParamsBr.indexOf(name) !== -1;
        }
    }, {
        key: '_urlTest',
        value: function _urlTest(path, regex) {
            var _this = this;

            var match = path.match(regex);
            if (!match) return null;else if (!this.urlParams.length) return {};
            // Reduce named params to key-value pairs
            return match.slice(1, this.urlParams.length + 1).reduce(function (params, m, i) {
                params[_this.urlParams[i]] = decodeURIComponent(m);
                return params;
            }, {});
        }
    }, {
        key: 'test',
        value: function test(path, opts) {
            var _this2 = this;

            var options = _extends({ trailingSlash: false }, opts);
            // trailingSlash: falsy => non optional, truthy => optional
            var source = optTrailingSlash(this.source, options.trailingSlash);
            // Check if exact match
            var matched = this._urlTest(path, new RegExp('^' + source + (this.hasQueryParams ? '(\\?.*$|$)' : '$')));
            // If no match, or no query params, no need to go further
            if (!matched || !this.hasQueryParams) return matched;
            // Extract query params
            var queryParams = parseQueryParams(path);
            var unexpectedQueryParams = Object.keys(queryParams).filter(function (p) {
                return _this2.queryParams.concat(_this2.queryParamsBr).indexOf(p) === -1;
            });

            if (unexpectedQueryParams.length === 0) {
                // Extend url match
                Object.keys(queryParams).forEach(function (p) {
                    return matched[p] = queryParams[p];
                });

                return matched;
            }

            return null;
        }
    }, {
        key: 'partialTest',
        value: function partialTest(path, opts) {
            var _this3 = this;

            var options = _extends({ delimited: true }, opts);
            // Check if partial match (start of given path matches regex)
            // trailingSlash: falsy => non optional, truthy => optional
            var source = upToDelimiter(this.source, options.delimited);
            var match = this._urlTest(path, new RegExp('^' + source));

            if (!match) return match;

            if (!this.hasQueryParams) return match;

            var queryParams = parseQueryParams(path);

            Object.keys(queryParams).filter(function (p) {
                return _this3.queryParams.concat(_this3.queryParamsBr).indexOf(p) >= 0;
            }).forEach(function (p) {
                return appendQueryParam(match, p, queryParams[p]);
            });

            return match;
        }
    }, {
        key: 'build',
        value: function build() {
            var _this4 = this;

            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var options = _extends({ ignoreConstraints: false, ignoreSearch: false }, opts);
            var encodedParams = Object.keys(params).reduce(function (acc, key) {
                if (!exists(params[key])) {
                    return acc;
                }

                var val = params[key];
                var encode = _this4._isQueryParam(key) ? encodeURIComponent : encodeURI;

                if (typeof val === 'boolean') {
                    acc[key] = val;
                } else if (Array.isArray(val)) {
                    acc[key] = val.map(encode);
                } else {
                    acc[key] = encode(val);
                }

                return acc;
            }, {});

            // Check all params are provided (not search parameters which are optional)
            if (this.urlParams.some(function (p) {
                return !exists(encodedParams[p]);
            })) throw new Error('Missing parameters');

            // Check constraints
            if (!options.ignoreConstraints) {
                var constraintsPassed = this.tokens.filter(function (t) {
                    return (/^url-parameter/.test(t.type) && !/-splat$/.test(t.type)
                    );
                }).every(function (t) {
                    return new RegExp('^' + defaultOrConstrained(t.otherVal[0]) + '$').test(encodedParams[t.val]);
                });

                if (!constraintsPassed) throw new Error('Some parameters are of invalid format');
            }

            var base = this.tokens.filter(function (t) {
                return (/^query-parameter/.test(t.type) === false
                );
            }).map(function (t) {
                if (t.type === 'url-parameter-matrix') return ';' + t.val + '=' + encodedParams[t.val[0]];
                return (/^url-parameter/.test(t.type) ? encodedParams[t.val[0]] : t.match
                );
            }).join('');

            if (options.ignoreSearch) return base;

            var queryParams = this.queryParams.concat(this.queryParamsBr.map(function (p) {
                return p + '[]';
            }));

            var searchPart = queryParams.filter(function (p) {
                return Object.keys(encodedParams).indexOf((0, _searchParams.withoutBrackets)(p)) !== -1;
            }).map(function (p) {
                return _serialise(p, encodedParams[(0, _searchParams.withoutBrackets)(p)]);
            }).join('&');

            return base + (searchPart ? '?' + searchPart : '');
        }
    }]);

    return Path;
}();

exports.default = Path;
module.exports = exports['default'];

},{"search-params":42}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
// Split path
var getPath = exports.getPath = function getPath(path) {
    return path.split('?')[0];
};
var getSearch = exports.getSearch = function getSearch(path) {
    return path.split('?')[1];
};

// Search param value
var isSerialisable = function isSerialisable(val) {
    return val !== undefined && val !== null && val !== '';
};

// Search param name
var bracketTest = /\[\]$/;
var hasBrackets = exports.hasBrackets = function hasBrackets(paramName) {
    return bracketTest.test(paramName);
};
var withoutBrackets = exports.withoutBrackets = function withoutBrackets(paramName) {
    return paramName.replace(bracketTest, '');
};

/**
 * Parse a querystring and return a list of params (Objects with name and value properties)
 * @param  {String} querystring The querystring to parse
 * @return {Array[Object]}      The list of params
 */
var parse = exports.parse = function parse(querystring) {
    return querystring.split('&').reduce(function (params, param) {
        var split = param.split('=');
        var name = split[0];
        var value = split[1];

        return params.concat(split.length === 1 ? { name: name, value: true } : { name: name, value: decodeURIComponent(value) });
    }, []);
};

/**
 * Reduce a list of parameters (returned by `.parse()``) to an object (key-value pairs)
 * @param  {Array} paramList The list of parameters returned by `.parse()`
 * @return {Object}          The object of parameters (key-value pairs)
 */
var toObject = exports.toObject = function toObject(paramList) {
    return paramList.reduce(function (params, _ref) {
        var name = _ref.name;
        var value = _ref.value;

        var isArray = hasBrackets(name);
        var currentValue = params[withoutBrackets(name)];

        if (currentValue === undefined) {
            params[withoutBrackets(name)] = isArray ? [value] : value;
        } else {
            params[withoutBrackets(name)] = [].concat(currentValue, value);
        }

        return params;
    }, {});
};

/**
 * Build a querystring from a list of parameters
 * @param  {Array} paramList The list of parameters (see `.parse()`)
 * @return {String}          The querystring
 */
var build = exports.build = function build(paramList) {
    return paramList.filter(function (_ref2) {
        var value = _ref2.value;
        return value !== undefined && value !== null;
    }).map(function (_ref3) {
        var name = _ref3.name;
        var value = _ref3.value;
        return value === true ? name : name + '=' + encodeURIComponent(value);
    }).join('&');
};

/**
 * Remove a list of parameters from a querystring
 * @param  {String} querystring  The original querystring
 * @param  {Array}  paramsToOmit The parameters to omit
 * @return {String}              The querystring
 */
var omit = exports.omit = function omit(querystring, paramsToOmit) {
    if (!querystring) return '';

    var remainingQueryParams = parse(querystring).filter(function (_ref4) {
        var name = _ref4.name;
        return paramsToOmit.indexOf(withoutBrackets(name)) === -1;
    });
    var remainingQueryString = build(remainingQueryParams);

    return remainingQueryString || '';
};
},{}],43:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],44:[function(require,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],45:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":43,"./lib/rng":44}],46:[function(require,module,exports){
var Advices = require("kaop/Advices");
var EventEmitter = require("./event-emitter");

Advices.locals.$EJS = require("ejs");
Advices.locals.$EJS.delimiter = "?";
Advices.locals.$axiosInstance = require("../services/request");
Advices.locals.$session = require("../services/sessionService");
Advices.locals.$EE = new EventEmitter();

Advices.add(
  function $emit(evid) {
    $EE.fire(evid, meta.result);
  },
  function $setupListeners() {
    var methods = Object.keys(meta.scope).filter(function(prop) { return typeof meta.scope[prop] === "function" })
    methods.filter(function(prop) { return prop.search("listen ") > -1 })
    .forEach(function(eventHandler){
      var evid = eventHandler.split(" ")[1];
      $EE.when(evid, meta.scope[eventHandler]);
    })
  },
  function $GET(resource) {
    $axiosInstance.get(resource, { params: meta.args[0] }).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $POST(resource) {
    $axiosInstance.post(resource, meta.args[0]).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $sessionCreate(resource) {
    meta.args.push($session.create(resource, meta.args[0]));
  },
  function $sessionRead(resource) {
    meta.args.push($session.read(resource, meta.args[0]));
  },
  function $PUT(resource) {
    $axiosInstance.put(resource + "/" + meta.args[0].id, meta.args[0]).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $DEL(resource) {
    $axiosInstance.delete(resource + "/" + meta.args[0].id).then(function(result){
      meta.args.push(result.data);
      next();
    })
  },
  function $ejsCompile() {
    if (!meta.scope.__compileFn) {
        meta.scope.__compileFn = $EJS.compile(meta.args[0], {
            context: meta.scope
        });
    }
    meta.args.push(meta.scope.__compileFn(null));
    next();
  },
  function $valueof(selector) {
    meta.args.unshift(meta.scope.q(selector).value);
  },
  function $registerDomListeners() {
    for (var prop in meta.scope) {
      if (meta.scope.hasOwnProperty(prop) && typeof meta.scope[prop] === "function") {
        meta.scope.on(prop, meta.scope[prop]);
      }
    }
  }
)

},{"../services/request":66,"../services/sessionService":67,"./event-emitter":48,"ejs":27,"kaop/Advices":31}],47:[function(require,module,exports){
var Class = require("kaop/Class");
var uuid = require("uuid/v1");

module.exports = Component = Class.inherits(HTMLElement, {
  selector: "x-base",
  uid: 0,
  el: null,
  css: null,
  template: "",
  html: "/empty/",
  props: {},
  constructor: [function(props) {
    this.props = props || {};
  }, "$setupListeners"],
  navigate: function(newUrl){
    newUrl = "#" + newUrl
    location.hash = newUrl;
  },
  set: function(key, val, silent) {
    this.props[key] = val;
    if(silent) { return; }
    if(!this.isRenderAllowed()) { return; }
    this.invalidate(this.template);
  },
  isRenderAllowed: function(){
    return true;
  },
  on: function(evt, handler) {
    var eventSplit = evt.split(" ");
    if(["click", "change", "keydown"].indexOf(eventSplit[0]) === -1) {
      return;
    }
    var targets = this.q(eventSplit[1], true);
    for (var i = 0; i < targets.length; i++) {
      targets[i].addEventListener(eventSplit[0], handler.bind(this));
    }
  },
  off: function(evt, handler) {
    var eventSplit = idEvent.split(" ");
    this.q(eventSplit[1]).removeEventListener(eventSplit[0], handler);
  },
  root: function() {
    var tmpNode = document.createElement(this.selector);
    this.uid = uuid();
    tmpNode.setAttribute("id", this.uid);
    var htmlRoot = tmpNode.outerHTML;
    this.html = htmlRoot;
    setTimeout(this.set, 0, "init", true);
    setTimeout(this.afterMount, 1);
    return htmlRoot;
  },
  invalidate: ["$ejsCompile", function(rawTemplate, compTemplate) {
    if (!this.el) {
      this.el = document.getElementById(this.uid);
    }
    this.replaceContent(compTemplate);

  }, "$registerDomListeners"],
  replaceContent: function(rawhtml) {
    if(this.css) {
      rawhtml += "<style>" + this.css + "</style>";
    }

    if(this.el) {
      this.el.innerHTML = rawhtml;
    }
  },
  q: function(selector, all) {
    if (all) {
      return (this.el || document).querySelectorAll(selector);
    }
    return (this.el || document).querySelector(selector);
  },
  afterMount: function(){}
})

},{"kaop/Class":32,"uuid/v1":45}],48:[function(require,module,exports){
var Class = require("kaop/Class");

module.exports = EventEmitter = Class({
    actions: [],
    when: function(idEvent, handler) {
        var actionStore = {
            id: idEvent,
            fn: handler
        };
        this.actions.push(actionStore);
    },
    fire: function(idEvent, subject) {
        for (var i = 0; i < this.actions.length; i++) {
            if (this.actions[i].id === idEvent) {
                if (subject) {
                    this.actions[i].fn.call(null, subject);
                } else {
                    this.actions[i].fn();
                }
            }
        }
    },
    ignore: function(idEvent) {
        var tmpActions = [];
        for (var i = 0; i < this.actions.length; i++) {
            if (this.actions[i].id !== idEvent) {
                tmpActions.push(this.actions[i]);
            }
        }
        this.actions = tmpActions;
    }
});

},{"kaop/Class":32}],49:[function(require,module,exports){
var Class = require("kaop/Class");
var Component = require("./component");
var path = require("path-parser");

module.exports = Router = Class.inherits(Component, {
  selector: "x-router",
  template: "",
  routePool: [],
  currentComponent: null,
  constructor: ["override", function(parent, props){
    parent(props);
    window.onhashchange = this.hashChange;
    setTimeout(this.navigate, 10, this.props.default);
    this.setup();
  }],
  setup: function(){
    Object.keys(this)
    .filter(function(prop){ return typeof this[prop] === "function"}.bind(this))
    .filter(function(prop){ return !prop.search("route ")})
    .forEach(function(prop){
      var route = prop.split(" ")[1];
      this.routePool.push({
        parser: new path(route),
        resolver: this[prop]
      })
    }, this);
  },
  navigate: function(newUrl){
    newUrl = "#" + newUrl
    if(newUrl === location.hash) {
      this.hashChange({ newURL: newUrl })
    } else {
      location.hash = newUrl;
    }
  },
  hashChange: function(e){
    var selectedRoute = e.newURL.split("#")[1];
    var selectedMatcher = this.routePool.find(function(matcher){
      var result = matcher.parser.test(selectedRoute);
      if(result) {
        this.currentComponent = matcher.resolver.call(this, result);
        this.replaceContent(this.currentComponent.root());
      }
      return !!result;
    }.bind(this))

    if(!selectedMatcher) {
      this.navigate(this.props.notFound || this.props.default);
    }
  }
})

},{"./component":47,"kaop/Class":32,"path-parser":40}],50:[function(require,module,exports){
var Class = require("kaop/Class");
var Router = require("../../common/router");

module.exports = AppRouter = Class.inherits(Router, {
  selector: "x-app-router",
  props: { default: "/profile/Aby", notFound: "/" },
  constructor: ["override", function(parent){
    parent(this.props);
  }],
  "route /": [function(){
    var home = new Home();
    return home;
  }, "$emit: 'list-mode'"],
  "route /chat/:name": [function(params){
    var chat = new Chat(params);
    return chat;
  }, "$emit: 'profile-mode'"],
  "route /profile/:name": [function(params){
    var profile = new Profile(params);
    return profile;
  }, "$emit: 'profile-mode'"],
})

},{"../../common/router":49,"kaop/Class":32}],51:[function(require,module,exports){
module.exports = "<div>\n  <?- new Nav().root() ?>\n</div>\n<div>\n  <?- new AppRouter().root() ?>\n</div>\n";

},{}],52:[function(require,module,exports){
var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = App = Class.inherits(Component, {
  selector: "x-app",
  template: require('./app.component.ejs'),
  constructor: ["override", function(parent, props) {
    parent(props);
  }],
  afterMount: function(profiles){
    this.sessionHandler();
  },
  sessionHandler: ["$GET: 'session'", function(session){
    storage.write("session", session);
    this.profilesHandler();
  }, "$emit: 'update-session'"],
  profilesHandler: ["$GET: 'profiles'", function(profiles){
    storage.write("profiles", profiles);
    return profiles;
  }, "$emit: 'update-profiles'"]
})

},{"../../common/component":47,"../../services/storage":68,"./app.component.ejs":51,"kaop/Class":32}],53:[function(require,module,exports){
module.exports = "x-chat .chat-container {\n    background: #e4e4e4;\n}\n\nx-chat .message-item {\n    margin: 10px 70px;\n    padding: 15px;\n    border-radius: 10px;\n    font-size: 20px;\n    position: relative;\n}\n\nx-chat .message-item span::after {\n  content: \"\\25BC\";\n  font-size: 70px;\n  position: absolute;\n  left: 0;\n  top: 0;\n  line-height: .48;\n}\n\nx-chat .textbox-container a.send{\n  position: fixed;\n  color: green;\n  font-size: 40px;\n  bottom: 0;\n  right: 0;\n  padding: 1vh 5vh;\n}\n\nx-chat .textbox-container a.send::after {\n  content: \"\\27A4\";\n}\n\nx-chat .message-item.from-selection {\n    background: lightblue;\n}\n\nx-chat .message-item.from-selection span::after {\n    color: lightblue;\n    margin-left: 195px;\n}\n\nx-chat .message-item.from-session {\n    background: lightgrey;\n}\n\nx-chat .message-item.from-session span::after {\n    color: lightgrey;\n    margin-left: -30px;\n}\n\nx-chat .chat-container {\n    background: #e4e4e4;\n    min-height: 91vh;\n    position: relative;\n    overflow: auto;\n    padding-bottom: 10vh;\n}\n\nx-chat .session-profile {\n    position: fixed;\n    bottom: 50px;\n    left: 15px;\n}\n\nx-chat .selection-profile {\n    position: fixed;\n    top: 70px;\n    right: 15px;\n}\n\nx-chat .textbox-container {\n    height: 30px;\n    position: fixed;\n    bottom:0%;\n    width:85%;\n    margin: 15px;\n\n}\n\nx-chat .textbox-container input {\n    width:100%;\n    background: #f1eeee;\n    padding: 10px;\n    border-radius: 5%;\n    border: none;\n}\n";

},{}],54:[function(require,module,exports){
module.exports = "<?\nthis.props.getChatClass = function(message){\n  return this.currentSession.id === message.fromId ? \"from-session\" : \"from-selection\";\n}\n\nthis.props.sortMessages = function(messageA, messageB) {\n  return new Date(messageA.timestamp).getTime() - new Date(messageB.timestamp).getTime();\n}\n?>\n\n<div class=\"chat-container\">\n  <div class=\"profile-min session-profile\">\n    <img src=\"<?= this.props.currentSession.profileImg ?>\">\n  </div>\n  <div class=\"profile-min selection-profile\">\n    <img src=\"<?= this.props.selectedProfile.profileImg ?>\">\n  </div>\n  <? this.props.messages.sort(this.props.sortMessages).forEach(function(message){ ?>\n    <div class=\"message-item <?= this.props.getChatClass(message) ?>\">\n\n      <span></span>\n      <?= message.content ?>\n    </div>\n  <? }, this) ?>\n</div>\n<div class=\"textbox-container\">\n  <input placeholder=\"Write a message\">\n  <a class=\"send\"></a>\n</div>\n";

},{}],55:[function(require,module,exports){
var Class = require("kaop/Class");
var Profile = require("../profile/profile.component");
var storage = require("../../services/storage");

module.exports = Chat = Class.inherits(Profile, {
  selector: "x-chat",
  template: require('./chat.component.ejs'),
  css: require('./chat.component.css'),
  constructor: ["override", function(parent, props){
    props.messages = [];
    parent(props);
    // kaop bug >.<!
    this.css = require('./chat.component.css');
  }],
  isRenderAllowed: ["override", function(parent){
    return this.props.messages instanceof Array &&
    this.props.currentSession &&
    parent();
  }],
  afterMount: ["override", function(parent){
    parent();
    this.set("messages", [], true);
    this.set("currentSession", storage.read("session"), true);
    this.messagesHandler({
      fromId: this.props.currentSession.id,
      toId: this.props.selectedProfile.id
    });
    this.messagesHandler({
      toId: this.props.currentSession.id,
      fromId: this.props.selectedProfile.id
    });
    // random message
    setTimeout(function(){
      this.addMessageHandler({
        "fromId": this.props.selectedProfile.id,
        "toId": this.props.currentSession.id,
        "content": "Hi, how are you! Wana some turing test?",
        "timestamp": new Date
      });
    }.bind(this), 1500);

  }],
  "click a.send": ["$valueof: '.textbox-container>input'", function(inputValue){
    if(!inputValue) { return; }
    this.addMessageHandler({
      "fromId": this.props.currentSession.id,
      "toId": this.props.selectedProfile.id,
      "content": inputValue,
      "timestamp": new Date
    });
  }],
  addMessageHandler: ["$sessionCreate: 'messages'", function(request, responseData){
    this.props.messages.push(responseData);
    this.set("messages", this.props.messages);
  }],
  messagesHandler: ["$sessionRead: 'messages'", function(request, responseData){
    this.set("messages", this.props.messages.concat(responseData));
  }]
})

},{"../../services/storage":68,"../profile/profile.component":64,"./chat.component.css":53,"./chat.component.ejs":54,"kaop/Class":32}],56:[function(require,module,exports){
module.exports = "x-home div {\n  padding: 20px;\n}\n\nx-home ul {\n  margin: 0;\n  padding: 0;\n}\n\nx-home li {\n  list-style: none;\n}\n\nx-home li a {\n  text-decoration: none;\n  cursor: pointer;\n}\n\nx-home li.list-item {\n  padding: 10px;\n  font-size: 1.5em;\n  color: #2a3031;\n}\n\nx-home .profile-min {\n    display: inline;\n    cursor: pointer;\n}\n\nx-home .profile-min .profile-name {\n    margin-left: 20px;\n    vertical-align: 3vh;\n    color: black;\n}\n";

},{}],57:[function(require,module,exports){
module.exports = "<div class=\"home-container\">\n  <ul>\n    <? this.props.profiles.forEach(function(profile) { ?>\n      <li class=\"list-item\">\n        <a href=\"#/profile/<?= profile.name ?>\">\n          <div class=\"profile-min\">\n            <img src=\"<?= profile.profileImg ?>\">\n            <span class=\"profile-name\"><?= profile.name ?></span>\n          </div>\n        </a>\n      </li>\n    <? }) ?>\n  </ul>\n</div>\n";

},{}],58:[function(require,module,exports){
var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = Home = Class.inherits(Component, {
  selector: "x-home",
  template: require('./home.component.ejs'),
  css: require('./home.component.css'),
  props: { profiles: [] },
  constructor: ["override", function(parent) {
    parent(this.props);
  }],
  "listen update-profiles": function(profiles){
    this.set("profiles", profiles);
  },
  afterMount: function(){
    this.getProfiles();
  },
  getProfiles: function(){
    var profiles = storage.read("profiles");
    this.set("profiles", profiles);
  }
})

},{"../../common/component":47,"../../services/storage":68,"./home.component.css":56,"./home.component.ejs":57,"kaop/Class":32}],59:[function(require,module,exports){
module.exports = "x-nav .menu {\n    background: #3a3a3a;\n    padding: 20px;\n    display: flex;\n}\n\nx-nav .menu ul {\n    margin: 0;\n    padding: 0;\n}\n\nx-nav li a {\n    text-decoration: none;\n    font-size: large;\n}\n\nx-nav .menu li {\n    list-style: none;\n}\n\nx-nav .menu a.a-left:after {\n  content: \"\\25C0\";\n}\n\nx-nav .menu * {\n  color: white;\n  font-weight: bold;\n  font-size: 25px;\n}\n\nx-nav .menu span {\n    margin: auto;\n}\n";

},{}],60:[function(require,module,exports){
module.exports = "<? if(this.props.profile) { ?>\n  <div class=\"menu profile-chat\">\n    <a class=\"a-left back\"></a>\n    <span><?= this.props.title ?></span>\n  </div>\n<? } else { ?>\n  <div class=\"menu\">\n    <ul>\n      <li>\n        <a href=\"#/profile/Me\">Profile</a>\n      </li>\n    </ul>\n  </div>\n<? } ?>\n";

},{}],61:[function(require,module,exports){
var Class = require("kaop/Class");
var Component = require("../../common/component");

module.exports = Nav = Class.inherits(Component, {
  selector: "x-nav",
  template: require('./nav.component.ejs'),
  css: require('./nav.component.css'),
  props: { profile: null },
  constructor: ["override", function(parent){
    parent(this.props);
  }],
  "listen profile-mode": function(profile){
    this.set("title", profile.props.routeName, true);
    this.set("profile", true);
  },
  "listen list-mode": function(){
    this.set("profile", false);
  },
  "click a.back": function(){
    if(location.hash.search("chat") > -1) {
      location.hash = location.hash.replace("chat", "profile");
    } else {
      this.navigate("/");
    }
  }
})

},{"../../common/component":47,"./nav.component.css":59,"./nav.component.ejs":60,"kaop/Class":32}],62:[function(require,module,exports){
module.exports = "x-profile .profile-content {\n    padding: 20px;\n    height: 85vh;\n    overflow: auto;\n}\n\nx-profile .profile-content.isFriend {\n    background: #e3baea;\n}\n\nx-profile .profile-content .profile-image {\n    height: 220px;\n    position: relative;\n}\n\nx-profile .profile-content .profile-image img {\n    margin: auto;\n    width: 200px;\n    border-radius: 100%;\n}\n\nx-profile .profile-content .profile-image {\n    display: flex;\n}\n\nx-profile .profile-content .profile-image .profile-status {\n    position: absolute;\n    right: 30px;\n    color: white;\n    font-weight: bold;\n    font-size: 18px;\n    width: 80px;\n    height: 80px;\n    border-radius: 100%;\n    text-align: center;\n    line-height: 4em;\n}\n\nx-profile span.online {\n    background: rgb(112, 214, 112);\n}\n\nx-profile span.offline {\n    background: rgb(255, 109, 109);\n}\n\nx-profile .profile-content .profile-summary .name-age {\n    font-size: 22px;\n}\n\nx-profile .profile-content .profile-summary .city {\n    color: #ff4c67;\n}\n\nx-profile .profile-content .profile-actions {\n  margin-top: 2vh;\n  display: inline-grid;\n  width: 90%;\n  position: fixed;\n  color: green;\n  bottom: 0;\n  right: 0;\n  padding: 1vh 5%;\n}\n\nx-profile .profile-content .profile-actions a {\n    bottom: 0;\n    display: grid;\n    background: #3a3a3a;\n    text-align: center;\n    padding: 10px;\n    color: white;\n    vertical-align: middle;\n    font-weight: bold;\n}\n\nx-profile .profile-content.isFriend .profile-actions a {\n  background: red;\n}\n";

},{}],63:[function(require,module,exports){
module.exports = "<?\nthis.props.getYearsOld = function(timestamp){\n  var today = new Date();\n  var birth = new Date(timestamp);\n  return today.getFullYear() - birth.getFullYear();\n}\n\nthis.props.capitalize = function(str) {\n    return str.replace(/(?:^|\\s)\\S/g, function(a) { return a.toUpperCase(); });\n};\n\nthis.props.getStatus = function() {\n  return this.selectedProfile.online ? \"online\": \"offline\";\n}\n\nvar defaultBio = \"Sit et aspernatur enim neque velit optio repellat. Sunt non sit soluta soluta vero rerum nulla. Consequatur facere ut doloremque blanditiis molestias similique ut ipsam. Quos fugit quisquam corrupti. Consequatur quasi aut blanditiis ut.\"\n\n?>\n\n<? if (!this.props.selectedProfile) { ?>\n  <div class=\"profile-content\">\n    <span>profile not found</span>\n  </div>\n<? } else { ?>\n  <div class=\"profile-content <?= !this.props.selectedProfile.friend || 'isFriend' ?>\">\n    <div class=\"profile-image\">\n      <? if(this.props.routeName !== \"Me\") { ?>\n        <span class=\"profile-status <?= this.props.getStatus() ?>\"><?= this.props.getStatus().toUpperCase() ?></span>\n      <? } ?>\n      <img src=\"<?= this.props.selectedProfile.profileImg ?>\">\n    </div>\n\n    <div class=\"profile-summary\">\n      <div>\n        <span class=\"name-age\">\n          <?= this.props.capitalize(this.props.selectedProfile.name) ?>,\n          <?= this.props.getYearsOld(this.props.selectedProfile.dob) ?>\n        </span>\n      </div>\n      <span class=\"city\"><?= this.props.selectedProfile.city ?></span>\n      <p><?= this.props.selectedProfile.bio || defaultBio ?></p>\n    </div>\n    <? if (this.props.routeName !== \"Me\") { ?>\n      <div class=\"profile-actions\">\n        <a class=\"add-friend\"><?= this.props.selectedProfile.friend ? 'Remove friend' : 'Add as friend'?></a>\n      </div>\n    <? } ?>\n  </div>\n<? } ?>\n";

},{}],64:[function(require,module,exports){
var Class = require("kaop/Class");
var Component = require("../../common/component");
var storage = require("../../services/storage");

module.exports = Profile = Class.inherits(Component, {
  selector: "x-profile",
  template: require('./profile.component.ejs'),
  css: require('./profile.component.css'),
  props: { selectedProfile: null, routeName: null },
  constructor: ["override", function(parent, props){
    props.routeName = props.name;
    props.selectedProfile = null;
    parent(props);
  }],
  isRenderAllowed: function(){
    return this.props.selectedProfile;
  },
  "listen update-profiles": function(){
    this.selectProfile();
  },
  "click .profile-image>img": function(){
    if(this.props.routeName === "Me") {
      return;
    }
    this.navigate("/chat/" + this.props.routeName);
  },
  "click .add-friend": function(){
    // number to boolean flip
    this.props.selectedProfile.friend = this.props.selectedProfile.friend ? 0 : 1;
    this.addFriendHandler(this.props.selectedProfile);
  },
  addFriendHandler: ["$PUT: 'profiles'", function(request, responseData){
    this.set("selectedProfile", responseData);
  }],
  selectProfile: function(){
    if(this.props.routeName === "Me") {
      this.set("selectedProfile", storage.read("session"));
    } else if(storage.read("profiles")) {
      this.set("selectedProfile", storage.read("profiles")
      .find(this.profileMatcherPredicate));
    } else {
      console.log("profile not found");
    }
  },
  afterMount: function(){
    this["listen update-profiles"]();
  },
  profileMatcherPredicate: function(prof){
    return prof.name === this.props.routeName;
  }
})

},{"../../common/component":47,"../../services/storage":68,"./profile.component.css":62,"./profile.component.ejs":63,"kaop/Class":32}],65:[function(require,module,exports){
require("./common/advices");
var App = require("./components/app/app.component");
var Nav = require("./components/nav/nav.component");
var AppRouter = require("./components/app-router/app-router.component");
var Home = require("./components/home/home.component");
var Profile = require("./components/profile/profile.component");
var Chat = require("./components/chat/chat.component");
var storage = require("./services/storage");
var app = new App();

document.body.querySelector("#app").innerHTML = app.root();

},{"./common/advices":46,"./components/app-router/app-router.component":50,"./components/app/app.component":52,"./components/chat/chat.component":55,"./components/home/home.component":58,"./components/nav/nav.component":61,"./components/profile/profile.component":64,"./services/storage":68}],66:[function(require,module,exports){
var axios = require("axios");

axios.defaults.headers.common["Accept"] = "application/json";

module.exports = instance = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 2000
});

},{"axios":1}],67:[function(require,module,exports){
var storage = require("./storage");

function query(store, alike){
  return store.filter(function(item){
    var lookupKeys = Object.keys(alike);
    for (var i = 0, arrl = lookupKeys.length; i < arrl; i++) {
      if(item[lookupKeys[i]] !== alike[lookupKeys[i]]) {
        return false;
      }
    }
    return true;
  });
}

module.exports = {
  prefix: "x-session-",
  create: function(resource, subject){
      var store = storage.read(this.prefix + resource) || [];
      store.push(subject);
      storage.write(this.prefix + resource, store);
      return subject;
  },
  read: function(resource, alike){
    var store = storage.read(this.prefix + resource) || [];
    return query(store, alike);
  }
}

},{"./storage":68}],68:[function(require,module,exports){
module.exports = {
  read: function(key) {
    return JSON.parse(sessionStorage.getItem(key));
  },
  write: function(key, value) {
    sessionStorage.setItem(key, value ? JSON.stringify(value) : "{}");
  },
  remove: function(key) {
    delete sessionStorage[key];
  }
}

},{}]},{},[65]);
