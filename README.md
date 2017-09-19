# appcache-webpack-plugin-plus

Derived from the original [`appcache-webpack-plugin`](https://github.com/lettertwo/appcache-webpack-plugin), but updated and converted to Typescript.

## Usage

```javascript
const AppcachePlugin = require('appcache-webpack-plugin-plus')

module.exports = {
  plugins: [
    new AppcachePlugin({
      cache: ['someOtherAsset.jpg'],
      network: [],  // No network access allowed!
      fallback: ['failwhale.jpg'],
      settings: ['prefer-online'],
      exclude: ['file.txt', /.*\.js$/], // Exclude file.txt and all .js files
      output: 'my-manifest.appcache'
    })
  ]
}
```

Arguments:

* `cache`: An array of additional assets to cache. Defaults to `[]`.
* `network`: An array of assets that may be accessed via the network.
  Defaults to `['*']`.
* `fallback`: An array of fallback assets. Defaults to `[]`.
* `settings`: An array of settings. Defaults to `[]`.
* `exclude`: An array of strings or regex patterns. Assets in the compilation
that match any of these patterns will be excluded from the manifest. Defaults to `[]`.
* `output`: The filename to write the appcache. Defaults to `manifest.appcache`.
