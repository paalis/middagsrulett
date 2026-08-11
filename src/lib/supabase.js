import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ujgqsxkaqvjymfwmgxqh.supabase.co";
const SUPABASE_KEY = "sb_publishable_evKQEJkFAgjt42665z_17Q_9DAxT7DC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
