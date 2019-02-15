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
  exports.USE_CALCULATED_PRICE = true;
  exports.MAX_APARTMENTS = 48;
  var MtmControlType;

  (function (MtmControlType) {
    MtmControlType[MtmControlType["Select"] = 1] = "Select";
    MtmControlType[MtmControlType["Group"] = 2] = "Group";
    MtmControlType[MtmControlType["List"] = 3] = "List";
    MtmControlType[MtmControlType["Grid"] = 4] = "Grid";
  })(MtmControlType = exports.MtmControlType || (exports.MtmControlType = {}));

  var MtmSortType;

  (function (MtmSortType) {
    MtmSortType[MtmSortType["String"] = 0] = "String";
    MtmSortType[MtmSortType["Numeric"] = 1] = "Numeric";
  })(MtmSortType = exports.MtmSortType || (exports.MtmSortType = {})); // code,singleModuleFrame,finish,moduleSize,mount,system,AV,keypad,proximity,infoModule,hearingModule,digitalDisplay,additionalModules,buttons,divided,mounting,
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


  var MtmControls =
  /*#__PURE__*/
  function () {
    function MtmControls() {
      _classCallCheck(this, MtmControls);
    }

    _createClass(MtmControls, null, [{
      key: "withLocale",
      value: function withLocale(locale) {
        MtmControls.selectNone.name = locale.selectNone || 'Select';
        return [{
          key: MtmControlEnum.Code,
          name: 'Code'
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
          name: locale.finishName,
          type: MtmControlType.Group,
          defaultId: 2,
          lazy: true
        }, {
          key: MtmControlEnum.ModuleSize,
          name: locale.moduleSizeName,
          description: locale.moduleSizeDescription,
          type: MtmControlType.Group
        }, {
          key: MtmControlEnum.Mount,
          name: locale.mountName,
          type: MtmControlType.List,
          lazy: true
        }, {
          key: MtmControlEnum.System,
          name: locale.systemName,
          description: locale.systemDescription,
          type: MtmControlType.Grid
        }, {
          key: MtmControlEnum.AudioVideo,
          name: locale.audioVideoName,
          type: MtmControlType.Group
        }, {
          key: MtmControlEnum.Keypad,
          name: locale.keypadName,
          description: locale.keypadDescription,
          type: MtmControlType.List,
          lazy: true,
          nullable: true
        }, {
          key: MtmControlEnum.Proximity,
          name: locale.proximityName,
          description: locale.proximityDescription,
          type: MtmControlType.Group,
          lazy: true,
          nullable: true
        }, {
          key: MtmControlEnum.InfoModule,
          name: locale.infoModuleName,
          description: locale.infoModuleDescription,
          type: MtmControlType.Group,
          lazy: true,
          nullable: true
        }, {
          key: MtmControlEnum.HearingModule,
          name: locale.hearingModuleName,
          description: locale.hearingModuleDescription,
          type: MtmControlType.Group,
          lazy: true,
          nullable: true
        }, {
          key: MtmControlEnum.DigitalDisplay,
          name: locale.digitalDisplayName,
          description: locale.digitalDisplayDescription,
          type: MtmControlType.Group,
          lazy: true,
          nullable: true
        }, {
          key: MtmControlEnum.AdditionalModules,
          disabled: true
        }, {
          key: MtmControlEnum.Buttons,
          name: locale.apartmentNumberName,
          type: MtmControlType.Select,
          sortType: MtmSortType.Numeric,
          nullable: true,
          lazy: true,
          className: 'control--list--sm'
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
          name: locale.knownTecnologyName,
          type: MtmControlType.Group,
          className: 'control--group--sm',
          values: [{
            id: 1,
            name: locale.buttonNoName
          }, {
            id: 2,
            name: locale.buttonYesName
          }]
        }, {
          key: MtmControlEnum.ConstrainedDimension,
          name: locale.constrainedDimensionName,
          type: MtmControlType.Group,
          className: 'control--group--sm',
          values: [{
            id: 1,
            name: locale.buttonNoName
          }, {
            id: 2,
            name: locale.buttonYesName
          }]
        }, {
          key: MtmControlEnum.ApartmentNumber,
          name: locale.apartmentNumberName,
          type: MtmControlType.Select,
          sortType: MtmSortType.Numeric,
          nullable: true,
          lazy: true,
          className: 'control--list--sm',
          values: new Array(exports.MAX_APARTMENTS).fill(0).map(function (x, i) {
            return {
              id: i + 1,
              name: (i + 1).toFixed(0),
              value: i + 1
            };
          })
        }, {
          key: MtmControlEnum.CallButtons,
          name: locale.callButtonsName,
          type: MtmControlType.List,
          lazy: true,
          className: 'control--list--sm',
          values: [{
            id: 1,
            name: locale.buttonSingleName
          }, {
            id: 2,
            name: locale.buttonDoubleName
          }, {
            id: 3,
            name: locale.buttonDigitalName
          }, {
            id: 4,
            name: locale.buttonDigitalDigi1Name
          }, {
            id: 5,
            name: locale.buttonDigitalDigi2Name
          }]
        }, {
          key: MtmControlEnum.Default,
          name: 'name',
          description: 'description',
          type: MtmControlType.Group
        }];
      }
    }]);

    return MtmControls;
  }();

  MtmControls.selectNone = {
    id: -1,
    name: 'Select',
    value: -1
  };
  exports.MtmControls = MtmControls;
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
    define(["require", "exports", "../data.service", "../utils/dom", "./constants", "./value"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var data_service_1 = require("../data.service");

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
      this.sortType = constants_1.MtmSortType.String;
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
        /*
        if (this.values.length) {
            this.values[0].selected = true;
            this.currentItem = this.values[0];
        }
        */
      } // }

    }

    _createClass(MtmControl, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option option--".concat(this.key, "\">\n\t\t<div class=\"title\">").concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control ").concat(this.className, "\"></div>\n\t</div>");
      }
    }, {
      key: "getChildTemplate",
      value: function getChildTemplate(item) {
        return "<button type=\"button\" class=\"btn btn--option ".concat(item.selected ? "selected" : "", " ").concat(item.active ? "active" : "", "\" data-id=\"").concat(item.id, "\">\n\t\t<span class=\"label\">").concat(item.name, "</span>").concat(item.getPrice(), "\n\t</button>");
      }
    }, {
      key: "getFragment",
      value: function getFragment() {
        var fragment = dom_1.default.fragmentFromHTML(this.getTemplate());
        this.element = dom_1.default.fragmentFirstElement(fragment); // console.log(this.key, fragment.children);

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
        }); // this.element = group as HTMLElement;
        // console.log(this.key, this.element);

        return fragment;
      }
    }, {
      key: "onClick",
      value: function onClick(button) {
        var prevent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (!button) {
          return;
        }

        var buttons = Array.prototype.slice.call(button.parentNode.childNodes);
        buttons.forEach(function (x) {
          return x.classList.remove('selected');
        });
        this.values.forEach(function (x) {
          return x.selected = false;
        });
        var id = parseInt(button.getAttribute('data-id'));
        var item = this.values.find(function (x) {
          return x.id === id;
        });

        if (this.currentItem === item) {
          item.selected = false;
          this.currentItem = null;
        } else {
          button.classList.add('selected');
          item.selected = true;
          this.currentItem = item;
        }

        if (!prevent && typeof this.didChange === 'function') {
          this.didChange(this.currentItem, this);
        } // console.log('MtmControl.onClick', 'button', button, 'item', item);

      }
    }, {
      key: "onSelect",
      value: function onSelect(value) {
        var prevent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this.values.forEach(function (x) {
          return x.selected = false;
        });
        this.currentItem = value;

        if (value) {
          value.selected = true;

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
        // console.log('MtmControl.updateState', this.key, this.element);
        if (this.element) {
          var group = this.element.querySelector('.control');
          this.values.forEach(function (x, i) {
            var button = group.childNodes[i];

            if (x.disabled) {
              button.classList.add('disabled');
            } else {
              button.classList.remove('disabled');
            } // console.log(x.disabled);

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
        var _this3 = this;

        var paths = new data_service_1.MtmPaths();
        this.index = index;

        if (this.values.length > 0) {
          if (this.sortType === constants_1.MtmSortType.Numeric) {
            this.values.sort(function (a, b) {
              return a.value - b.value;
            });
          } else {
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
            }
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
        }

        if (paths.showPrices !== '1') {
          this.values.forEach(function (x, i) {
            return x.price = 0;
          });
        }

        if (this.key === constants_1.MtmControlEnum.Finish) {
          console.log(this.values.map(function (x) {
            return x.name;
          }));
        }

        if (this.values.length && this.defaultId) {
          // this.values[0].selected = true;
          var defaultValue = this.values.find(function (x) {
            return x.id === _this3.defaultId;
          });

          if (defaultValue) {
            defaultValue.selected = true;
            this.currentItem = defaultValue;
            this.values.splice(this.values.indexOf(defaultValue), 1);
            this.values.unshift(defaultValue);
          }
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

},{"../data.service":9,"../utils/dom":11,"./constants":2,"./value":8}],4:[function(require,module,exports){
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
    define(["require", "exports", "../data.service", "./constants", "./control"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var data_service_1 = require("../data.service");

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
      _this.paths = new data_service_1.MtmPaths();
      return _this;
    }

    _createClass(MtmGrid, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option option--".concat(this.key, "\">\n\t\t<div class=\"title\">").concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--grid ").concat(this.className, "\"></div>\n\t</div>");
      }
    }, {
      key: "getChildTemplate",
      value: function getChildTemplate(item) {
        return "<div class=\"btn btn--system ".concat(item.selected ? "selected" : "", " ").concat(item.active ? "active" : "", "\" data-id=\"").concat(item.id, "\">\n\t\t<img class=\"icon\" src=\"").concat(this.paths.assets, "img/mtm-configurator/").concat(item.getKey(), ".jpg\" title=\"").concat(item.name, "\" />").concat(item.getPrice(), "\n\t\t<button type=\"button\" class=\"btn btn--info\">i</button>\n\t</div>");
      }
    }]);

    return MtmGrid;
  }(control_1.MtmControl);

  exports.MtmGrid = MtmGrid;
});

},{"../data.service":9,"./constants":2,"./control":3}],5:[function(require,module,exports){
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
        return "<div class=\"option option--".concat(this.key, "\">\n\t\t<div class=\"title\">").concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--group ").concat(this.values.length === 4 ? "btn-group--4" : "", " ").concat(this.className, "\"></div>\n\t</div>");
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
        return "<div class=\"option option--".concat(this.key, "\">\n\t\t<div class=\"title\">").concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--list ").concat(this.className, "\"></div>\n\t</div>");
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

      if (_this.nullable) {
        _this.values.unshift(constants_1.MtmControls.selectNone);
      }

      return _this;
    }

    _createClass(MtmSelect, [{
      key: "getTemplate",
      value: function getTemplate() {
        return "<div class=\"option option--".concat(this.key, "\">\n\t\t<div class=\"title\">").concat(this.name, "</div>").concat(this.description ? "<div class=\"subtitle\">".concat(this.description, "</div>") : "", "\n\t\t<div class=\"control control--list ").concat(this.className, "\">\n\t\t\t<div class=\"btn btn--select\">\n\t\t\t\t<select class=\"form-control form-control--select\"></select>\n\t\t\t\t<span class=\"label\"></span>\n\t\t\t</div>\n\t\t</div>\n\t</div>");
      }
    }, {
      key: "getChildTemplate",
      value: function getChildTemplate(item) {
        return "<option class=\"".concat(item.selected ? "selected" : "", " ").concat(item.disabled ? "disabled" : "", " ").concat(item.active ? "active" : "", "\" value=\"").concat(item.id, "\" data-id=\"").concat(item.id, "\">").concat(item.name, "</option>");
      }
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;

        var fragment = this.getFragment();
        var select = fragment.querySelector('.form-control--select');
        var fragments = this.values.map(function (x) {
          return dom_1.default.fragmentFromHTML(_this2.getChildTemplate(x));
        });
        var group = fragment.querySelector('.control');
        fragments.forEach(function (x) {
          return select.appendChild(x);
        });
        this.element = group;
        select.addEventListener('change', function (e) {
          return _this2.onChange(e);
        });
        var value = this.values.find(function (x) {
          return x.selected;
        });

        if (value) {
          select.value = value.id.toFixed();
        }

        this.onUpdate(select);
        return fragment;
      }
    }, {
      key: "updateState",
      value: function updateState() {
        // console.log('MtmSelect.updateState', this.element);
        if (this.element) {
          var select = this.element.querySelector('select');
          this.values.forEach(function (x, i) {
            var option = select.childNodes[i];

            if (x.disabled && x.id !== -1) {
              option.setAttribute('disabled', 'disabled');
            } else {
              option.removeAttribute('disabled');
            }
          });
        }
      }
    }, {
      key: "onUpdate",
      value: function onUpdate(select) {
        if (select) {
          var id = parseInt(select.value);
          var item = this.values.find(function (x) {
            return x.id === id;
          });
          this.currentItem = item; // console.log(select.value, id, item);

          if (item && this.element) {
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
    }, {
      key: "onSelect",
      value: function onSelect(value) {
        var prevent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        this.values.forEach(function (x) {
          return x.selected = false;
        });
        this.currentItem = value; // console.log('MtmSelect.onSelect', value);

        if (value) {
          value.selected = true;

          if (this.element) {
            var label = this.element.querySelector('.label');
            label.innerHTML = value.name;
            var select = this.element.querySelector('select');
            this.values.forEach(function (x, i) {
              x.selected = false;
              var option = select.childNodes[i];

              if (x.selected) {
                option.classList.add('selected');
              } else {
                option.classList.remove('selected');
              }
            });
            select.value = value.id.toString();
          }
        }
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
      this.selected = false;
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

          if (priceElement) {
            priceElement.innerHTML = this.price > 0 ? "+ \u20AC ".concat(this.price.toFixed(2)) : "";
          }
        }
      }
    }, {
      key: "getKey",
      value: function getKey() {
        return this.name.replace(/ /g, "").toLowerCase();
      }
    }]);

    return MtmValue;
  }();

  exports.MtmValue = MtmValue;
});

},{}],9:[function(require,module,exports){
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
    define(["require", "exports", "whatwg-fetch", "./controls/constants", "./controls/control", "./controls/grid", "./controls/group", "./controls/list", "./controls/select"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  require("whatwg-fetch");

  var constants_1 = require("./controls/constants");

  var control_1 = require("./controls/control");

  var grid_1 = require("./controls/grid");

  var group_1 = require("./controls/group");

  var list_1 = require("./controls/list");

  var select_1 = require("./controls/select");

  var MtmPaths = function MtmPaths() {
    _classCallCheck(this, MtmPaths);

    this.assets = '';
    this.kits = 'data/kits.json';
    this.parts = 'data/parts.json';
    this.localizations = 'data/localizations.json';
    this.configurator = 'http://websolute.came.com/came_configurator';
    this.showPrices = '1';

    if (window.hasOwnProperty('paths')) {
      Object.assign(this, window.paths);

      if (this.kits.indexOf(':/') !== -1) {
        this.configurator = this.kits.split('/came_configurator')[0] + '/came_configurator';
      }
    }
  };

  exports.MtmPaths = MtmPaths;

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
        }); // MtmDataService.controlsMap[value] = MtmDataService.controls.find(x => x.type === value);
        // console.log('MtmControlEnum', MtmControlEnum);
        // console.log('controlsMap', MtmDataService.controlsMap);

        return MtmDataService.fetchJson(callback, error); // return MtmDataService.fetchCsv(callback, error);
      }
    }, {
      key: "fetchJson",
      value: function fetchJson(callback, error) {
        var _this = this;

        // const bp: any = {};
        var paths = new MtmPaths();
        return Promise.all([paths.kits, paths.parts, paths.localizations].map(function (x, index) {
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
                /*
                if (!bp[x.buttons]) {
                    console.log(x.buttons);
                    bp[x.buttons] = true;
                }
                */


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
              data = data.map(function (x) {
                x.id = parseInt(x.nid);
                x.price = parseFloat(x.price);
                delete x.nid;
                return x;
              });
            } else if (index === 2) {
              MtmDataService.controls = constants_1.MtmControls.withLocale(data);
              MtmDataService.controls.filter(function (x) {
                return !x.disabled;
              }).forEach(function (x) {
                MtmDataService.controlsMap[x.key] = x;
              });
            }

            return data;
          });
        })).then(function (all) {
          var parts = all[1];
          var localizations = all[2];
          var partsPool = _this.partsPool;
          parts.forEach(function (x) {
            partsPool[x.id] = x;
          });
          var partsKeys = _this.partsKeys;
          var keysPool = {};
          var kits = all[0].map(function (x) {
            var price = 0;
            partsKeys.forEach(function (key) {
              if (x.hasOwnProperty(key)) {
                var part = partsPool[x[key]];

                if (part) {
                  price += part.price;
                  var name = key.replace(/\d/, '');
                  part.type = name;
                  var codes = keysPool[name] = keysPool[name] || [];

                  if (codes.indexOf(part.code) === -1) {
                    codes.push(part.code);
                  }
                }
              }
            });
            /*
            if (x.electronicsModule1) {
                price += partsPool[x.electronicsModule1].price;
                electronicModules[x.electronicsModule1] = partsPool[x.electronicsModule1].code;
            }
            if (x.electronicsModule2) {
                price += partsPool[x.electronicsModule2].price;
                electronicModules[x.electronicsModule2] = partsPool[x.electronicsModule2].code;
            }
            if (x.electronicsModule3) {
                price += partsPool[x.electronicsModule3].price;
                electronicModules[x.electronicsModule3] = partsPool[x.electronicsModule3].code;
            }
            if (x.electronicsModule4) {
                price += partsPool[x.electronicsModule4].price;
                electronicModules[x.electronicsModule4] = partsPool[x.electronicsModule4].code;
            }
            if (x.frontPiece1) {
                price += partsPool[x.frontPiece1].price;
                frontPieces[x.frontPiece1] = partsPool[x.frontPiece1].code;
            }
            if (x.frontPiece2) {
                price += partsPool[x.frontPiece2].price;
                frontPieces[x.frontPiece2] = partsPool[x.frontPiece2].code;
            }
            if (x.frontPiece3) {
                price += partsPool[x.frontPiece3].price;
                frontPieces[x.frontPiece3] = partsPool[x.frontPiece3].code;
            }
            if (x.frontPiece4) {
                price += partsPool[x.frontPiece4].price;
                frontPieces[x.frontPiece4] = partsPool[x.frontPiece4].code;
            }
            if (x.frame) {
                price += partsPool[x.frame].price;
                frames[x.frame] = partsPool[x.frame].code;
            }
            if (x.mounting) {
                price += partsPool[x.mounting].price;
                mountings[x.mounting] = partsPool[x.mounting].code;
            }
            if (x.flushRainshield) {
                price += partsPool[x.flushRainshield].price;
                rainshields[x.flushRainshield] = partsPool[x.flushRainshield].code;
            }
            */

            x.price = price;
            return x;
          });
          Object.keys(keysPool).forEach(function (key) {
            keysPool[key].sort();
          }); // console.log(JSON.stringify(keysPool));

          kits.sort(function (a, b) {
            return a.price - b.price;
          }); // console.log(JSON.stringify(kits));

          var values = MtmDataService.controls.filter(function (x) {
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
              x.finish = x.finish === 'Standard' ? localizations.buttonAluminumName : x.finish;
              var col = colsPool[key];
              return col.addValue(x[key], x.price);
            });
          });
          cols.forEach(function (x, i) {
            return x.sort(i);
          });
          MtmDataService.kits = kits;
          MtmDataService.parts = parts;
          MtmDataService.partsPool = partsPool;
          MtmDataService.cols = cols;
          MtmDataService.rows = rows; // console.log(MtmDataService.optionWithKey(MtmControlEnum.ButtonType));

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
  MtmDataService.partsKeys = ['electronicsModule1', 'electronicsModule2', 'electronicsModule3', 'electronicsModule4', 'frontPiece1', 'frontPiece2', 'frontPiece3', 'frontPiece4', 'frame', 'mounting', 'flushRainshield'];
  MtmDataService.partsPool = {};
  MtmDataService.cols = [];
  MtmDataService.rows = [];
  MtmDataService.map = {}; //: Map<string, string> = {};

  MtmDataService.controlsMap = {};
  exports.default = MtmDataService;
});

},{"./controls/constants":2,"./controls/control":3,"./controls/grid":4,"./controls/group":5,"./controls/list":6,"./controls/select":7,"whatwg-fetch":1}],10:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result["default"] = mod;
  return result;
};

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
    define(["require", "exports", "./controls/constants", "./data.service", "./utils/dom", "./utils/rect"], factory);
  }
})(function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var constants_1 = require("./controls/constants");

  var data_service_1 = __importStar(require("./data.service"));

  var dom_1 = __importDefault(require("./utils/dom"));

  var rect_1 = __importDefault(require("./utils/rect"));

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
      this.currentKey = constants_1.MtmControlEnum.Buttons;
      this.playing = false;
      this.element = document.querySelector(selector);
      var paths = new data_service_1.MtmPaths();

      if (paths.showPrices !== '1') {
        this.element.classList.add('noprice');
      }

      var stickys = [].slice.call(this.element.querySelectorAll('[sticky]'));
      this.stickys = stickys;
      this.stickyContents = stickys.map(function (x) {
        return x.querySelector('[sticky-content]');
      }); // this.addMediaScrollListener();
      // this.addRecapScrollListener();

      this.addRecapScrollFixed();
      data_service_1.default.fetch(function (cols, rows) {
        _this.cols = cols;
        _this.rows = rows;
        var options = [data_service_1.default.newControlByKey(constants_1.MtmControlEnum.KnownTecnology), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ConstrainedDimension), data_service_1.default.newControlByKey(constants_1.MtmControlEnum.ApartmentNumber), // MtmDataService.optionWithKey(MtmControlEnum.Buttons),
        data_service_1.default.newControlByKey(constants_1.MtmControlEnum.CallButtons), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.AudioVideo), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Keypad), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Proximity), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.DigitalDisplay), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.InfoModule), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.HearingModule), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Finish), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Mount), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.System), data_service_1.default.optionWithKey(constants_1.MtmControlEnum.ModuleSize)];
        options.forEach(function (x) {
          return x.didChange = function (item, control) {
            // console.log('MtmConfigurator.didChange', control.key, item);
            switch (control.key) {
              case constants_1.MtmControlEnum.KnownTecnology:
              case constants_1.MtmControlEnum.ConstrainedDimension:
                _this.doReorder();

                _this.onSearch(_this.didSelectCallButton());

                break;

              /*
              case MtmControlEnum.ApartmentNumber:
              this.onSearch(this.didSelectApartmentNumber());
              break;
              */

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
      key: "getRows",
      value: function getRows(key, value) {
        var _this2 = this;

        this.currentKey = key;
        var controls = this.options.map(function (x) {
          var index = _this2.cols.indexOf(x);

          if (index !== -1) {
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
        });
        var selected = controls.filter(function (x) {
          return x.selected && x.selected.id !== -1;
        });
        var unselected = controls.filter(function (x) {
          return !(x.selected && x.selected.id !== -1);
        });
        unselected.forEach(function (x) {
          x.values.forEach(function (v) {
            return v.disabled = true;
          });
        });
        /*
        const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
        if (buttons.selected && buttons.selected.id !== -1) {
            selected.unshift(buttons);
        } else {
            buttons.values.forEach(v => {
                v.disabled = false;
            });
            buttons.updateState();
        }
        */

        var divided = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Divided);

        if (divided.selected && divided.selected.id !== -1) {
          selected.unshift(divided);
        } else {
          divided.values.forEach(function (v) {
            v.disabled = false;
          });
          divided.updateState();
        }

        var digi = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Digi);

        if (digi.selected && digi.selected.id !== -1) {
          selected.unshift(digi);
        } else {
          digi.values.forEach(function (v) {
            v.disabled = false;
          });
          digi.updateState();
        }

        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });

        if (apartmentNumber.selected && apartmentNumber.selected.id !== -1) {
          selected.unshift(apartmentNumber);
        }

        var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons);
        var filteredRows = this.rows.filter(function (x) {
          return selected.reduce(function (has, c) {
            if (c.key === constants_1.MtmControlEnum.ApartmentNumber) {
              var buttonId = x[buttons.index];
              var buttonValue = buttons.values.find(function (v) {
                return v.id === buttonId;
              });
              return has && apartmentNumber.selected.value <= buttonValue.value;
            } else if (c.key === key) {
              if (value) {
                if (value.id === -1) {
                  return true;
                } else {
                  return has && x[c.index] === value.id;
                }
              } else {
                return has && x[c.index] === c.selected.id;
              }
            } else {
              return has && x[c.index] === c.selected.id;
            }
          }, true);
        });
        filteredRows.forEach(function (r) {
          unselected.forEach(function (c) {
            c.values.forEach(function (v) {
              if (v.id === r[c.index]) {
                v.disabled = false;
              }
            });
            c.updateState();
          });
        });
        return filteredRows;
      }
    }, {
      key: "didSelectApartmentNumber",
      value: function didSelectApartmentNumber() {
        var key;
        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });
        key = constants_1.MtmControlEnum.ApartmentNumber;
        return key;
      }
    }, {
      key: "setApartmentNumberState",
      value: function setApartmentNumberState(filteredRows) {
        var buttons = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Buttons); // filteredRows = this.getRows(MtmControlEnum.Buttons, buttons.values.find(x => x.value === -1));

        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });
        apartmentNumber.values.forEach(function (x) {
          return x.disabled = true;
        });
        filteredRows.forEach(function (r) {
          var buttonId = r[buttons.index];
          var button = buttons.values.find(function (b) {
            return b.id === buttonId;
          });
          apartmentNumber.values.forEach(function (v) {
            v.disabled = v.disabled && !(button.value >= v.value);
          });
          apartmentNumber.updateState();
        });
      }
    }, {
      key: "didSelectCallButton",
      value: function didSelectCallButton() {
        var key;
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });
        var divided = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Divided);
        var digi = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Digi);

        if (callButtons.selected.id !== -1) {
          // console.log('firstValue', firstValue);
          switch (callButtons.selected.id) {
            case 1:
              // pulsante singolo
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              digi.currentItem = null;
              key = constants_1.MtmControlEnum.Divided;
              break;

            case 2:
              // pulsante doppio
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 2;
              }));
              digi.currentItem = null;
              key = constants_1.MtmControlEnum.Divided;
              break;

            case 3:
              // digital keypad
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI';
              }));
              key = constants_1.MtmControlEnum.Keypad;
              break;

            case 4:
              // digital keypad + DIGI 1
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 1;
              }));
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI1';
              }));
              key = constants_1.MtmControlEnum.Digi;
              break;

            case 5:
              // digital keypad + DIGI 2
              divided.onSelect(divided.values.find(function (x) {
                return x.id === 2;
              }));
              digi.onSelect(digi.values.find(function (x) {
                return x.name === 'DIGI2D';
              }));
              key = constants_1.MtmControlEnum.Digi;
              break;
          }
          /*
          console.log(
              'apartmentNumber', apartmentNumberValue,
              'buttons', buttons.selected.id,
              'divided', divided.selected.id,
              'digi', digi.selected.id
          );
          */

        } else {
          divided.currentItem = null;
          digi.currentItem = null;
        }

        return key;
      }
    }, {
      key: "setCallButtonsState",
      value: function setCallButtonsState(filteredRows) {
        var divided = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Divided);
        var digi = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Digi);
        var callButtons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.CallButtons;
        });
        callButtons.values.forEach(function (x) {
          return x.disabled = true;
        });
        filteredRows.forEach(function (r) {
          var dividedId = r[divided.index];
          var digiId = r[digi.index]; // console.log(dividedId, digiId);

          callButtons.values.forEach(function (v) {
            var name = '';

            switch (v.id) {
              case 1:
                // pulsante singolo
                v.disabled = v.disabled && !(dividedId === 1 && digiId === 1);
                name = 'pulsante singolo';
                break;

              case 2:
                // pulsante doppio
                v.disabled = v.disabled && !(dividedId === 2 && digiId === 1);
                name = 'pulsante doppio';
                break;

              case 3:
                // digital keypad
                // query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                v.disabled = v.disabled && !(dividedId === 1 && digiId === digi.values.find(function (x) {
                  return x.name === 'DIGI';
                }).id);
                name = 'digital keypad';
                break;

              case 4:
                // digital keypad + DIGI 1
                // query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                v.disabled = v.disabled && !(dividedId === 1 && digiId === digi.values.find(function (x) {
                  return x.name === 'DIGI1';
                }).id);
                name = 'digital keypad + DIGI 1';
                break;

              case 5:
                // digital keypad + DIGI 2
                // query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                v.disabled = v.disabled && !(dividedId === 2 && digiId === digi.values.find(function (x) {
                  return x.name === 'DIGI2D';
                }).id);
                name = 'digital keypad + DIGI 2';
                break;
            }
          });
          callButtons.updateState();
        });
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

        if (knownTecnology.selected.id === 2) {
          controls.push(system.element);
        }

        controls.push(constrainedDimension.element);

        if (constrainedDimension.selected.id === 2) {
          controls.push(moduleSize.element);
        }

        var apartmentNumber = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.ApartmentNumber;
        });
        var buttons = this.options.find(function (x) {
          return x.key === constants_1.MtmControlEnum.Buttons;
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

        if (apartmentNumber && apartmentNumber.element) {
          controls.push(apartmentNumber.element);
        }

        if (buttons && buttons.element) {
          controls.push(buttons.element);
        }

        controls.push(callButtons.element);
        controls.push(audioVideo.element);
        controls.push(keypad.element);
        controls.push(proximity.element);
        controls.push(digitalDisplay.element);
        controls.push(infoModule.element);
        controls.push(hearingModule.element);
        controls.push(finish.element);
        controls.push(mount.element);

        if (knownTecnology.selected.id === 1) {
          controls.push(system.element);
        }

        if (constrainedDimension.selected.id === 1) {
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
      value: function onSearch(key) {
        var filteredRows = this.getRows(key);
        this.setApartmentNumberState(filteredRows);
        this.setCallButtonsState(filteredRows); // console.log(filteredRows.length);

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
      key: "calcOptions__",
      value: function calcOptions__(row) {
        var _this3 = this;

        var prices = data_service_1.default.optionWithKey(constants_1.MtmControlEnum.Price);
        var controls = [// MtmControlEnum.CallButtons,
        constants_1.MtmControlEnum.Buttons, constants_1.MtmControlEnum.AudioVideo, constants_1.MtmControlEnum.Keypad, constants_1.MtmControlEnum.Proximity, constants_1.MtmControlEnum.DigitalDisplay, constants_1.MtmControlEnum.InfoModule, constants_1.MtmControlEnum.HearingModule, constants_1.MtmControlEnum.Finish, constants_1.MtmControlEnum.Mounting, constants_1.MtmControlEnum.System, constants_1.MtmControlEnum.ModuleSize].map(function (key) {
          return data_service_1.default.optionWithKey(key);
        });
        /*
        controls.forEach(control => {
            control.values.forEach(x => {
                if (x.id !== control.selected.id) {
                    const rows = this.getRows(control.key, x);
                    console.log(control.key, x.name, rows.length);
                    if (rows.length) {
                        x.disabled = false;
                    } else {
                        x.disabled = true;
                    }
                }
            });
            control.updateState();
        });
        return;
        */

        var currentControl = data_service_1.default.optionWithKey(this.currentKey);

        if (controls.indexOf(currentControl) > 0) {
          controls.splice(controls.indexOf(currentControl), 1);
          controls.unshift(currentControl);
        }

        var paths = new data_service_1.MtmPaths();
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

            if (paths.showPrices == '1') {
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
            } else {
              v.price = 0;

              if (rows.length > 0) {
                if (data_service_1.default.partsKeys.indexOf(control.key) !== -1) {
                  var part = data_service_1.default.partsPool[v.value];

                  if (part) {
                    v.price = part.price;
                  } // console.log(control.key, v.price, v, part);

                }

                v.disabled = false;
                count++;
              } else {
                v.disabled = true;
              }

              v.updatePrice(control.element);
            }
          });

          if (paths.showPrices == '1') {
            control.values.forEach(function (v) {
              var rowPrice = v.price;

              if (count > 1) {
                v.price -= minimumPrice;
              } else {
                v.price = 0;
              }

              v.updatePrice(control.element); // console.log(control.key, v.name, rowPrice, v.price, v.disabled ? 'disabled' : '');
            });
          }

          control.updateState();
        });
        /*
        const buttons = MtmDataService.optionWithKey(MtmControlEnum.Buttons);
        const divided = MtmDataService.optionWithKey(MtmControlEnum.Divided);
        const digi = MtmDataService.optionWithKey(MtmControlEnum.Digi);
        const callButtons = this.options.find(x => x.key === MtmControlEnum.CallButtons);
        // const callButtons = MtmDataService.optionWithKey(MtmControlEnum.CallButtons);
        controls.push(divided);
        controls.push(digi);
        callButtons.values.forEach(v => {
            const query = row.slice();
            let name = '';
            switch (v.id) {
                case 1:
                    // pulsante singolo
                    query[divided.index] = 1;
                    query[digi.index] = 1;
                    name = 'pulsante singolo';
                    break;
                case 2:
                    // pulsante doppio
                    query[divided.index] = 2;
                    query[digi.index] = 1;
                    name = 'pulsante doppio';
                    break;
                case 3:
                    // digital keypad
                    query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                    query[divided.index] = 1;
                    query[digi.index] = digi.values.find(x => x.name === 'DIGI').id;
                    name = 'digital keypad';
                    break;
                case 4:
                    // digital keypad + DIGI 1
                    query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                    query[divided.index] = 1;
                    query[digi.index] = digi.values.find(x => x.name === 'DIGI1').id;
                    name = 'digital keypad + DIGI 1';
                    break;
                case 5:
                    // digital keypad + DIGI 2
                    query[buttons.index] = buttons.values.find(x => x.name === '48').id;
                    query[divided.index] = 2;
                    query[digi.index] = digi.values.find(x => x.name === 'DIGI2D').id;
                    name = 'digital keypad + DIGI 2';
                    break;
            }
            let rows = this.rows.filter(r => {
                return controls.reduce((has, c, i) => {
                    return has && r[c.index] === query[c.index];
                }, true);
            });
            if (rows.length > 0) {
                v.disabled = false;
            } else {
                v.disabled = true;
            }
            // console.log(name, rows.length, v);
        });
        callButtons.updateState();
        */
        // console.log('callButtons', callButtons, 'divided', divided, 'digi', digi);
        // callButtons.onSelect(callButtons.values.find(x => x.id == 1), true);
      }
    }, {
      key: "calcOptions",
      value: function calcOptions(row) {}
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
              result[c.key] = value.name; // c.onSelect(value, true);
            } else {
              result[c.key] = '-';
            }
          } else {
            result[c.key] = null;
          }
        });
        var price = parseFloat(result.price);
        var paths = new data_service_1.MtmPaths();

        if (paths.showPrices == '1') {
          this.element.querySelectorAll('.result-price').forEach(function (x) {
            return x.innerHTML = "\u20AC ".concat(price.toFixed(2));
          });
        } else {
          this.element.querySelectorAll('.result-price').forEach(function (x) {
            return x.innerHTML = "";
          });
        }

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
        var code = result.code.replace(/\//g, '|');
        this.element.querySelector('.result-cta').setAttribute('href', "".concat(paths.configurator, "/view_kit/").concat(code));
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

        image.src = "".concat(paths.configurator, "/build_kit_image/").concat(code);
        this.calcOptions(row);
        dom_1.default.log('setRow', result);
      }
    }, {
      key: "render",
      value: function render() {
        var _this4 = this;

        var outlet = this.element.querySelector('.options-outlet');
        this.options.map(function (x) {
          return x.render();
        }).forEach(function (x) {
          return outlet.appendChild(x);
        });
        this.options.forEach(function (x) {
          return x.element = _this4.element.querySelector(".option--".concat(x.key));
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
    }, {
      key: "addRecapScrollFixed",
      value: function addRecapScrollFixed() {
        var inner = this.element.querySelector('.section--recap--fixed > .inner');
        inner.classList.add('fixed');
      }
    }, {
      key: "animate",
      value: function animate() {
        var _this5 = this;

        this.stickys.forEach(function (node, i) {
          var content = _this5.stickyContents[i];
          var top = parseInt(node.getAttribute('sticky')) || 0;
          var rect = rect_1.default.fromNode(node);
          var maxtop = node.offsetHeight - content.offsetHeight;

          if (window.innerWidth >= 768) {
            top = Math.max(0, Math.min(maxtop, top - rect.top));
            content.setAttribute('style', "transform: translateY(".concat(top, "px);"));
          } else {
            content.setAttribute('style', "transform: none;");
          }
        });
      }
    }, {
      key: "loop",
      value: function loop() {
        var _this6 = this;

        this.animate();

        if (this.playing) {
          window.requestAnimationFrame(function () {
            _this6.loop();
          });
        }
      }
    }, {
      key: "play",
      value: function play() {
        this.playing = true;
        this.loop();
      }
    }, {
      key: "pause",
      value: function pause() {
        this.playing = false;
      }
    }]);

    return MtmConfigurator;
  }();

  exports.default = MtmConfigurator;
  var configurator = new MtmConfigurator(".configurator");
  configurator.play();
});

},{"./controls/constants":2,"./data.service":9,"./utils/dom":11,"./utils/rect":12}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* jshint esversion: 6 */
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

  var Rect =
  /*#__PURE__*/
  function () {
    function Rect(rect) {
      _classCallCheck(this, Rect);

      this.width = 0;
      this.height = 0;
      this.top = 0;
      this.left = 0;
      this.right = 0;
      this.bottom = 0;
      this.set(rect);
    }

    _createClass(Rect, [{
      key: "set",
      value: function set(rect) {
        if (rect) {
          Object.assign(this, rect);
          this.right = this.left + this.width;
          this.bottom = this.top + this.height;
        }

        this.center = {
          top: this.top + this.height / 2,
          left: this.left + this.width / 2
        };
        this.center.x = this.center.left;
        this.center.y = this.center.top;
      }
    }, {
      key: "contains",
      value: function contains(left, top) {
        return Rect.contains(this, left, top);
      }
    }, {
      key: "intersect",
      value: function intersect(rect) {
        return Rect.intersectRect(this, rect);
      }
    }, {
      key: "intersection",
      value: function intersection(rect) {
        var center = {
          x: (this.center.x - rect.center.x) / (rect.width / 2),
          y: (this.center.y - rect.center.y) / (rect.height / 2)
        };

        if (this.intersect(rect)) {
          var dx = this.left > rect.left ? 0 : Math.abs(rect.left - this.left);
          var dy = this.top > rect.top ? 0 : Math.abs(rect.top - this.top);
          var x = dx ? 1 - dx / this.width : (rect.left + rect.width - this.left) / this.width;
          var y = dy ? 1 - dy / this.height : (rect.top + rect.height - this.top) / this.height;
          x = Math.min(1, x);
          y = Math.min(1, y);
          return {
            x: x,
            y: y,
            center: center
          };
        } else {
          return {
            x: 0,
            y: 0,
            center: center
          };
        }
      }
    }], [{
      key: "contains",
      value: function contains(rect, left, top) {
        return rect.top <= top && top <= rect.bottom && rect.left <= left && left <= rect.right;
      }
    }, {
      key: "intersectRect",
      value: function intersectRect(r1, r2) {
        return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
      }
    }, {
      key: "fromNode",
      value: function fromNode(node) {
        if (!node.getClientRects().length) {
          return new Rect();
        }

        var rect = node.getBoundingClientRect(); // const defaultView = node.ownerDocument.defaultView;

        return new Rect({
          // top: rect.top + defaultView.pageYOffset,
          // left: rect.left + defaultView.pageXOffset,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }]);

    return Rect;
  }();

  exports.default = Rect;
});

},{}]},{},[10]);
