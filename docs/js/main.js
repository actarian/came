(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob:
      'FileReader' in self &&
      'Blob' in self &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = self.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.onabort = function() {
        reject(new exports.DOMException('Aborted', 'AbortError'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!self.fetch) {
    self.fetch = fetch;
    self.Headers = Headers;
    self.Request = Request;
    self.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],2:[function(require,module,exports){
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./models/mtm-data.service", "./utils/dom"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var mtm_data_service_1 = __importDefault(require("./models/mtm-data.service"));
    var dom_1 = __importDefault(require("./utils/dom"));
    var MtmConfigurator = /** @class */ (function () {
        function MtmConfigurator(selector) {
            this.element = document.querySelector(selector);
            this.addMediaScrollListener();
            this.addRecapScrollListener();
            mtm_data_service_1.default.fetch();
        }
        MtmConfigurator.prototype.addMediaScrollListener = function () {
            var media = this.element.querySelector('.media');
            var picture = media.querySelector('.picture');
            window.addEventListener('scroll', function () {
                var rect = media.getBoundingClientRect();
                if (rect.top < 60) {
                    dom_1.default.addClass(picture, 'fixed');
                }
                else {
                    dom_1.default.removeClass(picture, 'fixed');
                }
            }, false);
        };
        MtmConfigurator.prototype.addRecapScrollListener = function () {
            var inner = this.element.querySelector('.section--recap > .inner');
            var lastScrollTop = dom_1.default.scrollTop();
            window.addEventListener('scroll', function () {
                var scrollTop = dom_1.default.scrollTop();
                if (scrollTop > lastScrollTop) {
                    dom_1.default.addClass(inner, 'fixed');
                }
                else {
                    dom_1.default.removeClass(inner, 'fixed');
                }
                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
            }, false);
        };
        return MtmConfigurator;
    }());
    exports.default = MtmConfigurator;
    var configurator = new MtmConfigurator(".configurator");
});

},{"./models/mtm-data.service":3,"./utils/dom":4}],3:[function(require,module,exports){
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "whatwg-fetch"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("whatwg-fetch");
    var MtmValue = /** @class */ (function () {
        function MtmValue(id, name) {
            this.id = id;
            this.name = name;
        }
        return MtmValue;
    }());
    exports.MtmValue = MtmValue;
    var MTM_MAP = {
        'Code': { key: 'code', name: 'Codice', description: '' },
        'SingleModuleFrame': { key: 'singleModuleFrame', name: '', description: '' },
        'Finish': { key: 'finish', name: 'Finitura', description: '' },
        'ModuleSize': { key: 'moduleSize', name: 'Numero di moduli', description: 'Quanto spazio ti serve? Consulta la guida.' },
        'Mount': { key: 'mount', name: '', description: '' },
        'System': { key: 'system', name: 'Sistema', description: 'Scopri le tecnologie e funzionalità dei sistemi Came.' },
        'AV': { key: 'audioVideo', name: 'Caratteristiche Audio / Video', description: '' },
        'Keypad': { key: 'keypad', name: 'Tastiera per il controllo accessi', description: 'Tastiera numerica per la sicurezza' },
        'Proximity': { key: 'proximity', name: 'Modulo di prossimità', description: 'Accesso automatico tramite scansione RFID' },
        'InfoModule': { key: 'infoModule', name: 'Modulo informazioni', description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato' },
        'HearingModule': { key: 'hearingModule', name: 'Modulo di sintesi vocale', description: 'Disponi di apparecchio acustico con interfaccia magnetica?' },
        'DigitalDisplay': { key: 'digitalDisplay', name: 'Display Digitale', description: '' },
        'moduliaggiuntivi': { key: 'additionalModules', name: '', description: '' },
        'Buttons': { key: 'buttons', name: 'Pulsanti di chiamata', description: '' },
        'Divided': { key: 'divided', name: '', description: '' },
        'Mounting': { key: 'mounting', name: '', description: '' },
        'FlushRainshield': { key: 'flushRainshield', name: '', description: '' },
        'Frame': { key: 'frame', name: '', description: '' },
        'ElectronicsModule1': { key: 'electronicsModule1', name: '', description: '' },
        'FrontPiece1': { key: 'frontPiece1', name: '', description: '' },
        'ElectronicsModule2': { key: 'electronicsModule2', name: '', description: '' },
        'FrontPiece2': { key: 'frontPiece2', name: '', description: '' },
        'ElectronicsModule3': { key: 'electronicsModule3', name: '', description: '' },
        'FrontPiece3': { key: 'frontPiece3', name: '', description: '' },
        'ElectronicsModule4': { key: 'electronicsModule4', name: '', description: '' },
        'FrontPiece4': { key: 'frontPiece4', name: '', description: '' },
        'CI': { key: 'identifierCode', name: '', description: '' },
        '': { key: 'Description', name: '', description: '' },
        Default: { key: 'key', name: 'name', description: 'description' },
    };
    var MtmOption = /** @class */ (function () {
        function MtmOption(originalName) {
            if (originalName === void 0) { originalName = ''; }
            var map = MTM_MAP[originalName] || MTM_MAP.Default;
            this.key = map.key;
            this.name = map.name;
            this.description = map.description;
            this.originalName = originalName;
            this.values = [];
            this.cache = {};
            this.count = 0;
        }
        MtmOption.prototype.addValue = function (value) {
            var item = this.cache[value];
            if (this.cache[value] == undefined) {
                item = new MtmValue(++this.count, value);
                this.values.push(item);
            }
            this.cache[value] = item;
            return item.id;
        };
        MtmOption.prototype.sort = function () {
            this.values.sort(function (a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
            // this.values.forEach((x, i) => x.id = i + 1);
        };
        return MtmOption;
    }());
    exports.MtmOption = MtmOption;
    var MtmDataService = /** @class */ (function () {
        function MtmDataService() {
        }
        MtmDataService.fetch = function (callback) {
            /*
            fetch('data/data.json')
                .then((response) => response.json())
                .then((json) => {
                    console.log('json', json);
                });
            */
            fetch('data/data.csv')
                .then(function (response) { return response.text(); })
                .then(function (text) {
                var csv = text.split('\n');
                var cols = MtmDataService.parseCsvArray(csv.shift() || '').map(function (x) { return x.trim().replace(/ |\//gm, ''); }).map(function (x) { return new MtmOption(x); });
                var rows = csv.map(function (x) { return MtmDataService.parseCsvArray(x).map(function (x) { return x.trim(); }); });
                // console.log('rows', rows.length, cols, rows[0]);
                var records = rows.map(function (values) { return values.map(function (value, i) { return cols[i].addValue(value); }); });
                cols.forEach(function (x) { return x.sort(); });
                MtmDataService.options = cols;
                // console.log(MtmDataService.options);
            });
        };
        MtmDataService.parseCsvArray = function (value) {
            var isValid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
            var matchValues = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
            // Return NULL if input string is not well formed CSV string.
            if (!isValid.test(value))
                return [];
            var a = [];
            value.replace(matchValues, function (m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if (m1 !== undefined) {
                    a.push(m1.replace(/\\'/g, "'"));
                }
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) {
                    a.push(m2.replace(/\\"/g, '"'));
                }
                else if (m3 !== undefined) {
                    a.push(m3);
                }
                return '';
            });
            // Handle special case of empty last value.
            if (/,\s*$/.test(value))
                a.push('');
            return a;
        };
        MtmDataService.options = [];
        return MtmDataService;
    }());
    exports.default = MtmDataService;
});

},{"whatwg-fetch":1}],4:[function(require,module,exports){
/* global window, document, console, GlslCanvas, Swiper, TweenLite */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Dom = /** @class */ (function () {
        function Dom() {
        }
        Dom.hasClass = function (element, name) {
            return element && new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(element.className);
        };
        Dom.addClass = function (element, name) {
            if (element && !Dom.hasClass(element, name)) {
                element.className = element.className ? (element.className + " " + name) : name;
            }
            return Dom;
        };
        Dom.removeClass = function (element, name) {
            if (element && Dom.hasClass(element, name)) {
                element.className = element.className.split(name).join("").replace(/\s\s+/g, " "); // .replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
            }
            return Dom;
        };
        Dom.scrollTop = function () {
            var pageYOffset = window ? window.pageXOffset : 0;
            var scrollTop = document && document.documentElement ? document.documentElement.scrollTop : 0;
            return pageYOffset || scrollTop;
        };
        return Dom;
    }());
    exports.default = Dom;
});

},{}]},{},[2]);

//# sourceMappingURL=main.js.map
