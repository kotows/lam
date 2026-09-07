(function() {
  'use strict';

  var Defined = {
    api: 'lampac',
    localhost: 'https://gpbx.me/',
    apn: ''
  };

  var balansers_with_search;

  var unic_id = '';

  function gpbayUidClean(value) {
    var uid = '';

    try {
      uid = value == null ? '' : String(value);
    } catch (e) {
      uid = '';
    }

    try {
      uid = uid.replace(/^\s+|\s+$/g, '').toLowerCase();
    } catch (e2) {}

    if (!uid || /^\{[^}]+\}$/.test(uid)) return '';
    if (uid == 'undefined' || uid == 'null' || uid == 'false') return '';
    if (!/^[a-z0-9]{8}$/.test(uid)) return '';
    return uid;
  }

  function gpbayCreateUid() {
    try {
      if (Lampa && Lampa.Utils && typeof Lampa.Utils.uid == 'function') {
        return gpbayUidClean(Lampa.Utils.uid(8).toLowerCase());
      }
    } catch (e) {}

    try {
      return gpbayUidClean(((Date.now ? Date.now() : new Date().getTime()).toString(36) + Math.random().toString(36).replace(/[^a-z0-9]+/g, '')).slice(-8));
    } catch (e2) {}

    return 'uid' + (new Date().getTime() + '').slice(-5);
  }

  function gpbayLocalStorageGet(key) {
    try {
      if (typeof window != 'undefined' && window.localStorage)
        return gpbayUidClean(window.localStorage.getItem(key));
    } catch (e) {}

    return '';
  }

  function gpbayLocalStorageSet(key, value) {
    try {
      if (typeof window != 'undefined' && window.localStorage)
        window.localStorage.setItem(key, value);
    } catch (e) {}
  }

  function gpbayStorageGet(key) {
    try {
      if (Lampa && Lampa.Storage)
        return gpbayUidClean(Lampa.Storage.get(key, ''));
    } catch (e) {}

    return '';
  }

  function gpbayStorageSet(key, value) {
    try {
      if (Lampa && Lampa.Storage)
        Lampa.Storage.set(key, value);
    } catch (e) {}
  }

  function gpbaySaveUid(uid) {
    uid = gpbayUidClean(uid);
    if (!uid) return '';

    gpbayStorageSet('lampac_unic_id', uid);
    gpbayLocalStorageSet('lampac_unic_id', uid);
    gpbayLocalStorageSet('gpbay_lampac_unic_id', uid);

    unic_id = uid;
    return uid;
  }

  function gpbayEnsureUid() {
    var uid = gpbayStorageGet('lampac_unic_id');

    if (!uid) uid = gpbayUidClean(unic_id);
    if (!uid) uid = gpbayLocalStorageGet('lampac_unic_id');
    if (!uid) uid = gpbayLocalStorageGet('gpbay_lampac_unic_id');
    if (!uid) uid = gpbayCreateUid();

    return gpbaySaveUid(uid);
  }

  function gpbayRotateUid() {
    var previous = gpbayEnsureUid();
    var next = '';
    var i;

    for (i = 0; i < 12; i++) {
      next = gpbayCreateUid();
      if (next && next != previous) break;
    }

    if (!next || next == previous) return '';
    return gpbaySaveUid(next);
  }

  unic_id = gpbayEnsureUid();

  try {
    if (typeof window != 'undefined' && typeof window.globalThis == 'undefined') {
      window.globalThis = window;
    }
  } catch (e) {}

  var GPBAY_GA4_ID = 'G-E8QT8F2JGR';
  var GPBAY_YM_ID = 110512060;
  var GPBAY_YM_SRC = 'https://mc.webvisor.org/metrika/tag_ww.js?id=' + GPBAY_YM_ID;
  var GPBAY_DATA_LAYER = 'gpbayDataLayer';
  var GPBAY_PAGE_TITLE = 'GProjectBay';
  var gpbay_last_page_title = GPBAY_PAGE_TITLE;
  var GPBAY_ANALYTICS_SETTING = 'gpbay_analytics_enabled';
  var gpbay_analytics_runtime_enabled = true;
  var gpbay_analytics_restart_pending = false;

  function gpbayAnalyticsValueEnabled(value) {
    return !(value === false || value === 0 || value === '0' || value === 'false' || value === 'off');
  }

  function gpbayAnalyticsStoredValue() {
    var raw = 'true';
    var enabled = true;
    var canonical = 'true';

    try { raw = Lampa.Storage.get(GPBAY_ANALYTICS_SETTING, 'true'); } catch (e) {}
    enabled = gpbayAnalyticsValueEnabled(raw);
    canonical = enabled ? 'true' : 'false';

    if (raw !== canonical) {
      try { Lampa.Storage.set(GPBAY_ANALYTICS_SETTING, canonical); } catch (e2) {}
    }

    return enabled;
  }

  function gpbayAnalyticsEnabled() {
    return gpbay_analytics_runtime_enabled === true;
  }

  gpbay_analytics_runtime_enabled = gpbayAnalyticsStoredValue();

  function gpbayAnalyticsBase() {
    var base = '';

    try {
      base = (Defined.localhost || '').toString();
    } catch (e) {}

    if (!base || base.indexOf('{') >= 0) {
      try {
        base = window.location.origin + '/';
      } catch (e2) {
        base = '';
      }
    }

    return base.replace(/\/+$/, '');
  }

  function gpbayGaLocation(path) {
    var base = gpbayAnalyticsBase();
    path = (path || '/w') + '';
    if (path.charAt(0) != '/') path = '/' + path;
    return base ? base + path : path;
  }

  function gpbayCleanText(value) {
    try {
      return (value || '').toString().replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    } catch (e) {
      return '';
    }
  }

  function gpbayMovieTitle(movie) {
    try {
      movie = movie || {};
      return gpbayCleanText(movie.title || movie.name || movie.original_title || movie.original_name || movie.search || '');
    } catch (e) {
      return '';
    }
  }

  function gpbayMovieYear(movie) {
    try {
      movie = movie || {};
      var year = ((movie.release_date || movie.first_air_date || movie.year || '0000') + '').slice(0, 4);
      return year && year != '0000' ? year : '';
    } catch (e) {
      return '';
    }
  }

  function gpbayMovieSeoTitle(movie, fallback) {
    var title = gpbayMovieTitle(movie);
    var year = gpbayMovieYear(movie);

    if (title) {
      return title + (year ? ' (' + year + ')' : '') + ' — смотреть онлайн';
    }

    return fallback || GPBAY_PAGE_TITLE;
  }

  function gpbayMoviePagePath(movie) {
    try {
      movie = movie || {};
      var type = (movie.number_of_seasons || movie.name) ? 'series' : 'movie';
      var source = movie.source || 'tmdb';
      var id = movie.tmdb_id || movie.id || movie.kinopoisk_id || movie.imdb_id || '';

      if (id) {
        return '/w/' + type + '/' + encodeURIComponent(source + '-' + id);
      }

      return '/w/' + type;
    } catch (e) {}

    return '/w';
  }

  function gpbayAnalyticsParams(params) {
    var clean = {};

    try {
      params = params || {};
      for (var key in params) {
        if (!Object.prototype.hasOwnProperty.call(params, key)) continue;

        var value = params[key];
        if (typeof value == 'undefined' || typeof value == 'function') continue;
        if (value === null) value = '';

        if (typeof value == 'object') {
          try {
            value = JSON.stringify(value);
          } catch (e) {
            value = '';
          }
        }

        clean[key] = value;
      }
    } catch (e2) {}

    clean.component = 'gpbay';
    clean.lampac_uid = unic_id || '';
    return clean;
  }

  function gpbayMovieParams(movie) {
    var params = {};

    try {
      if (movie) {
        params.content_type = movie.number_of_seasons || movie.name ? 'series' : 'movie';
        params.content_source = movie.source || 'tmdb';
        params.content_id = (params.content_source || 'tmdb') + ':' + (movie.id || movie.tmdb_id || '');
        params.tmdb_id = movie.tmdb_id || movie.id || '';
        params.kinopoisk_id = movie.kinopoisk_id || '';
        params.imdb_id = movie.imdb_id || '';
        params.content_title = gpbayMovieTitle(movie);
        params.content_year = gpbayMovieYear(movie);
        params.page_title = gpbayMovieSeoTitle(movie);
        params.page_path = gpbayMoviePagePath(movie);
        params.page_location = gpbayGaLocation(params.page_path);
      }
    } catch (e) {}

    return params;
  }

  function gpbayQualityValue(element) {
    try {
      if (!element) return '';
      if (typeof element.quality == 'string') return element.quality;
      if (element.quality && typeof element.quality == 'object') {
        for (var q in element.quality) {
          if (Object.prototype.hasOwnProperty.call(element.quality, q)) return q;
        }
      }
      if (typeof element.qualitys == 'string') return element.qualitys;
      if (element.qualitys && typeof element.qualitys == 'object') {
        for (var k in element.qualitys) {
          if (Object.prototype.hasOwnProperty.call(element.qualitys, k)) return k;
        }
      }
    } catch (e) {}
    return '';
  }

  function gpbayMediaBadges(element) {
    try {
      if (!element) return '';

      var parts = [];
      var skip = {
        url: 1,
        stream: 1,
        file: 1,
        playlist: 1,
        subtitles: 1,
        subtitle: 1,
        img: 1,
        image: 1,
        thumbnail: 1,
        vast_url: 1
      };

      for (var key in element) {
        if (!Object.prototype.hasOwnProperty.call(element, key)) continue;
        if (skip[key]) continue;

        var value = element[key];
        if (typeof value == 'string' && value.length && value.length <= 500)
          parts.push(value);
      }

      var text = parts.join(' ').toUpperCase();
      if (!text) return '';

      var token = function(value) {
        return new RegExp('(^|[^A-Z0-9])' + value + '([^A-Z0-9]|$)').test(text);
      };

      var badges = [];
      var hasDv = text.indexOf('DOLBY VISION') >= 0 || token('DV');
      var hdr = '';
      var codec = '';

      if (text.indexOf('HDR10+') >= 0 || text.indexOf('HDR10 PLUS') >= 0)
        hdr = 'HDR10+';
      else if (text.indexOf('HDR10') >= 0)
        hdr = 'HDR10';
      else if (!hasDv && token('HDR'))
        hdr = 'HDR';

      if (token('AV1'))
        codec = 'AV1';
      else if (token('HEVC') || text.indexOf('H.265') >= 0 || token('H265'))
        codec = 'HEVC';

      if (hasDv) badges.push(['DV', 'dv']);
      if (hdr) badges.push([hdr, 'hdr']);
      if (codec) badges.push([codec, 'codec']);

      if (badges.length < 3 && (text.indexOf('60FPS') >= 0 || text.indexOf('60 FPS') >= 0))
        badges.push(['60FPS', 'video']);

      if (badges.length < 3 && !hdr && (text.indexOf('10BIT') >= 0 || text.indexOf('10-BIT') >= 0 || text.indexOf('10 BIT') >= 0))
        badges.push(['10BIT', 'video']);

      if (!badges.length) return '';
      if (badges.length > 3) badges.length = 3;

      return badges.map(function(badge) {
        return '<span class="online-prestige__badge online-prestige__badge--' + badge[1] + '">' + badge[0] + '</span>';
      }).join('');
    } catch (e) {}

    return '';
  }

  function gpbayYmInit() {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      if (window.__gpbay_ym_inited) return;
      if (!document || !document.createElement) return;

      window.__gpbay_ym_inited = true;
      window.ym = window.ym || function() {
        (window.ym.a = window.ym.a || []).push(arguments);
      };
      window.ym.l = window.ym.l || 1 * new Date();

      var hasYmScript = false;
      var scripts = document.scripts || document.getElementsByTagName('script') || [];
      for (var j = 0; j < scripts.length; j++) {
        var src = scripts[j].src || '';
        if (src == GPBAY_YM_SRC || src.indexOf('/metrika/tag') >= 0 || scripts[j].getAttribute('data-gpbay-ym') == (GPBAY_YM_ID + '')) {
          hasYmScript = true;
          break;
        }
      }

      if (!hasYmScript) {
        var ymScript = document.createElement('script');
        ymScript.async = true;
        ymScript.src = GPBAY_YM_SRC;
        ymScript.setAttribute('data-gpbay-ym', GPBAY_YM_ID);

        var firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(ymScript, firstScript);
        else (document.head || document.documentElement || document.body).appendChild(ymScript);
      }

      window.ym(GPBAY_YM_ID, 'init', {
        defer: true,
        ssr: true,
        clickmap: false,
        ecommerce: false,
        accurateTrackBounce: false,
        trackLinks: false,
        webvisor: false,
        referrer: document.referrer,
        url: gpbayGaLocation('/w'),
        title: gpbay_last_page_title || GPBAY_PAGE_TITLE
      });

      if (unic_id) {
        window.ym(GPBAY_YM_ID, 'setUserID', unic_id);
        window.ym(GPBAY_YM_ID, 'userParams', { lampac_uid: unic_id, component: 'gpbay' });
      }
    } catch (e) {}
  }

  function gpbayYmEvent(name, params) {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      if (!window.__gpbay_ym_inited) gpbayYmInit();
      if (typeof window.ym != 'function') return;
      window.ym(GPBAY_YM_ID, 'reachGoal', name, gpbayAnalyticsParams(params));
    } catch (e) {}
  }

  function gpbayYmPage(title, params) {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      if (!window.__gpbay_ym_inited) gpbayYmInit();
      if (typeof window.ym != 'function') return;

      params = gpbayAnalyticsParams(params || {});
      var url = params.page_location || gpbayGaLocation(params.page_path || '/w');

      window.ym(GPBAY_YM_ID, 'hit', url, {
        title: title || params.page_title || GPBAY_PAGE_TITLE,
        referer: document.referrer,
        params: params
      });
    } catch (e) {}
  }

  function gpbayGaInit() {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      gpbayYmInit();

      if (window.__gpbay_ga4_inited) return;
      if (!document || !document.createElement) return;

      window.__gpbay_ga4_inited = true;
      window[GPBAY_DATA_LAYER] = window[GPBAY_DATA_LAYER] || [];

      gpbayGtag('js', new Date());
      gpbayGtag('config', GPBAY_GA4_ID, {
        send_page_view: false,
        user_id: unic_id || undefined,
        transport_type: 'beacon'
      });

      var hasGaScript = false;
      var scripts = document.scripts || document.getElementsByTagName('script') || [];
      for (var i = 0; i < scripts.length; i++) {
        if ((scripts[i].src || '').indexOf('googletagmanager.com/gtag/js') >= 0 && scripts[i].getAttribute('data-gpbay-ga4') == GPBAY_GA4_ID) {
          hasGaScript = true;
          break;
        }
      }

      if (!hasGaScript) {
        var ga = document.createElement('script');
        ga.async = true;
        ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GPBAY_GA4_ID) + '&l=' + encodeURIComponent(GPBAY_DATA_LAYER);
        ga.setAttribute('data-gpbay-ga4', GPBAY_GA4_ID);
        (document.head || document.documentElement || document.body).appendChild(ga);
      }
    } catch (e) {}
  }

  function gpbayGtag() {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      window[GPBAY_DATA_LAYER] = window[GPBAY_DATA_LAYER] || [];
      window[GPBAY_DATA_LAYER].push(arguments);
    } catch (e) {}
  }

  function gpbayGaEvent(name, params) {
    try {
      if (!gpbayAnalyticsEnabled()) return;
      if (!window.__gpbay_ga4_inited) gpbayGaInit();

      params = gpbayAnalyticsParams(params);
      params.send_to = GPBAY_GA4_ID;

      gpbayGtag('event', name, params);

      if (name != 'page_view') {
        gpbayYmEvent(name, params);
      }
    } catch (e) {}
  }

  function gpbayGaPage(title, params) {
    if (!gpbayAnalyticsEnabled()) return;
    params = params || {};
    if (!params.page_title) params.page_title = title || GPBAY_PAGE_TITLE;
    if (!params.page_path) params.page_path = '/w';
    if (!params.page_location) params.page_location = gpbayGaLocation(params.page_path);

    gpbay_last_page_title = params.page_title || title || GPBAY_PAGE_TITLE;
    gpbayGaEvent('page_view', params);
    gpbayYmPage(gpbay_last_page_title, params);
  }

  function gpbayAnalyticsOpen(movie, method) {
    if (!gpbayAnalyticsEnabled()) return;
    var params = gpbayMovieParams(movie);
    params.open_method = method || '';
    gpbayGaPage(params.page_title || GPBAY_PAGE_TITLE, params);
    gpbayGaEvent('gpbay_open_online', params);
  }

  function gpbayAnalyticsEvent(name, params) {
    if (!gpbayAnalyticsEnabled()) return;
    gpbayGaEvent(name, params || {});
  }

    function getAndroidVersion() {
  if (Lampa.Platform.is('android')) {
    try {
      var current = AndroidJS.appVersion().split('-');
      return parseInt(current.pop());
    } catch (e) {
      return 0;
    }
  } else {
    return 0;
  }
}

var hostkey = 'https://gpbx.me'.replace('http://', '').replace('https://', '');

if (!window.rch_nws || !window.rch_nws[hostkey]) {
  if (!window.rch_nws) window.rch_nws = {};

  window.rch_nws[hostkey] = {
    type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
    startTypeInvoke: false,
    rchRegistry: false,
    apkVersion: getAndroidVersion()
  };
}

window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
  if (!window.rch_nws[hostkey].startTypeInvoke) {
    window.rch_nws[hostkey].startTypeInvoke = true;

    var check = function check(good) {
      window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
      call();
    };

    if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
    else {
      var net = new Lampa.Reguest();
      net.silent('https://gpbx.me'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
        check(true);
      }, function() {
        check(false);
      }, false, {
        dataType: 'text'
      });
    }
  } else call();
};

