import { Buffer } from 'buffer'
import * as path from 'path'
import { Compiler } from 'webpack'

export default class AppCachePlugin {
  cache: string[]
  network: string[]
  fallback: string[]
  settings: string[]
  exclude: RegExp[]
  output: string
  comment: string

  constructor(
    {
      cache = [],
      network = ['*'],
      fallback = [],
      settings = [],
      exclude = [],
      output = 'manifest.appcache',
      comment
    }: {
      cache?: string[]
      network?: string[]
      fallback?: string[]
      settings?: string[]
      exclude?: (string | RegExp)[]
      output?: string
      comment?: string
    } = {}
  ) {
    this.cache = cache
    this.network = network
    this.fallback = fallback
    this.settings = settings
    this.output = output
    this.comment = comment

    // Convert exclusion strings to RegExp.
    this.exclude = exclude.map(exclusion => {
      if (exclusion instanceof RegExp) return exclusion
      return new RegExp(`^${exclusion}$`)
    })
  }

  apply(compiler: Compiler) {
    const compilerOptions = compiler.options || {}
    const compilerOutput = compilerOptions.output || {}
    const publicPath = compilerOutput.publicPath || ''

    compiler.plugin(
      'emit',
      (
        compilation: {
          hash: string
          chunkhash: string
          assets: { [filename: string]: { source: string; size: number } }
        },
        callback: () => void
      ) => {
        const assets = Object.keys(compilation.assets)
          .filter(asset => !this.exclude.some(pattern => pattern.test(asset)))
          .map(asset =>
            asset
              .replace('{hash}', compilation.hash)
              .replace('{chunkhash}', compilation.chunkhash)
          )
        const totalCache = assets
          .concat(this.cache)
          .map(asset => encodeURI(path.join(publicPath, asset)))

        const cacheBody =
          totalCache.length > 0 ? `CACHE:\n${totalCache.join('\n')}\n` : null

        const networkBody =
          this.network.length > 0
            ? `NETWORK:\n${this.network.join('\n')}\n`
            : null

        const fallbackBody =
          this.fallback.length > 0
            ? `FALLBACK:\n${this.fallback.join('\n')}\n`
            : null

        const settingsBody =
          this.settings.length > 0
            ? `SETTINGS:\n${this.settings.join('\n')}\n`
            : null

        const finalManifest = [
          'CACHE MANIFEST',
          `# ${compilation.hash}`,
          this.comment ? `# ${this.comment}` : null,
          cacheBody,
          networkBody,
          fallbackBody,
          settingsBody
        ]
          .filter(item => item !== null)
          .join('\n')

        compilation.assets[this.output] = {
          source: finalManifest,
          size: Buffer.byteLength(finalManifest)
        }
        callback()
      }
    )
  }
}
