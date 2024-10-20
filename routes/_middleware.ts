import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
    if (req.method == "OPTIONS") {
        const res = new Response(null, {
            status: 204,
        });
        const headers = res.headers;
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "PATCH, DELETE");
        return res;
    }
    const res = await ctx.next();
    const headers = res.headers;

    headers.set("Access-Control-Allow-Origin", "*");
    headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE",
    );

    return res;
}
