import { Application, Router, send } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const CONCURRENT_CONNECTIONS = 4;
const connectOpts = Deno.env.get("DATABASE_URL") ?? { }
const pool = new Pool(connectOpts, CONCURRENT_CONNECTIONS);

async function executeSql(...args) {
    let client = null;
    let result = null;
    try {
        client = await pool.connect();
        result = await client.queryObject(...args)
    } catch (err) {
        console.error(err);
    } finally {
        try {
            await client.release();
        } catch (err) {
            console.error(err);
        }
    }
    return result.rows;
}

const staticFiles = new Set()
for await (const file of Deno.readDir("static")) { 
    if (!file.isDirectory) {
        staticFiles.add(file.name)
    }
}

const app = new Application();
const router = new Router()

const buttonIdToMinutes = {
    "0": "5",
    "1": "10",
    "2": "15",
    "3": "20",
    "4": "25",
}

router.post("/api/press", async (ctx, next) => {
    const body = await ctx.request.body().value
    const location = body.location
    const minutes = buttonIdToMinutes[body.buttonId]
    if (!minutes) return

    console.log(minutes)
    console.log(location)
    await executeSql("INSERT INTO presses (minutes, location, time) VALUES ($minutes, $location, NOW())",
        { minutes, location })

    ctx.response.type = "application/json"
    ctx.response.body = { ok: true }
})

router.get("/api/dump", async (ctx, next) => {
    const rows = await executeSql("SELECT * FROM presses")

    ctx.response.type = "application/json"
    ctx.response.body = { rows }
})

router.get("/api/times", async (ctx, next) => {
    const body = await ctx.request.body().value
    const minutes = buttonIdToMinutes[body.buttonId]
    if (!minutes) return

    ctx.response.type = "application/json"
    ctx.response.body = { rows }
})

app.use(async (ctx, next) => {
    let path = ctx.request.url.pathname
    if (path.startsWith("/")) path = path.substring(1)
    if (path == "") path = "index.html"
    if (staticFiles.has(path)) {
        await send(ctx, path, {
            root: "static",
        });
    } else {
        await next()
    }
})

app.use(router.routes())

app.listen({ port: 8080 });
