"use strict";

/*
 Generic  Canvas Layer for leaflet 0.7 and 1.0-rc,
 copyright Stanislav Sumbera,  2016 , sumbera.com , license MIT
 originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

 */
// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
if (!L.DomUtil.setTransform) {
  L.DomUtil.setTransform = function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale ? " scale(" + scale + ")" : "");
  };
} // -- support for both  0.0.7 and 1.0.0 rc2 leaflet


L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
  // -- initialized is called on prototype
  initialize: function initialize(options) {
    this._map = null;
    this._canvas = null;
    this._frame = null;
    this._delegate = null;
    L.setOptions(this, options);
  },
  delegate: function delegate(del) {
    this._delegate = del;
    return this;
  },
  needRedraw: function needRedraw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
    }

    return this;
  },
  //-------------------------------------------------------------
  _onLayerDidResize: function _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  //-------------------------------------------------------------
  _onLayerDidMove: function _onLayerDidMove() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);

    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  },
  //-------------------------------------------------------------
  getEvents: function getEvents() {
    var events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove
    };

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }

    return events;
  },
  //-------------------------------------------------------------
  onAdd: function onAdd(map) {
    //console.log('canvas onAdd', this);
    this._map = map;
    this._canvas = L.DomUtil.create("canvas", "leaflet-layer");
    this.tiles = {};

    var size = this._map.getSize();

    this._canvas.width = size.x;
    this._canvas.height = size.y;
    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(this._canvas, "leaflet-zoom-" + (animated ? "animated" : "hide"));
    this.options.pane.appendChild(this._canvas);
    map.on(this.getEvents(), this);
    var del = this._delegate || this;
    del.onLayerDidMount && del.onLayerDidMount(); // -- callback

    this.needRedraw();

    var self = this;
    setTimeout(function () {
      self._onLayerDidMove();
    }, 0);
  },
  //-------------------------------------------------------------
  onRemove: function onRemove(map) {
    var del = this._delegate || this;
    del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback

    this.options.pane.removeChild(this._canvas);
    map.off(this.getEvents(), this);
    this._canvas = null;
  },
  //------------------------------------------------------------
  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },
  //------------------------------------------------------------------------------
  drawLayer: function drawLayer() {
    // -- todo make the viewInfo properties  flat objects.
    var size = this._map.getSize();

    var bounds = this._map.getBounds();

    var zoom = this._map.getZoom();

    var center = this._map.options.crs.project(this._map.getCenter());

    var corner = this._map.options.crs.project(this._map.containerPointToLatLng(this._map.getSize()));

    var del = this._delegate || this;
    del.onDrawLayer && del.onDrawLayer({
      layer: this,
      canvas: this._canvas,
      bounds: bounds,
      size: size,
      zoom: zoom,
      center: center,
      corner: corner
    });
    this._frame = null;
  },
  // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
  //------------------------------------------------------------------------------
  _setTransform: function _setTransform(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale ? " scale(" + scale + ")" : "");
  },
  //------------------------------------------------------------------------------
  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom); // -- different calc of offset in leaflet 1.0.0 and 0.0.7 thanks for 1.0.0-rc2 calc @jduggan1


    var offset = L.Layer ? this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), e.zoom, e.center) : this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
    L.DomUtil.setTransform(this._canvas, offset, scale);
  }
});

L.canvasLayer = function (pane) {
  return new L.CanvasLayer(pane);
};


