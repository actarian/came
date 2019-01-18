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
  })(MtmControlType = exports.MtmControlType || (exports.MtmControlType = {})); // code,singleModuleFrame,finish,moduleSize,mount,system,AV,keypad,proximity,infoModule,hearingModule,digitalDisplay,additionalModules,buttons,divided,mounting,
  // flushRainshield,frame,electronicsModule1,frontPiece1,electronicsModule2,frontPiece2,electronicsModule3,frontPiece3,electronicsModule4,frontPiece4,ci,description


  var MtmControlEnum;

  (function (MtmControlEnum) {
    MtmControlEnum["Code"] = "code";
    MtmControlEnum["SingleModuleFrame"] = "singleModuleFrame";
    MtmControlEnum["Finish"] = "finish";
    MtmControlEnum["ModuleSize"] = "moduleSize";
    MtmControlEnum["Mount"] = "mount";
    MtmControlEnum["System"] = "system";
    MtmControlEnum["AudioVideo"] = "AV";
    MtmControlEnum["Keypad"] = "keypad";
    MtmControlEnum["Proximity"] = "proximity";
    MtmControlEnum["InfoModule"] = "infoModule";
    MtmControlEnum["HearingModule"] = "hearingModule";
    MtmControlEnum["DigitalDisplay"] = "digitalDisplay";
    MtmControlEnum["AdditionalModules"] = "additionalModules";
    MtmControlEnum["Buttons"] = "buttons";
    MtmControlEnum["Divided"] = "divided";
    MtmControlEnum["Mounting"] = "mounting";
    MtmControlEnum["FlushRainshield"] = "flushRainshield";
    MtmControlEnum["Frame"] = "frame";
    MtmControlEnum["Module1"] = "electronicsModule1";
    MtmControlEnum["Front1"] = "frontPiece1";
    MtmControlEnum["Module2"] = "electronicsModule2";
    MtmControlEnum["Front2"] = "frontPiece2";
    MtmControlEnum["Module3"] = "electronicsModule3";
    MtmControlEnum["Front3"] = "frontPiece3";
    MtmControlEnum["Module4"] = "electronicsModule4";
    MtmControlEnum["Front4"] = "frontPiece4";
    MtmControlEnum["Identifier"] = "ci";
    MtmControlEnum["Description"] = "description";
    MtmControlEnum["Price"] = "price"; // customs

    MtmControlEnum["Digi"] = "digi";
    MtmControlEnum["ButtonType"] = "buttonType";
    MtmControlEnum["KnownTecnology"] = "knownTecnology";
    MtmControlEnum["ConstrainedDimension"] = "constrainedDimension";
    MtmControlEnum["ApartmentNumber"] = "apartmentNumber";
    MtmControlEnum["CallButtons"] = "callButtons"; // default

    MtmControlEnum["Default"] = "none";
  })(MtmControlEnum = exports.MtmControlEnum || (exports.MtmControlEnum = {})); // Code,Single Module Frame,Finish,Module Size,Mount,System,A/V,Keypad,Proximity,Info Module,Hearing Module,Digital Display,moduli aggiuntivi,Buttons,Divided,Mounting,Flush Rainshield,Frame,Electronics Module 1,Front Piece 1,Electronics Module 2,Front Piece 2,Electronics Module 3,Front Piece 3,Electronics Module 4,Front Piece 4,CI,


  exports.MtmControls = [{
    key: MtmControlEnum.Code,
    name: 'Codice'
  }, {
    key: MtmControlEnum.Digi,
    name: 'Digi',
    lazy: true
  }, {
    key: MtmControlEnum.ButtonType,
    name: 'ButtonType',
    lazy: true
  }, {
    key: MtmControlEnum.SingleModuleFrame,
    disabled: true
  }, {
    key: MtmControlEnum.Finish,
    name: 'Finitura',
    type: MtmControlType.Group,
    lazy: true
  }, {
    key: MtmControlEnum.ModuleSize,
    name: 'Numero di moduli',
    description: 'Quanto spazio ti serve? Consulta la guida.',
    type: MtmControlType.Group
  }, {
    key: MtmControlEnum.Mount,
    name: 'Installazione',
    type: MtmControlType.List,
    lazy: true
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
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.Proximity,
    name: 'Modulo di prossimità',
    description: 'Accesso automatico tramite scansione RFID',
    type: MtmControlType.Group,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.InfoModule,
    name: 'Modulo informazioni',
    description: 'Vuoi fornire indicazioni? Usa il modulo retroilluminato',
    type: MtmControlType.Group,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.HearingModule,
    name: 'Modulo di sintesi vocale',
    description: 'Disponi di apparecchio acustico con interfaccia magnetica?',
    type: MtmControlType.Group,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.DigitalDisplay,
    name: 'Display Digitale',
    description: 'Disponi di apparecchio acustico con interfaccia magnetica?',
    type: MtmControlType.Group,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.AdditionalModules,
    disabled: true
  }, {
    key: MtmControlEnum.Buttons,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.Divided,
    lazy: true,
    nullable: true
  }, {
    key: MtmControlEnum.Mounting,
    lazy: true
  }, {
    key: MtmControlEnum.FlushRainshield,
    lazy: true
  }, {
    key: MtmControlEnum.Frame,
    lazy: true
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
    key: MtmControlEnum.Identifier,
    disabled: true
  }, {
    key: MtmControlEnum.Description,
    disabled: true
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
        name: (i + 1).toFixed(0),
        value: i + 1
      };
    }),
    className: 'control--list--sm'
  }, {
    key: MtmControlEnum.CallButtons,
    name: 'Pulsanti di chiamata',
    type: MtmControlType.List,
    values: [{
      id: 1,
      name: 'Pulsante singolo'
    }, {
      id: 2,
      name: 'Pulsante doppio'
    }, {
      id: 3,
      name: 'Digital keypad'
    }, {
      id: 4,
      name: 'Digital keypad + DIGI1'
    }, {
      id: 5,
      name: 'Digital keypad + DIGI2'
    }],
    className: 'control--list--sm'
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
      this.index = 0;
      this.className = '';
      this.nullable = false;
      this.lazy = false;
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
        var prevent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

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
          return x.classList.remove('active');
        });
        button.classList.add('active');
        this.values.forEach(function (x) {
          return x.active = false;
        });
        var id = parseInt(button.getAttribute('data-id'));
        var item = this.values.find(function (x) {
          return x.id === id;
        });
        item.active = true;
        this.currentItem = item;

        if (!prevent && typeof this.didChange === 'function') {
          this.didChange(item, this);
        } // console.log('MtmControl.onClick', 'button', button, 'item', item);

      }
    }, {
      key: "onSelect",
      value: function onSelect(value) {
        var prevent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this.values.forEach(function (x) {
          return x.active = false;
        });
        this.currentItem = value;

        if (value) {
          value.active = true;

          if (this.element) {
            var group = this.element.querySelector('.control');
            var button = group.querySelector("[data-id=\"".concat(value.id, "\"]"));
            this.onClick(button, prevent);
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
              button.classList.add('disabled');
            } else {
              button.classList.remove('disabled');
            }
          });
        }
      }
    }, {
      key: "addValue",
      value: function addValue(name, price) {
        name = name && name.toString().trim() !== '' ? name.toString() : 'No';

        if (name === 'No' && (this.key === constants_1.MtmControlEnum.AudioVideo || this.key === constants_1.MtmControlEnum.System)) {
          return -1;
        }

        var item = this.cache[name];

        if (item == undefined) {
          /*
          if (name === 'No') {
              console.log(this.key, name);
          }
          */
          item = new value_1.MtmValue({
            id: ++this.count,
            name: name,
            price: price,
            value: parseInt(name)
          });
          this.values.push(item);
          /*
          if (this.key === 'buttons') {
              console.log(item, this.values[0]);
          }
          */
        } else {
          item.count++;
          item.price = Math.min(price, item.price);
        }

        this.cache[name] = item;
        return item.id;
      }
    }, {
      key: "sort",
      value: function sort(index) {
        this.index = index;

        if (this.values.length > 0) {
          this.values.sort(function (a, b) {
            return a.price - b.price;
          });
          var minimumPrice = this.values[0].price;

          if (minimumPrice) {
            this.values.forEach(function (x) {
              return x.price = x.price - minimumPrice;
            });
          } else {
            this.values.sort(function (a, b) {
              return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
          } // this.values.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        }

        var nullValue = this.values.find(function (x) {
          return x.name === 'No';
        });

        if (nullValue) {
          this.values.splice(this.values.indexOf(nullValue), 1);

          if (this.nullable) {
            this.values.unshift(nullValue);
            /*
            this.values.unshift(new MtmValue({
                id: nullValue ? nullValue.id : 0,
                name: 'No',
            }));
            */
          }
        } // this.values.forEach((x, i) => x.price = 4.99 * i);


        if (this.values.length) {
          this.values[0].active = true;
        }
      }
    }, {
      key: "selected",
      get: function get() {
        var selected = this.currentItem;

        if (this.currentItem) {
          return this.currentItem;
        } else {
          return {
            id: -1,
            name: '-',
            price: 0
          };
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
          console.log(select.value, id, item);

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
        return this.price > 0 ? "<span class=\"price\">+ \u20AC ".concat(this.price.toFixed(2), "</span>") : "<span class=\"price\"></span>";
      }
    }, {
      key: "updatePrice",
      value: function updatePrice(element) {
        if (element) {
          var priceElement = element.querySelector("[data-id=\"".concat(this.id, "\"] .price"));
          priceElement.innerHTML = this.price > 0 ? "+ \u20AC ".concat(this.price.toFixed(2)) : "";
        }
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
    define(["require", "exports", "./controls/constants", "./models/data.service", "./utils/dom"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./controls/constants");

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
      this.filteredRows = [];
      this.row = null;
      this.currentKey = constants_1.MtmControlEnum.ApartmentNumber;
      this.element = document.querySelector(selector);
      this.addMediaScrollListener();
      this.addRecapScrollListener();
      data_service_1.default.fetch(function (cols, rows) {
        _this.cols = cols;
        _this.rows = rows;
        var options = [data_service_1.default.newControlByKey(constants_1.MtmControlEnum.KnownTecnology), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ConstrainedDimension), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ApartmentNumber), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.CallButtons), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.AudioVideo), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Keypad), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Proximity), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.DigitalDisplay), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.InfoModule), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.HearingModule), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Finish), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Mount), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.System), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.ModuleSize)];
        options.forEach(function (x) {
          return x.didChange = function (item, control) {
            // console.log('MtmConfigurator.didChange', control.key, item);
            switch (control.key) {
              case constants_1.MtmControlEnum.KnownTecnology:
              case constants_1.MtmControlEnum.ConstrainedDimension:
                _this.doReorder();

                _this.onSearch(_this.didSelectCallButton());

                break;

              case constants_1.MtmControlEnum.ApartmentNumber:
                _this.onSearch(_this.didSelectCallButton());

                break;

              case constants_1.MtmControlEnum.CallButtons:
                _this.onSearch(_this.didSelectCallButton());

                break;

              default:
                _this.onSearch(control.key);

            }
          };
        });
        _this.options = options;

        _this.render();

        _this.onSearch(_this.didSelectCallButton());

        _this.element.querySelector('.media>.picture').addEventListener('click', function () {
          _this.toggleResults();
        });
      }, function (error) {
        console.log('error', error);
      });
    }

    _createClass(MtmConfigurator, [{
      key: "didSelectCallButton",
      value: function didSelectCallButton() {
        var key;
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });

        if (callButtons.selected) {
          var apartmentNumber = this.options.find(function (x) {
            return x.key === constants_1.MtmControlEnum.ApartmentNumber;
          });
          var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons);
          var keypad = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Keypad);
          var keypadValue = keypad.values.find(function (x) {
            return x.name === 'Digital Keypad';
          });
          var divided = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Divided);
          var digi = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Digi);
          var apartmentNumberValue = apartmentNumber.selected.value;

          if (callButtons.selected.id === 2) {
            apartmentNumberValue = Math.ceil(apartmentNumberValue / 2) * 2;
          }

          var firstValue = buttons.values.find(function (v) {
            return v.value >= apartmentNumberValue;
          });

          if (!firstValue && callButtons.selected.id < 3) {
            callButtons.onSelect(callButtons.values.find(function (x) {
              return x.id == 3;
            }), true);
          } // console.log('firstValue', firstValue);


          switch (callButtons.selected.id) {
            case 1:
              // pulsante singolo
              buttons.onSelect(firstValue);
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              keypad.onSelect(null);
              digi.onSelect(null);
              key = constants_1.MtmControlEnum.Buttons;
              break;

            case 2:
              // pulsante doppio
              buttons.onSelect(firstValue);
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 2;
              }));
              keypad.onSelect(null);
              digi.onSelect(null);
              key = constants_1.MtmControlEnum.Divided;
              break;

            case 3:
              // digital keypad
              buttons.onSelect(null);
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              keypad.onSelect(keypadValue);
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI';
              }));
              key = constants_1.MtmControlEnum.Keypad;
              break;

            case 4:
              // digital keypad + DIGI 1
              buttons.onSelect(null);
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              keypad.onSelect(keypadValue);
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI1';
              }));
              key = constants_1.MtmControlEnum.Digi;
              break;

            case 5:
              // digital keypad + DIGI 2
              buttons.onSelect(null);
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 2;
              }));
              keypad.onSelect(keypadValue);
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI2D';
              }));
              key = constants_1.MtmControlEnum.Digi;
              break;
          }

          console.log('apartmentNumber', apartmentNumberValue, 'buttons', buttons.selected.id, 'divided', divided.selected.id, 'keypad', keypad.selected.id, 'digi', digi.selected.id);
        }

        return key;
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
        var proximity = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Proximity;
        });
        var digitalDisplay = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.DigitalDisplay;
        });
        var infoModule = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.InfoModule;
        });
        var hearingModule = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.HearingModule;
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
        controls.push(proximity.element);
        controls.push(digitalDisplay.element);
        controls.push(infoModule.element);
        controls.push(hearingModule.element);
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
      key: "getRows",
      value: function getRows(key) {
        var _this2 = this;

        this.currentKey = key;
        var knownTecnology = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.KnownTecnology;
        });
        var constrainedDimension = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ConstrainedDimension;
        });
        var controls = this.options.map(function (x) {
          var index = _this2.cols.indexOf(x);

          if (index !== -1 && x.key !== key) {
            switch (x.key) {
              case constants_1.MtmControlEnum.System:
                x.lazy = knownTecnology.selected.id !== 2;
                break;

              case constants_1.MtmControlEnum.ModuleSize:
                x.lazy = constrainedDimension.selected.id !== 2;
                break;
            }

            return x;
          } else {
            return {
              index: index
            };
          }
        }).filter(function (x) {
          return x.index !== -1;
        }).map(function (x) {
          return x;
        }).filter(function (x) {
          return x.selected && x.selected.id !== -1;
        });
        var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons);

        if (buttons.selected.id !== -1) {
          // console.log(buttons.index);
          // console.log('onSearch', buttons.selected.id);
          controls.unshift(buttons);
        }

        var divided = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Divided);

        if (divided.selected.id !== -1) {
          // console.log('onSearch', divided.selected.id);
          controls.unshift(divided);
        }

        var digi = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Digi);

        if (digi.selected.id !== -1) {
          // console.log('onSearch', digi.selected.id);
          controls.unshift(digi);
        }

        if (key) {
          // force clicked item
          controls.unshift(data_service_1.default.optionWithKey(key));
        }

        var filteredRows = this.rows.filter(function (x) {
          return controls.reduce(function (has, c) {
            if (c.lazy && c.key !== key) {
              return has;
            } else {
              return has && x[c.index] === c.selected.id;
            }
          }, true);
        });
        var lazyControls = controls.filter(function (c) {
          return c.lazy;
        }); // console.log(controls.filter(c => c.lazy).map(x => x.key + ':' + x.selected.id));

        lazyControls.forEach(function (c) {
          var strictRows = filteredRows.filter(function (x) {
            return x[c.index] === c.selected.id;
          });
          /*
          if (c.key === MtmControlEnum.Buttons) {
              filteredRows.forEach(x => {
                  console.log(c.key, c.selected.id, x[c.index]);
              });
          }
          */

          if (strictRows.length) {
            filteredRows = strictRows;
          }
        });
        return filteredRows;
      }
    }, {
      key: "onSearch",
      value: function onSearch(key) {
        var filteredRows = this.getRows(key); // console.log(filteredRows.length);

        if (filteredRows.length > 0) {
          var row = filteredRows[0];
          this.setRow(row);
        }

        dom_1.default.log('results', filteredRows.length);
        this.filteredRows = filteredRows;
      }
    }, {
      key: "toggleResults",
      value: function toggleResults() {
        var filteredRows = this.filteredRows;

        if (filteredRows.length > 1) {
          var index = (filteredRows.indexOf(this.row) + 1) % filteredRows.length;
          this.setRow(filteredRows[index]);
        }
      }
    }, {
      key: "calcOptions",
      value: function calcOptions(row) {
        var _this3 = this;

        var prices = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Price);
        var controls = [// MtmControlEnum.CallButtons,
        constants_1.MtmControlEnum.AudioVideo, constants_1.MtmControlEnum.Proximity, constants_1.MtmControlEnum.DigitalDisplay, constants_1.MtmControlEnum.InfoModule, constants_1.MtmControlEnum.HearingModule, constants_1.MtmControlEnum.Finish, constants_1.MtmControlEnum.Mounting, constants_1.MtmControlEnum.System, constants_1.MtmControlEnum.ModuleSize].map(function (key) {
          return data_service_1.default.optionWithKey(key);
        });
        var currentControl = data_service_1.default.optionWithKey(this.currentKey);

        if (controls.indexOf(currentControl) > 0) {
          controls.splice(controls.indexOf(currentControl), 1);
          controls.unshift(currentControl);
        }

        controls.forEach(function (control) {
          var query = row.slice();
          var minimumPrice = Number.POSITIVE_INFINITY,
              count = 0;
          control.values.forEach(function (v) {
            query[control.index] = v.id;

            var rows = _this3.rows.filter(function (r) {
              return controls.reduce(function (has, c, i) {
                if (c === control) {
                  return has && r[c.index] === query[c.index];
                } else if (c.lazy && c.key !== _this3.currentKey) {
                  return has;
                } else {
                  return has && r[c.index] === query[c.index];
                }
              }, true);
            });

            controls.filter(function (c) {
              return c.lazy;
            }).forEach(function (c) {
              var strictRows = rows.filter(function (x) {
                return x[c.index] === query[c.index];
              });

              if (true || strictRows.length) {
                rows = strictRows;
              }
            });

            if (rows.length > 0) {
              var rowPrice = prices.values.find(function (v) {
                return v.id === rows[0][prices.index];
              }).value;
              v.price = rowPrice;
              v.disabled = false;
              count++;
            } else {
              v.price = 0;
              v.disabled = true;
            }

            minimumPrice = Math.min(v.price, minimumPrice);
          });
          control.values.forEach(function (v) {
            var rowPrice = v.price;

            if (count > 1) {
              v.price -= minimumPrice;
            } else {
              v.price = 0;
            }

            v.updatePrice(control.element); // console.log(control.key, v.name, rowPrice, v.price, v.disabled ? 'disabled' : '');
          });
          control.updateState();
        });
      }
    }, {
      key: "setRow",
      value: function setRow(row) {
        this.row = row;
        var result = {};
        this.cols.forEach(function (c, i) {
          if (row[i]) {
            var value = c.values.find(function (v) {
              return v.id === row[i];
            });

            if (value) {
              result[c.key] = value.name;
              c.onSelect(value, true);
            } else {
              result[c.key] = '-';
            }
          } else {
            result[c.key] = null;
          }
        });
        var price = parseFloat(result.price);
        this.element.querySelectorAll('.result-price').forEach(function (x) {
          return x.innerHTML = "\u20AC ".concat(price.toFixed(2));
        });
        this.element.querySelector('.result-code').innerHTML = result.code;
        var keys = [constants_1.MtmControlEnum.Module1, constants_1.MtmControlEnum.Module2, constants_1.MtmControlEnum.Module3, constants_1.MtmControlEnum.Module4];
        var descriptions = [];
        keys.forEach(function (x) {
          var value = result[x];

          if (value !== '-') {
            descriptions.push(data_service_1.default.parts.find(function (x) {
              return x.id === parseInt(value);
            }).shortDescription);
          }
        });
        this.element.querySelector('.result-description').innerHTML = descriptions.join(', ');
        this.element.querySelector('.result-finish').innerHTML = result.finish;
        this.element.querySelector('.result-system').innerHTML = result.system;
        this.element.querySelector('.result-mount').innerHTML = result.mount;
        var picture = this.element.querySelector('.media>.picture');
        picture.classList.add('loading');
        var image = new Image();

        image.onload = function () {
          picture.classList.remove('loading');
          picture.querySelectorAll('img').forEach(function (x) {
            return x.parentNode.removeChild(x);
          });
          picture.appendChild(image);
        };

        image.src = 'https://came.yetnot.it/came_configurator/build_kit_image/' + result.code.replace(/\//g, '|');
        this.calcOptions(row);
        dom_1.default.log('setRow', result);
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
        var sidebar = this.element.querySelector('.sidebar');
        var media = this.element.querySelector('.media'); // const picture = media.querySelector('.picture') as HTMLElement;

        var onScroll = function onScroll() {
          var rect = sidebar.getBoundingClientRect();

          if (rect.top < 60) {
            media.classList.add('fixed');
          } else {
            media.classList.remove('fixed');
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
            inner.classList.add('fixed');
          } else {
            inner.classList.remove('fixed');
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

},{"./controls/constants":2,"./models/data.service":10,"./utils/dom":11}],10:[function(require,module,exports){
"use strict";

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

  var MtmPart = function MtmPart() {
    _classCallCheck(this, MtmPart);
  };

  exports.MtmPart = MtmPart;

  var MtmKit = function MtmKit() {
    _classCallCheck(this, MtmKit);
  };

  exports.MtmKit = MtmKit;

  var MtmResult = function MtmResult() {
    _classCallCheck(this, MtmResult);
  };

  exports.MtmResult = MtmResult;

  var MtmDataService =
  /*#__PURE__*/
  function () {
    function MtmDataService() {
      _classCallCheck(this, MtmDataService);
    }

    _createClass(MtmDataService, null, [{
      key: "fetch",
      value: function fetch(callback, error) {
        Object.keys(constants_1.MtmControlEnum).forEach(function (k) {
          var key = k;
          var value = constants_1.MtmControlEnum[key];
          MtmDataService.map[value] = key;
        });
        constants_1.MtmControls.filter(function (x) {
          return !x.disabled;
        }).forEach(function (x) {
          MtmDataService.controlsMap[x.key] = x;
        }); // MtmDataService.controlsMap[value] = MtmControls.find(x => x.type === value);
        // console.log('MtmControlEnum', MtmControlEnum);
        // console.log('controlsMap', MtmDataService.controlsMap);

        return MtmDataService.fetchJson(callback, error); // return MtmDataService.fetchCsv(callback, error);
      }
    }, {
      key: "fetchJson",
      value: function fetchJson(callback, error) {
        var bp = {};
        return Promise.all( // ['https://came.yetnot.it/came_configurator/export/kits_list', 'https://came.yetnot.it/came_configurator/export/parts'].map((x, index) => fetch(x)
        ['data/kits.json', 'data/parts.json'].map(function (x, index) {
          return fetch(x).then(function (response) {
            return response.json();
          }).then(function (data) {
            if (index === 0) {
              data = data.map(function (x) {
                if (x.code.indexOf('DIGI2D') !== -1) {
                  x.digi = 'DIGI2D';
                } else if (x.code.indexOf('DIGI1') !== -1) {
                  x.digi = 'DIGI1';
                } else if (x.code.indexOf('DIGI') !== -1) {
                  x.digi = 'DIGI';
                } else {
                  x.digi = null;
                }

                if (x.digi) {
                  x.buttons = 48;
                  x.buttonType = x.digi;
                } else if (isNaN(parseInt(x.buttons))) {
                  x.buttons = null;
                  x.buttonType = null;
                  console.log('error', x);
                } else {
                  x.buttons = parseInt(x.buttons);
                  x.buttonType = (x.buttons ? x.buttons : '') + (x.divided ? x.divided : '');
                }

                if (!bp[x.buttons]) {
                  console.log(x.buttons);
                  bp[x.buttons] = true;
                }

                x.electronicsModule1 = x.electronicsModule1 ? parseInt(x.electronicsModule1) : null;
                x.electronicsModule2 = x.electronicsModule2 ? parseInt(x.electronicsModule2) : null;
                x.electronicsModule3 = x.electronicsModule3 ? parseInt(x.electronicsModule3) : null;
                x.electronicsModule4 = x.electronicsModule4 ? parseInt(x.electronicsModule4) : null;
                x.frontPiece1 = x.frontPiece1 ? parseInt(x.frontPiece1) : null;
                x.frontPiece2 = x.frontPiece2 ? parseInt(x.frontPiece2) : null;
                x.frontPiece3 = x.frontPiece3 ? parseInt(x.frontPiece3) : null;
                x.frontPiece4 = x.frontPiece4 ? parseInt(x.frontPiece4) : null;
                x.frame = parseInt(x.frame);
                x.mounting = parseInt(x.mounting);
                x.moduleSize = parseInt(x.moduleSize);
                x.flushRainshield = x.flushRainshield ? parseInt(x.flushRainshield) : null;
                return x;
              }).filter(function (x) {
                return x.buttons;
              });
            } else if (index === 1) {
              data = data.rows.map(function (x) {
                x.id = parseInt(x.nid);
                x.price = parseFloat(x.price);
                delete x.nid;
                return x;
              });
            }

            return data;
          });
        })).then(function (all) {
          var parts = all[1];
          var partsPool = {};
          parts.forEach(function (x) {
            partsPool[x.id] = x;
          });
          var kits = all[0].map(function (x) {
            var price = 0;

            if (x.electronicsModule1) {
              price += partsPool[x.electronicsModule1].price;
            }

            if (x.electronicsModule2) {
              price += partsPool[x.electronicsModule2].price;
            }

            if (x.electronicsModule3) {
              price += partsPool[x.electronicsModule3].price;
            }

            if (x.electronicsModule4) {
              price += partsPool[x.electronicsModule4].price;
            }

            if (x.frontPiece1) {
              price += partsPool[x.frontPiece1].price;
            }

            if (x.frontPiece2) {
              price += partsPool[x.frontPiece2].price;
            }

            if (x.frontPiece3) {
              price += partsPool[x.frontPiece3].price;
            }

            if (x.frontPiece4) {
              price += partsPool[x.frontPiece4].price;
            }

            if (x.frame) {
              price += partsPool[x.frame].price;
            }

            if (x.mounting) {
              price += partsPool[x.mounting].price;
            }

            if (x.flushRainshield) {
              price += partsPool[x.flushRainshield].price;
            }

            x.price = price;
            return x;
          });
          kits.sort(function (a, b) {
            return a.price - b.price;
          }); // console.log(JSON.stringify(kits));

          var values = constants_1.MtmControls.filter(function (x) {
            return !x.disabled;
          }).map(function (x) {
            return x.key;
          });
          var cols = values.map(function (x) {
            return MtmDataService.newControlByKey(x);
          });
          var colsPool = {};
          cols.forEach(function (x) {
            return colsPool[x.key] = x;
          });
          var rows = kits.map(function (x) {
            return values.filter(function (key) {
              return colsPool[key];
            }).map(function (key) {
              var col = colsPool[key];
              return col.addValue(x[key], x.price);
            });
          });
          cols.forEach(function (x, i) {
            return x.sort(i);
          });
          MtmDataService.kits = kits;
          MtmDataService.parts = parts;
          MtmDataService.cols = cols;
          MtmDataService.rows = rows;
          console.log(MtmDataService.optionWithKey(constants_1.MtmControlEnum.ButtonType));
          /*
          console.log('kit0', kits[0]);
          console.log('part0', parts[0])
          console.log('row0', rows[0]);
          */

          if (typeof callback === 'function') {
            callback(cols, rows);
          }
        });
      }
    }, {
      key: "fetchCsv",
      value: function fetchCsv(callback, error) {
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
              return cols[i].addValue(value, 0);
            }).filter(function (x) {
              return x;
            });
          });
          cols.forEach(function (x, i) {
            return x.sort(i);
          });
          MtmDataService.cols = cols;
          MtmDataService.rows = rows; // console.log(cols[0], rows[0]);

          if (typeof callback === 'function') {
            callback(cols, rows);
          }
        }).catch(function (reason) {
          if (typeof error === 'function') {
            error(reason);
          }
        });
      }
    }, {
      key: "renameColumn",
      value: function renameColumn(name) {
        if (name === '') {
          name = 'description';
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

  MtmDataService.kits = [];
  MtmDataService.parts = [];
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
      key: "log",
      value: function log() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // const s = args.join(', ');
        var items = ['%c%s', 'background: #1976d2; color: #fff; border-radius: 3px; padding: 4px 8px; margin-bottom: 4px;'].concat(args);
        console.log.apply(this, items);
      }
    }, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzcmMvYXBwL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTXRtQ29udHJvbEVudW0gfSBmcm9tIFwiLi9jb250cm9scy9jb25zdGFudHNcIjtcbmltcG9ydCB7IE10bUNvbnRyb2wgfSBmcm9tIFwiLi9jb250cm9scy9jb250cm9sXCI7XG5pbXBvcnQgeyBNdG1WYWx1ZSB9IGZyb20gXCIuL2NvbnRyb2xzL3ZhbHVlXCI7XG5pbXBvcnQgTXRtRGF0YVNlcnZpY2UgZnJvbSBcIi4vbW9kZWxzL2RhdGEuc2VydmljZVwiO1xuaW1wb3J0IERvbSBmcm9tIFwiLi91dGlscy9kb21cIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTXRtQ29uZmlndXJhdG9yIHtcblxuXHRlbGVtZW50OiBIVE1MRWxlbWVudDtcblx0b3B0aW9uczogTXRtQ29udHJvbFtdO1xuXHRjb2xzOiBNdG1Db250cm9sW10gPSBbXTtcblx0cm93czogbnVtYmVyW11bXSA9IFtdO1xuXHRmaWx0ZXJlZFJvd3M6IGFueVtdID0gW107XG5cdHJvdzogbnVtYmVyW10gPSBudWxsO1xuXHRjdXJyZW50S2V5OiBNdG1Db250cm9sRW51bSA9IE10bUNvbnRyb2xFbnVtLkFwYXJ0bWVudE51bWJlcjtcblxuXHRjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nKSB7XG5cdFx0dGhpcy5lbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgYXMgSFRNTEVsZW1lbnQ7XG5cdFx0dGhpcy5hZGRNZWRpYVNjcm9sbExpc3RlbmVyKCk7XG5cdFx0dGhpcy5hZGRSZWNhcFNjcm9sbExpc3RlbmVyKCk7XG5cdFx0TXRtRGF0YVNlcnZpY2UuZmV0Y2goKGNvbHM6IE10bUNvbnRyb2xbXSwgcm93czogbnVtYmVyW11bXSkgPT4ge1xuXHRcdFx0dGhpcy5jb2xzID0gY29scztcblx0XHRcdHRoaXMucm93cyA9IHJvd3M7XG5cdFx0XHRsZXQgb3B0aW9ucyA9IFtcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2UubmV3Q29udHJvbEJ5S2V5KE10bUNvbnRyb2xFbnVtLktub3duVGVjbm9sb2d5KSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2UubmV3Q29udHJvbEJ5S2V5KE10bUNvbnRyb2xFbnVtLkNvbnN0cmFpbmVkRGltZW5zaW9uKSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2UubmV3Q29udHJvbEJ5S2V5KE10bUNvbnRyb2xFbnVtLkFwYXJ0bWVudE51bWJlciksXG5cdFx0XHRcdE10bURhdGFTZXJ2aWNlLm5ld0NvbnRyb2xCeUtleShNdG1Db250cm9sRW51bS5DYWxsQnV0dG9ucyksXG5cdFx0XHRcdE10bURhdGFTZXJ2aWNlLm9wdGlvbldpdGhLZXkoTXRtQ29udHJvbEVudW0uQXVkaW9WaWRlbyksXG5cdFx0XHRcdE10bURhdGFTZXJ2aWNlLm9wdGlvbldpdGhLZXkoTXRtQ29udHJvbEVudW0uS2V5cGFkKSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5Qcm94aW1pdHkpLFxuXHRcdFx0XHRNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KE10bUNvbnRyb2xFbnVtLkRpZ2l0YWxEaXNwbGF5KSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5JbmZvTW9kdWxlKSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5IZWFyaW5nTW9kdWxlKSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5GaW5pc2gpLFxuXHRcdFx0XHRNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KE10bUNvbnRyb2xFbnVtLk1vdW50KSxcblx0XHRcdFx0TXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5TeXN0ZW0pLFxuXHRcdFx0XHRNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KE10bUNvbnRyb2xFbnVtLk1vZHVsZVNpemUpLFxuXHRcdFx0XTtcblx0XHRcdG9wdGlvbnMuZm9yRWFjaCh4ID0+IHguZGlkQ2hhbmdlID0gKGl0ZW06IE10bVZhbHVlLCBjb250cm9sOiBNdG1Db250cm9sKSA9PiB7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKCdNdG1Db25maWd1cmF0b3IuZGlkQ2hhbmdlJywgY29udHJvbC5rZXksIGl0ZW0pO1xuXHRcdFx0XHRzd2l0Y2ggKGNvbnRyb2wua2V5KSB7XG5cdFx0XHRcdFx0Y2FzZSBNdG1Db250cm9sRW51bS5Lbm93blRlY25vbG9neTpcblx0XHRcdFx0XHRjYXNlIE10bUNvbnRyb2xFbnVtLkNvbnN0cmFpbmVkRGltZW5zaW9uOlxuXHRcdFx0XHRcdFx0dGhpcy5kb1Jlb3JkZXIoKTtcblx0XHRcdFx0XHRcdHRoaXMub25TZWFyY2godGhpcy5kaWRTZWxlY3RDYWxsQnV0dG9uKCkpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSBNdG1Db250cm9sRW51bS5BcGFydG1lbnROdW1iZXI6XG5cdFx0XHRcdFx0XHR0aGlzLm9uU2VhcmNoKHRoaXMuZGlkU2VsZWN0Q2FsbEJ1dHRvbigpKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgTXRtQ29udHJvbEVudW0uQ2FsbEJ1dHRvbnM6XG5cdFx0XHRcdFx0XHR0aGlzLm9uU2VhcmNoKHRoaXMuZGlkU2VsZWN0Q2FsbEJ1dHRvbigpKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHR0aGlzLm9uU2VhcmNoKGNvbnRyb2wua2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHRcdHRoaXMub25TZWFyY2godGhpcy5kaWRTZWxlY3RDYWxsQnV0dG9uKCkpO1xuXHRcdFx0dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZWRpYT4ucGljdHVyZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnRvZ2dsZVJlc3VsdHMoKTtcblx0XHRcdH0pO1xuXHRcdH0sIChlcnJvcjogYW55KSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygnZXJyb3InLCBlcnJvcik7XG5cblx0XHR9KTtcblx0fVxuXG5cdGRpZFNlbGVjdENhbGxCdXR0b24oKTogTXRtQ29udHJvbEVudW0ge1xuXHRcdGxldCBrZXk6IE10bUNvbnRyb2xFbnVtO1xuXHRcdGNvbnN0IGNhbGxCdXR0b25zID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uQ2FsbEJ1dHRvbnMpO1xuXHRcdGlmIChjYWxsQnV0dG9ucy5zZWxlY3RlZCkge1xuXHRcdFx0Y29uc3QgYXBhcnRtZW50TnVtYmVyID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uQXBhcnRtZW50TnVtYmVyKTtcblx0XHRcdGNvbnN0IGJ1dHRvbnMgPSBNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KE10bUNvbnRyb2xFbnVtLkJ1dHRvbnMpO1xuXHRcdFx0Y29uc3Qga2V5cGFkID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5LZXlwYWQpO1xuXHRcdFx0Y29uc3Qga2V5cGFkVmFsdWUgPSBrZXlwYWQudmFsdWVzLmZpbmQoeCA9PiB4Lm5hbWUgPT09ICdEaWdpdGFsIEtleXBhZCcpO1xuXHRcdFx0Y29uc3QgZGl2aWRlZCA9IE10bURhdGFTZXJ2aWNlLm9wdGlvbldpdGhLZXkoTXRtQ29udHJvbEVudW0uRGl2aWRlZCk7XG5cdFx0XHRjb25zdCBkaWdpID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5EaWdpKTtcblx0XHRcdGxldCBhcGFydG1lbnROdW1iZXJWYWx1ZSA9IGFwYXJ0bWVudE51bWJlci5zZWxlY3RlZC52YWx1ZTtcblx0XHRcdGlmIChjYWxsQnV0dG9ucy5zZWxlY3RlZC5pZCA9PT0gMikge1xuXHRcdFx0XHRhcGFydG1lbnROdW1iZXJWYWx1ZSA9IE1hdGguY2VpbChhcGFydG1lbnROdW1iZXJWYWx1ZSAvIDIpICogMjtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGZpcnN0VmFsdWUgPSBidXR0b25zLnZhbHVlcy5maW5kKHYgPT4gdi52YWx1ZSA+PSBhcGFydG1lbnROdW1iZXJWYWx1ZSk7XG5cdFx0XHRpZiAoIWZpcnN0VmFsdWUgJiYgY2FsbEJ1dHRvbnMuc2VsZWN0ZWQuaWQgPCAzKSB7XG5cdFx0XHRcdGNhbGxCdXR0b25zLm9uU2VsZWN0KGNhbGxCdXR0b25zLnZhbHVlcy5maW5kKHggPT4geC5pZCA9PSAzKSwgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnZmlyc3RWYWx1ZScsIGZpcnN0VmFsdWUpO1xuXHRcdFx0c3dpdGNoIChjYWxsQnV0dG9ucy5zZWxlY3RlZC5pZCkge1xuXHRcdFx0XHRjYXNlIDE6XG5cdFx0XHRcdFx0Ly8gcHVsc2FudGUgc2luZ29sb1xuXHRcdFx0XHRcdGJ1dHRvbnMub25TZWxlY3QoZmlyc3RWYWx1ZSk7XG5cdFx0XHRcdFx0ZGl2aWRlZC5vblNlbGVjdChkaXZpZGVkLnZhbHVlcy5maW5kKHggPT4geC5pZCA9PT0gMSkpO1xuXHRcdFx0XHRcdGtleXBhZC5vblNlbGVjdChudWxsKTtcblx0XHRcdFx0XHRkaWdpLm9uU2VsZWN0KG51bGwpO1xuXHRcdFx0XHRcdGtleSA9IE10bUNvbnRyb2xFbnVtLkJ1dHRvbnM7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMjpcblx0XHRcdFx0XHQvLyBwdWxzYW50ZSBkb3BwaW9cblx0XHRcdFx0XHRidXR0b25zLm9uU2VsZWN0KGZpcnN0VmFsdWUpO1xuXHRcdFx0XHRcdGRpdmlkZWQub25TZWxlY3QoZGl2aWRlZC52YWx1ZXMuZmluZCh4ID0+IHguaWQgPT09IDIpKTtcblx0XHRcdFx0XHRrZXlwYWQub25TZWxlY3QobnVsbCk7XG5cdFx0XHRcdFx0ZGlnaS5vblNlbGVjdChudWxsKTtcblx0XHRcdFx0XHRrZXkgPSBNdG1Db250cm9sRW51bS5EaXZpZGVkO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDM6XG5cdFx0XHRcdFx0Ly8gZGlnaXRhbCBrZXlwYWRcblx0XHRcdFx0XHRidXR0b25zLm9uU2VsZWN0KG51bGwpO1xuXHRcdFx0XHRcdGRpdmlkZWQub25TZWxlY3QoZGl2aWRlZC52YWx1ZXMuZmluZCh4ID0+IHguaWQgPT09IDEpKTtcblx0XHRcdFx0XHRrZXlwYWQub25TZWxlY3Qoa2V5cGFkVmFsdWUpO1xuXHRcdFx0XHRcdGRpZ2kub25TZWxlY3QoZGlnaS52YWx1ZXMuZmluZCh4ID0+IHgubmFtZSA9PT0gJ0RJR0knKSk7XG5cdFx0XHRcdFx0a2V5ID0gTXRtQ29udHJvbEVudW0uS2V5cGFkO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDQ6XG5cdFx0XHRcdFx0Ly8gZGlnaXRhbCBrZXlwYWQgKyBESUdJIDFcblx0XHRcdFx0XHRidXR0b25zLm9uU2VsZWN0KG51bGwpO1xuXHRcdFx0XHRcdGRpdmlkZWQub25TZWxlY3QoZGl2aWRlZC52YWx1ZXMuZmluZCh4ID0+IHguaWQgPT09IDEpKTtcblx0XHRcdFx0XHRrZXlwYWQub25TZWxlY3Qoa2V5cGFkVmFsdWUpO1xuXHRcdFx0XHRcdGRpZ2kub25TZWxlY3QoZGlnaS52YWx1ZXMuZmluZCh4ID0+IHgubmFtZSA9PT0gJ0RJR0kxJykpO1xuXHRcdFx0XHRcdGtleSA9IE10bUNvbnRyb2xFbnVtLkRpZ2k7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgNTpcblx0XHRcdFx0XHQvLyBkaWdpdGFsIGtleXBhZCArIERJR0kgMlxuXHRcdFx0XHRcdGJ1dHRvbnMub25TZWxlY3QobnVsbCk7XG5cdFx0XHRcdFx0ZGl2aWRlZC5vblNlbGVjdChkaXZpZGVkLnZhbHVlcy5maW5kKHggPT4geC5pZCA9PT0gMikpO1xuXHRcdFx0XHRcdGtleXBhZC5vblNlbGVjdChrZXlwYWRWYWx1ZSk7XG5cdFx0XHRcdFx0ZGlnaS5vblNlbGVjdChkaWdpLnZhbHVlcy5maW5kKHggPT4geC5uYW1lID09PSAnRElHSTJEJykpO1xuXHRcdFx0XHRcdGtleSA9IE10bUNvbnRyb2xFbnVtLkRpZ2k7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0J2FwYXJ0bWVudE51bWJlcicsIGFwYXJ0bWVudE51bWJlclZhbHVlLFxuXHRcdFx0XHQnYnV0dG9ucycsIGJ1dHRvbnMuc2VsZWN0ZWQuaWQsXG5cdFx0XHRcdCdkaXZpZGVkJywgZGl2aWRlZC5zZWxlY3RlZC5pZCxcblx0XHRcdFx0J2tleXBhZCcsIGtleXBhZC5zZWxlY3RlZC5pZCxcblx0XHRcdFx0J2RpZ2knLCBkaWdpLnNlbGVjdGVkLmlkXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5O1xuXHR9XG5cblx0ZG9SZW9yZGVyKCkge1xuXHRcdGNvbnN0IGNvbnRyb2xzID0gW107XG5cdFx0Y29uc3Qga25vd25UZWNub2xvZ3kgPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5Lbm93blRlY25vbG9neSk7XG5cdFx0Y29uc3Qgc3lzdGVtID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uU3lzdGVtKTtcblx0XHRjb25zdCBjb25zdHJhaW5lZERpbWVuc2lvbiA9IHRoaXMub3B0aW9ucy5maW5kKHggPT4geC5rZXkgPT09IE10bUNvbnRyb2xFbnVtLkNvbnN0cmFpbmVkRGltZW5zaW9uKTtcblx0XHRjb25zdCBtb2R1bGVTaXplID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uTW9kdWxlU2l6ZSk7XG5cdFx0Y29udHJvbHMucHVzaChrbm93blRlY25vbG9neS5lbGVtZW50KTtcblx0XHRpZiAoa25vd25UZWNub2xvZ3kuY3VycmVudEl0ZW0uaWQgPT09IDIpIHtcblx0XHRcdGNvbnRyb2xzLnB1c2goc3lzdGVtLmVsZW1lbnQpO1xuXHRcdH1cblx0XHRjb250cm9scy5wdXNoKGNvbnN0cmFpbmVkRGltZW5zaW9uLmVsZW1lbnQpO1xuXHRcdGlmIChjb25zdHJhaW5lZERpbWVuc2lvbi5jdXJyZW50SXRlbS5pZCA9PT0gMikge1xuXHRcdFx0Y29udHJvbHMucHVzaChtb2R1bGVTaXplLmVsZW1lbnQpO1xuXHRcdH1cblx0XHRjb25zdCBhcGFydG1lbnROdW1iZXIgPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5BcGFydG1lbnROdW1iZXIpO1xuXHRcdGNvbnN0IGNhbGxCdXR0b25zID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uQ2FsbEJ1dHRvbnMpO1xuXHRcdGNvbnN0IGF1ZGlvVmlkZW8gPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5BdWRpb1ZpZGVvKTtcblx0XHRjb25zdCBrZXlwYWQgPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5LZXlwYWQpO1xuXHRcdGNvbnN0IHByb3hpbWl0eSA9IHRoaXMub3B0aW9ucy5maW5kKHggPT4geC5rZXkgPT09IE10bUNvbnRyb2xFbnVtLlByb3hpbWl0eSk7XG5cdFx0Y29uc3QgZGlnaXRhbERpc3BsYXkgPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5EaWdpdGFsRGlzcGxheSk7XG5cdFx0Y29uc3QgaW5mb01vZHVsZSA9IHRoaXMub3B0aW9ucy5maW5kKHggPT4geC5rZXkgPT09IE10bUNvbnRyb2xFbnVtLkluZm9Nb2R1bGUpO1xuXHRcdGNvbnN0IGhlYXJpbmdNb2R1bGUgPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5IZWFyaW5nTW9kdWxlKTtcblx0XHRjb25zdCBmaW5pc2ggPSB0aGlzLm9wdGlvbnMuZmluZCh4ID0+IHgua2V5ID09PSBNdG1Db250cm9sRW51bS5GaW5pc2gpO1xuXHRcdGNvbnN0IG1vdW50ID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uTW91bnQpO1xuXHRcdGNvbnRyb2xzLnB1c2goYXBhcnRtZW50TnVtYmVyLmVsZW1lbnQpO1xuXHRcdGNvbnRyb2xzLnB1c2goY2FsbEJ1dHRvbnMuZWxlbWVudCk7XG5cdFx0Y29udHJvbHMucHVzaChhdWRpb1ZpZGVvLmVsZW1lbnQpO1xuXHRcdGNvbnRyb2xzLnB1c2goa2V5cGFkLmVsZW1lbnQpO1xuXHRcdGNvbnRyb2xzLnB1c2gocHJveGltaXR5LmVsZW1lbnQpO1xuXHRcdGNvbnRyb2xzLnB1c2goZGlnaXRhbERpc3BsYXkuZWxlbWVudCk7XG5cdFx0Y29udHJvbHMucHVzaChpbmZvTW9kdWxlLmVsZW1lbnQpO1xuXHRcdGNvbnRyb2xzLnB1c2goaGVhcmluZ01vZHVsZS5lbGVtZW50KTtcblx0XHRjb250cm9scy5wdXNoKGZpbmlzaC5lbGVtZW50KTtcblx0XHRjb250cm9scy5wdXNoKG1vdW50LmVsZW1lbnQpO1xuXHRcdGlmIChrbm93blRlY25vbG9neS5jdXJyZW50SXRlbS5pZCA9PT0gMSkge1xuXHRcdFx0Y29udHJvbHMucHVzaChzeXN0ZW0uZWxlbWVudCk7XG5cdFx0fVxuXHRcdGlmIChjb25zdHJhaW5lZERpbWVuc2lvbi5jdXJyZW50SXRlbS5pZCA9PT0gMSkge1xuXHRcdFx0Y29udHJvbHMucHVzaChtb2R1bGVTaXplLmVsZW1lbnQpO1xuXHRcdH1cblx0XHQvLyBjb25zdCBjb250cm9scyA9IHRoaXMub3B0aW9ucy5tYXAoeCA9PiB4LmVsZW1lbnQpO1xuXHRcdC8vIGNvbnRyb2xzLnVuc2hpZnQoY29udHJvbHMucG9wKCkpO1xuXHRcdHRoaXMub3B0aW9ucy5tYXAoeCA9PiB4LmVsZW1lbnQpLmZvckVhY2goeCA9PiB7XG5cdFx0XHRpZiAoeC5wYXJlbnROb2RlKSB7XG5cdFx0XHRcdHgucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh4KTtcblx0XHRcdH1cblx0XHR9KVxuXHRcdGNvbnN0IG91dGxldCA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcub3B0aW9ucy1vdXRsZXQnKSBhcyBIVE1MRWxlbWVudDtcblx0XHRjb250cm9scy5mb3JFYWNoKHggPT4gb3V0bGV0LmFwcGVuZENoaWxkKHgpKTtcblx0XHQvLyBjb25zb2xlLmxvZygnZG9SZW9yZGVyJyk7XG5cdH1cblxuXHRnZXRSb3dzKGtleT86IE10bUNvbnRyb2xFbnVtKSB7XG5cdFx0dGhpcy5jdXJyZW50S2V5ID0ga2V5O1xuXHRcdGNvbnN0IGtub3duVGVjbm9sb2d5ID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uS25vd25UZWNub2xvZ3kpO1xuXHRcdGNvbnN0IGNvbnN0cmFpbmVkRGltZW5zaW9uID0gdGhpcy5vcHRpb25zLmZpbmQoeCA9PiB4LmtleSA9PT0gTXRtQ29udHJvbEVudW0uQ29uc3RyYWluZWREaW1lbnNpb24pO1xuXHRcdGNvbnN0IGNvbnRyb2xzID0gdGhpcy5vcHRpb25zLm1hcCh4ID0+IHtcblx0XHRcdGNvbnN0IGluZGV4ID0gdGhpcy5jb2xzLmluZGV4T2YoeCk7XG5cdFx0XHRpZiAoaW5kZXggIT09IC0xICYmIHgua2V5ICE9PSBrZXkpIHtcblx0XHRcdFx0c3dpdGNoICh4LmtleSkge1xuXHRcdFx0XHRcdGNhc2UgTXRtQ29udHJvbEVudW0uU3lzdGVtOlxuXHRcdFx0XHRcdFx0eC5sYXp5ID0ga25vd25UZWNub2xvZ3kuc2VsZWN0ZWQuaWQgIT09IDI7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlIE10bUNvbnRyb2xFbnVtLk1vZHVsZVNpemU6XG5cdFx0XHRcdFx0XHR4LmxhenkgPSBjb25zdHJhaW5lZERpbWVuc2lvbi5zZWxlY3RlZC5pZCAhPT0gMjtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB4O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHsgaW5kZXggfTtcblx0XHRcdH1cblx0XHR9KS5maWx0ZXIoeCA9PiB4LmluZGV4ICE9PSAtMSkubWFwKHggPT4geCBhcyBNdG1Db250cm9sKS5maWx0ZXIoeCA9PiB4LnNlbGVjdGVkICYmIHguc2VsZWN0ZWQuaWQgIT09IC0xKTtcblx0XHRjb25zdCBidXR0b25zID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5CdXR0b25zKTtcblx0XHRpZiAoYnV0dG9ucy5zZWxlY3RlZC5pZCAhPT0gLTEpIHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKGJ1dHRvbnMuaW5kZXgpO1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ29uU2VhcmNoJywgYnV0dG9ucy5zZWxlY3RlZC5pZCk7XG5cdFx0XHRjb250cm9scy51bnNoaWZ0KGJ1dHRvbnMpO1xuXHRcdH1cblx0XHRjb25zdCBkaXZpZGVkID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5EaXZpZGVkKTtcblx0XHRpZiAoZGl2aWRlZC5zZWxlY3RlZC5pZCAhPT0gLTEpIHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdvblNlYXJjaCcsIGRpdmlkZWQuc2VsZWN0ZWQuaWQpO1xuXHRcdFx0Y29udHJvbHMudW5zaGlmdChkaXZpZGVkKTtcblx0XHR9XG5cdFx0Y29uc3QgZGlnaSA9IE10bURhdGFTZXJ2aWNlLm9wdGlvbldpdGhLZXkoTXRtQ29udHJvbEVudW0uRGlnaSk7XG5cdFx0aWYgKGRpZ2kuc2VsZWN0ZWQuaWQgIT09IC0xKSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnb25TZWFyY2gnLCBkaWdpLnNlbGVjdGVkLmlkKTtcblx0XHRcdGNvbnRyb2xzLnVuc2hpZnQoZGlnaSk7XG5cdFx0fVxuXHRcdGlmIChrZXkpIHtcblx0XHRcdC8vIGZvcmNlIGNsaWNrZWQgaXRlbVxuXHRcdFx0Y29udHJvbHMudW5zaGlmdChNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KGtleSkpO1xuXHRcdH1cblx0XHRsZXQgZmlsdGVyZWRSb3dzID0gdGhpcy5yb3dzLmZpbHRlcih4ID0+IHtcblx0XHRcdHJldHVybiBjb250cm9scy5yZWR1Y2UoKGhhcywgYykgPT4ge1xuXHRcdFx0XHRpZiAoYy5sYXp5ICYmIGMua2V5ICE9PSBrZXkpIHtcblx0XHRcdFx0XHRyZXR1cm4gaGFzO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBoYXMgJiYgeFtjLmluZGV4XSA9PT0gYy5zZWxlY3RlZC5pZDtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fSk7XG5cdFx0Y29uc3QgbGF6eUNvbnRyb2xzID0gY29udHJvbHMuZmlsdGVyKGMgPT4gYy5sYXp5KTtcblx0XHQvLyBjb25zb2xlLmxvZyhjb250cm9scy5maWx0ZXIoYyA9PiBjLmxhenkpLm1hcCh4ID0+IHgua2V5ICsgJzonICsgeC5zZWxlY3RlZC5pZCkpO1xuXHRcdGxhenlDb250cm9scy5mb3JFYWNoKGMgPT4ge1xuXHRcdFx0Y29uc3Qgc3RyaWN0Um93cyA9IGZpbHRlcmVkUm93cy5maWx0ZXIoeCA9PiB4W2MuaW5kZXhdID09PSBjLnNlbGVjdGVkLmlkKTtcblx0XHRcdC8qXG5cdFx0XHRpZiAoYy5rZXkgPT09IE10bUNvbnRyb2xFbnVtLkJ1dHRvbnMpIHtcblx0XHRcdFx0ZmlsdGVyZWRSb3dzLmZvckVhY2goeCA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYy5rZXksIGMuc2VsZWN0ZWQuaWQsIHhbYy5pbmRleF0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdCovXG5cdFx0XHRpZiAoc3RyaWN0Um93cy5sZW5ndGgpIHtcblx0XHRcdFx0ZmlsdGVyZWRSb3dzID0gc3RyaWN0Um93cztcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gZmlsdGVyZWRSb3dzO1xuXHR9XG5cblx0b25TZWFyY2goa2V5PzogTXRtQ29udHJvbEVudW0pIHtcblx0XHRjb25zdCBmaWx0ZXJlZFJvd3MgPSB0aGlzLmdldFJvd3Moa2V5KTtcblx0XHQvLyBjb25zb2xlLmxvZyhmaWx0ZXJlZFJvd3MubGVuZ3RoKTtcblx0XHRpZiAoZmlsdGVyZWRSb3dzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IHJvdyA9IGZpbHRlcmVkUm93c1swXTtcblx0XHRcdHRoaXMuc2V0Um93KHJvdyk7XG5cdFx0fVxuXHRcdERvbS5sb2coJ3Jlc3VsdHMnLCBmaWx0ZXJlZFJvd3MubGVuZ3RoKTtcblx0XHR0aGlzLmZpbHRlcmVkUm93cyA9IGZpbHRlcmVkUm93cztcblx0fVxuXG5cdHRvZ2dsZVJlc3VsdHMoKSB7XG5cdFx0Y29uc3QgZmlsdGVyZWRSb3dzID0gdGhpcy5maWx0ZXJlZFJvd3M7XG5cdFx0aWYgKGZpbHRlcmVkUm93cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRjb25zdCBpbmRleCA9IChmaWx0ZXJlZFJvd3MuaW5kZXhPZih0aGlzLnJvdykgKyAxKSAlIGZpbHRlcmVkUm93cy5sZW5ndGg7XG5cdFx0XHR0aGlzLnNldFJvdyhmaWx0ZXJlZFJvd3NbaW5kZXhdKTtcblx0XHR9XG5cdH1cblxuXHRjYWxjT3B0aW9ucyhyb3c6IG51bWJlcltdKSB7XG5cdFx0Y29uc3QgcHJpY2VzID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleShNdG1Db250cm9sRW51bS5QcmljZSk7XG5cdFx0Y29uc3QgY29udHJvbHMgPSBbXG5cdFx0XHQvLyBNdG1Db250cm9sRW51bS5DYWxsQnV0dG9ucyxcblx0XHRcdE10bUNvbnRyb2xFbnVtLkF1ZGlvVmlkZW8sXG5cdFx0XHRNdG1Db250cm9sRW51bS5Qcm94aW1pdHksXG5cdFx0XHRNdG1Db250cm9sRW51bS5EaWdpdGFsRGlzcGxheSxcblx0XHRcdE10bUNvbnRyb2xFbnVtLkluZm9Nb2R1bGUsXG5cdFx0XHRNdG1Db250cm9sRW51bS5IZWFyaW5nTW9kdWxlLFxuXHRcdFx0TXRtQ29udHJvbEVudW0uRmluaXNoLFxuXHRcdFx0TXRtQ29udHJvbEVudW0uTW91bnRpbmcsXG5cdFx0XHRNdG1Db250cm9sRW51bS5TeXN0ZW0sXG5cdFx0XHRNdG1Db250cm9sRW51bS5Nb2R1bGVTaXplLFxuXHRcdF0ubWFwKGtleSA9PiBNdG1EYXRhU2VydmljZS5vcHRpb25XaXRoS2V5KGtleSkpO1xuXHRcdGNvbnN0IGN1cnJlbnRDb250cm9sID0gTXRtRGF0YVNlcnZpY2Uub3B0aW9uV2l0aEtleSh0aGlzLmN1cnJlbnRLZXkpO1xuXHRcdGlmIChjb250cm9scy5pbmRleE9mKGN1cnJlbnRDb250cm9sKSA+IDApIHtcblx0XHRcdGNvbnRyb2xzLnNwbGljZShjb250cm9scy5pbmRleE9mKGN1cnJlbnRDb250cm9sKSwgMSk7XG5cdFx0XHRjb250cm9scy51bnNoaWZ0KGN1cnJlbnRDb250cm9sKTtcblx0XHR9XG5cdFx0Y29udHJvbHMuZm9yRWFjaChjb250cm9sID0+IHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0gcm93LnNsaWNlKCk7XG5cdFx0XHRsZXQgbWluaW11bVByaWNlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLCBjb3VudCA9IDA7XG5cdFx0XHRjb250cm9sLnZhbHVlcy5mb3JFYWNoKHYgPT4ge1xuXHRcdFx0XHRxdWVyeVtjb250cm9sLmluZGV4XSA9IHYuaWQ7XG5cdFx0XHRcdGxldCByb3dzID0gdGhpcy5yb3dzLmZpbHRlcihyID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gY29udHJvbHMucmVkdWNlKChoYXMsIGMsIGkpID0+IHtcblx0XHRcdFx0XHRcdGlmIChjID09PSBjb250cm9sKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBoYXMgJiYgcltjLmluZGV4XSA9PT0gcXVlcnlbYy5pbmRleF07XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGMubGF6eSAmJiBjLmtleSAhPT0gdGhpcy5jdXJyZW50S2V5KSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBoYXM7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaGFzICYmIHJbYy5pbmRleF0gPT09IHF1ZXJ5W2MuaW5kZXhdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIHRydWUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0Y29udHJvbHMuZmlsdGVyKGMgPT4gYy5sYXp5KS5mb3JFYWNoKGMgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHN0cmljdFJvd3MgPSByb3dzLmZpbHRlcih4ID0+IHhbYy5pbmRleF0gPT09IHF1ZXJ5W2MuaW5kZXhdKTtcblx0XHRcdFx0XHRpZiAodHJ1ZSB8fCBzdHJpY3RSb3dzLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cm93cyA9IHN0cmljdFJvd3M7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0aWYgKHJvd3MubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdGNvbnN0IHJvd1ByaWNlID0gcHJpY2VzLnZhbHVlcy5maW5kKHYgPT4gdi5pZCA9PT0gcm93c1swXVtwcmljZXMuaW5kZXhdKS52YWx1ZTtcblx0XHRcdFx0XHR2LnByaWNlID0gcm93UHJpY2U7XG5cdFx0XHRcdFx0di5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0di5wcmljZSA9IDA7XG5cdFx0XHRcdFx0di5kaXNhYmxlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bWluaW11bVByaWNlID0gTWF0aC5taW4odi5wcmljZSwgbWluaW11bVByaWNlKTtcblx0XHRcdH0pO1xuXHRcdFx0Y29udHJvbC52YWx1ZXMuZm9yRWFjaCh2ID0+IHtcblx0XHRcdFx0Y29uc3Qgcm93UHJpY2UgPSB2LnByaWNlO1xuXHRcdFx0XHRpZiAoY291bnQgPiAxKSB7XG5cdFx0XHRcdFx0di5wcmljZSAtPSBtaW5pbXVtUHJpY2U7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0di5wcmljZSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0di51cGRhdGVQcmljZShjb250cm9sLmVsZW1lbnQpO1xuXHRcdFx0XHQvLyBjb25zb2xlLmxvZyhjb250cm9sLmtleSwgdi5uYW1lLCByb3dQcmljZSwgdi5wcmljZSwgdi5kaXNhYmxlZCA/ICdkaXNhYmxlZCcgOiAnJyk7XG5cdFx0XHR9KTtcblx0XHRcdGNvbnRyb2wudXBkYXRlU3RhdGUoKTtcblx0XHR9KTtcblx0fVxuXG5cdHNldFJvdyhyb3c6IG51bWJlcltdKSB7XG5cdFx0dGhpcy5yb3cgPSByb3c7XG5cdFx0Y29uc3QgcmVzdWx0OiBhbnkgPSB7fTtcblx0XHR0aGlzLmNvbHMuZm9yRWFjaCgoYywgaSkgPT4ge1xuXHRcdFx0aWYgKHJvd1tpXSkge1xuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IGMudmFsdWVzLmZpbmQodiA9PiB2LmlkID09PSByb3dbaV0pO1xuXHRcdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0XHRyZXN1bHRbYy5rZXldID0gdmFsdWUubmFtZTtcblx0XHRcdFx0XHRjLm9uU2VsZWN0KHZhbHVlLCB0cnVlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXN1bHRbYy5rZXldID0gJy0nO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXN1bHRbYy5rZXldID0gbnVsbDtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRjb25zdCBwcmljZSA9IHBhcnNlRmxvYXQocmVzdWx0LnByaWNlKTtcblx0XHR0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJlc3VsdC1wcmljZScpLmZvckVhY2goeCA9PiB4LmlubmVySFRNTCA9IGDigqwgJHtwcmljZS50b0ZpeGVkKDIpfWApO1xuXHRcdHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmVzdWx0LWNvZGUnKS5pbm5lckhUTUwgPSByZXN1bHQuY29kZTtcblx0XHRjb25zdCBrZXlzID0gW010bUNvbnRyb2xFbnVtLk1vZHVsZTEsIE10bUNvbnRyb2xFbnVtLk1vZHVsZTIsIE10bUNvbnRyb2xFbnVtLk1vZHVsZTMsIE10bUNvbnRyb2xFbnVtLk1vZHVsZTRdXG5cdFx0Y29uc3QgZGVzY3JpcHRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGtleXMuZm9yRWFjaCh4ID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlOiBzdHJpbmcgPSByZXN1bHRbeF07XG5cdFx0XHRpZiAodmFsdWUgIT09ICctJykge1xuXHRcdFx0XHRkZXNjcmlwdGlvbnMucHVzaChNdG1EYXRhU2VydmljZS5wYXJ0cy5maW5kKHggPT4geC5pZCA9PT0gcGFyc2VJbnQodmFsdWUpKS5zaG9ydERlc2NyaXB0aW9uKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJlc3VsdC1kZXNjcmlwdGlvbicpLmlubmVySFRNTCA9IGRlc2NyaXB0aW9ucy5qb2luKCcsICcpO1xuXHRcdHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmVzdWx0LWZpbmlzaCcpLmlubmVySFRNTCA9IHJlc3VsdC5maW5pc2g7XG5cdFx0dGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yZXN1bHQtc3lzdGVtJykuaW5uZXJIVE1MID0gcmVzdWx0LnN5c3RlbTtcblx0XHR0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJlc3VsdC1tb3VudCcpLmlubmVySFRNTCA9IHJlc3VsdC5tb3VudDtcblx0XHRjb25zdCBwaWN0dXJlID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZWRpYT4ucGljdHVyZScpO1xuXHRcdHBpY3R1cmUuY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuXHRcdGNvbnN0IGltYWdlID0gbmV3IEltYWdlKCk7XG5cdFx0aW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuXHRcdFx0cGljdHVyZS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG5cdFx0XHRwaWN0dXJlLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpLmZvckVhY2goeCA9PiB4LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoeCkpO1xuXHRcdFx0cGljdHVyZS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cdFx0fVxuXHRcdGltYWdlLnNyYyA9ICdodHRwczovL2NhbWUueWV0bm90Lml0L2NhbWVfY29uZmlndXJhdG9yL2J1aWxkX2tpdF9pbWFnZS8nICsgcmVzdWx0LmNvZGUucmVwbGFjZSgvXFwvL2csICd8Jyk7XG5cdFx0dGhpcy5jYWxjT3B0aW9ucyhyb3cpO1xuXHRcdERvbS5sb2coJ3NldFJvdycsIHJlc3VsdCk7XG5cdH1cblxuXHRyZW5kZXIoKSB7XG5cdFx0Y29uc3Qgb3V0bGV0ID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vcHRpb25zLW91dGxldCcpIGFzIEhUTUxFbGVtZW50O1xuXHRcdHRoaXMub3B0aW9ucy5tYXAoeCA9PiB4LnJlbmRlcigpKS5mb3JFYWNoKHggPT4gb3V0bGV0LmFwcGVuZENoaWxkKHgpKTtcblx0XHQvLyBjb25zb2xlLmxvZygncmVuZGVyLm91dGxldCcsIG91dGxldCk7XG5cdH1cblxuXHRhZGRNZWRpYVNjcm9sbExpc3RlbmVyKCkge1xuXHRcdGNvbnN0IHNpZGViYXIgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnNpZGViYXInKSBhcyBIVE1MRWxlbWVudDtcblx0XHRjb25zdCBtZWRpYSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubWVkaWEnKSBhcyBIVE1MRWxlbWVudDtcblx0XHQvLyBjb25zdCBwaWN0dXJlID0gbWVkaWEucXVlcnlTZWxlY3RvcignLnBpY3R1cmUnKSBhcyBIVE1MRWxlbWVudDtcblx0XHRjb25zdCBvblNjcm9sbCA9ICgpID0+IHtcblx0XHRcdGNvbnN0IHJlY3Q6IENsaWVudFJlY3QgfCBET01SZWN0ID0gc2lkZWJhci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdGlmIChyZWN0LnRvcCA8IDYwKSB7XG5cdFx0XHRcdG1lZGlhLmNsYXNzTGlzdC5hZGQoJ2ZpeGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtZWRpYS5jbGFzc0xpc3QucmVtb3ZlKCdmaXhlZCcpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0b25TY3JvbGwoKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgb25TY3JvbGwsIGZhbHNlKTtcblx0fVxuXG5cdGFkZFJlY2FwU2Nyb2xsTGlzdGVuZXIoKSB7XG5cdFx0Y29uc3QgaW5uZXIgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLnNlY3Rpb24tLXJlY2FwLS1maXhlZCA+IC5pbm5lcicpIGFzIEhUTUxFbGVtZW50O1xuXHRcdHZhciBsYXN0U2Nyb2xsVG9wID0gRG9tLnNjcm9sbFRvcCgpO1xuXHRcdGNvbnN0IG9uU2Nyb2xsID0gKCkgPT4ge1xuXHRcdFx0dmFyIHNjcm9sbFRvcCA9IERvbS5zY3JvbGxUb3AoKTtcblx0XHRcdGlmIChzY3JvbGxUb3AgPiBsYXN0U2Nyb2xsVG9wKSB7XG5cdFx0XHRcdGlubmVyLmNsYXNzTGlzdC5hZGQoJ2ZpeGVkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpbm5lci5jbGFzc0xpc3QucmVtb3ZlKCdmaXhlZCcpO1xuXHRcdFx0fVxuXHRcdFx0bGFzdFNjcm9sbFRvcCA9IHNjcm9sbFRvcCA8PSAwID8gMCA6IHNjcm9sbFRvcDsgLy8gRm9yIE1vYmlsZSBvciBuZWdhdGl2ZSBzY3JvbGxpbmdcblx0XHR9O1xuXHRcdG9uU2Nyb2xsKCk7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIG9uU2Nyb2xsLCBmYWxzZSk7XG5cdH1cblxufVxuXG5jb25zdCBjb25maWd1cmF0b3IgPSBuZXcgTXRtQ29uZmlndXJhdG9yKGAuY29uZmlndXJhdG9yYCk7XG4iXSwiZmlsZSI6ImRvY3MvanMvbWFpbi5qcyJ9
