import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://muewqqqbwygtntxhgnyn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZXdxcXFid3lndG50eGhnbnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzcwMjgsImV4cCI6MjA3OTgxMzAyOH0.rZW2_-LB62oyfJ-bIaIYFkliIPNtxqvz_8fB9TtlLl0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
