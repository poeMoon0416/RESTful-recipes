import { Handlers } from "$fresh/server.ts";
import { Recipe } from "../../utils/Recipe.ts";
import { RecipeView } from "../../utils/RecipeView.ts";

export const handler: Handlers<string | null> = {
    // レシピを作成
    async POST(req, _ctx) {
        const kv = await Deno.openKv("db");
        // id生成(AUTO_INCREMENT)
        const entries = await kv.list<Recipe>({ prefix: ["recipes"] });
        const recipes: Recipe[] = [];
        for await (const entry of entries) {
            recipes.push(entry.value);
        }
        const id = recipes.length + 1;
        // created_at, updated_at用のtoday生成
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
        const recipe = (await req.json()) as Recipe;
        recipe.id = id;
        recipe.created_at = today;
        recipe.updated_at = today;
        const recipeKey = ["recipes", id];
        const ok = await kv.atomic().set(recipeKey, recipe).commit();
        const resObj = ok
            ? { message: "Recipe successfully created!", "recipe": [recipe] }
            : {
                message: "Recipe creation failed!",
                "required": "title, making_time, serves, ingredients, cost",
            };
        return new Response(JSON.stringify(resObj));
    },

    // 全レシピ一覧を返す
    async GET(_req, _ctx) {
        const kv = await Deno.openKv("db");
        const entries = await kv.list<Recipe>({ prefix: ["recipes"] });
        const recipes: RecipeView[] = [];
        for await (const entry of entries) {
            const ev = entry.value;
            const { id, title, making_time, serves, ingredients, cost } = ev;
            const recipe: RecipeView = {
                id,
                title,
                making_time,
                serves,
                ingredients,
                cost,
            };
            recipes.push(recipe);
        }
        return new Response(JSON.stringify({ recipes: recipes }));
    },
};