import { Handlers } from "$fresh/server.ts";
import { Recipe } from "../../utils/Recipe.ts";

export const handler: Handlers<string | null> = {
    // AWS環境でもPATCHだけは動かない。(501 no implements)
    // PUTだとすべて動作確認成功

    // 指定レシピ一つを返す(ok)
    // const res = await fetch("http://localhost:8000/recipes/3");
    // res.json();
    async GET(_req, ctx) {
        const kv = await Deno.openKv();
        const id = Number(ctx.params.id);
        const key = ["recipes", id];
        const ev = (await kv.get<Recipe>(key)).value!;
        const { title, making_time, serves, ingredients, cost } = ev;
        const recipe = {
            id,
            title,
            making_time,
            serves,
            ingredients,
            cost,
        };
        return new Response(
            JSON.stringify({
                message: "Recipe details by id",
                recipe: [recipe],
            }),
            { headers: { "Content-Type": "application/json" } },
        );
    },

    // 指定レシピの更新(ok => ng)
    // ローカルでは成功したが、Deno Deployでのみ500エラーが出る。
    // const res = await fetch("http://localhost:8000/recipes/3", {method: "PUT", body: JSON.stringify({title: "芋煮", making_time: "50分", serves: "10人", ingredients: "芋, 醤油, 豚肉", cost: 2000})});
    // res.json();
    async PUT(req, ctx) {
        const kv = await Deno.openKv();
        const id = Number(ctx.params.id);
        // updated_at用のtoday生成
        const todaySrc = new Date();
        const todayYear = String(todaySrc.getFullYear());
        const todayMonth = todaySrc.getMonth() < 10
            ? "0" + String(todaySrc.getMonth())
            : String(todaySrc.getMonth());
        const todayDate = todaySrc.getDate() < 10
            ? "0" + String(todaySrc.getDate())
            : String(todaySrc.getDate());
        const todayHours = todaySrc.getHours() < 10
            ? "0" + String(todaySrc.getHours())
            : String(todaySrc.getHours());
        const todayMinutes = todaySrc.getMinutes() < 10
            ? "0" + String(todaySrc.getMinutes())
            : String(todaySrc.getMinutes());
        const todaySeconds = todaySrc.getSeconds() < 10
            ? "0" + String(todaySrc.getSeconds())
            : String(todaySrc.getSeconds());
        const today =
            `${todayYear}-${todayMonth}-${todayDate} ${todayHours}:${todayMinutes}:${todaySeconds}`;
        // メイン処理
        const newRecipe = (await req.json()) as Recipe;
        const oldRecipe =
            (await fetch(`${new URL(req.url).origin}/recipes/${id}`)).json();
        newRecipe.id = id;
        newRecipe.created_at = (await oldRecipe).created_at;
        newRecipe.updated_at = today;
        const { title, making_time, serves, ingredients, cost } = newRecipe;
        const newRecipeView = {
            title,
            making_time,
            serves,
            ingredients,
            cost,
        };
        const recipeKey = ["recipes", id];
        const ok = await kv.atomic().set(recipeKey, newRecipe).commit();
        const resObj = ok
            ? {
                message: "Recipe successfully updated!",
                "recipe": [newRecipeView],
            }
            : {
                message: "Recipe update failed!",
                "required": "title, making_time, serves, ingredients, cost",
            };
        return new Response(JSON.stringify(resObj), {
            headers: { "Content-Type": "application/json" },
        });
    },

    // 指定レシピの削除(ok => ng)
    // ローカルでは成功したが、Deno DeployでのみNo Recipe Foundが出る。
    // const res = await fetch("http://localhost:8000/recipes/3", {method: "DELETE"});
    // res.json();
    async DELETE(req, ctx) {
        const kv = await Deno.openKv();
        const id = Number(ctx.params.id);
        const key = ["recipes", id];
        // console.log(key);
        const res = (await fetch(`${new URL(req.url).origin}/recipes/${id}`))
            .json();
        const ok = await (res.then((_recipe) => true).catch((_e) => false));
        await kv.delete(key);
        const resObj = ok
            ? {
                message: "Recipe successfully removed!",
            }
            : { message: "No Recipe found" };
        return new Response(JSON.stringify(resObj), {
            headers: { "Content-Type": "application/json" },
        });
    },
};
