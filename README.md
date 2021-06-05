# Deno DevDocs
A simple cli for searching devdocs.io made in deno. In very early stages.

---
## Install
Run `deno install -A --unstable https://github.com/ab3-dev/deno-devdocs/raw/master/ddocs.ts`

Or, learn more in the [deno docs](https://deno.land/#installation).

## Use
Currently there is one command, `search`, which does what you think. run `ddocs search` and you will get a prompt asking for the language you want to search. Alternatively, just run `ddocs search <lang>`. For example, `ddocs search css`.

Next, you will get a prompt for searching inside the language. Type in your query, and then you will get a indexed list of results. Type in the index of the result you want, and it will open in the browser!
