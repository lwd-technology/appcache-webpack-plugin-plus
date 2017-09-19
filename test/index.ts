import 'mocha'
import * as assert from 'assert'
import { createHash } from 'crypto'
import { Compiler } from 'webpack'
import AppCachePlugin from '../src'

const DEFAULT_MANIFEST_NAME = 'manifest.appcache'

interface Compilation {
  assets: { [filename: string]: { source: string; size: number } | null }
  hash?: string
}

describe('AppCachePlugin', () => {
  describe('constructor', () => {
    describe('cache option', () => {
      it('is empty array by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.cache instanceof Array && plugin.cache.length === 0)
      })

      it('accepts CACHE section entries', () => {
        const plugin = new AppCachePlugin({ cache: ['cache.test'] })
        assert(plugin.cache.length === 1)
        assert(plugin.cache[0] === 'cache.test')
      })
    })

    describe('network option', () => {
      it('allows all (*) by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.network.length === 1)
        assert(plugin.network[0] === '*')
      })

      it('accepts NETWORK section entries', () => {
        const plugin = new AppCachePlugin({ network: ['network.test'] })
        assert(plugin.network.length === 1)
        assert(plugin.network[0] === 'network.test')
      })
    })

    describe('fallback option', () => {
      it('is empty array by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.fallback instanceof Array && plugin.fallback.length === 0)
      })

      it('accepts FALLBACK section entries', () => {
        const plugin = new AppCachePlugin({ fallback: ['fallback.test'] })
        assert(plugin.fallback.length === 1)
        assert(plugin.fallback[0] === 'fallback.test')
      })
    })

    describe('settings option', () => {
      it('is empty array by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.settings instanceof Array && plugin.settings.length == 0)
      })

      it('accepts SETTINGS section entries', () => {
        const plugin = new AppCachePlugin({ settings: ['prefer-online'] })
        assert(plugin.settings.length === 1)
        assert(plugin.settings[0] === 'prefer-online')
      })
    })

    describe('exclude option', () => {
      it('is an empty array by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.exclude.length === 0)
      })

      it('accepts a list of exclude patterns (compiled to RegExp)', () => {
        const plugin = new AppCachePlugin({
          exclude: ['something', /somethingelse/]
        })
        assert(plugin.exclude.length === 2)
        assert(plugin.exclude[0] instanceof RegExp)
        assert(plugin.exclude[0].toString() === '/^something$/')
        assert(plugin.exclude[1] instanceof RegExp)
        assert(plugin.exclude[1].toString() === '/somethingelse/')
      })
    })

    describe('output option', () => {
      it('is manifest.appcache by default', () => {
        const plugin = new AppCachePlugin()
        assert(plugin.output === DEFAULT_MANIFEST_NAME)
      })
    })
  })

  describe('apply()', () => {
    let compiler: Compiler
    let compilation: Compilation
    let callback: () => void
    let callbackWasCalled: boolean

    beforeEach(() => {
      callbackWasCalled = false
      callback = () => {
        callbackWasCalled = true
      }

      compilation = {
        assets: { 'test.asset': null }
      }

      compiler = {
        plugin(
          _: any,
          fn: (compilation: Compilation, callback: () => void) => void
        ) {
          fn(compilation, callback)
        }
      } as any
    })

    it('creates a new compilation asset', () => {
      new AppCachePlugin().apply(compiler)

      assert(Object.keys(compilation.assets).length === 2)
      assert(compilation.assets[DEFAULT_MANIFEST_NAME])
      assert(compilation.assets[DEFAULT_MANIFEST_NAME]!.source)
      assert(compilation.assets[DEFAULT_MANIFEST_NAME]!.size)
    })

    it('names the asset as specified by the output option', () => {
      const OUTPUT_NAME = 'my-special-manifest.appcache'

      new AppCachePlugin({ output: OUTPUT_NAME }).apply(compiler)
      assert(Object.keys(compilation.assets).length === 2)
      assert(compilation.assets[DEFAULT_MANIFEST_NAME] === undefined)
      assert(compilation.assets[OUTPUT_NAME])
      assert(compilation.assets[OUTPUT_NAME]!.source)
      assert(compilation.assets[OUTPUT_NAME]!.size)
    })

    it('it adds compilation assets to the app cache', () => {
      new AppCachePlugin().apply(compiler)
      assert(compilation.assets[DEFAULT_MANIFEST_NAME])
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf(
          'test.asset'
        ) !== -1
      )
    })

    it('excludes compilation assets that match an exclude pattern', () => {
      new AppCachePlugin({ exclude: [/asset/] }).apply(compiler)
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf('asset') ===
          -1
      )
    })

    it('excludes compilation assets that match an exclude string', () => {
      new AppCachePlugin({ exclude: ['test.asset'] }).apply(compiler)
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf(
          'test.asset'
        ) === -1
      )
    })

    it('calls the apply callback', () => {
      new AppCachePlugin().apply(compiler)
      assert(callbackWasCalled)
    })

    it('incorporates the output.publicPath option', () => {
      compiler.options = { output: { publicPath: '/test/' } }
      new AppCachePlugin().apply(compiler)
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf(
          '/test/test.asset'
        ) !== -1
      )
    })
  })

  describe('source', () => {
    let compiler: Compiler
    let compilation: Compilation
    let callback: () => void
    let callbackWasCalled: boolean
    let comment = 'version 2.17.0-8105-827a7b6-20160212045647'
    let hash: string
    let appCache: AppCachePlugin
    let cache: string[]
    let network: string[]
    let fallback: string[]
    let settings: string[]

    beforeEach(() => {
      callbackWasCalled = false
      callback = () => {
        callbackWasCalled = true
      }

      compilation = {
        assets: { 'test.asset': null },
        hash: createHash('md5').digest('hex')
      }

      compiler = {
        plugin(
          _: any,
          fn: (compilation: Compilation, callback: () => void) => void
        ) {
          fn(compilation, callback)
        }
      } as any

      cache = ['cache.test']
      network = ['network.test']
      fallback = ['fallback.test']
      settings = ['prefer-online']

      new AppCachePlugin({
        cache,
        network,
        fallback,
        settings,
        comment
      }).apply(compiler)
    })

    it('includes webpack build hash', () => {
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf(
          `# ${compilation.hash}`
        ) !== -1,
        'hash is not in source'
      )
    })

    it('includes comment', () => {
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.source.indexOf(comment) !==
          -1,
        'comment is not in source'
      )
    })

    it('measures byte size', () => {
      assert(
        compilation.assets[DEFAULT_MANIFEST_NAME]!.size === 197,
        `size doesn't match: ${compilation.assets[DEFAULT_MANIFEST_NAME]!.size}`
      )
    })
  })
})