// 绘制热力图的图层
L.ScalarLayer = (L.Layer ? L.Layer : L.Class).extend({
  //标量图层接受的参数
  options: {
    displayValues: true,
    displayOptions: {
      velocityType: "Scalar",
      position: "bottomleft",
      emptyString: "No Scalar data"
    },
    //取值范围
    minValue: 193,
    maxValue: 328,
    //色标
    colorScale: null,
    //数据
    data: null
  },
  _map: null,
  _canvasLayer: null,
  _scalar: null,
  _context: null,
  _timer: 0,
  _mouseControl: null,

  // 这是一个类构造函数,用于传递图层的参数
  initialize: function initialize(options) {
    console.log('==>', options);
    L.setOptions(this, options);
  },

  //添加图层到地图map中
  onAdd: function onAdd(map) {
    // determine where to add the layer
    this._paneName = this.options.paneName || "scalarPane"; // fall back to overlayPane for leaflet < 1

    var pane = map._panes.overlayPane;

    if (map.getPane) {
      // attempt to get pane first to preserve parent (createPane voids this)
      pane = map.getPane(this._paneName);

      if (!pane) {
        pane = map.createPane(this._paneName);
      }
    } // create canvas, add to map pane


    this._canvasLayer = L.canvasLayer({
      pane: pane
    }).delegate(this);

    this._canvasLayer.addTo(map);

    this._map = map;
  //  this._map.on('mousemove',this._onMouseMove,this);
  },

  //删除图层
  onRemove: function onRemove(map) {
    this._destroyScalar();
  },

  //传入数据,数据的格式是GFS的datajson数组
  setData: function setData(data) {
    this.options.data = data;
    console.log("dataJson:",data)
    if (this._scalar) {
      this._scalar.setData(data);

      this._clearAndRestart();
    }

    this.fire("load");
  },

  setOpacity: function setOpacity(opacity) {
    console.log("this._canvasLayer", this._canvasLayer);

    this._canvasLayer.setOpacity(opacity);
  },

  //设置参数
  setOptions: function setOptions(options) {
    this.options = Object.assign(this.options, options);

    if (options.hasOwnProperty("displayOptions")) {
      this.options.displayOptions = Object.assign(this.options.displayOptions, options.displayOptions);

      this._initMouseHandler(true);
    }

    if (options.hasOwnProperty("data")) this.options.data = options.data;

    if (this._scalar) {
      this._scalar.setOptions(options);

      if (options.hasOwnProperty("data")) this._scalar.setData(options.data);

      this._clearAndRestart();
    } // this.fire("load");

  },

  //将向量变为速度
  vectorToSpeed: function (uMs, vMs) {
    return  Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));

  },

  _onMouseMove: function (e) {
    var self = this;
    var pos = self._map.containerPointToLatLng(
        L.point(e.containerPoint.x, e.containerPoint.y)
    );
    var gridValue = self._scalar.interpolatePoint(
        pos.lng,
        pos.lat
    );
    var htmlOut =gridValue ? gridValue.toFixed(2) : null;
    console.log('当前的值是',htmlOut)
  },

  /*------------------------------------ PRIVATE ------------------------------------------*/
  onDrawLayer: function onDrawLayer(overlay, params) {
    var self = this;

    if (!this._scalar) {
      this._initScalar(this);

      return;
    }

    if (!this.options.data) {
      return;
    }

    if (this._timer) clearTimeout(self._timer);
    this._timer = setTimeout(function () {
      self._startScalar();
    }, 0); // showing velocity is delayed
  },

  _startScalar: function _startScalar() {

    //获取地图的边界
    var bounds = this._map.getBounds();
    console.log("地图边界:"+bounds)
    var size = this._map.getSize(); // bounds, width, height, extent
    console.log("地图大小:"+size)
    this._scalar.start([[0, 0], [size.x, size.y]], size.x, size.y, [[bounds._southWest.lng, bounds._southWest.lat], [bounds._northEast.lng, bounds._northEast.lat]]);
  },

  _initScalar: function _initScalar(self) {
    // scalar object, copy options
    var options = Object.assign({
      canvas: self._canvasLayer._canvas,
      map: this._map
    }, self.options);
    this._scalar = new Scalar(options); // prepare context global var, start drawing

    this._context = this._canvasLayer._canvas.getContext("2d");

    this._canvasLayer._canvas.classList.add("scalar-overlay");

    this._canvasLayer._canvas.classList.add("leaflet-zoom-hide");

    this.onDrawLayer();

    //添加一些操作地图的行为,比如拖拽地图时图层会消失,就是在这里定义的
    // this._map.on("movestart", self._hideScalar);
    //
    // this._map.on("moveend", self._clearAndRestart);
    //
    // this._map.on("zoomstart", self._hideScalar);
    //
    // this._map.on("zoomend", self._clearAndRestart);
    //
    // this._map.on("resize", self._clearScalar);

    this._initMouseHandler(false);
  },

  _initMouseHandler: function _initMouseHandler(voidPrevious) {
    if (voidPrevious) {
      this._map.removeControl(this._mouseControl);

      this._mouseControl = false;
    }

    if (!this._mouseControl && this.options.displayValues) {
      var options = this.options.displayOptions || {};
      options["leafletVelocity"] = this;
      this._mouseControl = L.control.velocity(options).addTo(this._map);
    }
  },

  // 拖拽时 隐藏 windy canvas
  _hideScalar: function _hideWind() {
    // console.log('viewset');
    // var canvas = document.querySelector('.scalar-overlay');
    //
    // if (canvas) {
    //   canvas.style.visibility = 'hidden';
    // }
  },
  _clearAndRestart: function _clearAndRestart() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._scalar) this._startScalar();
    setTimeout(function () {
      var canvas = document.querySelector('.scalar-overlay');

      if (canvas) {
        canvas.style.visibility = 'visible';
      }
    }, 0);
  },
  _clearScalar: function _clearScalar() {
    if (this._scalar) this._scalar.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  },
  _destroyScalar: function _destroyScalar() {
    if (this._timer) clearTimeout(this._timer);
    if (this._scalar) this._scalar.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._mouseControl) this._map.removeControl(this._mouseControl);
    this._mouseControl = null;
    this._scalar = null;

    this._map.removeLayer(this._canvasLayer);
  }
});

L.scalarLayer = function (options) {
  return new L.ScalarLayer(options);
};


