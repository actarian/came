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
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var MtmMaxApartments = 48;
  var MtmControlType;

  (function (MtmControlType) {
    MtmControlType[MtmControlType["Select"] = 1] = "Select";
    MtmControlType[MtmControlType["Group"] = 2] = "Group";
    MtmControlType[MtmControlType["List"] = 3] = "List";
    MtmControlType[MtmControlType["Grid"] = 4] = "Grid";
  })(MtmControlType = exports.MtmControlType || (exports.MtmControlType = {}));

  var MtmControlEnum;

  (function (MtmControlEnum) {
    MtmControlEnum["Code"] = "Code";
    MtmControlEnum["SingleModuleFrame"] = "Single Module Frame";
    MtmControlEnum["Finish"] = "Finish";
    MtmControlEnum["ModuleSize"] = "Module Size";
    MtmControlEnum["Mount"] = "Mount";
    MtmControlEnum["System"] = "System";
    MtmControlEnum["AudioVideo"] = "A/V";
    MtmControlEnum["Keypad"] = "Keypad";
    MtmControlEnum["Proximity"] = "Proximity";
    MtmControlEnum["InfoModule"] = "Info Module";
    MtmControlEnum["HearingModule"] = "Hearing Module";
    MtmControlEnum["DigitalDisplay"] = "Digital Display";
    MtmControlEnum["AdditionalModules"] = "moduli aggiuntivi";
    MtmControlEnum["Buttons"] = "Buttons";
    MtmControlEnum["Divided"] = "Divided";
    MtmControlEnum["Mounting"] = "Mounting";
    MtmControlEnum["FlushRainshield"] = "Flush Rainshield";
    MtmControlEnum["Frame"] = "Frame";
    MtmControlEnum["Module1"] = "Electronics Module 1";
    MtmControlEnum["Front1"] = "Front Piece 1";
    MtmControlEnum["Module2"] = "Electronics Module 2";
    MtmControlEnum["Front2"] = "Front Piece 2";
    MtmControlEnum["Module3"] = "Electronics Module 3";
    MtmControlEnum["Front3"] = "Front Piece 3";
    MtmControlEnum["Module4"] = "Electronics Module 4";
    MtmControlEnum["Front4"] = "Front Piece 4";
    MtmControlEnum["Identifier"] = "CI";
    MtmControlEnum["Description"] = "Description";
    MtmControlEnum["Price"] = "Price"; // customs

    MtmControlEnum["KnownTecnology"] = "KnownTecnology";
    MtmControlEnum["ConstrainedDimension"] = "ConstrainedDimension";
    MtmControlEnum["ApartmentNumber"] = "ApartmentNumber";
    MtmControlEnum["CallButtons"] = "CallButtons"; // default

    MtmControlEnum["Default"] = "None";
  })(MtmControlEnum = exports.MtmControlEnum || (exports.MtmControlEnum = {})); // Code,Single Module Frame,Finish,Module Size,Mount,System,A/V,Keypad,Proximity,Info Module,Hearing Module,Digital Display,moduli aggiuntivi,Buttons,Divided,Mounting,Flush Rainshield,Frame,Electronics Module 1,Front Piece 1,Electronics Module 2,Front Piece 2,Electronics Module 3,Front Piece 3,Electronics Module 4,Front Piece 4,CI,


  exports.MtmControls = [{
    key: MtmControlEnum.Code,
    name: 'Codice'
  }, {
    key: MtmControlEnum.SingleModuleFrame
  }, {
    key: MtmControlEnum.Finish,
    name: 'Finitura',
    type: MtmControlType.Group
  }, {
    key: MtmControlEnum.ModuleSize,
    name: 'Numero di moduli',
    description: 'Quanto spazio ti serve? Consulta la guida.',
    type: MtmControlType.Group
  }, {
    key: MtmControlEnum.Mount,
    name: 'Installazione',
    type: MtmControlType.List
  }, {
    key: MtmControlEnum.System,
    name: 'Sistema',
    description: 'Scopri le tecnologie e funzionalità dei sistemi Came.',
    type: MtmControlType.Grid
  }, {
    key: MtmControlEnum.AudioVideo,
    name: 'Caratteristiche Audio / Video',
    type: MtmControlType.Group
  }, {
    key: MtmControlEnum.Keypad,
    name: 'Tastiera per il controllo accessi',
    description: 'Tastiera numerica per la sicurezza',
    type: MtmControlType.List,
    nullable: true
  }, {
    key: MtmControlEnum.Proximity,
    name: 'Modulo di prossimità',
    description: 'Accesso automatico tramite scansione RFID',
    type: MtmControlType.Group,
    nullable: true
  }, {
    key: MtmControlEnum.InfoModule,
    name: 'Modulo informazioni',
    description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato',
    type: MtmControlType.Group,
    nullable: true
  }, {
    key: MtmControlEnum.HearingModule,
    name: 'Modulo di sintesi vocale',
    description: 'Disponi di apparecchio acustico con interfaccia magnetica?',
    type: MtmControlType.Group,
    nullable: true
  }, {
    key: MtmControlEnum.DigitalDisplay,
    name: 'Display Digitale'
  }, {
    key: MtmControlEnum.AdditionalModules
  }, {
    key: MtmControlEnum.Buttons,
    name: 'Pulsanti di chiamata',
    type: MtmControlType.List
  }, {
    key: MtmControlEnum.Divided
  }, {
    key: MtmControlEnum.Mounting
  }, {
    key: MtmControlEnum.FlushRainshield
  }, {
    key: MtmControlEnum.Frame
  }, {
    key: MtmControlEnum.Module1
  }, {
    key: MtmControlEnum.Front1
  }, {
    key: MtmControlEnum.Module2
  }, {
    key: MtmControlEnum.Front2
  }, {
    key: MtmControlEnum.Module3
  }, {
    key: MtmControlEnum.Front3
  }, {
    key: MtmControlEnum.Module4
  }, {
    key: MtmControlEnum.Front4
  }, {
    key: MtmControlEnum.Identifier
  }, {
    key: MtmControlEnum.Description
  }, {
    key: MtmControlEnum.Price
  }, {
    key: MtmControlEnum.KnownTecnology,
    name: 'Conosci già la tecnologia da adottare?',
    type: MtmControlType.Group,
    values: [{
      id: 1,
      name: 'No'
    }, {
      id: 2,
      name: 'Sì'
    }],
    className: 'control--group--sm'
  }, {
    key: MtmControlEnum.ConstrainedDimension,
    name: 'Hai un vincolo sul numero di moduli e dimensione del pannello?',
    type: MtmControlType.Group,
    values: [{
      id: 1,
      name: 'No'
    }, {
      id: 2,
      name: 'Sì'
    }],
    className: 'control--group--sm'
  }, {
    key: MtmControlEnum.ApartmentNumber,
    name: 'Quanti appartamenti o punti interni devi gestire?',
    type: MtmControlType.Select,
    values: new Array(MtmMaxApartments).fill(0).map(function (x, i) {
      return {
        id: i + 1,
        name: (i + 1).toFixed(0)
      };
    }),
    className: 'control--list--sm'
  }, {
    key: MtmControlEnum.CallButtons,
    name: 'Pulsanti di chiamata',
    type: MtmControlType.List,
    values: []
  }, {
    key: MtmControlEnum.Default,
    name: 'name',
    description: 'description',
    type: MtmControlType.Group
  }];
});

},{}],3:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "../utils/dom", "./constants", "./value"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var dom_1 = __importDefault(require("../utils/dom"));

  var constants_1 = require("./constants");

  var value_1 = require("./value");

  var MtmControl =
  /*#__PURE__*/
  function () {
    function MtmControl(options) {
      var _this = this;

      _classCallCheck(this, MtmControl);

      this.type = constants_1.MtmControlType.Grid;
      this.key = constants_1.MtmControlEnum.Default;
      this.name = '';
      this.description = '';
      this.originalName = '';
      this.values = [];
      this.cache = {};
      this.count = 0;
      this.className = '';
      this.nullable = false;
      this.element = null;
      this.currentItem = null;
      this.didChange = null;
      /*
      if (typeof options == 'string') {
          const map = MTM_MAP[options as string] || MTM_MAP.Default;
          this.key = map.key;
          this.name = map.name;
          this.description = map.description;
          this.originalName = options;
          this.values = [];
          this.cache = {};
          this.count = 0;
      } else {
          */

      options = options;
      Object.assign(this, options);
      this.originalName = this.name;

      if (options.values) {
        this.values = options.values.map(function (x) {
          return new value_1.MtmValue(x);
        });
        this.values.forEach(function (x) {
          _this.cache[x.name] = x;
          _this.count++;
        });

        if (this.values.length) {
          this.values[0].active = true;
          this.currentItem = this.values[0];
        }
      } // }

    }

    _createClass(MtmControl, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option\">\n\t\t<div class=\"title\">".concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control ").concat(this.className, "\"></div>\n\t</div>");
      }
    }, {
      key: "getChildTemplate",
      value: function getChildTemplate(item) {
        return "<button type=\"button\" class=\"btn btn--option ".concat(item.active ? "active" : "", "\" data-id=\"").concat(item.id, "\">\n\t\t<span class=\"label\">").concat(item.name, "</span>").concat(item.getPrice(), "\n\t</button>");
      }
    }, {
      key: "getFragment",
      value: function getFragment() {
        var fragment = dom_1.default.fragmentFromHTML(this.getTemplate());
        this.element = dom_1.default.fragmentFirstElement(fragment);
        return fragment;
      }
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;

        var fragment = this.getFragment();
        var group = fragment.querySelector('.control');
        var fragments = this.values.map(function (x) {
          return dom_1.default.fragmentFromHTML(_this2.getChildTemplate(x));
        });
        var buttons = fragments.map(function (x) {
          return dom_1.default.fragmentFirstElement(x);
        });
        buttons.forEach(function (x) {
          return x.addEventListener('click', function (e) {
            return _this2.onClick(x);
          });
        });
        fragments.forEach(function (x) {
          return group.appendChild(x);
        });
        return fragment;
      }
    }, {
      key: "onClick",
      value: function onClick(button) {
        /*
        const group = this.element.querySelector('.control');
        const buttons = Array.prototype.slice.call(group.childNodes);
        const index = buttons.indexOf(button);
        if (index !== -1) {
            this.onSelected(this.values[index].id);
        }
        */
        var buttons = Array.prototype.slice.call(button.parentNode.childNodes);
        buttons.forEach(function (x) {
          return dom_1.default.removeClass(x, 'active');
        });
        dom_1.default.addClass(button, 'active');
        this.values.forEach(function (x) {
          return x.active = false;
        });
        var id = parseInt(button.getAttribute('data-id'));
        var item = this.values.find(function (x) {
          return x.id === id;
        });
        item.active = true;
        this.currentItem = item;

        if (typeof this.didChange === 'function') {
          this.didChange(item, this);
        } // console.log('MtmControl.onClick', 'button', button, 'item', item);

      }
    }, {
      key: "onSelect",
      value: function onSelect(value) {
        this.values.forEach(function (x) {
          return x.active = false;
        });
        this.currentItem = value;

        if (value) {
          value.active = true;

          if (this.element) {
            var group = this.element.querySelector('.control');
            var button = group.querySelector("[data-id]=\"".concat(value.id, "\""));
            this.onClick(button);
          }
        }
      }
    }, {
      key: "updateState",
      value: function updateState() {
        // console.log('MtmControl.updateState', this.element);
        if (this.element) {
          var group = this.element.querySelector('.control');
          this.values.forEach(function (x, i) {
            var button = group.childNodes[i];

            if (x.disabled) {
              dom_1.default.addClass(button, 'disabled');
            } else {
              dom_1.default.removeClass(button, 'disabled');
            }
          });
        }
      }
    }, {
      key: "addValue",
      value: function addValue(name) {
        name = name.trim() !== '' ? name : 'No';
        var item = this.cache[name];

        if (item == undefined) {
          item = new value_1.MtmValue({
            id: ++this.count,
            name: name
          });
          this.values.push(item);
        } else {
          item.count++;
        }

        this.cache[name] = item;
        return item.id;
      }
    }, {
      key: "sort",
      value: function sort() {
        var nullValue = this.values.find(function (x) {
          return x.name === 'No';
        });

        if (nullValue) {
          this.values.splice(this.values.indexOf(nullValue), 1);
        }

        this.values.sort(function (a, b) {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }); // this.values.sort((a, b) => (a.count > b.count) ? 1 : ((b.count > a.count) ? -1 : 0));

        if (this.nullable) {
          this.values.unshift(nullValue);
          /*
          this.values.unshift(new MtmValue({
              id: nullValue ? nullValue.id : 0,
              name: 'No',
          }));
          */
        }

        this.values.forEach(function (x, i) {
          return x.price = 4.99 * i;
        });

        if (this.values.length) {
          this.values[0].active = true;
          this.currentItem = this.values[0];
        }
      }
    }]);

    return MtmControl;
  }();

  exports.MtmControl = MtmControl;
});

},{"../utils/dom":11,"./constants":2,"./value":8}],4:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./constants", "./control"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./constants");

  var control_1 = require("./control");

  var MtmGrid =
  /*#__PURE__*/
  function (_control_1$MtmControl) {
    _inherits(MtmGrid, _control_1$MtmControl);

    function MtmGrid(options) {
      var _this;

      _classCallCheck(this, MtmGrid);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(MtmGrid).call(this, options));
      _this.type = constants_1.MtmControlType.Grid;
      return _this;
    }

    _createClass(MtmGrid, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option\">\n\t\t<div class=\"title\">".concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--grid ").concat(this.className, "\"></div>\n\t</div>");
      }
    }, {
      key: "getChildTemplate",
      value: function getChildTemplate(item) {
        return "<div class=\"btn btn--system ".concat(item.active ? "active" : "", "\" data-id=\"").concat(item.id, "\">\n\t\t<img class=\"icon\" src=\"img/mtm-configurator/").concat(item.getKey(), ".jpg\" title=\"").concat(item.name, "\" />").concat(item.getPrice(), "\n\t\t<button type=\"button\" class=\"btn btn--info\">i</button>\n\t</div>");
      }
    }]);

    return MtmGrid;
  }(control_1.MtmControl);

  exports.MtmGrid = MtmGrid;
});

},{"./constants":2,"./control":3}],5:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./constants", "./control"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./constants");

  var control_1 = require("./control");

  var MtmGroup =
  /*#__PURE__*/
  function (_control_1$MtmControl) {
    _inherits(MtmGroup, _control_1$MtmControl);

    function MtmGroup(options) {
      var _this;

      _classCallCheck(this, MtmGroup);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(MtmGroup).call(this, options));
      _this.type = constants_1.MtmControlType.Group;
      return _this;
    }

    _createClass(MtmGroup, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option\">\n\t\t<div class=\"title\">".concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--group ").concat(this.values.length === 4 ? "btn-group--4" : "", " ").concat(this.className, "\"></div>\n\t</div>");
      }
    }]);

    return MtmGroup;
  }(control_1.MtmControl);

  exports.MtmGroup = MtmGroup;
});

},{"./constants":2,"./control":3}],6:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./constants", "./control"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./constants");

  var control_1 = require("./control");

  var MtmList =
  /*#__PURE__*/
  function (_control_1$MtmControl) {
    _inherits(MtmList, _control_1$MtmControl);

    function MtmList(options) {
      var _this;

      _classCallCheck(this, MtmList);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(MtmList).call(this, options));
      _this.type = constants_1.MtmControlType.List;
      return _this;
    }

    _createClass(MtmList, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option\">\n\t\t<div class=\"title\">".concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--list ").concat(this.className, "\"></div>\n\t</div>");
      }
    }]);

    return MtmList;
  }(control_1.MtmControl);

  exports.MtmList = MtmList;
});

},{"./constants":2,"./control":3}],7:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "../utils/dom", "./constants", "./control"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var dom_1 = __importDefault(require("../utils/dom"));

  var constants_1 = require("./constants");

  var control_1 = require("./control");

  var MtmSelect =
  /*#__PURE__*/
  function (_control_1$MtmControl) {
    _inherits(MtmSelect, _control_1$MtmControl);

    function MtmSelect(options) {
      var _this;

      _classCallCheck(this, MtmSelect);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(MtmSelect).call(this, options));
      _this.type = constants_1.MtmControlType.Select;
      return _this;
    }

    _createClass(MtmSelect, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option\">\n\t\t<div class=\"title\">".concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--list ").concat(this.className, "\">\n\t\t\t<div class=\"btn btn--select\">\n\t\t\t\t<select class=\"form-control form-control--select\"></select>\n\t\t\t\t<span class=\"label\"></span>\n\t\t\t</div>\n\t\t</div>\n\t</div>");
      }
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;

        var fragment = this.getFragment();
        var select = fragment.querySelector('.form-control--select');
        this.values.map(function (x) {
          var html = "\n\t\t<option value=\"".concat(x.id, "\">").concat(x.name, "</option>\n\t\t");
          var fragment = dom_1.default.fragmentFromHTML(html);
          return fragment;
        }).forEach(function (x) {
          return select.appendChild(x);
        });
        select.addEventListener('change', function (e) {
          return _this2.onChange(e);
        });
        var value = this.values.find(function (x) {
          return x.active;
        });

        if (value) {
          select.value = value.id.toFixed();
        }

        this.onUpdate(select);
        return fragment;
      }
    }, {
      key: "onUpdate",
      value: function onUpdate(select) {
        if (select) {
          var id = parseInt(select.value);
          var item = this.values.find(function (x) {
            return x.id === id;
          });
          this.currentItem = item;

          if (item) {
            var label = this.element.querySelector('.label');
            label.innerHTML = item.name;
          }

          if (typeof this.didChange === 'function') {
            this.didChange(item, this);
          }
        } // console.log('MtmSelect.onUpdate', select.value);

      }
    }, {
      key: "onChange",
      value: function onChange(e) {
        // console.log('MtmSelect.onChange', e.target);
        this.onUpdate(e.target);
      }
    }]);

    return MtmSelect;
  }(control_1.MtmControl);

  exports.MtmSelect = MtmSelect;
});

},{"../utils/dom":11,"./constants":2,"./control":3}],8:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var MtmValue =
  /*#__PURE__*/
  function () {
    function MtmValue(options) {
      _classCallCheck(this, MtmValue);

      this.price = 0;
      this.count = 1;
      this.order = 0;
      this.value = 0;
      this.active = false;
      this.disabled = false;

      if (options) {
        Object.assign(this, options);
      }
    }

    _createClass(MtmValue, [{
      key: "getPrice",
      value: function getPrice() {
        return this.price ? "<span class=\"price\">+ \u20AC ".concat(this.price.toFixed(2), "</span>") : "";
      }
    }, {
      key: "getKey",
      value: function getKey() {
        return this.name.replace(/ /g, "");
      }
    }]);

    return MtmValue;
  }();

  exports.MtmValue = MtmValue;
});

},{}],9:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "./controls/constants", "./controls/value", "./models/data.service", "./utils/dom"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./controls/constants");

  var value_1 = require("./controls/value");

  var data_service_1 = __importDefault(require("./models/data.service"));

  var dom_1 = __importDefault(require("./utils/dom"));

  var MtmConfigurator =
  /*#__PURE__*/
  function () {
    function MtmConfigurator(selector) {
      var _this = this;

      _classCallCheck(this, MtmConfigurator);

      this.cols = [];
      this.rows = [];
      this.element = document.querySelector(selector);
      this.addMediaScrollListener();
      this.addRecapScrollListener();
      data_service_1.default.fetch(function (cols, rows) {
        _this.cols = cols;
        _this.rows = rows;
        var options = [data_service_1.default.newControlByKey(constants_1.MtmControlEnum.KnownTecnology), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ConstrainedDimension), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ApartmentNumber), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.CallButtons), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.AudioVideo), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Keypad), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.InfoModule), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Proximity), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Finish), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Mount), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.System), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.ModuleSize)];
        options.forEach(function (x) {
          return x.didChange = function (item, control) {
            // console.log('MtmConfigurator.didChange', control.key, item);
            switch (control.key) {
              case constants_1.MtmControlEnum.KnownTecnology:
              case constants_1.MtmControlEnum.ConstrainedDimension:
                _this.doReorder();

                break;

              case constants_1.MtmControlEnum.ApartmentNumber:
                _this.updateCallButtons();

                break;

              case constants_1.MtmControlEnum.CallButtons:
                _this.didSelectCallButton();

                _this.onSearch();

                break;

              default:
                _this.onSearch();

            }
          };
        });
        _this.options = options;

        _this.initCallButtons();

        _this.render();

        _this.updateCallButtons();

        _this.didSelectCallButton();

        _this.onSearch();
      }, function (error) {
        console.log('error', error);
      });
    }

    _createClass(MtmConfigurator, [{
      key: "initCallButtons",
      value: function initCallButtons() {
        var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons);
        var digi1 = buttons.values.filter(function (x) {
          return x.name === 'DIGI1';
        });
        var digi2 = buttons.values.filter(function (x) {
          return x.name === 'DIGI2';
        });
        var numericButtons = buttons.values.filter(function (x) {
          return parseInt(x.name).toString() === x.name;
        });
        var digitalDisplay = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.DigitalDisplay);
        var digitalDisplayButton = digitalDisplay.values.find(function (x) {
          return x.name === 'Digital Display';
        }); // console.log(buttons.values); // 26
        // Modulo 1 Pulsante

        var values = [];
        var i = 0;
        values.push(new value_1.MtmValue({
          id: ++i,
          name: "DIGI1",
          value: 1,
          order: 10 - 2,
          data: {
            buttons: digi1
          }
        }));
        values.push(new value_1.MtmValue({
          id: ++i,
          name: "DIGI2",
          value: 2,
          order: 20 - 1,
          data: {
            buttons: digi2
          }
        }));
        numericButtons.forEach(function (x) {
          var value = parseInt(x.name);
          values.push(new value_1.MtmValue({
            id: ++i,
            name: "Modulo ".concat(value > 1 ? value + ' pulsanti' : '1 pulsante'),
            value: value,
            order: value * 10,
            data: {
              buttons: x
            }
          }));
          values.push(new value_1.MtmValue({
            id: ++i,
            name: "Modulo DIGI1 + ".concat(value > 1 ? value + ' pulsanti' : '1 pulsante'),
            value: value + 1,
            order: (value + 1) * 10 - 2,
            data: {
              buttons: x // + digi1

            }
          }));
          values.push(new value_1.MtmValue({
            id: ++i,
            name: "Modulo DIGI2 + ".concat(value > 1 ? value + ' pulsanti' : '1 pulsante'),
            value: value + 2,
            order: (value + 2) * 10 - 1,
            data: {
              buttons: x // + digi2

            }
          }));
        });
        values.push(new value_1.MtmValue({
          id: ++i,
          name: "Digital Display",
          value: 1000,
          order: 10000,
          data: {
            digitalDisplay: digitalDisplayButton
          }
        }));
        values.sort(function (a, b) {
          return a.order > b.order ? 1 : b.order > a.order ? -1 : 0;
        });
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });
        callButtons.values = values;
        callButtons.values.forEach(function (x, i) {
          return x.price = 4.99 * i;
        });

        if (callButtons.values.length) {
          callButtons.values[0].active = true;
          callButtons.currentItem = callButtons.values[0];
        }
      }
    }, {
      key: "updateCallButtons",
      value: function updateCallButtons() {
        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });
        var apartmentNumberValue = apartmentNumber.currentItem.id;
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });
        callButtons.values.forEach(function (x) {
          switch (x.name) {
            case 'Digital Display':
              x.disabled = false;
              break;

            default:
              x.disabled = x.value !== apartmentNumberValue;
              break;
          }
        }); // console.log(callButtons.values.filter(x => !x.disabled).map(x => x.name));

        callButtons.updateState(); // const callButtonsCurrentItem = callButtons.currentItem;
        // console.log('updateCallButtons', apartmentNumberValue, callButtonsCurrentItem.name);
      }
    }, {
      key: "didSelectCallButton",
      value: function didSelectCallButton() {
        var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons);
        var digitalDisplay = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.DigitalDisplay);
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        }); // console.log('didSelectCallButton.currentItem =>', callButtons.currentItem);

        if (callButtons.currentItem && callButtons.currentItem.data) {
          buttons.onSelect(callButtons.currentItem.data.buttons);
          digitalDisplay.onSelect(callButtons.currentItem.data.digitalDisplay);
        }
        /*
        buttons.values.forEach(x => x.active = false);
        digitalDisplay.values.forEach(x => x.active = false);
        if (callButtons.currentItem.name === 'Digital Display') {
            digitalDisplay.currentItem = digitalDisplay.values.find(x => x.id === callButtons.currentItem.id);
            digitalDisplay.currentItem.active = true;
            buttons.currentItem = null;
        } else {
            buttons.currentItem = buttons.values.find(x => x.id === callButtons.currentItem.id);
            buttons.currentItem.active = true;
            digitalDisplay.currentItem = null;
        }
        */

      }
    }, {
      key: "doReorder",
      value: function doReorder() {
        var controls = [];
        var knownTecnology = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.KnownTecnology;
        });
        var system = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.System;
        });
        var constrainedDimension = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ConstrainedDimension;
        });
        var moduleSize = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ModuleSize;
        });
        controls.push(knownTecnology.element);

        if (knownTecnology.currentItem.id === 2) {
          controls.push(system.element);
        }

        controls.push(constrainedDimension.element);

        if (constrainedDimension.currentItem.id === 2) {
          controls.push(moduleSize.element);
        }

        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });
        var audioVideo = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.AudioVideo;
        });
        var keypad = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Keypad;
        });
        var infoModule = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.InfoModule;
        });
        var proximity = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Proximity;
        });
        var finish = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Finish;
        });
        var mount = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Mount;
        });
        controls.push(apartmentNumber.element);
        controls.push(callButtons.element);
        controls.push(audioVideo.element);
        controls.push(keypad.element);
        controls.push(infoModule.element);
        controls.push(proximity.element);
        controls.push(finish.element);
        controls.push(mount.element);

        if (knownTecnology.currentItem.id === 1) {
          controls.push(system.element);
        }

        if (constrainedDimension.currentItem.id === 1) {
          controls.push(moduleSize.element);
        } // const controls = this.options.map(x => x.element);
        // controls.unshift(controls.pop());


        this.options.map(function (x) {
          return x.element;
        }).forEach(function (x) {
          if (x.parentNode) {
            x.parentNode.removeChild(x);
          }
        });
        var outlet = this.element.querySelector('.options-outlet');
        controls.forEach(function (x) {
          return outlet.appendChild(x);
        }); // console.log('doReorder');
      }
    }, {
      key: "onSearch",
      value: function onSearch() {
        var _this2 = this;

        // FILTERS
        var filters = this.options.map(function (x) {
          var index = _this2.cols.indexOf(x);

          if (index !== -1) {
            var control = x;
            var selectedValue = x.values.find(function (v) {
              return v.active;
            });
            var value = selectedValue ? selectedValue.id : -1;
            var name = selectedValue ? selectedValue.name : '-';
            var price = selectedValue ? selectedValue.price : 0;
            return {
              index: index,
              value: value,
              name: name,
              price: price,
              control: control
            };
          } else {
            return {
              index: index
            };
          }
        }).filter(function (x) {
          return x.index !== -1 && x.value !== -1;
        });
        console.log(filters.map(function (x) {
          return x.control.name + ' ' + x.name + ' ' + x.value;
        }).join('\n')); // TOTALPRICE ?

        var totalPrice = filters.reduce(function (p, x) {
          // console.log(p, x.price);
          return p + x.price;
        }, 0); // FILTER RESULTS

        var results = this.rows.filter(function (x) {
          var has = true;
          filters.forEach(function (f) {
            return has = has && x[f.index] === f.value;
          });
          return has;
        }).map(function (r) {
          var result = {};

          _this2.cols.forEach(function (c, i) {
            if (r[i]) {
              var value = c.values.find(function (v) {
                return v.id === r[i];
              });
              result[c.key] = value ? value.name : '-';
            } else {
              result[c.key] = null;
            }
          });

          return result;
        });

        if (results.length > 0) {
          var result = results[0];
          this.element.querySelector('.result-price').innerHTML = "\u20AC ".concat(totalPrice.toFixed(2));
          this.element.querySelector('.result-code').innerHTML = result.code; // this.element.querySelectorAll('.result-code').forEach(x => x.innerHTML = result.code);

          this.element.querySelector('.result-description').innerHTML = result.Description;

          if (results.length === 1) {
            console.log('MtmConfigurato.onSearch', result);
          } else {
            console.log('onSearch.error', results);
          }
        } else {
          console.log('onSearch.error', results);
        }
      }
    }, {
      key: "render",
      value: function render() {
        var outlet = this.element.querySelector('.options-outlet');
        this.options.map(function (x) {
          return x.render();
        }).forEach(function (x) {
          return outlet.appendChild(x);
        }); // console.log('render.outlet', outlet);
      }
    }, {
      key: "addMediaScrollListener",
      value: function addMediaScrollListener() {
        var media = this.element.querySelector('.media');
        var picture = media.querySelector('.picture');

        var onScroll = function onScroll() {
          var rect = media.getBoundingClientRect();

          if (rect.top < 60) {
            dom_1.default.addClass(picture, 'fixed');
          } else {
            dom_1.default.removeClass(picture, 'fixed');
          }
        };

        onScroll();
        window.addEventListener('scroll', onScroll, false);
      }
    }, {
      key: "addRecapScrollListener",
      value: function addRecapScrollListener() {
        var inner = this.element.querySelector('.section--recap--fixed > .inner');
        var lastScrollTop = dom_1.default.scrollTop();

        var onScroll = function onScroll() {
          var scrollTop = dom_1.default.scrollTop();

          if (scrollTop > lastScrollTop) {
            dom_1.default.addClass(inner, 'fixed');
          } else {
            dom_1.default.removeClass(inner, 'fixed');
          }

          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
        };

        onScroll();
        window.addEventListener('scroll', onScroll, false);
      }
    }]);

    return MtmConfigurator;
  }();

  exports.default = MtmConfigurator;
  var configurator = new MtmConfigurator(".configurator");
});

},{"./controls/constants":2,"./controls/value":8,"./models/data.service":10,"./utils/dom":11}],10:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports", "whatwg-fetch", "../controls/constants", "../controls/control", "../controls/grid", "../controls/group", "../controls/list", "../controls/select"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  require("whatwg-fetch");

  var constants_1 = require("../controls/constants");

  var control_1 = require("../controls/control");

  var grid_1 = require("../controls/grid");

  var group_1 = require("../controls/group");

  var list_1 = require("../controls/list");

  var select_1 = require("../controls/select");

  var MtmDataService =
  /*#__PURE__*/
  function () {
    function MtmDataService() {
      _classCallCheck(this, MtmDataService);
    }

    _createClass(MtmDataService, null, [{
      key: "fetch",
      value: function (_fetch) {
        function fetch(_x, _x2) {
          return _fetch.apply(this, arguments);
        }

        fetch.toString = function () {
          return _fetch.toString();
        };

        return fetch;
      }(function (callback, error) {
        Object.keys(constants_1.MtmControlEnum).forEach(function (k) {
          var key = k;
          var value = constants_1.MtmControlEnum[key];
          MtmDataService.map[value] = key;
        });
        constants_1.MtmControls.forEach(function (x) {
          MtmDataService.controlsMap[x.key] = x;
        }); // MtmDataService.controlsMap[value] = MtmControls.find(x => x.type === value);
        // console.log('MtmControlEnum', MtmControlEnum);
        // console.log('controlsMap', MtmDataService.controlsMap);

        fetch('data/data.csv').then(function (response) {
          return response.text();
        }).then(function (text) {
          var csv = text.split('\n');
          var cols = MtmDataService.parseCsvArray(csv.shift() || '').map(function (x) {
            return MtmDataService.renameColumn(x.trim());
          }).map(function (x) {
            return MtmDataService.newControlByKey(x);
          });
          var records = csv.map(function (x) {
            return MtmDataService.parseCsvArray(x).map(function (x) {
              return x.trim();
            });
          });
          var rows = records.map(function (values) {
            return values.map(function (value, i) {
              return cols[i].addValue(value);
            }).filter(function (x) {
              return x;
            });
          });
          cols.forEach(function (x) {
            return x.sort();
          });
          MtmDataService.cols = cols;
          MtmDataService.rows = rows;
          /*
          const row = rows[10];
          console.log(row);
          console.log(row.map((id, i) => {
              const value = cols[i].values.find(x => x.id === id);
              return value ? value.name : null;
          }));
          */

          if (typeof callback === 'function') {
            callback(cols, rows);
          }
        }).catch(function (reason) {
          if (typeof error === 'function') {
            error(reason);
          }
        });
      })
    }, {
      key: "renameColumn",
      value: function renameColumn(name) {
        if (name === '') {
          name = 'Description';
        }

        return name; // MtmDataService.map[name];
        // return name.replace(/ |\//gm, '');
      }
    }, {
      key: "newControlByKey",
      value: function newControlByKey(key) {
        var map = MtmDataService.controlsMap[key] || MtmDataService.controlsMap.Default; // console.log('newControlByKey', key);

        var control;

        switch (map.type) {
          case constants_1.MtmControlType.Select:
            control = new select_1.MtmSelect(map);
            break;

          case constants_1.MtmControlType.Group:
            control = new group_1.MtmGroup(map);
            break;

          case constants_1.MtmControlType.List:
            control = new list_1.MtmList(map);
            break;

          case constants_1.MtmControlType.Grid:
            control = new grid_1.MtmGrid(map);
            break;

          default:
            control = new control_1.MtmControl(map);
        }

        return control;
      }
    }, {
      key: "optionWithKey",
      value: function optionWithKey(key) {
        return MtmDataService.cols.find(function (x) {
          return x.key === key;
        });
      }
    }, {
      key: "parseCsvArray",
      value: function parseCsvArray(value) {
        var isValid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var matchValues = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

        if (!isValid.test(value)) {
          return [];
        }

        var a = [];
        value.replace(matchValues, function (m0, m1, m2, m3) {
          if (m1 !== undefined) {
            a.push(m1.replace(/\\'/g, "'"));
          } else if (m2 !== undefined) {
            a.push(m2.replace(/\\"/g, "\""));
          } else if (m3 !== undefined) {
            a.push(m3);
          }

          return '';
        });

        if (/,\s*$/.test(value)) {
          a.push('');
        }

        return a;
      }
    }]);

    return MtmDataService;
  }();

  MtmDataService.cols = [];
  MtmDataService.rows = [];
  MtmDataService.map = {}; //: Map<string, string> = {};

  MtmDataService.controlsMap = {};
  exports.default = MtmDataService;
});

},{"../controls/constants":2,"../controls/control":3,"../controls/grid":4,"../controls/group":5,"../controls/list":6,"../controls/select":7,"whatwg-fetch":1}],11:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* global window, document, console, GlslCanvas, Swiper, TweenLite */
(function (factory) {
  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && _typeof(module.exports) === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var Dom =
  /*#__PURE__*/
  function () {
    function Dom() {
      _classCallCheck(this, Dom);
    }

    _createClass(Dom, null, [{
      key: "fragmentFirstElement",
      value: function fragmentFirstElement(fragment) {
        return Array.prototype.slice.call(fragment.children).find(function (x) {
          return x.nodeType === Node.ELEMENT_NODE;
        });
      }
    }, {
      key: "fragmentFromHTML",
      value: function fragmentFromHTML(html) {
        return document.createRange().createContextualFragment(html);
      }
    }, {
      key: "hasClass",
      value: function hasClass(element, name) {
        return element && new RegExp("(?:^|\\s+)".concat(name, "(?:\\s+|$)")).test(element.className);
      }
    }, {
      key: "addClass",
      value: function addClass(element, name) {
        if (element && !Dom.hasClass(element, name)) {
          element.className = element.className ? "".concat(element.className, " ").concat(name) : name;
        }

        return Dom;
      }
    }, {
      key: "removeClass",
      value: function removeClass(element, name) {
        if (element && Dom.hasClass(element, name)) {
          element.className = element.className.split(name).join("").replace(/\s\s+/g, " "); // .replace(new RegExp('(?:^|\\s+)' + name + '(?:\\s+|$)', 'g'), '');
        }

        return Dom;
      }
    }, {
      key: "scrollTop",
      value: function scrollTop() {
        var pageYOffset = window ? window.pageXOffset : 0;
        var scrollTop = document && document.documentElement ? document.documentElement.scrollTop : 0;
        return pageYOffset || scrollTop;
      }
    }]);

    return Dom;
  }();

  exports.default = Dom;
});

},{}]},{},[9]);

//# sourceMappingURL=main.js.map
