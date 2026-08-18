import { createClient } from "@supabase/supabase-js";

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  const client = createClient(config.public.supabase.url, config.public.supabase.key);

  try {
    const { error } = await client.auth.getSession();
    if (error) throw error;
    console.log("[supabase] client conectado OK");
  } catch (error) {
    console.error("[supabase] error de conexión:", error);
  }
});
