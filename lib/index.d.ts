/// <reference types="webpack" />
import { Compiler } from 'webpack';
export default class AppCachePlugin {
    cache: string[];
    network: string[];
    fallback: string[];
    settings: string[];
    exclude: RegExp[];
    output: string;
    comment: string;
    constructor({cache, network, fallback, settings, exclude, output, comment}: {
        cache: string[];
        network: string[];
        fallback: string[];
        settings: string[];
        exclude: (string | RegExp)[];
        output: string;
        comment?: string;
    });
    apply(compiler: Compiler): void;
}
