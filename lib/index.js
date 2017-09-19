'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var buffer_1 = require('buffer')
var path = require('path')
var AppCachePlugin = /** @class */ (function() {
  function AppCachePlugin(_a) {
    var _b = _a.cache,
      cache = _b === void 0 ? [] : _b,
      _c = _a.network,
      network = _c === void 0 ? ['*'] : _c,
      _d = _a.fallback,
      fallback = _d === void 0 ? [] : _d,
      _e = _a.settings,
      settings = _e === void 0 ? [] : _e,
      _f = _a.exclude,
      exclude = _f === void 0 ? [] : _f,
      _g = _a.output,
      output = _g === void 0 ? 'manifest.appcache' : _g,
      comment = _a.comment
    this.cache = cache
    this.network = network
    this.fallback = fallback
    this.settings = settings
    this.output = output
    this.comment = comment ? '# ' + comment + '\n' : ''
    // Convert exclusion strings to RegExp.
    this.exclude = exclude.map(function(exclusion) {
      if (exclusion instanceof RegExp) return exclusion
      return new RegExp('^' + exclusion + '$')
    })
  }
  AppCachePlugin.prototype.apply = function(compiler) {
    var _this = this
    var publicPath = (compiler.options.output || {}).publicPath || ''
    compiler.plugin('emit', function(compilation, callback) {
      var assets = Object.keys(compilation.assets)
        .filter(function(asset) {
          return !_this.exclude.some(function(pattern) {
            return pattern.test(asset)
          })
        })
        .map(function(asset) {
          return asset
            .replace('{hash}', compilation.hash)
            .replace('{chunkhash}', compilation.chunkhash)
        })
      var totalCache = assets.concat(_this.cache).map(function(asset) {
        return encodeURI(path.join(publicPath, asset))
      })
      var cacheBody =
        totalCache.length > 0
          ? '\nCACHE:\n' + _this.cache.concat(assets).join('\n') + '\n'
          : null
      var networkBody =
        _this.network.length > 0
          ? '\nNETWORK:\n' + _this.network.join('\n') + '\n'
          : null
      var fallbackBody =
        _this.fallback.length > 0
          ? '\nFALLBACK:\n' + _this.fallback.join('\n') + '\n'
          : null
      var settingsBody =
        _this.settings.length > 0
          ? '\nSETTINGS:\n' + _this.settings.join('\n') + '\n'
          : null
      var finalManifest = [
        'CACHE MANIFEST',
        '# ' + compilation.hash,
        _this.comment ? '# ' + _this.comment : null,
        cacheBody,
        networkBody,
        fallbackBody,
        settingsBody
      ]
        .filter(function(item) {
          return item !== null
        })
        .join('\n')
      compilation.assets[_this.output] = {
        source: finalManifest,
        size: buffer_1.Buffer.byteLength(finalManifest)
      }
      callback()
    })
  }
  return AppCachePlugin
})()
exports.default = AppCachePlugin
//# sourceMappingURL=index.js.map
