import { open } from "https://deno.land/x/opener/mod.ts"

interface Args {
    args?: string[]
}

class Command {
    args: string[]
    func: () => Promise<void> | void
    subCommands: Command[]
    subOptional: boolean

    constructor(args?: string[], func?: () => Promise<void> | void) {
        this.args = args || []
        this.func = func || async function () {}
        this.subCommands = []
        this.subOptional = false
    }

    addArg(arg: string) {
        this.args.push(arg)
    }
    addSubCommand(command: Command) {
        this.subCommands.push(command)
    }
    canRun(args: string[]): boolean {
        if (this.args.includes(args[0])) {
            if (this.subCommands.length != 0) {
                for (const command of this.subCommands) {
                    if (command.canRun(args.slice(1))) {
                        return true
                    }
                }
            } else {
                return true
            }
        }
        return false
    }
    hasSubcommand() {
        return this.subCommands.length == 0
    }
    formulateCommand (args: string[])  {
        if (!this.canRun(args)) {
            return []
        }
        const funcs = [this.func]
        const newArgs = args.slice(1)
        for (const command of this.subCommands) {
            if (command.canRun(newArgs)) {
                Array.prototype.push.apply(funcs, command.formulateCommand(newArgs))
            }
        }
        return funcs
    }
    async run (args: string[]) {
        const funcs = this.formulateCommand(args)
    
        for (const func of funcs) {
            await func()
        }
    }
}

class Cli {
    commands: Command[]
    constructor(commands?: Command[]) {
        this.commands = commands || []
    }

    async run (args: string[]) {
        for (const command of this.commands) {
            await command.run(args)
        }
    }
    addCommand(command: Command) {
        this.commands.push(command)
    }
    async log (value:string) {
        await Deno.stdout.write(new TextEncoder().encode(value))
    }
    async read () {
        const buf = new Uint8Array(1024)
        let input = ""
        const decoder = new TextDecoder()

        const n = await Deno.stdin.read(buf)
        if (n != null) {
            const text = decoder.decode(buf.subarray(0, n))
            input = text
        }


        return input
    }
}

interface LangData {
    name: string,
    slug: string,
    type: string,
    links: {
        code: string,
        home: string
    },
}

const searchLang = async (query: string) => {
    const req = await fetch("https://devdocs.io/docs/docs.json")
    const languages = await req.json()
    for (const lang of languages) {
        if (lang.name == query || lang.slug == query) {
            return lang
        }
    }
    return undefined
}
const getLangData = async (langSlug: string, query: string) => {
    const res = await fetch(`https://documents.devdocs.io/${langSlug}/index.json`)
    const json = await res.json()

    const langDetails = json.entries
    const chooseArray: {name: string, path: string, type: string}[] = []
    for (const item of langDetails) {
        if (item.name.includes(query)) {
            chooseArray.push(item)
        }
    }
    return chooseArray
}


const cli = new Cli()
const newCommand = new Command(["search", "s"], async () => {
    let lang = Deno.args[1]
    if (!lang) {
        await cli.log("Enter language\n")
        lang = (await cli.read()).replace("\n", "")
    }
    const langData = await searchLang(lang.replace("\n", ""))
    if (!langData) {
        cli.log("Not a valid language! Try a different query.\n")
        return
    }
    cli.log(JSON.stringify(langData))
    await cli.log(`\nSearch inside language ${lang}:\n`)
    const query = await (await cli.read()).replace("\n", "")
    await cli.log(`\nSearching for ${query.replace("\n", "")} in ${lang}...\n`)
    const data = await getLangData(langData.slug, query)
    let names = ""
    for (const [i, dat] of data.entries()) {
        names += `${i}: ${dat.name}\n`
    }
    if (names.length == 0) {
        await cli.log("No results 😢")
        return
    }
    await cli.log(names)
    await cli.log("Enter index of name: \n")
    const option = Number(await cli.read())
    const choice = data[option]
    await open(`https://devdocs.io/${langData.slug}/${choice.path}`)
})

cli.addCommand(newCommand)
cli.run(Deno.args)