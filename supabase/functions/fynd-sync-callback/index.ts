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
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const body = await req.json();
        const { supabase_id, status } = body;

        if (!supabase_id) {
            return new Response(JSON.stringify({ error: "supabase_id required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const syncStatus = status === "synced" ? "synced" : "error";

        // Update product sync status
        await supabase
            .from("products")
            .update({
                fynd_sync_status: syncStatus,
                fynd_synced_at: new Date().toISOString(),
            })
            .eq("id", supabase_id);

        // Log the callback
        await supabase.from("fynd_sync_logs").insert({
            product_id: supabase_id,
            action: "callback",
            payload: body,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
