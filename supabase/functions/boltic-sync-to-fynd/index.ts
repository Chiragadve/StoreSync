import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing auth" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { product_id } = await req.json();
        if (!product_id) {
            return new Response(JSON.stringify({ error: "product_id required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Fetch product
        const { data: product, error: fetchErr } = await supabase
            .from("products")
            .select("*")
            .eq("id", product_id)
            .single();

        if (fetchErr || !product) {
            return new Response(JSON.stringify({ error: "Product not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Update sync status to 'syncing'
        await supabase
            .from("products")
            .update({ fynd_sync_status: "syncing" })
            .eq("id", product_id);

        // Build webhook payload
        const BOLTIC_WEBHOOK_URL = Deno.env.get("BOLTIC_WEBHOOK_URL");
        if (!BOLTIC_WEBHOOK_URL) {
            throw new Error("BOLTIC_WEBHOOK_URL not configured");
        }

        const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fynd-sync-callback`;

        const webhookPayload = {
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                category: product.category,
                image_url: product.image_url || "",
                threshold: product.threshold,
            },
            callback_url: callbackUrl,
        };

        // POST to Boltic webhook
        const bolticRes = await fetch(BOLTIC_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
        });

        // Log the sync attempt
        await supabase.from("fynd_sync_logs").insert({
            product_id: product_id,
            action: "push",
            payload: {
                webhook_url: BOLTIC_WEBHOOK_URL,
                product: webhookPayload.product,
                boltic_status: bolticRes.status,
            },
        });

        if (!bolticRes.ok) {
            await supabase
                .from("products")
                .update({ fynd_sync_status: "error" })
                .eq("id", product_id);

            const errBody = await bolticRes.text();
            return new Response(JSON.stringify({ error: "Boltic webhook failed", details: errBody }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, status: "syncing" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