var µ = function () {
  "use strict";

  var τ = 2 * Math.PI;
  var H = 0.0000360; // 0.0000360°φ ~= 4m

  var DEFAULT_CONFIG = "current/wind/surface/level/orthographic";
  var TOPOLOGY = isMobile() ? "/data/earth-topo-mobile.json?v2" : "/data/earth-topo.json?v2";
  /**
   * @returns {Boolean} true if the specified value is truthy.
   */

  function isTruthy(x) {
    return !!x;
  }
  /**
   * @returns {Boolean} true if the specified value is not null and not undefined.
   */


  function isValue(x) {
    return x !== null && x !== undefined;
  }
  /**
   * @returns {Object} the first argument if not null and not undefined, otherwise the second argument.
   */


  function coalesce(a, b) {
    return isValue(a) ? a : b;
  }
  /**
   * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
   *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
   */


  function floorMod(a, n) {
    var f = a - n * Math.floor(a / n); // HACK: when a is extremely close to an n transition, f can be equal to n. This is bad because f must be
    //       within range [0, n). Check for this corner case. Example: a:=-1e-16, n:=10. What is the proper fix?

    return f === n ? 0 : f;
  }
  /**
   * @returns {Number} distance between two points having the form [x, y].
   */


  function distance(a, b) {
    var Δx = b[0] - a[0];
    var Δy = b[1] - a[1];
    return Math.sqrt(Δx * Δx + Δy * Δy);
  }
  /**
   * @returns {Number} the value x clamped to the range [low, high].
   */


  function clamp(x, low, high) {
    return Math.max(low, Math.min(x, high));
  }
  /**
   * @returns {number} the fraction of the bounds [low, high] covered by the value x, after clamping x to the
   *          bounds. For example, given bounds=[10, 20], this method returns 1 for x>=20, 0.5 for x=15 and 0
   *          for x<=10.
   */


  function proportion(x, low, high) {
    return (µ.clamp(x, low, high) - low) / (high - low);
  }
  /**
   * @returns {number} the value p within the range [0, 1], scaled to the range [low, high].
   */


  function spread(p, low, high) {
    return p * (high - low) + low;
  }
  /**
   * Pad number with leading zeros. Does not support fractional or negative numbers.
   */


  function zeroPad(n, width) {
    var s = n.toString();
    var i = Math.max(width - s.length, 0);
    return new Array(i + 1).join("0") + s;
  }
  /**
   * @returns {String} the specified string with the first letter capitalized.
   */


  function capitalize(s) {
    return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.substr(1);
  }
  /**
   * @returns {Boolean} true if agent is probably firefox. Don't really care if this is accurate.
   */


  function isFF() {
    return /firefox/i.test(navigator.userAgent);
  }
  /**
   * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
   */


  function isMobile() {
    return /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(navigator.userAgent);
  }

  function isEmbeddedInIFrame() {
    return window != window.top;
  }

  function toUTCISO(date) {
    return date.getUTCFullYear() + "-" + zeroPad(date.getUTCMonth() + 1, 2) + "-" + zeroPad(date.getUTCDate(), 2) + " " + zeroPad(date.getUTCHours(), 2) + ":00";
  }

  function toLocalISO(date) {
    return date.getFullYear() + "-" + zeroPad(date.getMonth() + 1, 2) + "-" + zeroPad(date.getDate(), 2) + " " + zeroPad(date.getHours(), 2) + ":00";
  }
  /**
   * @returns {String} the string yyyyfmmfdd as yyyytmmtdd, where f and t are the "from" and "to" delimiters. Either
   *          delimiter may be the empty string.
   */


  function ymdRedelimit(ymd, fromDelimiter, toDelimiter) {
    if (!fromDelimiter) {
      return ymd.substr(0, 4) + toDelimiter + ymd.substr(4, 2) + toDelimiter + ymd.substr(6, 2);
    }

    var parts = ymd.substr(0, 10).split(fromDelimiter);
    return [parts[0], parts[1], parts[2]].join(toDelimiter);
  }
  /**
   * @returns {String} the UTC year, month, and day of the specified date in yyyyfmmfdd format, where f is the
   *          delimiter (and may be the empty string).
   */


  function dateToUTCymd(date, delimiter) {
    return ymdRedelimit(date.toISOString(), "-", delimiter || "");
  }

  function dateToConfig(date) {
    return {
      date: µ.dateToUTCymd(date, "/"),
      hour: µ.zeroPad(date.getUTCHours(), 2) + "00"
    };
  }
  /**
   * @returns {Object} an object to perform logging, if/when the browser supports it.
   */


  function log() {
    function format(o) {
      return o && o.stack ? o + "\n" + o.stack : o;
    }

    return {
      debug: function debug(s) {
        if (console && console.log) console.log(format(s));
      },
      info: function info(s) {
        if (console && console.info) console.info(format(s));
      },
      error: function error(e) {
        if (console && console.error) console.error(format(e));
      },
      time: function time(s) {
        if (console && console.time) console.time(format(s));
      },
      timeEnd: function timeEnd(s) {
        if (console && console.timeEnd) console.timeEnd(format(s));
      }
    };
  }
  /**
   * @returns {width: (Number), height: (Number)} an object that describes the size of the browser's current view.
   */


  function view() {
    var w = window;
    var d = document && document.documentElement;
    var b = document && document.getElementsByTagName("body")[0];
    var x = w.innerWidth || d.clientWidth || b.clientWidth;
    var y = w.innerHeight || d.clientHeight || b.clientHeight;
    return {
      width: x,
      height: y
    };
  }
  /**
   * Removes all children of the specified DOM element.
   */


  function removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
  /**
   * @returns {Object} clears and returns the specified Canvas element's 2d context.
   */


  function clearCanvas(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function colorInterpolator(start, end) {
    var r = start[0],
        g = start[1],
        b = start[2];
    var Δr = end[0] - r,
        Δg = end[1] - g,
        Δb = end[2] - b;
    return function (i, a) {
      return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
    };
  }
  /**
   * Produces a color style in a rainbow-like trefoil color space. Not quite HSV, but produces a nice
   * spectrum. See http://krazydad.com/tutorials/makecolors.php.
   *
   * @param hue the hue rotation in the range [0, 1]
   * @param a the alpha value in the range [0, 255]
   * @returns {Array} [r, g, b, a]
   */


  function sinebowColor(hue, a) {
    // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
    // hue == 1 from mapping to the same color.
    var rad = hue * τ * 5 / 6;
    rad *= 0.75; // increase frequency to 2/3 cycle per rad

    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var r = Math.floor(Math.max(0, -c) * 255);
    var g = Math.floor(Math.max(s, 0) * 255);
    var b = Math.floor(Math.max(c, 0, -s) * 255);
    return [r, g, b, a];
  }

  var BOUNDARY = 0.45;
  var fadeToWhite = colorInterpolator(sinebowColor(1.0, 0), [255, 255, 255]);
  /**
   * Interpolates a sinebow color where 0 <= i <= j, then fades to white where j < i <= 1.
   *
   * @param i number in the range [0, 1]
   * @param a alpha value in range [0, 255]
   * @returns {Array} [r, g, b, a]
   */

  function extendedSinebowColor(i, a) {
    return i <= BOUNDARY ? sinebowColor(i / BOUNDARY, a) : fadeToWhite((i - BOUNDARY) / (1 - BOUNDARY), a);
  }

  function asColorStyle(r, g, b, a) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
  }
  /**
   * @returns {Array} of wind colors and a method, indexFor, that maps wind magnitude to an index on the color scale.
   */


  function windIntensityColorScale(step, maxWind) {
    var result = [];

    for (var j = 85; j <= 255; j += step) {
      result.push(asColorStyle(j, j, j, 1.0));
    }

    result.indexFor = function (m) {
      // map wind speed to a style
      return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
    };

    return result;
  }
  /**
   * Creates a color scale composed of the specified segments. Segments is an array of two-element arrays of the
   * form [value, color], where value is the point along the scale and color is the [r, g, b] color at that point.
   * For example, the following creates a scale that smoothly transitions from red to green to blue along the
   * points 0.5, 1.0, and 3.5:
   *
   *     [ [ 0.5, [255, 0, 0] ],
   *       [ 1.0, [0, 255, 0] ],
   *       [ 3.5, [0, 0, 255] ] ]
   *
   * @param segments array of color segments
   * @returns {Function} a function(point, alpha) that returns the color [r, g, b, alpha] for the given point.
   */


  function segmentedColorScale(segments) {
    var points = [],
        interpolators = [],
        ranges = [];

    for (var i = 0; i < segments.length - 1; i++) {
      points.push(segments[i + 1][0]);
      interpolators.push(colorInterpolator(segments[i][1], segments[i + 1][1]));
      ranges.push([segments[i][0], segments[i + 1][0]]);
    }

    return function (point, alpha) {
      var i;

      for (i = 0; i < points.length - 1; i++) {
        if (point <= points[i]) {
          break;
        }
      }

      var range = ranges[i];
      return interpolators[i](µ.proportion(point, range[0], range[1]), alpha);
    };
  }
  /**
   * Returns a human readable string for the provided coordinates.
   */


  function formatCoordinates(λ, φ) {
    return Math.abs(φ).toFixed(2) + "° " + (φ >= 0 ? "N" : "S") + ", " + Math.abs(λ).toFixed(2) + "° " + (λ >= 0 ? "E" : "W");
  }
  /**
   * Returns a human readable string for the provided scalar in the given units.
   */


  function formatScalar(value, units) {
    return units.conversion(value).toFixed(units.precision);
  }
  /**
   * Returns a human readable string for the provided rectangular wind vector in the given units.
   * See http://mst.nerc.ac.uk/wind_vect_convs.html.
   */


  function formatVector(wind, units) {
    var d = Math.atan2(-wind[0], -wind[1]) / τ * 360; // calculate into-the-wind cardinal degrees

    var wd = Math.round((d + 360) % 360 / 5) * 5; // shift [-180, 180] to [0, 360], and round to nearest 5.

    return wd.toFixed(0) + "° @ " + formatScalar(wind[2], units);
  }
  /**
   * Returns a promise for a JSON resource (URL) fetched via XHR. If the load fails, the promise rejects with an
   * object describing the reason: {status: http-status-code, message: http-status-text, resource:}.
   */


  function loadJson(resource) {} // var d = when.defer();
  // d3.json(resource, function(error, result) {
  //     return error ?
  //         !error.status ?
  //             d.reject({status: -1, message: "Cannot load resource: " + resource, resource: resource}) :
  //             d.reject({status: error.status, message: error.statusText, resource: resource}) :
  //         d.resolve(result);
  // });
  // return d.promise;

  /**
   * Returns the distortion introduced by the specified projection at the given point.
   *
   * This method uses finite difference estimates to calculate warping by adding a very small amount (h) to
   * both the longitude and latitude to create two lines. These lines are then projected to pixel space, where
   * they become diagonals of triangles that represent how much the projection warps longitude and latitude at
   * that location.
   *
   * <pre>
   *        (λ, φ+h)                  (xλ, yλ)
   *           .                         .
   *           |               ==>        \
   *           |                           \   __. (xφ, yφ)
   *    (λ, φ) .____. (λ+h, φ)       (x, y) .--
   * </pre>
   *
   * See:
   *     Map Projections: A Working Manual, Snyder, John P: pubs.er.usgs.gov/publication/pp1395
   *     gis.stackexchange.com/questions/5068/how-to-create-an-accurate-tissot-indicatrix
   *     www.jasondavies.com/maps/tissot
   *
   * @returns {Array} array of scaled derivatives [dx/dλ, dy/dλ, dx/dφ, dy/dφ]
   */


  function distortion(projection, λ, φ, x, y) {
    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;
    var pλ = projection([λ + hλ, φ]);
    var pφ = projection([λ, φ + hφ]); // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1° λ
    // changes depending on φ. Without this, there is a pinching effect at the poles.

    var k = Math.cos(φ / 360 * τ);
    return [(pλ[0] - x) / hλ / k, (pλ[1] - y) / hλ / k, (pφ[0] - x) / hφ, (pφ[1] - y) / hφ];
  }
  /**
   * Returns a new agent. An agent executes tasks and stores the result of the most recently completed task.
   *
   * A task is a value or promise, or a function that returns a value or promise. After submitting a task to
   * an agent using the submit() method, the task is evaluated and its result becomes the agent's value,
   * replacing the previous value. If a task is submitted to an agent while an earlier task is still in
   * progress, the earlier task is cancelled and its result ignored. Evaluation of a task may even be skipped
   * entirely if cancellation occurs early enough.
   *
   * Agents are Backbone.js Event emitters. When a submitted task is accepted for invocation by an agent, a
   * "submit" event is emitted. This event has the agent as its sole argument. When a task finishes and
   * the agent's value changes, an "update" event is emitted, providing (value, agent) as arguments. If a task
   * fails by either throwing an exception or rejecting a promise, a "reject" event having arguments (err, agent)
   * is emitted. If an event handler throws an error, an "error" event having arguments (err, agent) is emitted.
   *
   * The current task can be cancelled by invoking the agent.cancel() method, and the cancel status is available
   * as the Boolean agent.cancel.requested key. Within the task callback, the "this" context is set to the agent,
   * so a task can know to abort execution by checking the this.cancel.requested key. Similarly, a task can cancel
   * itself by invoking this.cancel().
   *
   * Example pseudocode:
   * <pre>
   *     var agent = newAgent();
   *     agent.on("update", function(value) {
   *         console.log("task completed: " + value);  // same as agent.value()
   *     });
   *
   *     function someLongAsynchronousProcess(x) {  // x === "abc"
   *         var d = when.defer();
   *         // some long process that eventually calls: d.resolve(result)
   *         return d.promise;
   *     }
   *
   *     agent.submit(someLongAsynchronousProcess, "abc");
   * </pre>
   *
   * @param [initial] initial value of the agent, if any
   * @returns {Object}
   */


  function newAgent(initial) {
    /**
     * @returns {Function} a cancel function for a task.
     */
    function cancelFactory() {
      return function cancel() {
        cancel.requested = true;
        return agent;
      };
    }
    /**
     * Invokes the specified task.
     * @param cancel the task's cancel function.
     * @param taskAndArguments the [task-function-or-value, arg0, arg1, ...] array.
     */


    function runTask(cancel, taskAndArguments) {//
      // function run(args) {
      //     return cancel.requested ? null : _.isFunction(task) ? task.apply(agent, args) : task;
      // }
      //
      // function accept(result) {
      //     if (!cancel.requested) {
      //         value = result;
      //         agent.trigger("update", result, agent);
      //     }
      // }
      //
      // function reject(err) {
      //     if (!cancel.requested) {  // ANNOYANCE: when cancelled, this task's error is silently suppressed
      //         agent.trigger("reject", err, agent);
      //     }
      // }
      //
      // function fail(err) {
      //     agent.trigger("fail", err, agent);
      // }
      //
      // try {
      //     // When all arguments are resolved, invoke the task then either accept or reject the result.
      //     var task = taskAndArguments[0];
      //     when.all(_.rest(taskAndArguments)).then(run).then(accept, reject).done(undefined, fail);
      //     agent.trigger("submit", agent);
      // } catch (err) {
      //     fail(err);
      // }
    }

    var _value = initial;

    var runTask_debounced = _.debounce(runTask, 0); // ignore multiple simultaneous submissions--reduces noise


    var agent = {
      /**
       * @returns {Object} this agent's current value.
       */
      value: function value() {
        return _value;
      },

      /**
       * Cancels this agent's most recently submitted task.
       */
      cancel: cancelFactory(),

      /**
       * Submit a new task and arguments to invoke the task with. The task may return a promise for
       * asynchronous tasks, and all arguments may be either values or promises. The previously submitted
       * task, if any, is immediately cancelled.
       * @returns this agent.
       */
      submit: function submit(task, arg0, arg1, and_so_on) {
        // immediately cancel the previous task
        this.cancel(); // schedule the new task and update the agent with its associated cancel function

        runTask_debounced(this.cancel = cancelFactory(), arguments);
        return this;
      }
    };
    return _.extend(agent, Backbone.Events);
  }
  /**
   * Parses a URL hash fragment:
   *
   * example: "2013/11/14/0900Z/wind/isobaric/1000hPa/orthographic=26.50,-153.00,1430/overlay=off"
   * output: {date: "2013/11/14", hour: "0900", param: "wind", surface: "isobaric", level: "1000hPa",
   *          projection: "orthographic", orientation: "26.50,-153.00,1430", overlayType: "off"}
   *
   * grammar:
   *     hash   := ( "current" | yyyy / mm / dd / hhhh "Z" ) / param / surface / level [ / option [ / option ... ] ]
   *     option := type [ "=" number [ "," number [ ... ] ] ]
   *
   * @param hash the hash fragment.
   * @param projectionNames the set of allowed projections.
   * @param overlayTypes the set of allowed overlays.
   * @returns {Object} the result of the parse.
   */


  function parse(hash, projectionNames, overlayTypes) {
    var option,
        result = {}; //             1        2        3          4          5            6      7      8    9

    var tokens = /^(current|(\d{4})\/(\d{1,2})\/(\d{1,2})\/(\d{3,4})Z)\/(\w+)\/(\w+)\/(\w+)([\/].+)?/.exec(hash);

    if (tokens) {
      var date = tokens[1] === "current" ? "current" : tokens[2] + "/" + zeroPad(tokens[3], 2) + "/" + zeroPad(tokens[4], 2);
      var hour = isValue(tokens[5]) ? zeroPad(tokens[5], 4) : "";
      result = {
        date: date,
        // "current" or "yyyy/mm/dd"
        hour: hour,
        // "hhhh" or ""
        param: tokens[6],
        // non-empty alphanumeric _
        surface: tokens[7],
        // non-empty alphanumeric _
        level: tokens[8],
        // non-empty alphanumeric _
        projection: "orthographic",
        orientation: "",
        topology: TOPOLOGY,
        overlayType: "default",
        showGridPoints: false
      };
      coalesce(tokens[9], "").split("/").forEach(function (segment) {
        if (option = /^(\w+)(=([\d\-.,]*))?$/.exec(segment)) {
          if (projectionNames.has(option[1])) {
            result.projection = option[1]; // non-empty alphanumeric _

            result.orientation = coalesce(option[3], ""); // comma delimited string of numbers, or ""
          }
        } else if (option = /^overlay=(\w+)$/.exec(segment)) {
          if (overlayTypes.has(option[1]) || option[1] === "default") {
            result.overlayType = option[1];
          }
        } else if (option = /^grid=(\w+)$/.exec(segment)) {
          if (option[1] === "on") {
            result.showGridPoints = true;
          }
        }
      });
    }

    return result;
  }
  /**
   * A Backbone.js Model that persists its attributes as a human readable URL hash fragment. Loading from and
   * storing to the hash fragment is handled by the sync method.
   */


  var Configuration = Backbone.Model.extend({
    id: 0,
    _ignoreNextHashChangeEvent: false,
    _projectionNames: null,
    _overlayTypes: null,

    /**
     * @returns {String} this configuration converted to a hash fragment.
     */
    toHash: function toHash() {
      var attr = this.attributes;
      var dir = attr.date === "current" ? "current" : attr.date + "/" + attr.hour + "Z";
      var proj = [attr.projection, attr.orientation].filter(isTruthy).join("=");
      var ol = !isValue(attr.overlayType) || attr.overlayType === "default" ? "" : "overlay=" + attr.overlayType;
      var grid = attr.showGridPoints ? "grid=on" : "";
      return [dir, attr.param, attr.surface, attr.level, ol, proj, grid].filter(isTruthy).join("/");
    },

    /**
     * Synchronizes between the configuration model and the hash fragment in the URL bar. Invocations
     * caused by "hashchange" events must have the {trigger: "hashchange"} option specified.
     */
    sync: function sync(method, model, options) {
      switch (method) {
        case "read":
          if (options.trigger === "hashchange" && model._ignoreNextHashChangeEvent) {
            model._ignoreNextHashChangeEvent = false;
            return;
          }

          model.set(parse(window.location.hash.substr(1) || DEFAULT_CONFIG, model._projectionNames, model._overlayTypes));
          break;

        case "update":
          // Ugh. Setting the hash fires a hashchange event during the next event loop turn. Ignore it.
          model._ignoreNextHashChangeEvent = true;
          window.location.hash = model.toHash();
          break;
      }
    }
  });
  /**
   * A Backbone.js Model to hold the page's configuration as a set of attributes: date, layer, projection,
   * orientation, etc. Changes to the configuration fire events which the page's components react to. For
   * example, configuration.save({projection: "orthographic"}) fires an event which causes the globe to be
   * re-rendered with an orthographic projection.
   *
   * All configuration attributes are persisted in a human readable form to the page's hash fragment (and
   * vice versa). This allows deep linking and back-button navigation.
   *
   * @returns {Configuration} Model to represent the hash fragment, using the specified set of allowed projections.
   */

  function buildConfiguration(projectionNames, overlayTypes) {
    var result = new Configuration();
    result._projectionNames = projectionNames;
    result._overlayTypes = overlayTypes;
    return result;
  }

  return {
    isTruthy: isTruthy,
    isValue: isValue,
    coalesce: coalesce,
    floorMod: floorMod,
    distance: distance,
    clamp: clamp,
    proportion: proportion,
    spread: spread,
    zeroPad: zeroPad,
    capitalize: capitalize,
    isFF: isFF,
    isMobile: isMobile,
    isEmbeddedInIFrame: isEmbeddedInIFrame,
    toUTCISO: toUTCISO,
    toLocalISO: toLocalISO,
    ymdRedelimit: ymdRedelimit,
    dateToUTCymd: dateToUTCymd,
    dateToConfig: dateToConfig,
    log: log,
    view: view,
    removeChildren: removeChildren,
    clearCanvas: clearCanvas,
    sinebowColor: sinebowColor,
    extendedSinebowColor: extendedSinebowColor,
    windIntensityColorScale: windIntensityColorScale,
    segmentedColorScale: segmentedColorScale,
    formatCoordinates: formatCoordinates,
    formatScalar: formatScalar,
    formatVector: formatVector,
    loadJson: loadJson,
    distortion: distortion,
    newAgent: newAgent,
    parse: parse,
    buildConfiguration: buildConfiguration
  };
}();
/*  Global class for simulating the movement of particle through a 1km wind grid

 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.

 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".

 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */


