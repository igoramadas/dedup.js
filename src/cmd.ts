// COMMAND LINE WRAPPER

import {hasValue, logError} from "./utils"
import Dedupr from "./index"
import yargs = require("yargs")
import yargsIntance = require("yargs/yargs")

// Unhandled rejections goes here.
process.on("unhandledRejection", (err) => {
    console.error("FATAL ERROR!")
    console.error(err)
    return process.exit()
})

export = async function () {
    const argOptions = yargsIntance(process.argv.slice(2)).options({
        u: {alias: "subfolders", type: "boolean", describe: "If a single folder is passed, use its subfolders as the source folders"},
        e: {alias: "extensions", type: "array", describe: "Allowed file extensions, default is all extensions"},
        o: {alias: "output", type: "string", describe: "Full path to the JSON output file, default is dedupr.json"},
        p: {alias: "parallel", type: "number", describe: "How many files processed in parallel (default 5)"},
        s: {alias: "size", type: "number", describe: "How much data from each file should be hashed, default is 20000 (20MB)"},
        h: {alias: "hash", type: "string", describe: "Hash algorithm, default is sha1"},
        v: {alias: "verbose", type: "boolean", describe: "Verbose mode with extra logging"},
        r: {alias: "reverse", type: "boolean", describe: "Reverse the folders and files order (alphabetically descending)"},
        f: {alias: "filename", type: "boolean", describe: "Also consider filenames to check if a file is a duplicate"},
        d: {alias: "delete", type: "boolean", describe: "Delete duplicate files"},
        crazyfast: {type: "boolean", describe: "Shortcut to --size 100, --hash sha1"},
        veryfast: {type: "boolean", describe: "Shortcut to --size 1000, --hash sha1"},
        faster: {type: "boolean", describe: "Shortcut to --size 5000, --hash sha1"},
        fast: {type: "boolean", describe: "Shortcut to --size 20000, --hash sha256"},
        safe: {type: "boolean", describe: "Shortcut to --size 1000000, --hash sha512"}
    })

    // Command line options.
    argOptions.env("DEDUPR")
    argOptions.wrap(Math.min(100, yargs.terminalWidth()))

    // Examples.
    argOptions.usage(`Usage: $0 -[options...] folders...`)
    argOptions.epilog("Need help? More info at https://github.com/igoramadas/dedupr")

    // Transform arguments to options.
    let options: Options = {
        console: true,
        folders: argOptions.argv._ as string[],
        extensions: hasValue(argOptions.argv.e) ? (argOptions.argv.e as string[]) : null,
        output: hasValue(argOptions.argv.o) ? argOptions.argv.o : null,
        parallel: hasValue(argOptions.argv.p) ? argOptions.argv.p : null,
        hashSize: hasValue(argOptions.argv.s) ? argOptions.argv.s : null,
        hashAlgorithm: hasValue(argOptions.argv.h) ? argOptions.argv.h : null,
        verbose: hasValue(argOptions.argv.v) ? argOptions.argv.v : null,
        reverse: hasValue(argOptions.argv.r) ? argOptions.argv.r : null,
        filename: hasValue(argOptions.argv.f) ? argOptions.argv.f : null,
        delete: hasValue(argOptions.argv.d) ? argOptions.argv.d : null
    }

    // Hash size shortcuts (crazyfast 5KB MD5, superfast 100KB SHA1, faster 1MB SHA1, fast 5MB SHA1, safe 50MB SHA256).
    if (argOptions.argv.crazyfast) {
        options.hashSize = 5
        options.hashAlgorithm = "md5"
    } else if (argOptions.argv.veryfast) {
        options.hashSize = 100
        options.hashAlgorithm = "sha1"
    } else if (argOptions.argv.faster) {
        options.hashSize = 1000
        options.hashAlgorithm = "sha1"
    } else if (argOptions.argv.fast) {
        options.hashSize = 5000
        options.hashAlgorithm = "sha1"
    } else if (argOptions.argv.safe) {
        options.hashSize = 50000
        options.hashAlgorithm = "sha256"
    }

    // Do it baby!
    try {
        const dedupr = new Dedupr(options)
        await dedupr.run()
    } catch (ex) {
        logError(options, `Failure to run`, ex)
    }
}