window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
  window.rch_nws[hostkey].typeInvoke('https://gpbx.me', function() {

    client.invoke("RchRegistry", JSON.stringify({
      version: 151,
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
      apkVersion: window.rch_nws[hostkey].apkVersion,
      player: Lampa.Storage.field('player'),
	  account_email: Lampa.Storage.get('account_email', ''),
	  unic_id: Lampa.Storage.get('lampac_unic_id', ''),
	  profile_id: Lampa.Storage.get('lampac_profile_id', ''),
	  token: ''
    }));

    if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
      if (startConnection) startConnection();
      return;
    }

    window.rch_nws[hostkey].rchRegistry = true;

    client.on('RchRegistry', function(clientIp) {
      if (startConnection) startConnection();
    });

    client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
      var network = new Lampa.Reguest();
	  
	  function sendResult(uri, html) {
	    $.ajax({
	      url: 'https://gpbx.me/rch/' + uri + '?id=' + rchId,
	      type: 'POST',
	      data: html,
	      async: true,
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(j) {},
	      error: function() {
	        client.invoke("RchResult", rchId, '');
	      }
	    });
	  }

      function result(html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
          html = JSON.stringify(html);
        }

        if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
          var compressionStream = new CompressionStream('gzip');
          var encoder = new TextEncoder();
          var readable = new ReadableStream({
            start: function(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            }
          });
          var compressedStream = readable.pipeThrough(compressionStream);
          new Response(compressedStream).arrayBuffer()
            .then(function(compressedBuffer) {
              var compressedArray = new Uint8Array(compressedBuffer);
              if (compressedArray.length > html.length) {
                sendResult('result', html);
              } else {
                sendResult('gzresult', compressedArray);
              }
            })
            .catch(function() {
              sendResult('result', html);
            });

        } else {
          sendResult('result', html);
        }
      }

      if (url == 'eval') {
        console.log('RCH', url, data);
        result(eval(data));
      } else if (url == 'evalrun') {
        console.log('RCH', url, data);
        eval(data);
      } else if (url == 'ping') {
        result('pong');
      } else {
        console.log('RCH', url);
        network["native"](url, result, function(e) {
          console.log('RCH', 'result empty, ' + e.status);
          result('');
        }, data, {
          dataType: 'text',
          timeout: 1000 * 8,
          headers: headers,
          returnHeaders: returnHeaders
        });
      }
    });

    client.on('Connected', function(connectionId) {
      console.log('RCH', 'ConnectionId: ' + connectionId);
      window.rch_nws[hostkey].connectionId = connectionId;
    });
    client.on('Closed', function() {
      console.log('RCH', 'Connection closed');
    });
    client.on('Error', function(err) {
      console.log('RCH', 'error:', err);
    });
  });
};
  window.rch_nws[hostkey].typeInvoke('https://gpbx.me', function() {});

  function rchInvoke(json, call) {
    if (window.nwsClient && window.nwsClient[hostkey] && window.nwsClient[hostkey]._shouldReconnect){
      call();
      return;
    }
    if (!window.nwsClient) window.nwsClient = {};
    if (window.nwsClient[hostkey] && window.nwsClient[hostkey].socket)
      window.nwsClient[hostkey].socket.close();
    window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
      autoReconnect: false
    });
    window.nwsClient[hostkey].on('Connected', function(connectionId) {
      window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
        call();
      });
    });
    window.nwsClient[hostkey].connect();
  }

  function rchRun(json, call) {
    if (typeof NativeWsClient == 'undefined') {
      Lampa.Utils.putScript(["https://gpbx.me/js/nws-client-es5.js?v18112025"], function() {}, false, function() {
        rchInvoke(json, call);
      }, true);
    } else {
      rchInvoke(json, call);
    }
  }

  function account(url) {
    url = url + '';
    if (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    if (url.indexOf('uid=') == -1) {
      var uid = gpbayEnsureUid();
      if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
    }
    if (url.indexOf('nws_id=') == -1 && window.rch_nws && window.rch_nws[hostkey]) {
      var nws_id = window.rch_nws[hostkey].connectionId || Lampa.Storage.get('lampac_nws_id', '');
      if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
    }
    return url;
  }

  var gpbay_pairing_state = {
    timer: 0,
    refreshTimer: 0,
    active: false,
    locked: false,
    pairingId: '',
    refreshCooldown: 0,
    startRetryCount: 0,
    uidRotated: false,
    reconnectActive: false
  };

  function templateValueOrEmpty(value) {
    var v = (value || '') + '';
    return /^\{[^}]+\}$/.test(v.trim()) ? '' : v;
  }

  function pairingBase() {
    var external = templateValueOrEmpty('{pairing_host}');
    var host = external || Defined.localhost;
    return (host + '').replace(/\/+$/, '');
  }

  function pairingUrl(path) {
    return pairingBase() + '/pair/v1/' + (path || '').replace(/^\/+/, '');
  }

  function getPairingUid() {
    return gpbayEnsureUid();
  }

  function getPairingProfileId() {
    return Lampa.Storage.get('lampac_profile_id', '');
  }

  function getPairingPlatform() {
    if (Lampa.Platform.is('android')) return 'android';
    if (Lampa.Platform.is('tizen')) return 'tizen';
    if (Lampa.Platform.is('webos')) return 'webos';
    if (Lampa.Platform.is('apple')) return 'apple';
    if (Lampa.Platform.is('browser')) return 'browser';
    return 'unknown';
  }

  function getPairingAppVersion() {
    try {
      if (Lampa.Platform.is('android')) return String(getAndroidVersion() || '');
      if (Lampa.Manifest && Lampa.Manifest.app_digital) return String(Lampa.Manifest.app_digital);
    } catch (e) {}
    return '';
  }

  function getPairingRchType() {
    try {
      return ((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || '';
    } catch (e) {}
    return '';
  }

  function getPairingDeviceName() {
    var platform = getPairingPlatform();
    switch (platform) {
      case 'android': return 'Android device';
      case 'tizen': return 'Samsung TV';
      case 'webos': return 'LG TV';
      case 'apple': return 'Apple device';
      case 'browser': return 'Browser';
      default: return 'Lampa device';
    }
  }

  function escapePairingHtml(value) {
    return (value == null ? '' : String(value))
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getPairingBotLink(pairing, allowFallback) {
    try {
      var direct = pairing && (pairing.botLink || pairing.bot_link || pairing.reconnectLink || pairing.reconnect_link);
      if (direct) return String(direct).trim();
    } catch (e) {}

    if (allowFallback) {
      try {
        if (typeof GPBAY_GOLD_BOT_LINK != 'undefined' && GPBAY_GOLD_BOT_LINK) {
          var fallbackLink = String(GPBAY_GOLD_BOT_LINK);
          if (/([?&]start=)[^&#]*/i.test(fallbackLink))
            return fallbackLink.replace(/([?&]start=)[^&#]*/i, '$1restore');
          return fallbackLink + (fallbackLink.indexOf('?') >= 0 ? '&' : '?') + 'start=restore';
        }
      } catch (e2) {}
    }

    return '';
  }

  function getPairingBotHandle(pairing, allowFallback) {
    if (pairing && (pairing.botHandle || pairing.bot_handle))
      return pairing.botHandle || pairing.bot_handle;
    var link = getPairingBotLink(pairing, allowFallback);
    var match = link.match(/t\.me\/([^\/?#]+)/i);
    return match && match[1] ? '@' + match[1] : 'Telegram-бот';
  }

  function getPairingBadgeText(pairing) {
    if (pairing && pairing.badgeText) return pairing.badgeText;
    return 'Telegram · подключение';
  }

  function getPairingQrImage(pairing, allowFallback) {
    if (pairing && (pairing.qrDataUri || pairing.qr_data_uri))
      return pairing.qrDataUri || pairing.qr_data_uri;
    if (pairing && (pairing.qrImageUrl || pairing.qr_image_url))
      return pairing.qrImageUrl || pairing.qr_image_url;
    var link = getPairingBotLink(pairing, allowFallback);
    if (link)
      return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(link);
    return '';
  }

  var GPBAY_GOLD_PROMO_SETTING = 'gpbay_gold_promo_enabled';
  var GPBAY_GOLD_GROUP_CACHE = 'gpbay_gold_user_group';
  var GPBAY_SETTINGS_COMPONENT = 'lampac';
  var GPBAY_SETTINGS_ICON_MARKER = 'gpbay-settings-component-marker';
  var gpbay_gold_settings_name = 'Lampac';
  var gpbay_gold_promo_component = null;
  var gpbay_gold_settings_retry_timer = 0;
  var gpbay_gold_settings_order_timer = 0;
  var gpbay_gold_settings_order_interval = 0;
  var gpbay_gold_settings_order_observer = null;
  var gpbay_gold_settings_order_hooked = false;
  var gpbay_gold_settings_order_guard = false;
  var gpbay_gold_promo_refresh_timer = 0;
  var GPBAY_GOLD_BOT_LINK = 'https://t.me/gpbx_bot?start=gold';
  var GPBAY_GOLD_QR_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXIAAAFyAQAAAADAX2ykAAACLElEQVR42u1bQYrkMAwsrQN9TGAeME9JfjBPmq/FD1qwjw0ONQfZ8bDLHuayoKZ8aNxJnVRdskpyG/GTlX/hZ0t44YUXXnjhhf8X3vpagGxmyBtgBy4D6nh3KJ5x8TtJstyPqxlPJNqBRJKk4hkaX4dCd5LASpptlw11L4pnTPzylwP6KDDAQNQHTfF8NXxdACDRjrUpPq+i35UAKmB7eQPzARB183dUPKPjs5mZdT5hnwWwA4kALi+fFc/A+p0KZX5vIGrfdWErnlHxcPOzs4Enku/8q7uite98nYpnRH55rmS3RkjEXgB/BozdLn7j8uskO7WjoeEk//E7UDxj8lsAYO2p2allSf6if4jfuOevp2F0VkcTq7kT5unEi9/Y+blXWiTp5ZYbY6q+epH6qtwi9iSd+pkMQPqN7Y9KcpJHQZXYpVvSd5MkfqPqd5y1vEXsz9aRrsVvZH4xZHr6wLd9r5/lf4Pj7ZNPA+rDSTbb5vwoEXu51H8O739HjdzQlTz5pfxR8PpqGKLR0OhNyl46j56W+I2JH6MF0o6VhI+OcHc6cOl+XUy8zwfH6Zoa8/Z7IerSCDwNqG8NWNtCxTMw/r4/aUddAKxPs2OUW8i6Xxe+v3Efs76DW9/JvuqrwPl5LvNcXFND/hiXsLLdVzwUz9h4nvVB5K2LeJpg1Vex/VHvNc/RAoDZelZ/Mja/o37mbG3MmdK8jiV+o+FN/+8WXnjhhRde+P+O/wKyhS41gr6q1wAAAABJRU5ErkJggg==';
  var gpbay_gold_user_group = null;

  function gpbaySetGoldUserGroup(value) {
    if (value === true || value === 1 || value === '1')
      gpbay_gold_user_group = 1;
    else if (value === false || value === 0 || value === '0')
      gpbay_gold_user_group = 0;
    else
      gpbay_gold_user_group = null;

    try {
      if (gpbay_gold_user_group !== null)
        Lampa.Storage.set(GPBAY_GOLD_GROUP_CACHE, gpbay_gold_user_group);
    } catch (e) {}

    if (gpbay_gold_user_group === 1) {
      try { Lampa.Storage.set(GPBAY_GOLD_PROMO_SETTING, 'false'); } catch (e2) {}
      try {
        if (gpbay_gold_promo_component) {
          gpbay_gold_promo_component.unbindGoldPromoResize();
          gpbay_gold_promo_component.removeGoldPromo();
        }
      } catch (e3) {}
    } else if (gpbay_gold_user_group === 0 && gpbayGoldPromoEnabled()) {
      gpbayRequestGoldPromoRefresh(0);
    }

    gpbaySyncGoldPromoSettingUi();
  }

  function gpbayGoldUserGroupKnown() {
    return gpbay_gold_user_group !== null;
  }

  function gpbayGoldUserHasGroup() {
    return gpbay_gold_user_group === 1;
  }

  function gpbayGoldPromoValueEnabled(value) {
    return !(value === false || value === 0 || value === '0' || value === 'false' || value === 'off');
  }

  function gpbayGoldSettingsLocked() {
    if (gpbay_gold_user_group !== null)
      return gpbay_gold_user_group === 1;

    try {
      return Number(Lampa.Storage.get(GPBAY_GOLD_GROUP_CACHE, 0)) === 1;
    } catch (e) {}

    return false;
  }

  function gpbayGoldPromoStoredValue() {
    var raw = 'true';
    var enabled = true;
    var canonical = 'true';

    try { raw = Lampa.Storage.get(GPBAY_GOLD_PROMO_SETTING, 'true'); } catch (e) {}
    enabled = gpbayGoldPromoValueEnabled(raw);
    canonical = enabled ? 'true' : 'false';

    if (raw !== canonical) {
      try { Lampa.Storage.set(GPBAY_GOLD_PROMO_SETTING, canonical); } catch (e2) {}
    }

    return enabled;
  }

  function gpbayGoldPromoEnabled() {
    if (gpbayGoldSettingsLocked()) return false;
    return gpbayGoldPromoStoredValue();
  }

  function gpbayStopGoldPromoRefresh() {
    if (gpbay_gold_promo_refresh_timer) {
      clearTimeout(gpbay_gold_promo_refresh_timer);
      gpbay_gold_promo_refresh_timer = 0;
    }
  }

  function gpbayRequestGoldPromoRefresh(attempt) {
    attempt = Number(attempt || 0);
    if (!gpbayGoldPromoEnabled() || gpbayGoldSettingsLocked()) {
      gpbayStopGoldPromoRefresh();
      return;
    }

    if (gpbayGoldUserGroupKnown() && !gpbayGoldUserHasGroup() && gpbay_gold_promo_component) {
      gpbayStopGoldPromoRefresh();
      try { gpbay_gold_promo_component.appendGoldPromo(0); } catch (e) {}
      return;
    }

    if (attempt >= 120 || gpbay_gold_promo_refresh_timer) return;

    gpbay_gold_promo_refresh_timer = setTimeout(function() {
      gpbay_gold_promo_refresh_timer = 0;
      gpbayRequestGoldPromoRefresh(attempt + 1);
    }, 250);
  }

  function gpbaySyncGoldPromoSettingUi(item) {
    var locked = gpbayGoldSettingsLocked();
    var enabled = locked ? false : gpbayGoldPromoStoredValue();
    var target = item && item.length ? item : $('[data-name="' + GPBAY_GOLD_PROMO_SETTING + '"]');

    if (!target || !target.length) return;

    target.each(function() {
      var row = $(this);
      row.attr('data-gpbay-gold-setting', '1');
      row.find('.settings-param__value').text(enabled ? 'Вкл' : 'Выкл');

      if (locked) {
        try { Lampa.Storage.set(GPBAY_GOLD_PROMO_SETTING, 'false'); } catch (e) {}
        row.attr('data-static', 'true');
        row.removeClass('selector focus').addClass('gpbay-setting-disabled');
        row.attr('aria-disabled', 'true').css({ opacity: '.48' });
      } else {
        row.removeAttr('data-static');
        row.addClass('selector').removeClass('gpbay-setting-disabled focus');
        row.removeAttr('aria-disabled').css({ opacity: '' });
      }

      setTimeout(function() {
        row.off('hover:enter');
        row.off('hover:enter.gpbayGoldSetting');

        if (gpbayGoldSettingsLocked()) return;

        row.on('hover:enter.gpbayGoldSetting', function(event) {
          if (event && event.preventDefault) event.preventDefault();
          if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();

          gpbayApplyGoldPromoSetting(gpbayGoldPromoStoredValue() ? 'false' : 'true');
          return false;
        });
      }, 0);
    });
  }

  function gpbayApplyGoldPromoSetting(value) {
    if (gpbayGoldSettingsLocked()) {
      try { Lampa.Storage.set(GPBAY_GOLD_PROMO_SETTING, 'false'); } catch (e) {}
      gpbayStopGoldPromoRefresh();
      gpbaySyncGoldPromoSettingUi();
      return;
    }

    var enabled = gpbayGoldPromoValueEnabled(value);
    try { Lampa.Storage.set(GPBAY_GOLD_PROMO_SETTING, enabled ? 'true' : 'false'); } catch (e2) {}

    gpbaySyncGoldPromoSettingUi();

    if (!enabled) {
      gpbayStopGoldPromoRefresh();
      try { $(window).off('resize.gpbayGoldPromo orientationchange.gpbayGoldPromo'); } catch (e3) {}
      try { $('.gpbay-gold-promo').remove(); } catch (e4) {}

      if (gpbay_gold_promo_component) {
        try { gpbay_gold_promo_component.unbindGoldPromoResize(); } catch (e5) {}
        try { gpbay_gold_promo_component.removeGoldPromo(); } catch (e6) {}
      }
      return;
    }

    if (gpbay_gold_promo_component) {
      try { gpbay_gold_promo_component.bindGoldPromoResize(); } catch (e7) {}
      try { gpbay_gold_promo_component.appendGoldPromo(0); } catch (e8) {}
    }

    gpbayRequestGoldPromoRefresh(0);
  }

  function gpbayAnalyticsSettingLocked() {
    return gpbay_analytics_restart_pending === true;
  }

  function gpbayShowAnalyticsReload() {
    var message = 'Для применения настройки требуется перезагрузить приложение.';
    var noText = 'Нет';
    var yesText = 'Да';

    function cancelReload() {
      gpbaySyncAnalyticsSettingUi();
    }

    try {
      if (Lampa.Lang && typeof Lampa.Lang.translate == 'function') {
        message = Lampa.Lang.translate('plugins_need_reload') || message;
        noText = Lampa.Lang.translate('settings_param_no') || noText;
        yesText = Lampa.Lang.translate('settings_param_yes') || yesText;
      }
    } catch (e) {}

    try {
      Lampa.Modal.open({
        title: '',
        align: 'center',
        zIndex: 300,
        html: $('<div class="about"></div>').text(message),
        buttons: [
          {
            name: noText,
            onSelect: function() {
              Lampa.Modal.close();
              cancelReload();
            }
          },
          {
            name: yesText,
            onSelect: function() {
              window.location.reload();
            }
          }
        ],
        onBack: function() {
          try { Lampa.Modal.close(); } catch (e2) {}
          cancelReload();
        }
      });
    } catch (e3) {
      try { Lampa.Noty.show(message); } catch (e4) {}
      cancelReload();
    }
  }

  function gpbaySyncAnalyticsSettingUi(item) {
    var enabled = gpbayAnalyticsStoredValue();
    var locked = gpbayAnalyticsSettingLocked();
    var target = item && item.length ? item : $('[data-name="' + GPBAY_ANALYTICS_SETTING + '"]');

    if (!target || !target.length) return;

    target.each(function() {
      var row = $(this);
      row.attr('data-gpbay-analytics-setting', '1');
      row.find('.settings-param__value').text(enabled ? 'Вкл' : 'Выкл');

      if (locked) {
        row.attr('data-static', 'true');
        row.removeClass('selector focus').addClass('gpbay-setting-disabled');
        row.attr('aria-disabled', 'true').css({ opacity: '.48' });
      } else {
        row.removeAttr('data-static');
        row.addClass('selector').removeClass('gpbay-setting-disabled focus');
        row.removeAttr('aria-disabled').css({ opacity: '' });
      }

      setTimeout(function() {
        row.off('hover:enter');
        row.off('hover:enter.gpbayAnalyticsSetting');

        if (gpbayAnalyticsSettingLocked()) return;

        row.on('hover:enter.gpbayAnalyticsSetting', function(event) {
          if (event && event.preventDefault) event.preventDefault();
          if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();

          gpbayApplyAnalyticsSetting(gpbayAnalyticsStoredValue() ? 'false' : 'true');
          return false;
        });
      }, 0);
    });
  }

  function gpbayApplyAnalyticsSetting(value) {
    if (gpbayAnalyticsSettingLocked()) {
      gpbaySyncAnalyticsSettingUi();
      return;
    }

    var enabled = gpbayAnalyticsValueEnabled(value);

    try {
      Lampa.Storage.set(GPBAY_ANALYTICS_SETTING, enabled ? 'true' : 'false');
    } catch (e) {
      gpbaySyncAnalyticsSettingUi();
      return;
    }

    gpbay_analytics_restart_pending = true;
    gpbaySyncAnalyticsSettingUi();
    gpbayShowAnalyticsReload();
  }

  function gpbayGoldSettingsIcon() {
    return '<svg class="' + GPBAY_SETTINGS_ICON_MARKER + '" data-gpbay-settings-icon="1" width="24" height="24" viewBox="0 0 28 29" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<g transform="translate(1.2 0)">' +
        '<path d="M22.4 8.55A10.55 10.55 0 1 0 22.4 20.45V14.5H18.55" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '<path d="M18.55 13.72C19.22 14.11 19.22 14.89 18.55 15.28L13.25 18.34C12.58 18.73 11.75 18.24 11.75 17.46V11.54C11.75 10.76 12.58 10.27 13.25 10.66L18.55 13.72Z" fill="currentColor"></path>' +
      '</g>' +
    '</svg>';
  }

  function gpbayFindSettingsFolder() {
    var folder = $();

    try {
      folder = $('.' + GPBAY_SETTINGS_ICON_MARKER).closest('.settings-folder').first();
      if (folder.length) return folder;
    } catch (e) {}

    try {
      folder = $('.settings-folder[data-component="' + GPBAY_SETTINGS_COMPONENT + '"]').first();
      if (folder.length) return folder;
    } catch (e2) {}

    try {
      $('.settings-folder').each(function() {
        var item = $(this);
        var name = item.find('.settings-folder__name').text();
        name = name == null ? '' : String(name).replace(/^\s+|\s+$/g, '');

        if (name == gpbay_gold_settings_name) {
          folder = item;
          return false;
        }
      });
    } catch (e3) {}

    return folder;
  }

  function gpbayPlaceSettingsFolderSecond() {
    try {
      var folder = gpbayFindSettingsFolder();
      if (!folder || !folder.length) return false;

      var parent = folder.parent();
      if (!parent.length) return false;

      var account = parent.children('.settings-folder[data-component="account"]').first();
      var anchor = account.length ? account : parent.children('.settings-folder').not(folder).first();
      if (!anchor.length || anchor[0] === folder[0]) return true;

      var previous = folder.prevAll('.settings-folder').first();
      if (!previous.length || previous[0] !== anchor[0]) folder.insertAfter(anchor);

      return true;
    } catch (e) {}

    return false;
  }

  function gpbayMoveSettingsComponentLastInApi() {
    if (gpbay_gold_settings_order_guard) return;

    try {
      if (!Lampa.SettingsApi || typeof Lampa.SettingsApi.allComponents != 'function') return;

      var components = Lampa.SettingsApi.allComponents();
      var own = components && components[GPBAY_SETTINGS_COMPONENT];
      if (!own) return;

      gpbay_gold_settings_order_guard = true;
      delete components[GPBAY_SETTINGS_COMPONENT];
      components[GPBAY_SETTINGS_COMPONENT] = own;
      gpbay_gold_settings_order_guard = false;
    } catch (e) {
      gpbay_gold_settings_order_guard = false;
    }
  }

  function gpbayScheduleSettingsFolderOrder(delay) {
    if (gpbay_gold_settings_order_timer) clearTimeout(gpbay_gold_settings_order_timer);

    gpbay_gold_settings_order_timer = setTimeout(function() {
      gpbay_gold_settings_order_timer = 0;
      gpbayPlaceSettingsFolderSecond();
    }, Number(delay || 0));
  }

  function gpbaySettingsFolderOrderBurst() {
    var delays = [0, 40, 120, 300, 700, 1500, 3000];

    for (var i = 0; i < delays.length; i++) {
      (function(delay) {
        setTimeout(function() {
          gpbayPlaceSettingsFolderSecond();
        }, delay);
      })(delays[i]);
    }
  }

  function gpbayHookSettingsAddComponent() {
    if (gpbay_gold_settings_order_hooked || !Lampa.SettingsApi ||
        typeof Lampa.SettingsApi.addComponent != 'function') return;

    var original = Lampa.SettingsApi.addComponent;

    Lampa.SettingsApi.addComponent = function(data) {
      var result = original.apply(this, arguments);

      if (!data || data.component != GPBAY_SETTINGS_COMPONENT) {
        gpbayMoveSettingsComponentLastInApi();
        gpbayScheduleSettingsFolderOrder(0);
        setTimeout(function() { gpbayPlaceSettingsFolderSecond(); }, 100);
      }

      return result;
    };

    gpbay_gold_settings_order_hooked = true;
  }

  function gpbayWatchSettingsFolderOrder() {
    gpbaySettingsFolderOrderBurst();
    gpbayHookSettingsAddComponent();

    if (!gpbay_gold_settings_order_observer && typeof MutationObserver != 'undefined') {
      try {
        var root = document.body || document.documentElement;

        if (root) {
          gpbay_gold_settings_order_observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
              var nodes = mutations[i].addedNodes || [];

              for (var j = 0; j < nodes.length; j++) {
                var node = nodes[j];
                if (!node || node.nodeType !== 1) continue;

                var added = $(node);
                if (added.hasClass('settings-folder') ||
                    added.find('.settings-folder').length ||
                    added.hasClass(GPBAY_SETTINGS_ICON_MARKER) ||
                    added.find('.' + GPBAY_SETTINGS_ICON_MARKER).length) {
                  gpbayScheduleSettingsFolderOrder(20);
                  return;
                }
              }
            }
          });

          gpbay_gold_settings_order_observer.observe(root, { childList: true, subtree: true });
        }
      } catch (e) {
        gpbay_gold_settings_order_observer = null;
      }
    }

    if (!gpbay_gold_settings_order_observer) {
      try {
        $(document).off('DOMNodeInserted.gpbaySettingsOrder');
        $(document).on('DOMNodeInserted.gpbaySettingsOrder', function(event) {
          var added = $(event.target);

          if (added.hasClass('settings-folder') ||
              added.find('.settings-folder').length ||
              added.hasClass(GPBAY_SETTINGS_ICON_MARKER) ||
              added.find('.' + GPBAY_SETTINGS_ICON_MARKER).length)
            gpbayScheduleSettingsFolderOrder(20);
        });
      } catch (e2) {}

      if (!gpbay_gold_settings_order_interval) {
        gpbay_gold_settings_order_interval = setInterval(function() {
          gpbayPlaceSettingsFolderSecond();
        }, 1000);
      }
    }
  }

  function gpbayRegisterSettings(pluginName) {
    var settingsVersion = 8;

    if (typeof Lampa == 'undefined' || !Lampa.SettingsApi ||
        typeof Lampa.SettingsApi.addComponent != 'function' ||
        typeof Lampa.SettingsApi.addParam != 'function')
      return false;

    if (window.__gpbay_gold_settings_registered === settingsVersion)
      return true;

    try {
      if (typeof Lampa.SettingsApi.removeComponent == 'function')
        Lampa.SettingsApi.removeComponent(GPBAY_SETTINGS_COMPONENT);
      else if (typeof Lampa.SettingsApi.removeParams == 'function')
        Lampa.SettingsApi.removeParams(GPBAY_SETTINGS_COMPONENT);

      gpbayGoldPromoStoredValue();
      gpbayAnalyticsStoredValue();
      gpbay_gold_settings_name = pluginName || 'Lampac';
      gpbayHookSettingsAddComponent();

      Lampa.SettingsApi.addComponent({
        component: GPBAY_SETTINGS_COMPONENT,
        name: gpbay_gold_settings_name,
        icon: gpbayGoldSettingsIcon(),
        after: 'account'
      });

      Lampa.SettingsApi.addParam({
        component: GPBAY_SETTINGS_COMPONENT,
        param: {
          name: GPBAY_GOLD_PROMO_SETTING,
          type: 'trigger',
          default: true
        },
        field: {
          name: 'Промо-блок',
          description: 'Показывать промо-блок GOLD в онлайн-каталоге'
        },
        onRender: function(item) {
          gpbaySyncGoldPromoSettingUi(item);
        },
        onChange: function(value) {
          gpbayApplyGoldPromoSetting(value);
        }
      });

      Lampa.SettingsApi.addParam({
        component: GPBAY_SETTINGS_COMPONENT,
        param: {
          name: GPBAY_ANALYTICS_SETTING,
          type: 'trigger',
          default: true
        },
        field: {
          name: 'Аналитика',
          description: 'Отключите, если не хотите делиться данными об использовании или если возникают проблемы совместимости на старых устройствах.'
        },
        onRender: function(item) {
          gpbaySyncAnalyticsSettingUi(item);
        },
        onChange: function(value) {
          if (!gpbayAnalyticsSettingLocked())
            gpbayApplyAnalyticsSetting(value);
        }
      });

      gpbayMoveSettingsComponentLastInApi();
      gpbayWatchSettingsFolderOrder();
    } catch (e2) {
      return false;
    }

    window.__gpbay_gold_settings_registered = settingsVersion;
    return true;
  }

  function gpbayEnsureSettings(pluginName, attempt) {
    attempt = Number(attempt || 0);
    if (gpbayRegisterSettings(pluginName)) return;
    if (attempt >= 20 || gpbay_gold_settings_retry_timer) return;

    gpbay_gold_settings_retry_timer = setTimeout(function() {
      gpbay_gold_settings_retry_timer = 0;
      gpbayEnsureSettings(pluginName, attempt + 1);
    }, 250);
  }

  function getPairingBridgeStatusMessage(resp) {
    return resp && resp.message ? resp.message : 'Доступ к плагину недоступен.';
  }

  function getPairingReasonCode(resp) {
    try {
      return gpbayCleanText(resp && (resp.reasonCode || resp.reason_code || resp.error || resp.status)).toLowerCase();
    } catch (e) {}
    return '';
  }

  function isPairingNonPairingResponse(resp) {
    if (!resp || resp.authorized === true) return false;
    if (resp.requiresPairing === false || resp.requires_pairing === false) return true;
    var reason = getPairingReasonCode(resp);
    return reason == 'suspended' || reason == 'bot_blocked' || reason == 'blocked' ||
      reason == 'banned' || reason == 'disabled' || reason == 'expired' ||
      reason == 'registration_pending' || reason == 'device_disabled' || reason == 'deactivated' || reason == 'chat_not_found';
  }

  function isPairingBlockedResponse(resp) {
    if (!resp) return false;
    if (resp.blocked === true || resp.suspended === true) return true;
    if ((resp.status || '').toString().toLowerCase() == 'blocked') return true;
    if ((resp.error || '').toString().toLowerCase() == 'user disabled') return true;
    return isPairingNonPairingResponse(resp);
  }

  function isTelegramReconnectResponse(resp) {
    if (!resp) return false;
    if (resp.reconnectRequired === true || resp.reconnect_required === true) return true;
    if (!(resp.suspended === true || resp.blocked === true)) return false;

    var reason = getPairingReasonCode(resp);
    return reason == 'blocked' || reason == 'bot_blocked' || reason == 'telegram_bot_blocked' ||
      reason == 'telegram_unreachable' || reason == 'chat_not_found';
  }

  function getPairingUnavailableTitle(resp) {
    var reason = getPairingReasonCode(resp);
    if (reason == 'expired') return 'Срок доступа истёк';
    if (reason == 'registration_pending') return 'Ожидается подтверждение';
    if (reason == 'device_disabled') return 'Устройство отключено';
    if ((resp && resp.suspended === true) || reason == 'suspended' || reason == 'bot_blocked' ||
        reason == 'telegram_unreachable' || reason == 'deactivated' || reason == 'chat_not_found')
      return 'Доступ приостановлен';
    if (reason == 'banned' || reason == 'disabled' || reason == 'blocked') return 'Доступ ограничен';
    return 'Доступ недоступен';
  }

  function getPairingBlockedMessage(resp) {
    var reason = '';
    var message = '';

    try { reason = gpbayCleanText(resp && (resp.suspensionReason || resp.suspension_reason || resp.banReason || resp.ban_reason)); } catch (e) {}
    try { message = gpbayCleanText(resp && (resp.message || resp.detail)); } catch (e2) {}

    if (message) return message;
    if (reason) return reason;
    return 'Доступ временно недоступен. Откройте Telegram-бота для уточнения статуса.';
  }

  function stopPairingTimer() {
    if (gpbay_pairing_state.timer) {
      clearTimeout(gpbay_pairing_state.timer);
      gpbay_pairing_state.timer = 0;
    }
  }

  function stopPairingRefreshTimer() {
    if (gpbay_pairing_state.refreshTimer) {
      clearTimeout(gpbay_pairing_state.refreshTimer);
      gpbay_pairing_state.refreshTimer = 0;
    }
  }

  function formatPairingCooldown(seconds) {
    var total = Math.max(0, parseInt(seconds || 0, 10));
    var minutes = Math.floor(total / 60);
    var secs = total % 60;
    return ('0' + minutes).slice(-2) + ':' + ('0' + secs).slice(-2);
  }

  function ensurePairingModalCss() {
    if (document.getElementById('gpbay_pairing_modal_css')) return;
    var style = document.createElement('style');
    style.id = 'gpbay_pairing_modal_css';
    style.type = 'text/css';
    style.textContent = '' +
      '.modal.pairing-modal #gpbayPairingRefresh.is-disabled{opacity:.56 !important;cursor:default !important;pointer-events:none !important;}' +
      '@media screen and (max-width:480px){' +
      '.modal.pairing-modal{display:flex !important;align-items:center !important;justify-content:center !important;padding:.85em !important;}' +
      '.modal.pairing-modal .modal__content{max-width:34em !important;position:relative !important;left:auto !important;right:auto !important;bottom:auto !important;top:auto !important;width:100% !important;border-radius:1.2em !important;max-height:calc(100vh - 1.7em) !important;overflow:visible !important;}' +
      '.modal.pairing-modal #gpbayPairingCard{max-height:calc(100vh - 1.7em) !important;overflow-y:auto !important;-webkit-overflow-scrolling:touch !important;}' +
      '}';
    document.head.appendChild(style);
  }

  function setPairingRefreshCooldown(seconds) {
    stopPairingRefreshTimer();
    gpbay_pairing_state.refreshCooldown = Math.max(0, parseInt(seconds || 0, 10));

    var render = function() {
      var button = $('#gpbayPairingRefresh');
      if (!button.length) {
        stopPairingRefreshTimer();
        return;
      }

      if (gpbay_pairing_state.refreshCooldown > 0) {
        button.addClass('is-disabled').text('Новый код через ' + formatPairingCooldown(gpbay_pairing_state.refreshCooldown));
        gpbay_pairing_state.refreshCooldown--;
        gpbay_pairing_state.refreshTimer = setTimeout(render, 1000);
      } else {
        button.removeClass('is-disabled').text('Получить новый код');
      }
    };

    render();
  }

  function tunePairingModalLayout() {
    ensurePairingModalCss();
    var modal = $('.modal');
    if (!modal.length) return;
    var content = modal.find('.modal__content');
    modal.addClass('pairing-modal');
    modal.css({
      position: 'fixed',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth <= 560 ? '.45em' : '.8em',
      boxSizing: 'border-box'
    });
    if (window.innerWidth <= 560) {
      content.css({
        width: '100%',
        maxWidth: '34em',
        margin: '0 auto',
        alignSelf: 'center',
        maxHeight: 'calc(100vh - 1.2em)',
        overflow: 'visible'
      });
    } else {
      content.css({
        width: '',
        maxWidth: '',
        margin: '0 auto',
        alignSelf: 'center',
        maxHeight: 'calc(100vh - 1.6em)',
        overflowY: 'auto'
      });
    }
  }

  function gpbayParseJsonResponse(value) {
    if (value && typeof value == 'object') return value;

    if (typeof value == 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {}
    }

    return {};
  }

  function requestPairingJson(method, url, payload, onSuccess, onError) {
    var completed = false;
    var ajaxStarted = false;

    function success(resp) {
      if (completed) return;
      completed = true;
      if (onSuccess) onSuccess(gpbayParseJsonResponse(resp));
    }

    function fail(data, xhr) {
      if (completed) return;
      completed = true;
      if (onError) onError(data || {}, xhr);
    }

    function ajaxFallback() {
      if (ajaxStarted || completed) return;
      ajaxStarted = true;

      $.ajax({
        url: url,
        method: method,
        type: method,
        dataType: 'json',
        timeout: 10000,
        cache: false,
        contentType: payload ? 'application/json' : undefined,
        data: payload ? JSON.stringify(payload) : undefined,
        success: function(resp) {
          success(resp || {});
        },
        error: function(xhr) {
          var data = xhr && xhr.responseJSON ? xhr.responseJSON : null;
          if (!data && xhr && xhr.responseText) {
            try {
              data = JSON.parse(xhr.responseText);
            } catch (e) {}
          }
          fail(data || {}, xhr);
        }
      });
    }

    if (method == 'GET') {
      try {
        if (Lampa && Lampa.Reguest) {
          var req = new Lampa.Reguest();
          if (req.timeout) req.timeout(10000);

          req.silent(url, function(resp) {
            success(resp);
          }, function() {
            ajaxFallback();
          }, false, {
            dataType: 'json',
            timeout: 10000
          });
          return;
        }
      } catch (e2) {}
    }

    ajaxFallback();
  }

  var Network = Lampa.Reguest;

  function component(object) {
    gpbay_gold_promo_component = this;
    var gpbay_component_instance = this;
    setTimeout(function() {
      if (gpbay_gold_promo_component === gpbay_component_instance && gpbayGoldPromoEnabled())
        gpbayRequestGoldPromoRefresh(0);
    }, 0);
    var network = new Network();
    var scroll = new Lampa.Scroll({
      mask: true,
      over: true
    });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var life_wait_times = 0;
    var life_wait_timer;
    var gpbay_gold_promo_timer = 0;
    var gpbay_gold_promo_resize_timer = 0;
    var filter_sources = {};
    var filter_translate = {
      season: Lampa.Lang.translate('torrent_serial_season'),
      voice: Lampa.Lang.translate('torrent_parser_voice'),
      source: Lampa.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      season: [],
      voice: []
    };

    var anonymousCorsSources = [
      'kinotochka',
      'leproduction',
	  'vkmovie',
	  'animevost'
    ];

    var vpnNoticeSources = [
      'none'
	  ];

    if (balansers_with_search == undefined) {
      network.timeout(10000);
      network.silent(account('https://gpbx.me/lite/withsearch'), function(json) {
        balansers_with_search = json;
      }, function() {
		  balansers_with_search = [];
	  });
    }

    function balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }

    function arrayFindCompat(list, predicate) {
      if (!list || !predicate) return null;
      for (var i = 0; i < list.length; i++) {
        if (predicate(list[i], i)) return list[i];
      }
      return null;
    }

	function clarificationSearchAdd(value){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		all[id] = value;

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchDelete(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		delete all[id];

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchGet(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		return all[id];
	}

    this.showTelegramReconnect = function(resp) {
      var _thisReconnect = this;
      var uid = getPairingUid();
      var platform = getPairingPlatform();
      var botLink = getPairingBotLink(resp, true);
      var botHandle = getPairingBotHandle(resp, true);
      var qrImage = getPairingQrImage(resp, true);
      var serverMessage = getPairingBlockedMessage(resp);

      stopPairingTimer();
      stopPairingRefreshTimer();
      gpbay_pairing_state.active = false;
      gpbay_pairing_state.locked = false;
      gpbay_pairing_state.reconnectActive = true;
      clearInterval(balanser_timer);

      if ($('.modal.pairing-modal').length)
        $('.modal.pairing-modal').remove();

      if (!document.getElementById('gpbay_telegram_reconnect_css')) {
        var style = document.createElement('style');
        style.id = 'gpbay_telegram_reconnect_css';
        style.type = 'text/css';
        style.textContent = '' +
          '.gpbay-telegram-reconnect{max-width:48em;padding:1.15em;border-radius:1.15em;background:rgba(10,15,23,.92);border:1px solid rgba(90,169,255,.23);box-sizing:border-box;color:#fff}' +
          '.gpbay-telegram-reconnect__head{font-size:1.65em;font-weight:800;line-height:1.12;margin-bottom:.42em}' +
          '.gpbay-telegram-reconnect__message{font-size:1em;line-height:1.45;color:rgba(255,255,255,.78)}' +
          '.gpbay-telegram-reconnect__body{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;gap:1em;margin-top:1em}' +
          '.gpbay-telegram-reconnect__qr{width:8.2em;-webkit-flex:0 0 8.2em;flex:0 0 8.2em;text-align:center}' +
          '.gpbay-telegram-reconnect__qr img{display:block;width:7.4em;height:7.4em;margin:0 auto;padding:.28em;border-radius:.78em;background:#fff;box-sizing:border-box}' +
          '.gpbay-telegram-reconnect__handle{margin-top:.4em;font-weight:800;color:#8bd1ff;word-break:break-word}' +
          '.gpbay-telegram-reconnect__steps{font-size:.95em;line-height:1.48;color:rgba(255,255,255,.88)}' +
          '.gpbay-telegram-reconnect__actions{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;gap:.65em;margin-top:1em}' +
          '.gpbay-telegram-reconnect__button{display:inline-block;padding:.72em 1em;border-radius:.78em;background:rgba(70,159,255,.16);border:1px solid rgba(112,184,255,.28);font-weight:750}' +
          '.gpbay-telegram-reconnect__button+.gpbay-telegram-reconnect__button{margin-left:.65em}' +
          '.gpbay-telegram-reconnect__button.focus{background:#fff;color:#111}' +
          '@media screen and (max-width:560px){.gpbay-telegram-reconnect{padding:.88em}.gpbay-telegram-reconnect__head{font-size:1.35em}.gpbay-telegram-reconnect__body{display:block}.gpbay-telegram-reconnect__qr{width:100%;margin-bottom:.8em}.gpbay-telegram-reconnect__actions{display:block}.gpbay-telegram-reconnect__button{display:block;text-align:center;margin-top:.55em}.gpbay-telegram-reconnect__button+.gpbay-telegram-reconnect__button{margin-left:0}}';
        (document.head || document.documentElement).appendChild(style);
      }

      var qrHtml = qrImage
        ? '<div class="gpbay-telegram-reconnect__qr"><img src="' + escapePairingHtml(qrImage) + '" alt="QR"><div class="gpbay-telegram-reconnect__handle">' + escapePairingHtml(botHandle) + '</div></div>'
        : '<div class="gpbay-telegram-reconnect__qr"><div class="gpbay-telegram-reconnect__handle">' + escapePairingHtml(botHandle) + '</div></div>';
      var openButton = botLink
        ? '<div id="gpbayReconnectOpenBot" class="gpbay-telegram-reconnect__button selector">Открыть ' + escapePairingHtml(botHandle) + '</div>'
        : '';
      var card = $('<div class="gpbay-telegram-reconnect">' +
        '<div class="gpbay-telegram-reconnect__head">Доступ временно приостановлен</div>' +
        '<div class="gpbay-telegram-reconnect__message">' + escapePairingHtml(serverMessage) + '</div>' +
        '<div class="gpbay-telegram-reconnect__body">' +
          qrHtml +
          '<div class="gpbay-telegram-reconnect__steps">' +
            '<div>1. Откройте ' + escapePairingHtml(botHandle) + ' в Telegram.</div>' +
            '<div>2. Разблокируйте бота, если он заблокирован.</div>' +
            '<div>3. Нажмите «Запустить» или отправьте <b>/start</b>.</div>' +
            '<div style="margin-top:.55em;opacity:.72">Повторно привязывать устройство не нужно. Экран обновится автоматически после восстановления связи.</div>' +
          '</div>' +
        '</div>' +
        '<div class="gpbay-telegram-reconnect__actions">' + openButton +
          '<div id="gpbayReconnectCheck" class="gpbay-telegram-reconnect__button selector">Проверить доступ</div>' +
        '</div>' +
      '</div>');

      scroll.clear();
      scroll.append(card);
      this.loading(false);
      Lampa.Controller.enable('content');

      function scheduleCheck(delay) {
        stopPairingTimer();
        if (!gpbay_pairing_state.reconnectActive) return;
        gpbay_pairing_state.timer = setTimeout(checkAccess, delay || 6000);
      }

      function checkAccess() {
        if (!gpbay_pairing_state.reconnectActive) {
          stopPairingTimer();
          return;
        }

        requestPairingJson('GET', pairingUrl('access?uid=' + encodeURIComponent(uid) + '&platform=' + encodeURIComponent(platform) + '&_=' + Date.now()), null, function(status) {
          if (!gpbay_pairing_state.reconnectActive) return;
          if (status && status.authorized) {
            gpbay_pairing_state.reconnectActive = false;
            stopPairingTimer();
            Lampa.Noty.show('Доступ восстановлен');
            window.location.reload();
            return;
          }

          if (isTelegramReconnectResponse(status)) {
            scheduleCheck(6000);
            return;
          }

          gpbay_pairing_state.reconnectActive = false;
          stopPairingTimer();
          if (isPairingBlockedResponse(status))
            _thisReconnect.showAccessBlocked(status);
          else if (status && (status.requiresPairing === true || status.requires_pairing === true))
            _thisReconnect.startPairingFlow((status && status.message) || 'Подключите устройство.', false);
          else
            _thisReconnect.showAccessUnavailable((status && status.message) || 'Доступ пока не восстановлен.');
        }, function() {
          scheduleCheck(7000);
        });
      }

      $('#gpbayReconnectOpenBot').off('hover:enter click').on('hover:enter click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!botLink) return;
        try { window.open(botLink, '_blank'); }
        catch (openError) { try { window.location.href = botLink; } catch (openError2) {} }
      });

      $('#gpbayReconnectCheck').off('hover:enter click').on('hover:enter click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        checkAccess();
      });

      scheduleCheck(6000);
    };

    this.showAccessBlocked = function(resp) {
      if (isTelegramReconnectResponse(resp)) {
        this.showTelegramReconnect(resp);
        return;
      }

      stopPairingTimer();
      stopPairingRefreshTimer();
      gpbay_pairing_state.active = false;
      gpbay_pairing_state.locked = false;
      gpbay_pairing_state.reconnectActive = false;
      clearInterval(balanser_timer);

      if ($('.modal.pairing-modal').length)
        $('.modal.pairing-modal').remove();

      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(getPairingUnavailableTitle(resp));
      html.find('.online-empty__time').text(getPairingBlockedMessage(resp));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      Lampa.Controller.enable('content');
    };

    this.showAccessUnavailable = function(message) {
      stopPairingTimer();
      stopPairingRefreshTimer();
      gpbay_pairing_state.active = false;
      gpbay_pairing_state.locked = false;
      gpbay_pairing_state.reconnectActive = false;
      clearInterval(balanser_timer);

      if ($('.modal.pairing-modal').length)
        $('.modal.pairing-modal').remove();

      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text('Не удалось проверить доступ');
      html.find('.online-empty__time').text(message || 'Сервер авторизации временно не отвечает. Повторите попытку позже. Повторная привязка устройства не требуется.');
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      Lampa.Controller.enable('content');
    };

    this.showPairingModal = function(pairing, baseMessage) {
      var _thisAuth = this;
      gpbay_pairing_state.reconnectActive = false;
      var uid = getPairingUid();
      var botHandle = getPairingBotHandle(pairing);
      var badgeText = getPairingBadgeText(pairing);
      var qrImage = getPairingQrImage(pairing);
      var statusText = baseMessage || pairing.message || 'Откройте Telegram и подтвердите устройство.';
      var deviceName = pairing && pairing.deviceName ? pairing.deviceName : getPairingDeviceName();
      var ttlText = pairing.expiresIn ? ('Код активен около ' + Math.max(1, Math.round(pairing.expiresIn / 60)) + ' мин.') : 'Код обновляется автоматически.';
      var isMobile = window.innerWidth <= 560;
      var isTiny = window.innerWidth <= 400;
      var cardMaxWidth = isMobile ? '34em' : '42em';
      var cardPadding = isMobile ? '.9em .92em .88em' : '1.05em 1.08em 1em';
      var headerGap = isMobile ? '.55em' : '.75em';
      var titleSize = isMobile ? '1.38em' : '1.72em';
      var noteSize = isMobile ? '.92em' : '1em';
      var noteLine = isMobile ? '1.34' : '1.42';
      var codeLabelAlign = 'center';
      var codeAlign = 'center';
      var bottomAlign = 'center';
      var codeFont = isTiny ? '1.74em' : (isMobile ? '1.96em' : '2.28em');
      var codeLetter = isTiny ? '.08em' : '.12em';
      var qrWrapWidth = isMobile ? '7.1em' : '8.6em';
      var qrImgSize = isMobile ? '6em' : '7.5em';
      var qrColumn = qrImage
        ? ('<div style="flex-shrink:0;width:' + qrWrapWidth + ';text-align:center;align-self:' + (isMobile ? 'center' : 'flex-start') + '">' +
            '<div style="display:inline-block;background:#fff;border-radius:' + (isMobile ? '.88em' : '1em') + ';padding:' + (isMobile ? '.26em' : '.34em') + ';box-shadow:0 10px 28px rgba(0,0,0,.22)">' +
              '<img src="' + escapePairingHtml(qrImage) + '" alt="QR" style="width:' + qrImgSize + ';height:' + qrImgSize + ';display:block">' +
            '</div>' +
            '<div style="margin-top:' + (isMobile ? '.42em' : '.55em') + ';font-size:' + (isMobile ? '.74em' : '.8em') + ';font-weight:600;color:#eef2ff;word-break:break-word">' + escapePairingHtml(botHandle) + '</div>' +
            '<div style="margin-top:.18em;font-size:' + (isMobile ? '.67em' : '.72em') + ';line-height:1.28;opacity:.62">' + escapePairingHtml(ttlText) + '</div>' +
          '</div>')
        : '';

      var modalHtml = '<div style="max-width:' + cardMaxWidth + ';color:#fff">' +
        '<div style="background:linear-gradient(180deg,rgba(16,20,28,.985),rgba(9,12,18,.97));border:1px solid rgba(255,255,255,.06);border-radius:1.22em;padding:' + cardPadding + ';box-shadow:0 20px 54px rgba(0,0,0,.38)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:' + headerGap + ';margin-bottom:' + (isMobile ? '.7em' : '.9em') + ';flex-wrap:wrap">' +
            '<div style="display:inline-block;padding:.24em .68em;border-radius:999px;background:rgba(104,126,255,.16);color:#d9e1ff;font-size:' + (isMobile ? '.74em' : '.78em') + ';font-weight:600">' + escapePairingHtml(badgeText) + '</div>' +
            '<div style="display:inline-block;padding:.3em .58em;border-radius:.75em;background:rgba(255,255,255,.055);font-size:' + (isMobile ? '.74em' : '.8em') + ';opacity:.92">Устройство: ' + escapePairingHtml(deviceName) + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:' + (isMobile ? '.78em' : '1.05em') + '">' +
            '<div style="min-width:0;flex:1;padding-right:' + (isMobile ? '0' : '.1em') + '">' +
              '<div style="font-size:' + titleSize + ';font-weight:800;line-height:1.08;letter-spacing:-.03em;margin-bottom:.28em;text-align:left">Подключите устройство</div>' +
              '<div id="gpbayPairingNote" style="max-width:' + (isMobile ? '100%' : '18em') + ';font-size:' + noteSize + ';line-height:' + noteLine + ';opacity:.84;text-align:left">' + escapePairingHtml(statusText) + '</div>' +
            '</div>' +
            qrColumn +
          '</div>' +
          '<div style="margin-top:' + (isMobile ? '.78em' : '.95em') + ';padding:' + (isMobile ? '.82em .86em' : '.95em 1.02em') + ';border-radius:1.02em;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)">' +
            '<div style="opacity:.56;font-size:' + (isMobile ? '.72em' : '.76em') + ';letter-spacing:.08em;text-transform:uppercase;margin-bottom:.42em;text-align:' + codeLabelAlign + '">Код подтверждения</div>' +
            '<div id="gpbayPairingCode" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:' + codeFont + ';font-weight:800;letter-spacing:' + codeLetter + ';line-height:1.02;color:#fff;text-align:' + codeAlign + '">' + escapePairingHtml(pairing.code || '---- ----') + '</div>' +
          '</div>' +
          '<div style="margin-top:' + (isMobile ? '.62em' : '.72em') + ';font-size:' + (isMobile ? '.84em' : '.9em') + ';line-height:1.45;opacity:.8;text-align:' + bottomAlign + '">' +
            'Откройте <span style="font-weight:700;color:#eef2ff">' + escapePairingHtml(botHandle) + '</span> и отправьте код. После подтверждения экран обновится автоматически.' +
          '</div>' +
          '<div style="margin-top:' + (isMobile ? '.62em' : '.72em') + ';display:flex;justify-content:center">' +
            '<div id="gpbayPairingRefresh" class="selector" style="display:inline-flex;align-items:center;justify-content:center;padding:' + (isMobile ? '.72em 1em' : '.78em 1.16em') + ';border-radius:.92em;background:rgba(104,126,255,.16);border:1px solid rgba(148,167,255,.22);font-size:' + (isMobile ? '.84em' : '.9em') + ';font-weight:700;color:#eef2ff;cursor:pointer">Получить новый код</div>' +
          '</div>' +
        '</div>' +
      '</div>';

      stopPairingTimer();
      gpbay_pairing_state.active = true;
      gpbay_pairing_state.pairingId = pairing && pairing.pairingId ? pairing.pairingId : '';
      if ($('.modal').length) $('.modal').remove();
      Lampa.Modal.open({
        title: '',
        align: 'center',
        zIndex: 300,
        html: $(modalHtml),
        onBack: function() {
          stopPairingTimer();
          stopPairingRefreshTimer();
          gpbay_pairing_state.active = false;
          $('.modal').removeClass('pairing-modal');
          Lampa.Activity.push({component: 'main'});
          window.location.reload();
        }
      });

      tunePairingModalLayout();
      setPairingRefreshCooldown(pairing && pairing.retryAfterSeconds ? pairing.retryAfterSeconds : 0);
      $('#gpbayPairingRefresh').off('hover:enter click').on('hover:enter click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (gpbay_pairing_state.refreshCooldown > 0) return;
        stopPairingTimer();
        stopPairingRefreshTimer();
        _thisAuth.startPairingFlow('Получаем новый код...', true);
      });

      var poll = function() {
        if (!gpbay_pairing_state.active || !$('.modal').length) {
          stopPairingTimer();
          return;
        }
        requestPairingJson('GET', pairingUrl('check?pairingId=' + encodeURIComponent(pairing.pairingId || '') + '&uid=' + encodeURIComponent(uid) + '&_=' + Date.now()), null, function(resp) {
          var note = $('#gpbayPairingNote');
          if (isPairingBlockedResponse(resp)) {
            stopPairingTimer();
            stopPairingRefreshTimer();
            gpbay_pairing_state.active = false;
            if ($('.modal').length) $('.modal').remove();
            _thisAuth.showAccessBlocked(resp);
            return;
          }
          if (resp && resp.status == 'success' && resp.authorized) {
            stopPairingTimer();
            stopPairingRefreshTimer();
            gpbay_pairing_state.active = false;
            if ($('.modal').length) $('.modal').remove();
            Lampa.Noty.show(resp.message || 'Устройство привязано');
            window.location.reload();
            return;
          }
          if (resp && (resp.status == 'expired' || resp.status == 'not_found')) {
            stopPairingTimer();
            stopPairingRefreshTimer();
            _thisAuth.startPairingFlow(resp.status == 'expired' ? 'Код истёк. Получаем новый...' : 'Получаем новый код...', true);
            return;
          }
          if (resp && resp.status == 'success' && !resp.authorized) {
            if (note.length) note.text(resp.message || 'Привязка подтверждена. Ожидаем разрешение доступа...');
          } else if (resp && resp.message && note.length) {
            note.text(resp.message);
          }
          stopPairingTimer();
          gpbay_pairing_state.timer = setTimeout(poll, 6000);
        }, function() {
          stopPairingTimer();
          gpbay_pairing_state.timer = setTimeout(poll, 7000);
        });
      };

      gpbay_pairing_state.timer = setTimeout(poll, 6000);
    };
    this.schedulePairingStartRetry = function(message, forceNew) {
      var _thisAuth = this;
      var delay;

      stopPairingTimer();
      gpbay_pairing_state.startRetryCount++;
      delay = Math.min(15000, 2000 + (gpbay_pairing_state.startRetryCount * 1500));

      gpbay_pairing_state.timer = setTimeout(function() {
        _thisAuth.startPairingFlow(message || 'Получаем код авторизации...', forceNew === true);
      }, delay);
    };
    this.startPairingFlow = function(message, forceNew) {
      var _thisAuth = this;
      gpbay_pairing_state.reconnectActive = false;
      var pairingUid = getPairingUid();
      var platform = getPairingPlatform();

      if (gpbay_pairing_state.locked) return;
      gpbay_pairing_state.locked = true;

      var startQuery = [
        'uid=' + encodeURIComponent(pairingUid),
        'lampac_uid=' + encodeURIComponent(pairingUid),
        'deviceName=' + encodeURIComponent(getPairingDeviceName()),
        'platform=' + encodeURIComponent(platform),
        'appVersion=' + encodeURIComponent(getPairingAppVersion()),
        'profileId=' + encodeURIComponent(getPairingProfileId()),
        'rchType=' + encodeURIComponent(getPairingRchType()),
        'forceNew=' + (forceNew ? '1' : '0'),
        '_=' + Date.now()
      ].join('&');

      requestPairingJson('GET', pairingUrl('start-get?' + startQuery), null, function(resp) {
        gpbay_pairing_state.locked = false;

        if (isPairingBlockedResponse(resp) || isPairingNonPairingResponse(resp)) {
          _thisAuth.showAccessBlocked(resp);
          return;
        }

        if (resp && resp.uid) {
          var serverUid = gpbayUidClean(resp.uid);
          if (!serverUid || serverUid != pairingUid) {
            try { console.error('[GPBAY AUTH] server UID mismatch', pairingUid, serverUid); } catch (e) {}
            _thisAuth.schedulePairingStartRetry('Получаем код авторизации...', false);
            return;
          }
        }

        if (resp && resp.uidConflict) {
          if (!gpbay_pairing_state.uidRotated) {
            var rotated = gpbayRotateUid();
            if (rotated) {
              gpbay_pairing_state.uidRotated = true;
              gpbay_pairing_state.startRetryCount = 0;
              _thisAuth.startPairingFlow('Подключите это устройство.', false);
              return;
            }
          }

          _thisAuth.schedulePairingStartRetry('Получаем код авторизации...', false);
          return;
        }

        if (resp && resp.alreadyAuthorized) {
          requestPairingJson('GET', pairingUrl('access?uid=' + encodeURIComponent(pairingUid) + '&platform=' + encodeURIComponent(platform) + '&_=' + Date.now()), null, function(status) {
            if (isPairingBlockedResponse(status) || isPairingNonPairingResponse(status)) {
              _thisAuth.showAccessBlocked(status);
              return;
            }
            if (status && status.authorized) {
              window.location.reload();
              return;
            }

            if (status && status.uidConflict && !gpbay_pairing_state.uidRotated) {
              var rotated = gpbayRotateUid();
              if (rotated) {
                gpbay_pairing_state.uidRotated = true;
                gpbay_pairing_state.startRetryCount = 0;
                _thisAuth.startPairingFlow('Подключите это устройство.', false);
                return;
              }
            }

            _thisAuth.schedulePairingStartRetry((status && status.message) || 'Получаем код авторизации...', true);
          }, function(data) {
            if (isPairingBlockedResponse(data)) {
              _thisAuth.showAccessBlocked(data);
              return;
            }
            _thisAuth.schedulePairingStartRetry('Получаем код авторизации...', true);
          });
          return;
        }

        if (!resp || !resp.pairingId || !resp.code) {
          _thisAuth.schedulePairingStartRetry((resp && resp.message) || 'Получаем код авторизации...', forceNew === true);
          return;
        }

        gpbay_pairing_state.startRetryCount = 0;
        _thisAuth.showPairingModal(resp, message || resp.message);
      }, function(data) {
        gpbay_pairing_state.locked = false;
        if (isPairingBlockedResponse(data)) {
          _thisAuth.showAccessBlocked(data);
          return;
        }
        _thisAuth.schedulePairingStartRetry(message || 'Получаем код авторизации...', forceNew === true);
      });
    };
    this.ensureAuthorized = function() {
      var _thisAuth = this;
      return new Promise(function(resolve, reject) {
        var platform = getPairingPlatform();
        var uid = getPairingUid();

        requestPairingJson('GET', pairingUrl('access?uid=' + encodeURIComponent(uid) + '&platform=' + encodeURIComponent(platform) + '&_=' + Date.now()), null, function(resp) {
          if (isPairingBlockedResponse(resp) || isPairingNonPairingResponse(resp)) {
            _thisAuth.showAccessBlocked(resp);
            reject({ authorized: false, blocked: true, response: resp });
            return;
          }

          if (resp && resp.authorized) {
            resolve(resp);
            return;
          }

          if (resp && resp.uidConflict && !gpbay_pairing_state.uidRotated) {
            var rotated = gpbayRotateUid();
            if (rotated) gpbay_pairing_state.uidRotated = true;
          }

          if (resp && (resp.requiresPairing === false || resp.requires_pairing === false)) {
            _thisAuth.showAccessBlocked(resp);
            reject({ authorized: false, blocked: true, response: resp });
            return;
          }

          _thisAuth.startPairingFlow((resp && resp.message) || 'Подключите устройство.', false);
          reject({ authorized: false, pairing: true });
        }, function(data) {
          if (isPairingBlockedResponse(data) || isPairingNonPairingResponse(data)) {
            _thisAuth.showAccessBlocked(data);
            reject({ authorized: false, blocked: true, response: data });
            return;
          }
          _thisAuth.showAccessUnavailable('Сервер авторизации временно не отвечает. Повторная привязка устройства не требуется. Попробуйте открыть раздел позже.');
          reject({ authorized: false, network: true });
        });
      });
    };
    function gpbayFilterIcon(type) {
      var body = '';

      if (type == 'source') {
        body = '<ellipse cx="12" cy="5.5" rx="7.5" ry="3" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 5.5v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 10.5v5c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-5" stroke="currentColor" stroke-width="1.7"/>';
      } else if (type == 'filter') {
        body = '<path d="M4 5h16l-6.25 7.1v5.15l-3.5 1.75v-6.9L4 5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>';
      } else {
        body = '<circle cx="10.5" cy="10.5" r="5.8" stroke="currentColor" stroke-width="1.8"/><path d="m15 15 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
      }

      return '<svg class="gpbay-filter-icon gpbay-filter-icon--' + type + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
    }

    function gpbayDecorateFilter() {
      var root = filter.render();
      var sourceButton = root.find('.filter--sort').first();
      var filterButton = root.find('.filter--filter').first();
      var searchButton = root.find('.filter--search').first();

      if (!filterButton.length) {
        filterButton = root.find('.torrent-filter>.simple-button--filter').not('.filter--sort').not('.filter--search').first();
      }

      function addIcon(button, type) {
        if (!button || !button.length || button.find('.gpbay-filter-icon').length) return false;
        var label = button.children('span').first();
        if (label.length) label.prepend(gpbayFilterIcon(type));
        else button.prepend(gpbayFilterIcon(type));
        return true;
      }

      addIcon(sourceButton, 'source');
      addIcon(filterButton, 'filter');
      addIcon(searchButton, 'search');

      if (searchButton.length && searchButton.find('.gpbay-filter-icon--search').length) {
        var nativeSearch = searchButton.find('svg').not('.gpbay-filter-icon').first();
        if (nativeSearch.length) nativeSearch.addClass('gpbay-filter-native-search-icon');
      }
    }

    this.initialize = function() {
      var _this = this;
      this.loading(true);
      filter.onSearch = function(value) {

		clarificationSearchAdd(value);

        Lampa.Activity.replace({
          search: value,
          clarification: true,
          similar: true
        });
      };
      filter.onBack = function() {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      filter.render().addClass('gpbay-online-filter');
      gpbayDecorateFilter();
      files.render().addClass('gpbay-online-ui');
      filter.onSelect = function(type, a, b) {
        if (type == 'filter') {
          if (a.reset) {
			  clarificationSearchDelete();

            _this.replaceChoice({
              season: 0,
              voice: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(function() {
              Lampa.Select.close();
              Lampa.Activity.replace({
				  clarification: 0,
				  similar: 0
			  });
            }, 10);
          } else {
            var url = filter_find[a.stype][b.index].url;
            var choice = _this.getChoice();
            if (a.stype == 'voice') {
              choice.voice_name = filter_find.voice[b.index].title;
              choice.voice_url = url;
            }
            choice[a.stype] = b.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } else if (type == 'sort') {
          Lampa.Select.close();
          object.lampac_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };
      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
      gpbayDecorateFilter();
      scroll.body().addClass('torrent-list');
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
      Lampa.Controller.enable('content');
      this.loading(false);
      this.ensureAuthorized().then(function() {
		  if(object.balanser){
			  files.render().find('.filter--search').remove();
			  sources = {};
			  sources[object.balanser] = {name: object.balanser};
			  balanser = object.balanser;
			  filter_sources = [];

			  return network["native"](account(object.url.replace('rjson=','nojson=')), _this.parse.bind(_this), function(er){
				  files.render().find('.torrent-filter').remove();
				  _this.empty();
			  }, false, {
	            dataType: 'text',
				headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
			  });
		  }
	      return _this.externalids().then(function() {
	        return _this.createSource();
	      }).then(function(json) {
	        if (!arrayFindCompat(balansers_with_search, function(b) {
	            return balanser.slice(0, b.length) == b;
	          })) {
	          filter.render().find('.filter--search').addClass('hide');
	        }
	        _this.search();
	      });
	      })["catch"](function(e) {
	        if (e && e.authorized === false) return;
	        _this.noConnectToServer(e);
	      });    };
    this.rch = function(json, noreset) {
      var _this2 = this;
	  rchRun(json, function() {
        if (!noreset) _this2.find();
        else noreset();
	  });
    };
    this.externalids = function() {
      return new Promise(function(resolve, reject) {
        if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + encodeURIComponent(object.movie.id));
          query.push('serial=' + (object.movie.name ? 1 : 0));
          if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          network.timeout(10000);
          network.silent(account(url), function(json) {
            for (var name in json) {
              object.movie[name] = json[name];
            }
            resolve();
          }, function() {
            resolve();
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        } else resolve();
      });
    };
    this.updateBalanser = function(balanser_name) {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      last_select_balanser[object.movie.id] = balanser_name;
      Lampa.Storage.set('online_last_balanser', last_select_balanser);
    };
    this.changeBalanser = function(balanser_name) {
      var gaParams = gpbayMovieParams(object.movie);
      gaParams.balancer = balanser_name || '';
      gaParams.previous_balancer = balanser || '';
      gaParams.balancer_name = sources[balanser_name] && sources[balanser_name].name ? sources[balanser_name].name : '';
      gpbayAnalyticsEvent('gpbay_change_balancer', gaParams);

      this.updateBalanser(balanser_name);
      Lampa.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      if (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Lampa.Activity.replace();
    };
    this.requestParams = function(url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb';
      query.push('id=' + encodeURIComponent(object.movie.id));
      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
	  if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));
      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      query.push('original_language=' + (object.movie.original_language || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
      query.push('clarification=' + (object.clarification ? 1 : 0));
      query.push('similar=' + (object.similar ? true : false));
      query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
      if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    this.getLastChoiceBalanser = function() {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        return last_select_balanser[object.movie.id];
      } else {
        return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };
    this.startSource = function(json) {
      return new Promise(function(resolve, reject) {
        json.forEach(function(j) {
          var name = balanserName(j);
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = Lampa.Arrays.getKeys(sources);
        if (filter_sources.length) {
          var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
          if (last_select_balanser[object.movie.id]) {
            balanser = last_select_balanser[object.movie.id];
          } else {
            balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
          }
          if (!sources[balanser]) balanser = filter_sources[0];
          if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
          source = sources[balanser].url;
          Lampa.Storage.set('active_balanser', balanser);
          resolve(json);
        } else {
          reject();
        }
      });
    };
    this.lifeSource = function() {
      var _this3 = this;
      return new Promise(function(resolve, reject) {
        var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
        var red = false;
        var gou = function gou(json, any) {
          if (json.accsdb) return reject(json);
          var last_balanser = _this3.getLastChoiceBalanser();
          if (!red) {
            var _filter = json.online.filter(function(c) {
              return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            if (_filter.length) {
              red = true;
              resolve(json.online.filter(function(c) {
                return c.show;
              }));
            } else if (any) {
              reject();
            }
          }
        };
        var fin = function fin(call) {
          network.timeout(3000);
          network.silent(account(url), function(json) {
            life_wait_times++;
            filter_sources = [];
            sources = {};
            json.online.forEach(function(j) {
              var name = balanserName(j);
              sources[name] = {
                url: j.url,
                name: j.name,
                show: typeof j.show == 'undefined' ? true : j.show
              };
            });
            filter_sources = Lampa.Arrays.getKeys(sources);
            filter.set('sort', filter_sources.map(function(e) {
              return {
                title: sources[e].name,
                source: e,
                selected: e == balanser,
                ghost: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
            gou(json);
            var lastb = _this3.getLastChoiceBalanser();
            if (life_wait_times > 15 || json.ready) {
              filter.render().find('.lampac-balanser-loader').remove();
              gou(json, true);
            } else if (!red && sources[lastb] && sources[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, 1000);
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, function() {
            life_wait_times++;
            if (life_wait_times > 15) {
              reject();
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        };
        fin();
      });
    };
    this.createSource = function() {
      var _this4 = this;
      return new Promise(function(resolve, reject) {
        var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true&gpbaymeta=true');
        network.timeout(15000);
        network.silent(account(url), function(json) {
          if (json && json.accsdb) {
            gpbaySetGoldUserGroup(null);
            _this4.removeGoldPromo();
            return reject(json);
          }

          if (json && typeof json.gold != 'undefined')
            gpbaySetGoldUserGroup(json.gold);
          else
            gpbaySetGoldUserGroup(null);

          _this4.appendGoldPromo();

          if (json && json.life) {
			_this4.memkey = json.memkey;
			if (json.title) {
              if (object.movie.name) object.movie.name = json.title;
              if (object.movie.title) object.movie.title = json.title;
			}
            filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
            _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
          } else {
            var online = json && json.online ? json.online : json;
            _this4.startSource(online || []).then(resolve)["catch"](reject);
          }
        }, function(error) {
          gpbaySetGoldUserGroup(null);
          _this4.removeGoldPromo();
          reject(error);
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      });
    };
    this.create = function() {
      return this.render();
    };
    this.search = function() {
      this.filter({
        source: filter_sources
      }, this.getChoice());
      this.find();
    };
    this.find = function() {
      this.request(this.requestParams(source));
    };
    this.request = function(url) {
      number_of_requests++;
      if (number_of_requests < 10) {
        network["native"](account(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
          dataType: 'text',
		  headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
        });
        clearTimeout(number_of_requests_timer);
        number_of_requests_timer = setTimeout(function() {
          number_of_requests = 0;
        }, 4000);
      } else this.empty();
    };
    this.parseJsonDate = function(str, name) {
      try {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(name).each(function() {
          var item = $(this);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          if (!object.movie.name) {
            if (text.match(/\d+p/i)) {
              if (!data.quality) {
                data.quality = {};
                data.quality[text] = data.url;
              }
              text = object.movie.title;
            }
            if (text == 'По умолчанию') {
              text = object.movie.title;
            }
          }
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.text = text;
          data.active = item.hasClass('active');
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };
    this.getFileUrl = function(file, call, waiting_rch) {
	  var _this = this;

      if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){
		  var newfile = Lampa.Arrays.clone(file);
		  newfile.method = 'play';
		  newfile.url = file.stream;
		  call(newfile, {});
	  }
      else if (file.method == 'play') call(file, {});
      else {
        Lampa.Loading.start(function() {
          Lampa.Loading.stop();
          Lampa.Controller.toggle('content');
          network.clear();
        });
        network["native"](account(file.url), function(json) {
			if(json.rch){
				if(waiting_rch) {
					waiting_rch = false;
					Lampa.Loading.stop();
					call(false, {});
				}
				else {
					_this.rch(json,function(){
						Lampa.Loading.stop();

						_this.getFileUrl(file, call, true);
					});
				}
			}
			else{
				Lampa.Loading.stop();
				call(json, json);
			}
        }, function() {
          Lampa.Loading.stop();
          call(false, {});
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      }
    };
    this.toPlayElement = function(file) {
      var play = {
        title: file.title,
        url: file.url,
        quality: file.qualitys,
        timeline: file.timeline,
        subtitles: file.subtitles,
		segments: file.segments,
        callback: file.mark,
		season: file.season,
		episode: file.episode,
		voice_name: file.voice_name,
		thumbnail: file.thumbnail
      };
      return play;
    };
    this.orUrlReserve = function(data) {
      if (data.url && typeof data.url == 'string' && data.url.indexOf(" or ") !== -1) {
        var urls = data.url.split(" or ");
        data.url = urls[0];
        data.url_reserve = urls[1];
      }
    };
    this.shouldForceHlsjs = function(data) {
      if (!data)
        return false;

      var forceHlsBalanser = ((balanser || '') + '').toLowerCase();
      if ((forceHlsBalanser == 'kinopub' || forceHlsBalanser == 'phantom') && Lampa.Platform.is('tizen'))
        return true;

      var urls = [];

      if (data.url && typeof data.url == 'string')
        urls.push(data.url);

      if (data.url_reserve && typeof data.url_reserve == 'string')
        urls.push(data.url_reserve);

      if (data.quality && typeof data.quality == 'object') {
        for (var q in data.quality) {
          if (typeof data.quality[q] == 'string')
            urls.push(data.quality[q]);
        }
      }

      for (var i = 0; i < urls.length; i++) {
        if (/[?&]hm=hlsjs(?:&|$)/i.test(urls[i]))
          return true;
      }

      return false;
    };
    this.applyForcedHlsMode = function(data) {
      if (!this.shouldForceHlsjs(data))
        return;

      data.hls_type = 'hlsjs';

      if (!data.hls_manifest_timeout)
        data.hls_manifest_timeout = 20000;
    };
    this.stopSourceAnonymousCorsFix = function() {
      if (this._sourceAnonymousCorsTimer) {
        clearInterval(this._sourceAnonymousCorsTimer);
        this._sourceAnonymousCorsTimer = 0;
      }
    };
    this.fixSourceAnonymousCors = function() {
      var sourceName = ((balanser || object.balanser || '') + '').toLowerCase();

      if (anonymousCorsSources.indexOf(sourceName) == -1)
        return;

      var _thisCors = this;
      var attempts = 0;
      var seenVideo = false;
      var missingAttempts = 0;

      this.stopSourceAnonymousCorsFix();

      function fixVideoCors() {
        attempts++;

        var video = null;

        try {
          video = document.querySelector('video.player-video__video');
        } catch (e) {}

        if (!video) {
          if (seenVideo) {
            missingAttempts++;

            if (missingAttempts >= 40)
              _thisCors.stopSourceAnonymousCorsFix();
          }
          else if (attempts >= 200) {
            _thisCors.stopSourceAnonymousCorsFix();
          }

          return;
        }

        seenVideo = true;
        missingAttempts = 0;

        if (video.getAttribute && video.getAttribute('crossorigin') !== null) {
          var src = '';

          try {
            src = video.getAttribute('src') || video.currentSrc || '';
          } catch (e2) {}

          try {
            video.pause();
          } catch (e3) {}

          if (src) {
            try {
              video.removeAttribute('src');
              video.load();
            } catch (e4) {}
          }

          try {
            video.removeAttribute('crossorigin');
          } catch (e5) {}

          if (src) {
            try {
              video.setAttribute('src', src);
              video.load();

              var playResult = video.play();
              if (playResult && playResult["catch"])
                playResult["catch"](function() {});
            } catch (e6) {}
          }
        }
      }

      fixVideoCors();
      this._sourceAnonymousCorsTimer = setInterval(fixVideoCors, 50);
    };
    this.setDefaultQuality = function(data) {
      if (Lampa.Arrays.getKeys(data.quality).length) {
        for (var q in data.quality) {
          if (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.orUrlReserve(data);
          }
          if (data.quality[q].indexOf(" or ") !== -1)
            data.quality[q] = data.quality[q].split(" or ")[0];
        }
      }
    };
    this.gpbayVastString = function(value) {
      if (value == null) return '';
      return String(value).trim();
    };

    this.gpbayVastDisabledUrl = function(url) {
      url = this.gpbayVastString(url);
      if (!url) return true;
      if (/^(false|0|null|undefined|about:blank)$/i.test(url)) return true;
      if (/^lampac-vast-disabled:/i.test(url)) return true;
      return false;
    };

    this.gpbayVastRawClientUrl = function(url) {
      url = this.gpbayVastString(url);
      return /\/lite\/[a-z0-9_-]+\/vast-client(?:\?|$|&)/i.test(url);
    };

    this.gpbayVastPreparedUrl = function(url) {
      url = this.gpbayVastString(url);
      if (/^blob:/i.test(url)) return true;
      if (/^data:application\/xml/i.test(url)) return true;
      if (/\/lite\/[a-z0-9_-]+\/vast-stored(?:\?|$|&)/i.test(url)) return true;
      return false;
    };

    this.gpbayVastGold = function() {
      try {
        if (Lampa && Lampa.Account && typeof Lampa.Account.hasPremium == 'function' && Lampa.Account.hasPremium())
          return true;
      } catch (e) {}

      try {
        var direct = window.__gpbay_group != null ? window.__gpbay_group : window.gpbay_group;
        if (Number(direct) > 0) return true;
      } catch (e) {}

      try {
        if (window.gpbay_profile && Number(window.gpbay_profile.group) > 0)
          return true;
      } catch (e) {}

      try {
        var keys = ['gpbay_group', 'lampac_group', 'account_group'];
        for (var i = 0; i < keys.length; i++) {
          var value = Lampa.Storage.get(keys[i], '');
          if (Number(value) > 0) return true;
        }
      } catch (e) {}

      return false;
    };

    this.ensureGoldPromoStyles = function() {
      if ($('#gpbay_gold_promo_styles').length) return;

      $('head').append('<style id="gpbay_gold_promo_styles">' +
        ' .gpbay-gold-promo{position:relative;display:block;width:100%;margin:-1.55em 0 .84em;padding:.78em .9em .76em .78em;box-sizing:border-box;overflow:hidden;border-radius:.52em;background:rgba(18,18,18,.3);background:rgba(18,18,18,.34);border:1px solid rgba(145,180,202,.13);color:#fff;cursor:pointer;-webkit-box-shadow:0 .15em .45em rgba(0,0,0,.1);box-shadow:0 .15em .45em rgba(0,0,0,.1);-webkit-transition:background .14s ease,color .14s ease,border-color .14s ease,box-shadow .14s ease;transition:background .14s ease,color .14s ease,border-color .14s ease,box-shadow .14s ease}' +
        ' .gpbay-gold-promo:before{content:"";position:absolute;left:.78em;right:.78em;top:0;height:1px;background:rgba(108,184,238,.12);background:-webkit-linear-gradient(left,transparent,rgba(108,184,238,.38),transparent);background:linear-gradient(90deg,transparent,rgba(108,184,238,.38),transparent);pointer-events:none}' +
        ' .gpbay-gold-promo:after{content:"›";position:absolute;right:.62em;bottom:.56em;font-size:1.06em;line-height:1;color:rgba(255,255,255,.34);-webkit-transition:color .14s ease;transition:color .14s ease}' +
        ' .gpbay-gold-promo__brand,.gpbay-gold-promo__content,.gpbay-gold-promo__copy,.gpbay-gold-promo__qr{position:relative;z-index:1}' +
        ' .gpbay-gold-promo__brand{display:block;white-space:nowrap;padding-bottom:.58em}' +
        ' .gpbay-gold-promo__icon{display:-webkit-inline-flex;display:inline-flex;position:relative;vertical-align:middle;width:2.06em;height:2.06em;line-height:0;text-align:center;overflow:hidden;border-radius:50%;background:rgba(108,184,238,.08);border:1px solid rgba(108,184,238,.22);color:#9ed6ff;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;-webkit-flex:none;flex:none}' +
        ' .gpbay-gold-promo__icon svg{display:block;width:68%;height:68%;overflow:visible;-webkit-flex:none;flex:none}' +
        ' .gpbay-gold-promo__eyebrow{display:inline-block;vertical-align:middle;margin-left:.56em;white-space:normal;line-height:1.06}' +
        ' .gpbay-gold-promo__mark{display:block;font-size:.68em;font-weight:900;letter-spacing:.1em;color:#e8c86f}' +
        ' .gpbay-gold-promo__label{display:block;margin-top:.2em;font-size:.65em;font-weight:600;color:rgba(255,255,255,.58)}' +
        ' .gpbay-gold-promo__content{display:table;width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0}' +
        ' .gpbay-gold-promo__qr{display:table-cell;width:5.35em;vertical-align:top;text-align:center}' +
        ' .gpbay-gold-promo__copy{display:table-cell;position:relative;top:-.08em;vertical-align:top;padding-left:.78em;padding-right:.76em}' +
        ' .gpbay-gold-promo__title{margin:0;font-size:1em;font-weight:700;line-height:1.2;color:inherit}' +
        ' .gpbay-gold-promo__text{margin-top:.28em;font-size:.72em;line-height:1.38;color:rgba(255,255,255,.72)}' +
        ' .gpbay-gold-promo__meta{display:inline-block;margin-top:.5em;padding:.24em .46em;border-radius:.36em;background:rgba(87,166,220,.10);border:1px solid rgba(112,190,241,.16);font-size:.62em;font-weight:700;color:#9ed6ff;white-space:nowrap}' +
        ' .gpbay-gold-promo__dot{display:inline-block;vertical-align:middle;width:.38em;height:.38em;margin-right:.38em;border-radius:50%;background:#6cb8ee}' +
        ' .gpbay-gold-promo__qrbox{display:inline-block;padding:.2em;border-radius:.36em;background:#fff;border:1px solid rgba(255,255,255,.12);-webkit-box-shadow:0 .1em .3em rgba(0,0,0,.12);box-shadow:0 .1em .3em rgba(0,0,0,.12)}' +
        ' .gpbay-gold-promo__qrbox img{display:block;width:4.48em;height:4.48em}' +
        ' .gpbay-gold-promo__bot{margin-top:.25em;font-size:.56em;font-weight:800;color:rgba(255,255,255,.56);white-space:nowrap}' +
        ' .gpbay-gold-promo--horizontal{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;width:100%;min-height:5.35em;margin:0 0 .84em;padding:.7em 1.88em .7em .8em}' +
        ' .gpbay-gold-promo--horizontal:after{right:.7em;bottom:50%;-webkit-transform:translateY(50%);transform:translateY(50%)}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__brand{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-flex:0 0 10.2em;flex:0 0 10.2em;max-width:10.2em;padding:0;margin-right:1em}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__content{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-flex:1 1 auto;flex:1 1 auto;width:auto;min-width:0}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__copy{display:block;position:relative;top:0;-webkit-order:1;order:1;-webkit-flex:1 1 auto;flex:1 1 auto;min-width:0;padding:0 .9em 0 0}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__qr{display:block;-webkit-order:2;order:2;-webkit-flex:0 0 4.05em;flex:0 0 4.05em;width:4.05em;vertical-align:middle}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__qrbox{padding:.17em;border-radius:.34em}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__qrbox img{width:3.42em;height:3.42em}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__bot{margin-top:.15em;font-size:.5em}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__title{font-size:.98em;line-height:1.16}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__text{margin-top:.2em;font-size:.7em;line-height:1.32}' +
        ' .gpbay-gold-promo--horizontal .gpbay-gold-promo__meta{margin-top:.32em;padding:.22em .42em;font-size:.59em}' +
        ' .gpbay-gold-promo.focus,.gpbay-gold-promo:hover{background:rgba(24,30,35,.57);border-color:rgba(151,211,252,.88);color:#fff;-webkit-box-shadow:0 0 0 .12em rgba(93,179,237,.24),0 .22em .72em rgba(0,0,0,.18);box-shadow:0 0 0 .12em rgba(93,179,237,.24),0 .22em .72em rgba(0,0,0,.18)}' +
        ' .gpbay-gold-promo.focus:before,.gpbay-gold-promo:hover:before{background:rgba(108,184,238,.18);background:-webkit-linear-gradient(left,transparent,rgba(108,184,238,.52),transparent);background:linear-gradient(90deg,transparent,rgba(108,184,238,.52),transparent)}' +
        ' .gpbay-gold-promo.focus:after,.gpbay-gold-promo:hover:after{color:rgba(255,255,255,.74)}' +
        ' .gpbay-gold-promo.focus .gpbay-gold-promo__label,.gpbay-gold-promo:hover .gpbay-gold-promo__label{color:rgba(255,255,255,.72)}' +
        ' .gpbay-gold-promo.focus .gpbay-gold-promo__text,.gpbay-gold-promo:hover .gpbay-gold-promo__text{color:rgba(255,255,255,.82)}' +
        ' .gpbay-gold-promo.focus .gpbay-gold-promo__meta,.gpbay-gold-promo:hover .gpbay-gold-promo__meta{background:rgba(87,166,220,.13);border-color:rgba(112,190,241,.2);color:#b7e2ff}' +
        ' .gpbay-gold-promo.focus .gpbay-gold-promo__bot,.gpbay-gold-promo:hover .gpbay-gold-promo__bot{color:rgba(255,255,255,.7)}' +
        ' @media screen and (max-width:560px){.gpbay-gold-promo{padding:.7em .72em .68em .66em}.gpbay-gold-promo:after{right:.5em}.gpbay-gold-promo__brand{padding-bottom:.52em}.gpbay-gold-promo__icon{width:1.88em;height:1.88em}.gpbay-gold-promo__qr{width:4.6em}.gpbay-gold-promo__copy{top:-.08em;padding-left:.62em;padding-right:.62em}.gpbay-gold-promo__title{font-size:.91em}.gpbay-gold-promo__text{font-size:.67em}.gpbay-gold-promo__meta{font-size:.58em}.gpbay-gold-promo__qrbox img{width:3.94em;height:3.94em}.gpbay-gold-promo__bot{font-size:.52em}}' +
        ' @media screen and (max-width:1100px){.gpbay-gold-promo--horizontal{display:block;min-height:9.2em;padding:.88em 1.75em .9em .88em}.gpbay-gold-promo--horizontal:after{right:.62em;bottom:.68em;-webkit-transform:none;transform:none}.gpbay-gold-promo--horizontal .gpbay-gold-promo__brand{display:-webkit-flex;display:flex;width:auto;max-width:none;-webkit-flex:none;flex:none;margin:0 0 .66em;padding:0}.gpbay-gold-promo--horizontal .gpbay-gold-promo__icon{width:2.18em;height:2.18em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__eyebrow{margin-left:.58em;line-height:1.08}.gpbay-gold-promo--horizontal .gpbay-gold-promo__mark{font-size:13px}.gpbay-gold-promo--horizontal .gpbay-gold-promo__label{margin-top:.18em;font-size:12px;line-height:1.22}.gpbay-gold-promo--horizontal .gpbay-gold-promo__content{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;width:100%}.gpbay-gold-promo--horizontal .gpbay-gold-promo__copy{top:0;padding:0 1em 0 0}.gpbay-gold-promo--horizontal .gpbay-gold-promo__title{font-size:17px;line-height:1.2}.gpbay-gold-promo--horizontal .gpbay-gold-promo__text{margin-top:.34em;font-size:13px;line-height:1.4}.gpbay-gold-promo--horizontal .gpbay-gold-promo__meta{margin-top:.45em;padding:.3em .52em;font-size:11px}.gpbay-gold-promo--horizontal .gpbay-gold-promo__qr{width:5.35em;-webkit-flex-basis:5.35em;flex-basis:5.35em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__qrbox{padding:.22em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__qrbox img{width:4.5em;height:4.5em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__bot{font-size:9px}}' +
        ' @media screen and (max-width:480px){.gpbay-gold-promo--horizontal{min-height:10.1em;padding:.82em 1.42em .86em .72em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__brand{margin-bottom:.58em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__icon{width:2em;height:2em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__eyebrow{margin-left:.5em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__mark{font-size:12px}.gpbay-gold-promo--horizontal .gpbay-gold-promo__label{font-size:11px;line-height:1.2}.gpbay-gold-promo--horizontal .gpbay-gold-promo__copy{padding-right:.7em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__title{font-size:16px;line-height:1.18}.gpbay-gold-promo--horizontal .gpbay-gold-promo__text{font-size:12px;line-height:1.38}.gpbay-gold-promo--horizontal .gpbay-gold-promo__meta{font-size:10px}.gpbay-gold-promo--horizontal .gpbay-gold-promo__qr{width:4.55em;-webkit-flex-basis:4.55em;flex-basis:4.55em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__qrbox img{width:3.82em;height:3.82em}.gpbay-gold-promo--horizontal .gpbay-gold-promo__bot{font-size:8px}}' +
      '</style>');
    };

    this.gpbayGoldPromoViewportWidth = function() {
      var width = 0;
      try { width = Number(window.innerWidth || 0); } catch (e) {}
      try {
        if (!width && document && document.documentElement)
          width = Number(document.documentElement.clientWidth || 0);
      } catch (e2) {}
      return width || 0;
    };

    this.gpbayGoldPromoElementVisible = function(element) {
      if (!element || !element.length || !element[0]) return false;

      var node = element[0];
      var current = node;

      try {
        while (current && current.nodeType == 1) {
          var style = window.getComputedStyle ? window.getComputedStyle(current, null) : current.currentStyle;
          if (style) {
            if (style.display == 'none' || style.visibility == 'hidden' || style.visibility == 'collapse')
              return false;
          }
          current = current.parentElement;
        }
      } catch (e) {}

      try {
        var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
        if (rect && (rect.width <= 0 || rect.height <= 0)) return false;
      } catch (e2) {}

      return true;
    };

    this.bindGoldPromoResize = function() {
      var _thisPromoResize = this;

      try {
        $(window).off('resize.gpbayGoldPromo orientationchange.gpbayGoldPromo');
        $(window).on('resize.gpbayGoldPromo orientationchange.gpbayGoldPromo', function() {
          if (gpbay_gold_promo_resize_timer)
            clearTimeout(gpbay_gold_promo_resize_timer);

          gpbay_gold_promo_resize_timer = setTimeout(function() {
            gpbay_gold_promo_resize_timer = 0;
            if (!gpbayGoldPromoEnabled() || !gpbayGoldUserGroupKnown() || gpbayGoldUserHasGroup()) {
              _thisPromoResize.removeGoldPromo();
              return;
            }
            _thisPromoResize.appendGoldPromo(10);
          }, 140);
        });
      } catch (e) {}
    };

    this.unbindGoldPromoResize = function() {
      if (gpbay_gold_promo_resize_timer) {
        clearTimeout(gpbay_gold_promo_resize_timer);
        gpbay_gold_promo_resize_timer = 0;
      }

      try { $(window).off('resize.gpbayGoldPromo orientationchange.gpbayGoldPromo'); } catch (e) {}
    };

    this.removeGoldPromo = function() {
      if (gpbay_gold_promo_timer) {
        clearTimeout(gpbay_gold_promo_timer);
        gpbay_gold_promo_timer = 0;
      }

      var root = files && typeof files.render == 'function' ? files.render() : $();
      if (root && root.length)
        root.find('.gpbay-gold-promo').remove();

      try {
        var listBody = scroll && typeof scroll.body == 'function' ? scroll.body() : $();
        if (listBody && listBody.length)
          listBody.children('.gpbay-gold-promo').remove();
      } catch (e) {}
    };

    this.findGoldPromoAnchor = function(attempt) {
      var root = files && typeof files.render == 'function' ? files.render() : $();
      if (!root || !root.length) return null;

      var viewportWidth = this.gpbayGoldPromoViewportWidth();
      var body = root.find('.explorer-card__body').first();

      if (viewportWidth >= 1366 && body.length && this.gpbayGoldPromoElementVisible(body)) {
        var title = body.children('.explorer-card__title').first();
        if (!title.length) title = body.find('.explorer-card__title').first();

        var genres = body.children('.explorer-card__genres').first();
        if (!genres.length) genres = body.find('.explorer-card__genres').first();

        var description = body.children('.explorer-card__descr').first();
        if (!description.length) description = body.find('.explorer-card__descr').first();

        return { title: title, genres: genres, description: description, root: body, horizontal: false };
      }

      if (viewportWidth >= 1366 && Number(attempt || 0) < 10) return null;

      var listBody = scroll && typeof scroll.body == 'function' ? scroll.body() : $();
      if (!listBody || !listBody.length) return null;

      return { title: $(), genres: $(), description: $(), root: listBody, horizontal: true };
    };

    this.appendGoldPromo = function(attempt) {
      var _thisPromo = this;
      attempt = Number(attempt || 0);

      if (!gpbayGoldPromoEnabled() || !gpbayGoldUserGroupKnown() || gpbayGoldUserHasGroup()) {
        this.unbindGoldPromoResize();
        this.removeGoldPromo();
        return;
      }

      this.bindGoldPromoResize();

      var anchor = this.findGoldPromoAnchor(attempt);
      if (!anchor) {
        if (attempt < 30 && !gpbay_gold_promo_timer) {
          gpbay_gold_promo_timer = setTimeout(function() {
            gpbay_gold_promo_timer = 0;
            _thisPromo.appendGoldPromo(attempt + 1);
          }, 150);
        }
        return;
      }

      if (gpbay_gold_promo_timer) {
        clearTimeout(gpbay_gold_promo_timer);
        gpbay_gold_promo_timer = 0;
      }

      var existingPromo = $();
      var promoRoot = files && typeof files.render == 'function' ? files.render() : $();
      if (promoRoot && promoRoot.length)
        existingPromo = existingPromo.add(promoRoot.find('.gpbay-gold-promo'));

      try {
        var promoListBody = scroll && typeof scroll.body == 'function' ? scroll.body() : $();
        if (promoListBody && promoListBody.length)
          existingPromo = existingPromo.add(promoListBody.children('.gpbay-gold-promo'));
      } catch (e) {}

      if (existingPromo.length) {
        var firstPromo = existingPromo.first();
        var sameParent = firstPromo.parent().length && anchor.root.length && firstPromo.parent()[0] === anchor.root[0];
        var sameOrientation = firstPromo.hasClass('gpbay-gold-promo--horizontal') === anchor.horizontal;
        if (sameParent && sameOrientation) return;
        existingPromo.remove();
      }

      this.ensureGoldPromoStyles();

      var horizontalClass = anchor.horizontal ? ' gpbay-gold-promo--horizontal' : '';
      var promoTitle = anchor.horizontal ? '1080p/2160p · Лучшее качество' : '1080p/2160p<br/>Лучшее качество';
      var promoText = 'Откройте Telegram и попробуйте GOLD с разрешением вплоть до 4K!';
      var card = $('<div class="gpbay-gold-promo' + horizontalClass + ' selector" data-gpbay-gold-promo="1" title="Открыть @gpbx_bot">' +
        '<div class="gpbay-gold-promo__brand">' +
          '<div class="gpbay-gold-promo__icon"><svg viewBox="0 0 28 29" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true"><g transform="translate(1.2 0)"><path d="M22.4 8.55A10.55 10.55 0 1 0 22.4 20.45V14.5H18.55" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.55 13.72C19.22 14.11 19.22 14.89 18.55 15.28L13.25 18.34C12.58 18.73 11.75 18.24 11.75 17.46V11.54C11.75 10.76 12.58 10.27 13.25 10.66L18.55 13.72Z" fill="currentColor"></path></g></svg></div>' +
          '<div class="gpbay-gold-promo__eyebrow"><span class="gpbay-gold-promo__mark">GOLD</span><span class="gpbay-gold-promo__label">Расширенный список источников</span></div>' +
        '</div>' +
        '<div class="gpbay-gold-promo__content">' +
          '<div class="gpbay-gold-promo__qr"><div class="gpbay-gold-promo__qrbox"><img src="' + GPBAY_GOLD_QR_IMAGE + '" alt="QR @gpbx_bot"></div><div class="gpbay-gold-promo__bot">@gpbx_bot</div></div>' +
          '<div class="gpbay-gold-promo__copy">' +
            '<div class="gpbay-gold-promo__title">' + promoTitle + '</div>' +
            '<div class="gpbay-gold-promo__text">' + promoText + '</div>' +
            '<div class="gpbay-gold-promo__meta"><span class="gpbay-gold-promo__dot"></span>Доступен пробный Trial</div>' +
          '</div>' +
        '</div>' +
      '</div>');

      card.on('hover:enter click', function(e) {
        if (e && e.preventDefault) e.preventDefault();
        try { window.open(GPBAY_GOLD_BOT_LINK, '_blank'); }
        catch (error) { try { window.location.href = GPBAY_GOLD_BOT_LINK; } catch (error2) {} }
      });

      if (anchor.root.length) card.prependTo(anchor.root);
    };

    this.clearLampacPluginVastLight = function(element) {
      if (!element) return;

      var url = '';
      try { url = this.gpbayVastString(element.vast_url); } catch (e) {}

      try {
        if (/^blob:/i.test(url) && window.URL && URL.revokeObjectURL)
          URL.revokeObjectURL(url);
      } catch (e) {}

      try { delete element.vast_url; } catch (e) { element.vast_url = undefined; }
      try { delete element.vast_msg; } catch (e) { element.vast_msg = undefined; }
      try { delete element.vast_region; } catch (e) { element.vast_region = undefined; }
      try { delete element.vast_platform; } catch (e) { element.vast_platform = undefined; }
      try { delete element.vast_screen; } catch (e) { element.vast_screen = undefined; }

      try { delete element.__gpbay_client_vast_provider; } catch (e) { element.__gpbay_client_vast_provider = ''; }
    };

    this.sanitizeLampacPluginVastElement = function(element, beforePlayer) {
      if (this.gpbayVastSanitize) {
        this.gpbayVastSanitize(element, beforePlayer);
        return;
      }

      if (!element) return;

      var url = this.gpbayVastString(element.vast_url);

      if (this.gpbayVastGold() || this.gpbayVastDisabledUrl(url)) {
        this.clearLampacPluginVastLight(element);
        return;
      }

      if (beforePlayer && this.gpbayVastRawClientUrl(url)) {
        this.clearLampacPluginVastLight(element);
        return;
      }
    };

    this.attachLampacVastFromJson = function(element, vast) {
      if (!element) return;

      if (this.gpbayVastAttachFromJson) {
        this.gpbayVastAttachFromJson(element, vast);
        return;
      }

      this.clearLampacPluginVastLight(element);

      var url = vast && vast.url != null ? this.gpbayVastString(vast.url) : '';
      if (this.gpbayVastDisabledUrl(url)) return;
      if (this.gpbayVastGold()) return;

      element.vast_url = url;
      element.vast_msg = vast.msg;
      element.vast_region = vast.region;
      element.vast_platform = vast.platform;
      element.vast_screen = vast.screen;
    };

    this.gpbayVastScriptUrl = function(element) {
      var version = '1970-01-01';
      var raw = '';

      try { raw = this.gpbayVastString(element && element.vast_url); } catch (e) {}

      try {
        var m = /^(https?:\/\/[^\/?#]+)\/lite\/[a-z0-9_-]+\/vast-client(?:\?|$|&)/i.exec(raw);
        if (m && m[1]) return m[1].replace(/\/+$/, '') + '/online/gpbay.vast.js?v=' + version;
      } catch (e) {}

      return '';
    };

    this.installGpbayVastIfReady = function() {
      try {
        if (window.GpbayVast && typeof window.GpbayVast.install == 'function') {
          window.GpbayVast.install(this);
          return true;
        }
      } catch (e) {}

      return false;
    };

    this.ensureGpbayVast = function(element, done) {
      var _thisVast = this;

      if (_thisVast.installGpbayVastIfReady()) {
        done();
        return;
      }

      var scriptUrl = _thisVast.gpbayVastScriptUrl(element);
      if (!scriptUrl) {
        try { console.warn('[GPBAY VAST] helper url is empty; raw client VAST will be skipped'); } catch (e) {}
        done();
        return;
      }

      window.__gpbayVastCallbacks = window.__gpbayVastCallbacks || [];
      window.__gpbayVastCallbacks.push(function() {
        _thisVast.installGpbayVastIfReady();
        done();
      });

      if (window.__gpbayVastLoading)
        return;

      window.__gpbayVastLoading = true;

      var script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl;

      script.onload = function() {
        window.__gpbayVastLoading = false;
        var callbacks = window.__gpbayVastCallbacks || [];
        window.__gpbayVastCallbacks = [];
        for (var i = 0; i < callbacks.length; i++) {
          try { callbacks[i](); } catch (e) {}
        }
      };

      script.onerror = function() {
        window.__gpbayVastLoading = false;
        var callbacks = window.__gpbayVastCallbacks || [];
        window.__gpbayVastCallbacks = [];
        for (var i = 0; i < callbacks.length; i++) {
          try { callbacks[i](); } catch (e) {}
        }
      };

      (document.head || document.documentElement).appendChild(script);
    };

    this.needGpbayVastModule = function(element) {
      if (!element) return false;
      if (this.gpbayVastGold()) return false;
      if (this.gpbayVastDisabledUrl(element.vast_url)) return false;
      if (this.gpbayVastPreparedUrl(element.vast_url)) return false;

      return this.gpbayVastRawClientUrl(element.vast_url);
    };

    this.prepareClientVast = function(element, done) {
      if (done) done();
    };

    this.startClientVastClick = function(element) {};
    this.display = function(videos) {
      var _this5 = this;
      this.draw(videos, {
        onEnter: function onEnter(item, html) {
          _this5.getFileUrl(item, function(json, json_call) {
            if (json && json.url) {
              var playlist = [];
              var first = _this5.toPlayElement(item);
              first.url = json.url;
              first.headers = json_call.headers || json.headers;
              first.quality = json_call.quality || item.qualitys;
			  first.segments = json_call.segments || item.segments;
              first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
              first.subtitles = json.subtitles;
			  first.subtitles_call = json_call.subtitles_call || json.subtitles_call;
			  _this5.attachLampacVastFromJson(first, json.vast);
              _this5.orUrlReserve(first);
              _this5.setDefaultQuality(first);
              if (item.season) {
                videos.forEach(function(elem) {
                  var cell = _this5.toPlayElement(elem);
                  if (elem == item) cell.url = json.url;
                  else {
                    if (elem.method == 'call') {
                      if (Lampa.Storage.field('player') !== 'inner') {
                        cell.url = elem.stream;
						delete cell.quality;
                      } else {
                        cell.url = function(call) {
                          _this5.getFileUrl(elem, function(stream, stream_json) {
                            if (stream.url) {
                              cell.url = stream.url;
                              cell.quality = stream_json.quality || elem.qualitys;
							  cell.segments = stream_json.segments || elem.segments;
                              cell.subtitles = stream.subtitles;
                              _this5.orUrlReserve(cell);
                              _this5.setDefaultQuality(cell);
                              elem.mark();
                            } else {
                              cell.url = '';
                              Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                            }
                            call();
                          }, function() {
                            cell.url = '';
                            call();
                          });
                        };
                      }
                    } else {
                      cell.url = elem.url;
                    }
                  }
                  _this5.orUrlReserve(cell);
                  _this5.setDefaultQuality(cell);
                  playlist.push(cell);
                });
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              _this5.sanitizeLampacPluginVastElement(first, false);
              playlist.forEach(function(cell) {
                _this5.sanitizeLampacPluginVastElement(cell, false);
              });
              _this5.applyForcedHlsMode(first);
              playlist.forEach(function(cell) {
                _this5.applyForcedHlsMode(cell);
              });
              if (first.url) {
                var element = first;
				element.isonline = true;
                var playNow = function() {
                  _this5.sanitizeLampacPluginVastElement(element, true);
                  playlist.forEach(function(cell) {
                    _this5.sanitizeLampacPluginVastElement(cell, true);
                  });
                  _this5.applyForcedHlsMode(element);
                  var gpbayStreamParams = gpbayMovieParams(object.movie);
                  gpbayStreamParams.balancer = balanser || '';
                  gpbayStreamParams.balancer_name = sources[balanser] && sources[balanser].name ? sources[balanser].name : '';
                  gpbayStreamParams.voice_name = element.voice_name || item.voice_name || '';
                  gpbayStreamParams.quality = gpbayQualityValue(element);
                  gpbayStreamParams.season = element.season || item.season || '';
                  gpbayStreamParams.episode = element.episode || item.episode || '';
                  gpbayStreamParams.has_vast = element.vast_url && !_this5.gpbayVastDisabledUrl(element.vast_url) ? 1 : 0;
                  gpbayAnalyticsEvent('gpbay_stream_open', gpbayStreamParams);
                  _this5.startClientVastClick(element);
                  
                  Lampa.Player.play(element);
                  Lampa.Player.playlist(playlist);
                  _this5.fixSourceAnonymousCors();
				  if(element.subtitles_call) _this5.loadSubtitles(element.subtitles_call)
                  item.mark();
                  _this5.updateBalanser(balanser);
                };

                if (_this5.needGpbayVastModule(element)) {
                  _this5.ensureGpbayVast(element, function() {
                    if (_this5.prepareClientVast && !_this5.gpbayVastDisabledUrl(element.vast_url))
                      _this5.prepareClientVast(element, playNow);
                    else
                      playNow();
                  });
                } else {
                  playNow();
                }
              } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }, true);
        },
        onContextMenu: function onContextMenu(item, html, data, call) {
          _this5.getFileUrl(item, function(stream) {
            call({
              file: stream.url,
              quality: item.qualitys
            });
          }, true);
        }
      });
      this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
    };
	this.loadSubtitles = function(link){
		network.silent(account(link), function(subs){
			Lampa.Player.subtitles(subs)
		}, function() {},false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
	}
    this.parse = function(str) {
      var json = Lampa.Arrays.decodeJson(str, {});
      if (Lampa.Arrays.isObject(str) && str.rch) json = str;
      if (json.rch) return this.rch(json);
      try {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');
        if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
          filter_find.season = items.map(function(s) {
            return {
              title: s.text,
              url: s.url
            };
          });
          this.replaceChoice({
            season: 0
          });
          this.request(items[0].url);
        } else {
          this.activity.loader(false);
          var videos = items.filter(function(v) {
            return v.method == 'play' || v.method == 'call';
          });
          var similar = items.filter(function(v) {
            return v.similar;
          });
          if (videos.length) {
            if (buttons.length) {
              filter_find.voice = buttons.map(function(b) {
                return {
                  title: b.text,
                  url: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = arrayFindCompat(buttons, function(v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = arrayFindCompat(buttons, function(v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = arrayFindCompat(buttons, function(v) {
                return v.active;
              });
              if (find_voice_url && !find_voice_url.active) {
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                this.request(find_voice_name.url);
              } else {
                if (find_voice_active) {
                  this.replaceChoice({
                    voice: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(videos);
              }
            } else {
              this.replaceChoice({
                voice: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(videos);
            }
          } else if (items.length) {
            if (similar.length) {
              this.similars(similar);
              this.activity.loader(false);
            } else {
              filter_find.season = items.map(function(s) {
                return {
                  title: s.text,
                  url: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              var season = filter_find.season[select_season];
              if (!season) season = filter_find.season[0];
              this.request(season.url);
            }
          } else {
            this.doesNotAnswer(json);
          }
        }
      } catch (e) {
        this.doesNotAnswer(e);
      }
    };
    this.similars = function(json) {
      var _this6 = this;
      scroll.clear();
      json.forEach(function(elem) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        if (year) info.push(year);
        if (elem.details) info.push(elem.details);
        var name = elem.title || elem.text;
        elem.title = name;
        elem.time = elem.time || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Lampa.Template.get('lampac_prestige_folder', elem);
		if (elem.img) {
		  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
		  item.find('.online-prestige__folder').empty().append(image);

		  if (elem.img !== undefined) {
		    if (elem.img.charAt(0) === '/')
		      elem.img = Defined.localhost + elem.img.substring(1);
		    if (elem.img.indexOf('/proxyimg') !== -1)
		      elem.img = account(elem.img);
		  }

		  Lampa.Utils.imgLoad(image, elem.img);
		}
        item.on('hover:enter', function() {
          _this6.reset();
          _this6.request(elem.url);
        }).on('hover:focus', function(e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      });
	  this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
      Lampa.Controller.enable('content');
    };
    this.getChoice = function(for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Lampa.Arrays.extend(save, {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      return save;
    };
    this.saveChoice = function(choice, for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      data[object.movie.id] = choice;
      Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data);
      this.updateBalanser(for_balanser || balanser);
    };
    this.replaceChoice = function(choice, for_balanser) {
      var to = this.getChoice(for_balanser);
      Lampa.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function() {
      images.forEach(function(img) {
        img.onerror = function() {};
        img.onload = function() {};
        img.src = '';
      });
      images = [];
    };
    this.reset = function() {
      last = false;
      clearInterval(balanser_timer);
      network.clear();
      this.clearImages();
      scroll.render().find('.empty').remove();
      scroll.clear();
      scroll.reset();
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
    };
    this.loading = function(status) {
      if (status) this.activity.loader(true);
      else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };
    this.filter = function(filter_items, choice) {
      var _this7 = this;
      var select = [];
      var add = function add(type, title) {
        var need = _this7.getChoice();
        var items = filter_items[type];
        var subitems = [];
        var value = need[type];
        items.forEach(function(name, i) {
          subitems.push({
            title: name,
            selected: value == i,
            index: i
          });
        });
        select.push({
          title: title,
          subtitle: items[value],
          items: subitems,
          stype: type
        });
      };
      filter_items.source = filter_sources;
      select.push({
        title: Lampa.Lang.translate('torrent_parser_reset'),
        reset: true
      });
      this.saveChoice(choice);
      if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
      if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
      filter.set('filter', select);
      filter.set('sort', filter_sources.map(function(e) {
        return {
          title: sources[e].name,
          source: e,
          selected: e == balanser,
          ghost: !sources[e].show
        };
      }));
      this.selected(filter_items);
    };
    this.selected = function(filter_items) {
      var need = this.getChoice(),
        select = [];
      for (var i in need) {
        if (filter_items[i] && filter_items[i].length) {
          if (i == 'voice') {
            select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } else if (i !== 'source') {
            if (filter_items.season.length >= 1) {
              select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      filter.chosen('filter', select);
      filter.chosen('sort', [sources[balanser].name]);
    };
    this.getEpisodes = function(season, call) {
      var episodes = [];
	  var tmdb_id = object.movie.id;
	  if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1)
        tmdb_id = object.movie.tmdb_id;
      if (typeof tmdb_id == 'number' && object.movie.name) {
		  Lampa.Api.sources.tmdb.get('tv/' + tmdb_id + '/season/' + season, {}, function(data){
			  episodes = data.episodes || [];

			  call(episodes);
		  }, function(){
			  call(episodes);
		  })
      } else call(episodes);
    };
    this.watched = function(set) {
      var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
      if (set) {
        if (!watched[file_id]) watched[file_id] = {};
        Lampa.Arrays.extend(watched[file_id], set, true);
        Lampa.Storage.set('online_watched_last', watched);
        this.updateWatched();
      } else {
        return watched[file_id];
      }
    };
    this.updateWatched = function() {
      var watched = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      if (watched) {
        var line = [];
        if (watched.balanser_name) line.push(watched.balanser_name);
        if (watched.voice_name) line.push(watched.voice_name);
        if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season);
        if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
        line.forEach(function(n) {
          body.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
    };
    this.ensureSourceNoticeStyles = function() {
      if ($('#lampac_source_notice_styles').length)
        return;

      $('head').append(
        '<style id="lampac_source_notice_styles">' +
          '.lampac-source-notice{' +
            'margin:0 0 .9em 0;' +
            'padding:.72em .9em;' +
            'border-radius:.75em;' +
            'background:rgba(15,18,24,.42);' +
            'border:1px solid rgba(255,255,255,.06);' +
            'box-sizing:border-box;' +
          '}' +
          '.lampac-source-notice__label{' +
            'display:inline-block;' +
            'margin-bottom:.35em;' +
            'padding:.18em .55em;' +
            'border-radius:999px;' +
            'font-size:.82em;' +
            'font-weight:600;' +
            'background:rgba(255,255,255,.08);' +
            'color:rgba(255,255,255,.92);' +
          '}' +
          '.lampac-source-notice__title{' +
            'font-size:1.02em;' +
            'font-weight:700;' +
            'line-height:1.25;' +
            'color:#fff;' +
          '}' +
          '.lampac-source-notice__text{' +
            'margin-top:.28em;' +
            'font-size:.88em;' +
            'line-height:1.35;' +
            'color:rgba(255,255,255,.74);' +
          '}' +
          '@media screen and (max-width:480px){' +
            '.lampac-source-notice{' +
              'padding:.65em .75em;' +
            '}' +
            '.lampac-source-notice__title{' +
              'font-size:.94em;' +
            '}' +
            '.lampac-source-notice__text{' +
              'font-size:.8em;' +
            '}' +
          '}' +
        '</style>'
      );
    };
    this.buildVpnNotice = function() {
      this.ensureSourceNoticeStyles();

      return $(
        '<div class="lampac-source-notice">' +
          '<div class="lampac-source-notice__label">Важно</div>' +
          '<div class="lampac-source-notice__title">Источник может не работать без VPN</div>' +
          '<div class="lampac-source-notice__text">Если источник не отвечает или видео не запускается, включите VPN и повторите попытку.</div>' +
        '</div>'
      );
    };
    this.isVpnNoticeSource = function() {
      var sourceName = ((balanser || object.balanser || '') + '').toLowerCase();
      return vpnNoticeSources.indexOf(sourceName) != -1;
    };
    this.appendVpnNotice = function() {
      if (this.isVpnNoticeSource())
        scroll.append(this.buildVpnNotice());
    };
    this.draw = function(items) {
      var _this8 = this;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!items.length) return this.empty();
      scroll.clear();
      this.appendGoldPromo();
      if(!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
      this.updateWatched();
      this.getEpisodes(items[0].season, function(episodes) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var serial = object.movie.name ? true : false;
        var choice = _this8.getChoice();
        var fully = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(function(element, index) {
          var media_badges = gpbayMediaBadges(element);
          var episode = serial && episodes.length && !params.similars ? arrayFindCompat(episodes, function(e) {
            return e.episode_number == element.episode;
          }) : false;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
          if (element.quality) {
            element.qualitys = element.quality;
            element.quality = Lampa.Arrays.getKeys(element.quality)[0];
          }
          Lampa.Arrays.extend(element, {
            voice_name: voice_name,
            info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            badges: media_badges,
            quality: '',
            time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
          });
          var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
          var data = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          if (element.season) {
            element.translate_episode_end = _this8.getLastEpisode(items);
            element.translate_voice = element.voice_name;
          }
          if (element.text && !episode) element.title = element.text;
          element.timeline = Lampa.Timeline.view(hash_timeline);
          if (episode) {
            element.title = episode.name;
            if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full);
          } else if (object.movie.release_date && fully) {
            info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
          }
          if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
          if (element.info && (!element.title || gpbayCleanText(element.info).toLowerCase() != gpbayCleanText(element.title).toLowerCase())) info.push(element.info);
          if (info.length) element.info = info.map(function(i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Lampa.Template.get('lampac_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
		  if(object.balanser) image.hide();
          if (!serial) {
            if (choice.movie_view == hash_behold) scroll_to_element = html;
          } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          if (serial && !episode) {
            image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            loader.remove();
          }
		  else if (!serial && object.movie.backdrop_path == 'undefined') loader.remove();
          else {
            var img = html.find('img')[0];
            img.onerror = function() {
              img.src = './img/img_broken.svg';
            };
            img.onload = function() {
              image.addClass('online-prestige__img--loaded');
              loader.remove();
              if (serial) image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            };
            img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
            images.push(img);
			element.thumbnail = img.src
          }
          html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
          if (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.addClass('online-prestige--viewed');
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed"><span>✓</span></div>');
          }
          element.mark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) == -1) {
              viewed.push(hash_behold);
              Lampa.Storage.set('online_view', viewed);
              if (html.find('.online-prestige__viewed').length == 0) {
                html.addClass('online-prestige--viewed');
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed"><span>✓</span></div>');
              }
            }
            choice = _this8.getChoice();
            if (!serial) {
              choice.movie_view = hash_behold;
            } else {
              choice.episodes_view[element.season] = episode_num;
            }
            _this8.saveChoice(choice);
            var voice_name_text = choice.voice_name || element.voice_name || element.title;
            if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this8.watched({
              balanser: balanser,
              balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ? sources[balanser].name.split(' ')[0] : balanser),
              voice_id: choice.voice_id,
              voice_name: voice_name_text,
              episode: element.episode,
              season: element.season
            });
          };
          element.unmark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
              Lampa.Arrays.remove(viewed, hash_behold);
              Lampa.Storage.set('online_view', viewed);
              Lampa.Storage.remove('online_view', hash_behold);
              html.removeClass('online-prestige--viewed');
              html.find('.online-prestige__viewed').remove();
            }
          };
          element.timeclear = function() {
            element.timeline.percent = 0;
            element.timeline.time = 0;
            element.timeline.duration = 0;
            Lampa.Timeline.update(element.timeline);
          };
          html.on('hover:enter', function() {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            if (params.onEnter) params.onEnter(element, html, data);
          }).on('hover:focus', function(e) {
            last = e.target;
            if (params.onFocus) params.onFocus(element, html, data);
            scroll.update($(e.target), true);
          });
          if (params.onRender) params.onRender(element, html, data);
          _this8.contextMenu({
            html: html,
            element: element,
            onFile: function onFile(call) {
              if (params.onContextMenu) params.onContextMenu(element, html, data, call);
            },
            onClearAllMark: function onClearAllMark() {
              items.forEach(function(elem) {
                elem.unmark();
              });
            },
            onClearAllTime: function onClearAllTime() {
              items.forEach(function(elem) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        if (serial && episodes.length > items.length && !params.similars) {
          var left = episodes.slice(items.length);
          left.forEach(function(episode) {
            var info = [];
            if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Date.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day;
            var html = Lampa.Template.get('lampac_prestige_full', {
              time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
              info: info.length ? info.map(function(i) {
                return '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              title: episode.name,
              quality: day > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
            var img = html.find('img')[0];
            if (episode.still_path) {
              img.onerror = function() {
                img.src = './img/img_broken.svg';
              };
              img.onload = function() {
                image.addClass('online-prestige__img--loaded');
                loader.remove();
                image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
              };
              img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path);
              images.push(img);
            } else {
              loader.remove();
              image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
            }
            html.on('hover:focus', function(e) {
              last = e.target;
              scroll.update($(e.target), true);
            });
            html.addClass('online-prestige--future');
            scroll.append(html);
          });
        }
        if (scroll_to_element) {
          last = scroll_to_element[0];
        } else if (scroll_to_mark) {
          last = scroll_to_mark[0];
        }
        Lampa.Controller.enable('content');
      });
    };
    this.contextMenu = function(params) {
      params.html.on('hover:long', function() {
        function show(extra) {
          var enabled = Lampa.Controller.enabled().name;
          var menu = [];
          if (Lampa.Platform.is('webos')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Webos',
              player: 'webos'
            });
          }
          if (Lampa.Platform.is('android')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }
          menu.push({
            title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
            player: 'lampa'
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_video'),
            separator: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_title'),
            mark: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
            unmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('time_reset'),
            timeclear: true
          });
          if (extra) {
            menu.push({
              title: Lampa.Lang.translate('copy_link'),
              copylink: true
            });
          }
          if (window.lampac_online_context_menu)
            window.lampac_online_context_menu.push(menu, extra, params);
          menu.push({
            title: Lampa.Lang.translate('more'),
            separator: true
          });
          if (Lampa.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) {
            menu.push({
              title: Lampa.Lang.translate('lampac_voice_subscribe'),
              subscribe: true
            });
          }
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_marks'),
            clearallmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_timecodes'),
            timeclearall: true
          });
          Lampa.Select.show({
            title: Lampa.Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Lampa.Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.mark) params.element.mark();
              if (a.unmark) params.element.unmark();
              if (a.timeclear) params.element.timeclear();
              if (a.clearallmark) params.onClearAllMark();
              if (a.timeclearall) params.onClearAllTime();
              if (window.lampac_online_context_menu)
                window.lampac_online_context_menu.onSelect(a, params);
              Lampa.Controller.toggle(enabled);
              if (a.player) {
                Lampa.Player.runas(a.player);
                params.html.trigger('hover:enter');
              }
              if (a.copylink) {
                if (extra.quality) {
                  var qual = [];
                  for (var i in extra.quality) {
                    qual.push({
                      title: i,
                      file: extra.quality[i]
                    });
                  }
                  Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_server_links'),
                    items: qual,
                    onBack: function onBack() {
                      Lampa.Controller.toggle(enabled);
                    },
                    onSelect: function onSelect(b) {
                      Lampa.Utils.copyTextToClipboard(b.file, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                      }, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                      });
                    }
                  });
                } else {
                  Lampa.Utils.copyTextToClipboard(extra.file, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                  }, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                  });
                }
              }
              if (a.subscribe) {
                Lampa.Account.subscribeToTranslation({
                  card: object.movie,
                  season: params.element.season,
                  episode: params.element.translate_episode_end,
                  voice: params.element.translate_voice
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success'));
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error'));
                });
              }
            }
          });
        }
        params.onFile(show);
      }).on('hover:focus', function() {
        if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html);
      });
    };
    this.empty = function() {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text'));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.getCurrentBalanserDisplayName = function() {
      return sources[balanser] && sources[balanser].name ? sources[balanser].name : (object.balanser || balanser || '');
    };
    this.noConnectToServer = function(er) {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('title_error'));
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', this.getCurrentBalanserDisplayName()));
      scroll.clear();
      this.appendVpnNotice();
      scroll.append(html);
      this.loading(false);
    };
    this.doesNotAnswer = function(er) {
      var _this9 = this;
      this.reset();
      var html = Lampa.Template.get('lampac_does_not_answer', {
        balanser: this.getCurrentBalanserDisplayName()
      });
      if(er && er.accsdb) html.find('.online-empty__title').html(er.msg);

      var tic = er && er.accsdb ? 10 : 5;
      html.find('.cancel').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      html.find('.change').on('hover:enter', function() {
        clearInterval(balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      scroll.clear();
      this.appendVpnNotice();
      scroll.append(html);
      this.loading(false);
      balanser_timer = setInterval(function() {
        tic--;
        html.find('.timeout').text(tic);
        if (tic == 0) {
          clearInterval(balanser_timer);
          var keys = Lampa.Arrays.getKeys(sources);
          var indx = keys.indexOf(balanser);
          var next = keys[indx + 1];
          if (!next) next = keys[0];
          balanser = next;
          if (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser);
        }
      }, 1000);
    };
    this.getLastEpisode = function(items) {
      var last_episode = 0;
      items.forEach(function(e) {
        if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      return last_episode;
    };
    this.start = function() {
      if (Lampa.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
      Lampa.Controller.add('content', {
        toggle: function toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(last || false, scroll.render());
        },
        gone: function gone() {
          clearTimeout(balanser_timer);
        },
        up: function up() {
          if (Navigator.canmove('up')) {
            Navigator.move('up');
          } else Lampa.Controller.toggle('head');
        },
        down: function down() {
          Navigator.move('down');
        },
        right: function right() {
          if (Navigator.canmove('right')) Navigator.move('right');
          else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        back: this.back.bind(this)
      });
      Lampa.Controller.toggle('content');
    };
    this.render = function() {
      return files.render();
    };
    this.back = function() {
      this.stopSourceAnonymousCorsFix();
      gpbay_pairing_state.reconnectActive = false;
      stopPairingTimer();
      stopPairingRefreshTimer();
      this.unbindGoldPromoResize();
      this.removeGoldPromo();
      Lampa.Activity.backward();
    };
    this.pause = function() {};
    this.stop = function() {};
    this.destroy = function() {
      this.stopSourceAnonymousCorsFix();
      gpbay_pairing_state.reconnectActive = false;
      stopPairingTimer();
      stopPairingRefreshTimer();
      this.unbindGoldPromoResize();
      this.removeGoldPromo();
      if (gpbay_gold_promo_component === this) gpbay_gold_promo_component = null;
      network.clear();
      this.clearImages();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
      clearTimeout(life_wait_timer);
    };
  }

  function addSourceSearch(spiderName, spiderUri) {
    var network = new Lampa.Reguest();

    var source = {
      title: spiderName,
      search: function(params, oncomplite) {
        function searchComplite(links) {
          var keys = Lampa.Arrays.getKeys(links);

          if (keys.length) {
            var status = new Lampa.Status(keys.length);

            status.onComplite = function(result) {
              var rows = [];

              keys.forEach(function(name) {
                var line = result[name];

                if (line && line.data && line.type == 'similar') {
                  var cards = line.data.map(function(item) {
                    item.title = Lampa.Utils.capitalizeFirstLetter(item.title);
                    item.release_date = item.year || '0000';
                    item.balanser = spiderUri;
                    if (item.img !== undefined) {
                      if (item.img.charAt(0) === '/')
                        item.img = Defined.localhost + item.img.substring(1);
                      if (item.img.indexOf('/proxyimg') !== -1)
                        item.img = account(item.img);
                    }

                    return item;
                  })

                  rows.push({
                    title: name,
                    results: cards
                  })
                }
              })

              oncomplite(rows);
            }

            keys.forEach(function(name) {
              network.silent(account(links[name]), function(data) {
                status.append(name, data);
              }, function() {
                status.error();
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
            })
          } else {
            oncomplite([]);
          }
        }

        network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(json) {
          if (json.rch) {
            rchRun(json, function() {
              network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(links) {
                searchComplite(links);
              }, function() {
                oncomplite([]);
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
            });
          } else {
            searchComplite(json);
          }
        }, function() {
          oncomplite([]);
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      },
      onCancel: function() {
        network.clear()
      },
      params: {
        lazy: true,
        align_left: true,
        card_events: {
          onMenu: function() {}
        }
      },
      onMore: function(params, close) {
        close();
      },
      onSelect: function(params, close) {
        close();

        gpbayAnalyticsOpen(params.element, 'search_source');

        Lampa.Activity.push({
          url: params.element.url,
          title: 'Lampac - ' + params.element.title,
          component: 'gpbay',
          movie: params.element,
          page: 1,
          search: params.element.title,
          clarification: true,
          balanser: params.element.balanser,
          noinfo: true
        });
      }
    }

    Lampa.Search.addSource(source)
  }

  function startPlugin() {
    window.gpbay_plugin = true;
    var manifst = {
      type: 'video',
      version: '',
      name: 'GPBAY',
      description: 'Плагин для просмотра онлайн сериалов и фильмов',
      component: 'gpbay',
      onContextMenu: function onContextMenu(object) {
        return {
          name: Lampa.Lang.translate('lampac_watch'),
          description: ''
        };
      },
      onContextLauch: function onContextLauch(object) {
        resetTemplates();
        Lampa.Component.add('gpbay', component);

		var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

        gpbayAnalyticsOpen(object, 'context_menu');

        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'gpbay',
          search: all[id] ? all[id] : object.title,
          search_one: object.title,
          search_two: object.original_title,
          movie: object,
          page: 1,
		  clarification: all[id] ? true : false
        });
      }
    };
	
	
    Lampa.Manifest.plugins = manifst;
    gpbayEnsureSettings(manifst.name, 0);
    Lampa.Lang.add({
      lampac_watch: {
        ru: 'Смотреть онлайн',
        en: 'Watch online',
        uk: 'Дивитися онлайн',
        zh: '在线观看'
      },
      lampac_video: {
        ru: 'Видео',
        en: 'Video',
        uk: 'Відео',
        zh: '视频'
      },
      lampac_no_watch_history: {
        ru: 'Нет истории просмотра',
        en: 'No browsing history',
        ua: 'Немає історії перегляду',
        zh: '没有浏览历史'
      },
      lampac_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败'
      },
      lampac_balanser: {
        ru: 'Источник',
        uk: 'Джерело',
        en: 'Source',
        zh: '来源'
      },
      helper_online_file: {
        ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: {
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的'
      },
      lampac_voice_subscribe: {
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译'
      },
      lampac_voice_success: {
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      lampac_voice_error: {
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误'
      },
      lampac_clear_all_marks: {
        ru: 'Очистить все метки',
        uk: 'Очистити всі мітки',
        en: 'Clear all labels',
        zh: '清除所有标签'
      },
      lampac_clear_all_timecodes: {
        ru: 'Очистить все тайм-коды',
        uk: 'Очистити всі тайм-коди',
        en: 'Clear all timecodes',
        zh: '清除所有时间代码'
      },
      lampac_change_balanser: {
        ru: 'Изменить балансер',
        uk: 'Змінити балансер',
        en: 'Change balancer',
        zh: '更改平衡器'
      },
      lampac_balanser_dont_work: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      },
      lampac_balanser_timeout: {
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Джерело буде автоматично переключено через <span class="timeout">10</span> секунд.',
        en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },
      lampac_does_not_answer_text: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      }
    });
    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';\n.gpbay-online-ui .online-prestige{position:relative;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;background:rgba(18,18,18,.34);border:1px solid rgba(145,180,202,.13);-webkit-border-radius:.52em;border-radius:.52em;-webkit-box-shadow:none!important;box-shadow:none!important;-webkit-transition:none!important;transition:none!important;-webkit-transform:none!important;transform:none!important;-webkit-animation:none!important;animation:none!important}\n.gpbay-online-ui .online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;min-width:0;position:relative}\n.gpbay-online-ui .online-prestige__img{position:relative;overflow:hidden;width:13em;min-height:8.2em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;background:rgba(255,255,255,.035);-webkit-border-radius:.52em 0 0 .52em;border-radius:.52em 0 0 .52em}\n.gpbay-online-ui .online-prestige__img:after{content:'';position:absolute;z-index:1;top:0;right:0;bottom:0;width:1.35em;pointer-events:none;background:-webkit-linear-gradient(left,transparent,rgba(18,18,18,.22));background:linear-gradient(90deg,transparent,rgba(18,18,18,.22))}\n.gpbay-online-ui .online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;opacity:0;-webkit-transition:none!important;transition:none!important}\n.gpbay-online-ui .online-prestige__img--loaded>img{opacity:1}\n.gpbay-online-ui .online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}\n.gpbay-online-ui .online-prestige__folder>svg{width:4.4em!important;height:4.4em!important;opacity:.8}\n.gpbay-online-ui .online-prestige__viewed{position:absolute!important;z-index:4!important;top:.58em!important;right:.58em!important;bottom:auto!important;left:auto!important;width:1.7em!important;height:1.7em!important;padding:0!important;margin:0!important;display:-webkit-box!important;display:-webkit-flex!important;display:flex!important;-webkit-box-align:center!important;-webkit-align-items:center!important;align-items:center!important;-webkit-box-pack:center!important;-webkit-justify-content:center!important;justify-content:center!important;background:rgba(7,13,18,.78)!important;border:1px solid rgba(150,211,255,.48)!important;-webkit-border-radius:50%!important;border-radius:50%!important;color:#a8dcff!important;-webkit-box-shadow:none!important;box-shadow:none!important}\n.gpbay-online-ui .online-prestige__viewed span{display:block;font-size:.92em;font-weight:800;line-height:1}\n.gpbay-online-ui .online-prestige__episode-number{position:absolute!important;z-index:4!important;left:.58em!important;bottom:.56em!important;top:auto!important;right:auto!important;display:block!important;min-width:1.8em!important;padding:.24em .4em!important;text-align:center!important;font-size:.8em!important;font-weight:700!important;line-height:1.1!important;color:#fff!important;background:rgba(7,12,17,.76)!important;border:1px solid rgba(255,255,255,.17)!important;-webkit-border-radius:.38em!important;border-radius:.38em!important;-webkit-box-shadow:none!important;box-shadow:none!important}\n.gpbay-online-ui .online-prestige__loader{position:absolute;z-index:2;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;background-size:contain;opacity:.75}\n.gpbay-online-ui .online-prestige__head,.gpbay-online-ui .online-prestige__footer,.gpbay-online-ui .online-prestige__meta{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;min-width:0}\n.gpbay-online-ui .online-prestige__head,.gpbay-online-ui .online-prestige__footer{-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between}\n.gpbay-online-ui .online-prestige__title{font-size:1.7em;line-height:1.2;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}\n.gpbay-online-ui .online-prestige__timeline{margin:.8em 0;min-height:.22em}\n.gpbay-online-ui .online-prestige__timeline>.time-line{display:block!important;height:.22em!important;margin:0!important;padding:0!important;overflow:hidden!important;background:rgba(255,255,255,.16)!important;border:0!important;-webkit-border-radius:99px!important;border-radius:99px!important;-webkit-box-shadow:none!important;box-shadow:none!important}\n.gpbay-online-ui .online-prestige__timeline>.time-line.hide{display:none!important}\n.gpbay-online-ui .online-prestige__timeline>.time-line>div{height:100%!important;min-width:.18em;background:#6cb8ee!important;border:0!important;-webkit-border-radius:99px!important;border-radius:99px!important;-webkit-box-shadow:none!important;box-shadow:none!important}\n.gpbay-online-ui .online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;min-width:0;-webkit-box-flex:1;-webkit-flex:1 1 auto;flex:1 1 auto;color:rgba(255,255,255,.72)}\n.gpbay-online-ui .online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}\n.gpbay-online-ui .online-prestige__meta{-webkit-flex:none;flex:none;margin-left:2em;color:rgba(255,255,255,.68)}\n.gpbay-online-ui .online-prestige__time{white-space:nowrap;color:rgba(255,255,255,.68);background:none!important;border:0!important;padding:0!important;margin:0!important;-webkit-border-radius:0!important;border-radius:0!important}\n.gpbay-online-ui .online-prestige__quality{margin-left:1em}\n.gpbay-online-ui .online-prestige__quality{display:inline-block;padding:.22em .5em;white-space:nowrap;line-height:1.15;text-align:center;color:rgba(225,243,255,.94);background:rgba(76,151,204,.1);border:1px solid rgba(128,198,244,.3);-webkit-border-radius:.42em;border-radius:.42em}\n.gpbay-online-ui .online-prestige__badges{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;margin-left:1em;white-space:nowrap}\n.gpbay-online-ui .online-prestige__badges:empty{display:none}\n.gpbay-online-ui .online-prestige__badge{display:inline-block;padding:.22em .5em;line-height:1.15;font-size:1em;white-space:nowrap;color:rgba(222,236,245,.95);background:rgba(108,132,148,.11);border:1px solid rgba(157,183,200,.3);-webkit-border-radius:.42em;border-radius:.42em}\n.gpbay-online-ui .online-prestige__badge+.online-prestige__badge{margin-left:.34em}\n.gpbay-online-ui .online-prestige__badge--hdr{color:rgba(255,220,151,.97);background:rgba(196,137,42,.12);border-color:rgba(242,184,77,.34)}\n.gpbay-online-ui .online-prestige__badge--dv{color:rgba(229,188,255,.97);background:rgba(145,80,184,.12);border-color:rgba(202,126,238,.34)}\n.gpbay-online-ui .online-prestige__badge--codec{color:rgba(181,231,226,.96);background:rgba(56,135,126,.11);border-color:rgba(103,187,176,.3)}\n.gpbay-online-ui .online-prestige__badge--video{color:rgba(194,231,193,.96);background:rgba(70,137,72,.11);border-color:rgba(118,187,119,.3)}\n.gpbay-online-ui .online-prestige__badges+.online-prestige__quality{margin-left:.42em}\n.gpbay-online-ui .online-prestige__quality:empty{display:none}\n.gpbay-online-ui .online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}\n.gpbay-online-ui .online-prestige__scan-file .broadcast__scan{margin:0}\n.gpbay-online-ui .online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;color:rgba(255,255,255,.28);-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}\n.gpbay-online-ui .online-prestige.focus{background:rgba(24,30,35,.52);border-color:rgba(151,211,252,.88);-webkit-box-shadow:none!important;box-shadow:none!important;-webkit-transform:none!important;transform:none!important}\n.gpbay-online-ui .online-prestige.focus .online-prestige__title{color:#fff}\n.gpbay-online-ui .online-prestige+.online-prestige{margin-top:1.5em}\n.gpbay-online-ui .online-prestige--folder .online-prestige__footer{margin-top:.8em}\n.gpbay-online-ui .online-prestige--future{background:rgba(18,18,18,.24);border-color:rgba(255,255,255,.07)}\n.gpbay-online-ui .online-prestige--future .online-prestige__img--loaded>img{opacity:.48}\n.gpbay-online-ui .online-prestige--future .online-prestige__title,.gpbay-online-ui .online-prestige--future .online-prestige__info,.gpbay-online-ui .online-prestige--future .online-prestige__time{color:rgba(255,255,255,.5)}\n.gpbay-online-ui .online-prestige-watched{padding:.62em .82em;background:rgba(18,18,18,.28);border-color:rgba(111,181,228,.14);-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}\n.gpbay-online-ui .online-prestige-watched__icon{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;justify-content:center;width:1.9em;height:1.9em;-webkit-flex:none;flex:none;background:rgba(74,157,214,.1);border:1px solid rgba(112,190,242,.22);-webkit-border-radius:50%;border-radius:50%;color:#9ed6ff}\n.gpbay-online-ui .online-prestige-watched__icon>svg{width:1.18em;height:1.18em}\n.gpbay-online-ui .online-prestige-watched__body{padding-left:.78em;padding-top:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap;color:rgba(255,255,255,.72);line-height:1.22}\n.gpbay-online-ui .online-prestige-watched__body>span+span::before{content:'•';vertical-align:middle;display:inline-block;margin:0 .5em;color:rgba(255,255,255,.27)}\n.gpbay-online-ui .online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;padding:.12em .34em;background:rgba(255,255,255,.045);-webkit-border-radius:.32em;border-radius:.32em}\n.gpbay-online-ui .online-prestige-rate>svg{width:1.3em!important;height:1.3em!important}\n.gpbay-online-ui .online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}\n.gpbay-online-filter .gpbay-filter-icon{display:inline-block!important;width:1.08em!important;height:1.08em!important;margin:0 .38em 0 0!important;vertical-align:-.14em!important;color:rgba(174,215,244,.86);pointer-events:none;overflow:visible!important}\n.gpbay-online-filter .simple-button--filter.focus .gpbay-filter-icon{color:#bfe5ff}\n.gpbay-online-filter .gpbay-filter-icon--source{vertical-align:-.20em!important}\n.gpbay-online-filter .filter--search .gpbay-filter-icon{margin-right:0!important}\n.gpbay-online-filter .filter--search .gpbay-filter-native-search-icon{display:none!important}\n.gpbay-online-filter .torrent-filter{background:transparent!important;border-color:transparent!important;-webkit-box-shadow:none!important;box-shadow:none!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter{background:rgba(0,0,0,.14)!important;border:1px solid rgba(255,255,255,.09)!important;color:rgba(255,255,255,.92)!important;-webkit-box-shadow:none!important;box-shadow:none!important;-webkit-transition:none!important;transition:none!important;-webkit-transform:none!important;transform:none!important;-webkit-animation:none!important;animation:none!important;text-shadow:none!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter.focus{background:rgba(24,30,35,.58)!important;border-color:rgba(151,211,252,.92)!important;color:#fff!important;outline:none!important;-webkit-box-shadow:none!important;box-shadow:none!important;-webkit-transform:none!important;transform:none!important;text-shadow:none!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter>span{-webkit-transition:none!important;transition:none!important;-webkit-transform:none!important;transform:none!important;text-shadow:none!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter>div:not(.hide){color:rgba(224,242,255,.88)!important;background:rgba(98,170,220,.13)!important;-webkit-transition:none!important;transition:none!important;-webkit-transform:none!important;transform:none!important;text-shadow:none!important;border:1px solid rgba(128,198,244,.16)!important;-webkit-border-radius:.34em!important;border-radius:.34em!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter.focus>div:not(.hide){color:rgba(224,242,255,.96)!important;background:rgba(98,170,220,.16)!important}\n.gpbay-online-filter .torrent-filter>.simple-button--filter *{-webkit-animation:none!important;animation:none!important;text-shadow:none!important}\n.gpbay-online-ui .online-empty{line-height:1.4}\n.gpbay-online-ui .online-empty__title{font-size:1.8em;margin-bottom:.3em}\n.gpbay-online-ui .online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em;color:rgba(255,255,255,.72)}\n.gpbay-online-ui .online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}\n.gpbay-online-ui .online-empty__buttons>*+*{margin-left:1em}\n.gpbay-online-ui .online-empty__button{background:rgba(0,0,0,.16);border:1px solid rgba(255,255,255,.09);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.46em;border-radius:.46em;margin-bottom:2.4em;-webkit-transition:none!important;transition:none!important}\n.gpbay-online-ui .online-empty__button.focus{background:rgba(24,30,35,.58);color:#fff;border-color:rgba(151,211,252,.88)}\n.gpbay-online-ui .online-empty__templates .online-empty-template:nth-child(2){opacity:.5}\n.gpbay-online-ui .online-empty__templates .online-empty-template:nth-child(3){opacity:.2}\n.gpbay-online-ui .online-empty-template{padding:1em;background:rgba(18,18,18,.25);border:1px solid rgba(255,255,255,.06);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.5em;border-radius:.5em}\n.gpbay-online-ui .online-empty-template>*{background:rgba(255,255,255,.07);-webkit-border-radius:.36em;border-radius:.36em}\n.gpbay-online-ui .online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}\n.gpbay-online-ui .online-empty-template__body{height:1.7em;width:70%}\n.gpbay-online-ui .online-empty-template+.online-empty-template{margin-top:1em}\n@media screen and (max-width:480px){.gpbay-online-ui .online-prestige__badges{margin-left:.6em}.gpbay-online-ui .online-prestige__badges+.online-prestige__quality{margin-left:.3em}.gpbay-online-ui .online-prestige__body{padding:.8em 1.2em}.gpbay-online-ui .online-prestige__img{width:7em;min-height:6em}.gpbay-online-ui .online-prestige__img:after{display:none}.gpbay-online-ui .online-prestige__title{font-size:1.4em}.gpbay-online-ui .online-prestige__meta{margin-left:1em}.gpbay-online-ui .online-prestige__episode-number{left:.42em!important;bottom:.42em!important;font-size:.72em!important}.gpbay-online-ui .online-prestige__viewed{top:.42em!important;right:.42em!important;width:1.5em!important;height:1.5em!important}}\n        </style>\n    ");
    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    function resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__meta\"><div class=\"online-prestige__time\">{time}</div><div class=\"online-prestige__badges\">{badges}</div><div class=\"online-prestige__quality\">{quality}</div></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\">\n                \n            </div>\n        </div>");
    }
    var button = '<div class="full-start__button selector view--online" data-subtitle="' + manifst.name + '">' +
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 29" fill="none">' +
			'<g transform="translate(14 14.5) scale(1.14) translate(-14 -14.5)">' +
				'<path d="M22.4 8.55A10.55 10.55 0 1 0 22.4 20.45V14.5H18.55" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"></path>' +
				'<path d="M18.55 13.72C19.22 14.11 19.22 14.89 18.55 15.28L13.25 18.34C12.58 18.73 11.75 18.24 11.75 17.46V11.54C11.75 10.76 12.58 10.27 13.25 10.66L18.55 13.72Z" fill="currentColor"></path>' +
			'</g>' +
		'</svg>' +
        '<span>' + manifst.name +
        '</span>' +
    '</div>';
    Lampa.Component.add('gpbay', component);
    resetTemplates();
    function addButton(e) {
      if (!e.render || !e.render.length) return;
      if (e.render.find('.lampac--button').length || e.render.parent().find('.lampac--button').length) return;
      var btn = $(Lampa.Lang.translate(button));
      btn.on('hover:enter', function() {
        resetTemplates();
        Lampa.Component.add('gpbay', component);

		var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

        gpbayAnalyticsOpen(e.movie, 'button');

        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_watch'),
          component: 'gpbay',
          search: all[id] ? all[id] : e.movie.title,
          search_one: e.movie.title,
          search_two: e.movie.original_title,
          movie: e.movie,
          page: 1,
		  clarification: all[id] ? true : false
        });
      });
      if (e.render.hasClass('button--play')) e.render.before(btn);
      else e.render.after(btn);
    }
    Lampa.Listener.follow('full', function(e) {
      if (e.type == 'complite') {
        var root = e.object.activity.render();
        var target = root.find('.button--play');
        if (!target.length) target = root.find('.view--torrent');
        addButton({
          render: target,
          movie: e.data.movie
        });
      }
    });
    try {
      if (Lampa.Activity.active().component == 'full') {
        var currentRoot = Lampa.Activity.active().activity.render();
        var currentTarget = currentRoot.find('.button--play');
        if (!currentTarget.length) currentTarget = currentRoot.find('.view--torrent');
        addButton({
          render: currentTarget,
          movie: Lampa.Activity.active().card
        });
      }
    } catch (e) {}
    if (Lampa.Manifest.app_digital >= 177) {
      var balansers_sync = ["filmix", 'filmixtv', "fxapi", "rezka", "rhsprem", "lumex", "videodb", "collaps", "collaps-dash", "hdvb", "zetflix", "kodik", "ashdi", "kinoukr", "kinotochka", "remux", "iframevideo", "cdnmovies", "anilibria", "animedia", "animego", "animevost", "animebesst", "redheadsound", "alloha", "animelib", "moonanime", "kinopub", "vibix", "vdbmovies", "fancdn", "cdnvideohub", "vokino", "rc/filmix", "rc/fxapi", "rc/rhs", "vcdn", "videocdn", "mirage", "hydraflix","videasy","vidsrc","movpi","vidlink","twoembed","autoembed","smashystream","autoembed","rgshows", "pidtor", "videoseed", "iptvonline", "veoveo"];
      balansers_sync.forEach(function(name) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
    }
  }
  window.__gpbayAuthIdentity = function() {
    return {
      uid: gpbayEnsureUid(),
      storageUid: gpbayStorageGet('lampac_unic_id'),
      localUid: gpbayLocalStorageGet('lampac_unic_id'),
      fallbackUid: gpbayLocalStorageGet('gpbay_lampac_unic_id'),
      platform: getPairingPlatform(),
      appVersion: getPairingAppVersion(),
      profileId: getPairingProfileId(),
      rchType: getPairingRchType()
    };
  };

  if (!window.gpbay_plugin) startPlugin();

})();