var Scalar = function Scalar(params) {
  // var SCALE = {
  //   bounds: [-20, 20],
  //   gradient: µ.segmentedColorScale([
  //     [-20, [37, 4, 42]],
  //     [-15, [41, 10, 130]],
  //     [-12, [81, 40, 40]],
  //     [-10, [192, 37, 149]],  // -40 C/F
  //     [-5, [70, 215, 215]],  // 0 F
  //     [0, [21, 84, 187]],   // 0 C
  //     [5, [24, 132, 14]],   // just above 0 C
  //     [10, [247, 251, 59]],
  //     [12, [235, 167, 21]],
  //     [15, [230, 71, 39]],
  //     [20, [88, 27, 67]]
  //   ])
  // }
  var view = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight
  };

  // 这个overlay_alpha应该是不透明度
  // var OVERLAY_ALPHA = Math.floor(0.4 * 255);
  var OVERLAY_ALPHA = Math.floor(0.7* 255);

  var TRANSPARENT_BLACK = [0, 0, 0, 0]; //default canvas's grid data color


  // 向量的取值范围
  var MIN_VELOCITY_INTENSITY = params.minValue || 193; // velocity at which particle intensity is minimum (m/s)

  var MAX_VELOCITY_INTENSITY = params.maxValue || 328; // velocity at which particle intensity is maximum (m/s)

  var OPACITY = 0.97; // 默认 最大值最小值范围及颜色区间

  var isScalar=params.isScalar | false;

  //色标,左边应该是数值的大小
  var COLORSCALE =params.colorScale || [
      [193, [90, 86, 143]],
      [206, [72, 104, 181]],
      [219, [69, 151, 168]],
      [233.15, [81, 180, 98]], // -40 C/F
      [255.372, [106, 192, 82]], // 0 F
      [273.15, [177, 209, 67]], // 0 C
      [275.15, [215, 206, 60]], // just above 0 C
      [291, [214, 172, 64]],
      [298, [213, 137, 72]],
      [311, [205, 94, 93]],
      [328, [144, 28, 79]]
    ];
  var SCALE = {
    bounds: [MIN_VELOCITY_INTENSITY, MAX_VELOCITY_INTENSITY],
    gradient: {} // 计算色值及step

  };

  // 是否要使用自定义色标，false表示直接根据minValue和maxValue均分色标
  var CUSTOM_KEY = params.customKey || false;
  var colorLengh=COLORSCALE.length-1;
  var setColorScale = function setColorScale() {
    if(!CUSTOM_KEY) {
      let n = parseFloat(((MAX_VELOCITY_INTENSITY - MIN_VELOCITY_INTENSITY) / colorLengh).toFixed(4)),
          m = MIN_VELOCITY_INTENSITY;

      for (let i = 0; i < COLORSCALE.length; i++) {
        COLORSCALE[i][0] = m;
        m += n;
      } 
    }
    return COLORSCALE;
  };

  SCALE.gradient = µ.segmentedColorScale(setColorScale());
  var NULL_WIND_VECTOR = [NaN, NaN, null]; // singleton for no wind in the form: [u, v, magnitude]

  var builder;
  var grid;
  var gridData = params.data;
  var date;
  var λ0, φ0, Δλ, Δφ, ni, nj;

  var setData = function setData(data) {
    gridData = data;
  }; // 计算色值及step


  var setColorScale = function setColorScale() {
    var max = SCALE.bounds[1],
        min = SCALE.bounds[0];
    var n = Math.ceil((max - min) / colorLengh);
    var m = min;

    for (var i = 0; i < COLORSCALE.length; i++) {
      COLORSCALE[i].unshift(m);
      m += n;
    }

    return COLORSCALE;
  };

  var setOptions = function setOptions(options) {
    if (options.hasOwnProperty("opacity")) OPACITY = options.opacity;
  }; // 双线性插入标量


  var bilinearInterpolateScalar = function bilinearInterpolateScalar(x, y, g00, g10, g01, g11) {
    var rx = 1 - x;
    var ry = 1 - y;
    return g00 * rx * ry + g10 * x * ry + g01 * rx * y + g11 * x * y;
  }; // 标量初始化

  //标量构造器,对负数取绝对值,但有个问题对于温度这种正负有物理意义的要怎么办
  var createScalarBuilder = function createScalarBuilder(res,isScalar) {
    let _data,_data1,_data2;
    if (res.length > 1){
      _data1 = res[0];
      _data2 = res[1];
      _data = _data1.data.map(function (v, i) {
        // 向量中有 负值，需取绝对值
        return (Math.abs(v) + Math.abs(_data2.data[i])) / 2;
      });
    }else{
      _data1 = res[0];
      _data = _data1.data.map(function (v, i) {

        if(isScalar){
          // 标量原样返回
          return v
        }else{
          //向量取绝对值
          return Math.abs(v)
        }
      });
    }

    return {
      header: res[0].header,
      data: function data(i) {
        return _data[i];
      },
      interpolate: bilinearInterpolateScalar
    };
  };

  //网格构造器,根据GFS的数据构造地图网格
  var buildGrid = function buildGrid(data, callback) {
    console.log("buildGrid:",data)
    builder = createScalarBuilder(data,isScalar);
    var header = builder.header;

    // 原点的经纬度,左上角(西北)
    λ0 = header.lo1;
    φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    //网格的间隔
    Δλ = header.dx;
    Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    //x轴(经度),y轴(纬度)的网格数
    ni = header.nx;
    nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    //根据时间戳创建变量
    date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime); // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
    // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml

    grid = [];
    var p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;

    //将GFS数据中的一纬数组填充到二维的地图网格中
    for (var j = 0; j < nj; j++) {
      var row = [];

      //记录第j行中每个网格的气象数值
      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }

      //网格应该是闭合的,最后一个和第一个网格的数值应该一样
      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }
      
      //存入网格中
      grid[j] = row;
    }

    //网格会比实际在线地图要小,此时要进行双线性插值
    callback({
      date: date,
      interpolate: interpolate
    });
  };

  /**
   * Get interpolated grid value from Lon/Lat position
   * 根据经纬度计算网格的数值
   * @param λ {Float} Longitude
   * @param φ {Float} Latitude
   * @returns {Object}
   */
  var interpolate = function interpolate(λ, φ) {
    if (!grid) return null;
    var i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)

    var j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    var fi = Math.floor(i),
        ci = fi + 1;
    var fj = Math.floor(j),
        cj = fj + 1;
    var row;

    if (row = grid[fj]) {
      var g00 = row[fi];
      var g10 = row[ci];

      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];

        if (isValue(g01) && isValue(g11)) {
          // All four points found, so interpolate the value.
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }

    return null;
  };
  /**
   * @returns {Boolean} true if the specified value is not null and not undefined.
   */


  var isValue = function isValue(x) {
    return x !== null && x !== undefined;
  };
  /**
   * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
   *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
   */


  var floorMod = function floorMod(a, n) {
    return a - n * Math.floor(a / n);
  };
  /**
   * @returns {Number} the value x clamped to the range [low, high].
   */


  var clamp = function clamp(x, range) {
    return Math.max(range[0], Math.min(x, range[1]));
  };
  /**
   * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
   */


  var isMobile = function isMobile() {
    return /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(navigator.userAgent);
  }; //


  var createField = function createField(columns, bounds, callback) {
    /**
     * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
     *          is undefined at that point.
     */
    function field(x, y) {
      var column = columns[Math.round(x)];
      return column && column[Math.round(y)] || NULL_WIND_VECTOR;
    } // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
    // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.


    field.release = function () {
      columns = [];
    };

    field.randomize = function (o) {
      // UNDONE: this method is terrible
      var x, y;
      var safetyNet = 0;

      do {
        x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
        y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);
      } while (field(x, y)[2] === null && safetyNet++ < 30);

      o.x = x;
      o.y = y;
      return o;
    }; // console.log(bounds,field)


    callback(bounds, field);
  };

  var buildBounds = function buildBounds(bounds, width, height) {
    var upperLeft = bounds[0];
    var lowerRight = bounds[1];
    var x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);

    var y = Math.max(Math.floor(upperLeft[1], 0), 0);
    var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
    var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
    return {
      x: x,
      y: y,
      xMax: width,
      yMax: yMax,
      width: width,
      height: height
    };
  };

  var deg2rad = function deg2rad(deg) {
    return deg / 180 * Math.PI;
  };

  var invert = function invert(x, y, windy) {
    var latlon = params.map.containerPointToLatLng(L.point(x, y));
    return [latlon.lng, latlon.lat];
  };

  var project = function project(lat, lon, windy) {
    var xy = params.map.latLngToContainerPoint(L.latLng(lat, lon));
    return [xy.x, xy.y];
  }; //


  var createMask = function createMask() {
    // Create a detached canvas, ask the model to define the mask polygon, then fill with an opaque color.
    var width = view.width,
        height = view.height;
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    context.fillStyle = "rgba(255, 0, 0, 1)";
    context.fill();
    var imageData = context.getImageData(0, 0, width, height);
    var data = imageData.data; // layout: [r, g, b, a, r, g, b, a, ...]
    // console.log(data)

    return {
      imageData: imageData,
      isVisible: function isVisible(x, y) {
        var i = (y * width + x) * 4;
        return data[i + 3] > 0; // non-zero alpha means pixel is visible
      },
      set: function set(x, y, rgba) {
        var i = (y * width + x) * 4;
        data[i] = rgba[0];
        data[i + 1] = rgba[1];
        data[i + 2] = rgba[2];
        data[i + 3] = rgba[3];
        return this;
      }
    };
  };

  var interpolateField = function interpolateField(grid, bounds, extent, callback) {
    var columns = [];
    var x = bounds.x;
    var mask = createMask();

    function interpolateColumn(x) {
      var column = [];

      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        // if (mask.isVisible(x, y)){
        var coord = invert(x, y);
        var color = TRANSPARENT_BLACK;

        if (coord) {
          var λ = coord[0],
              φ = coord[1];

          if (isFinite(λ)) {
            var scalar = null;
            scalar = grid.interpolate(λ, φ);

            if (isValue(scalar)) {
              color = SCALE.gradient(scalar, OVERLAY_ALPHA);
            }
          }
        }

        mask.set(x, y, color).set(x + 1, y, color).set(x, y + 1, color).set(x + 1, y + 1, color); // }
      }

      columns[x + 1] = columns[x] = column;
    }

    (function batchInterpolate() {
      var start = Date.now();

      while (x < bounds.width) {
        interpolateColumn(x);
        x += 2;

        if (Date.now() - start > 1000) {
          //MAX_TASK_TIME) {
          setTimeout(batchInterpolate, 25);
          return;
        }
      }

      createField(columns, bounds, function () {
        drawOverlay(mask);
      });
    })();
  }; // 绘制强度图层


  var drawOverlay = function drawOverlay(field) {
    if (!field) return;
    console.log('强度图层加载');
    var canvas = document.querySelector('.scalar-overlay');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 3000, 3000); // field.imageData.data = data

    ctx.putImageData(field.imageData, 0, 0);
    console.log(field.imageData);
  }; // 开始绘制


  var start = function start(bounds, width, height, extent) {
    var mapBounds = {
      south: deg2rad(extent[0][1]),
      north: deg2rad(extent[1][1]),
      east: deg2rad(extent[1][0]),
      west: deg2rad(extent[0][0]),
      width: width,
      height: height
    };
    stop(); // build grid

    buildGrid(gridData, function (grid) {
      // interpolateField
      interpolateField(grid, buildBounds(bounds, width, height), mapBounds, function (bounds, field) {// animate the canvas with random points
        // strength.field = field;
        // animate(bounds, field);
      });
    });
  };

  var stop = function stop() {
    if (scalar.field) scalar.field.release();
  };

  var scalar = {
    params: params,
    start: start,
    stop: stop,
    createField: createField,
    interpolatePoint: interpolate,
    setData: setData,
    setOptions: setOptions
  };
  return scalar;
};
/*  Global class for simulating the movement of particle through a 1km wind grid

 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.

 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".

 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */


if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}