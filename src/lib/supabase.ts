
// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyFromEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("[Supabase Client Init] Attempting to initialize Supabase client.");
console.log("[Supabase Client Init] NEXT_PUBLIC_SUPABASE_URL read from env:", supabaseUrlFromEnv);
console.log("[Supabase Client Init] NEXT_PUBLIC_SUPABASE_ANON_KEY read from env:", supabaseAnonKeyFromEnv);

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrlFromEnv && typeof supabaseUrlFromEnv === 'string' && supabaseUrlFromEnv.startsWith('http') && supabaseAnonKeyFromEnv) {
  try {
    supabaseInstance = createClient(supabaseUrlFromEnv, supabaseAnonKeyFromEnv);
    console.log("[Supabase Client Init] Supabase client initialized successfully.");
  } catch (e: any) { // Added type assertion for error
    console.error("[Supabase Client Init] Error creating Supabase client instance:", e.message);
    console.error("[Supabase Client Init] Supabase URL used during error:", supabaseUrlFromEnv);
    supabaseInstance = null; // Ensure it's null if creation fails
  }
} else {
  console.warn(
    '[Supabase Client Init] Supabase client will NOT be initialized due to missing or invalid environment variables.'
  );
  if (!supabaseUrlFromEnv) {
    console.warn("[Supabase Client Init] NEXT_PUBLIC_SUPABASE_URL is missing or empty.");
  } else if (typeof supabaseUrlFromEnv !== 'string' || !supabaseUrlFromEnv.startsWith('http')) {
    console.warn("[Supabase Client Init] NEXT_PUBLIC_SUPABASE_URL is invalid. Value received:", supabaseUrlFromEnv);
  }
  if (!supabaseAnonKeyFromEnv) {
    console.warn("[Supabase Client Init] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty.");
  }
}

export const supabase = supabaseInstance;

// Comment on Row Level Security (RLS):
// For secure data access after user authentication, Row Level Security (RLS)
// must be enabled and configured for your Supabase tables.
//
// When a user is logged in, supabase.auth.getSession() or supabase.auth.getUser()
// will provide access to the user's session, including:
// - session.user.id (the user's unique ID)
// - session.user.email
// - session.user.role (if roles are assigned)
//
// These details, particularly user.id and user.role, can be used in your RLS policies
// to control what data a specific user can read, insert, update, or delete.
// For example, a policy might allow a user to only access records where a 'user_id'
// column matches their session.user.id.
//
// Example RLS Policy (conceptual):
// CREATE POLICY "Users can only access their own profiles."
// ON profiles FOR SELECT
// USING (auth.uid() = user_id);
//
// Ensure you thoroughly understand RLS and apply it to all sensitive tables.

// Placeholder functions for data interaction (can be removed or expanded later)

/**
 * Placeholder function to fetch data.
 * @param tableName The name of the table to fetch from.
 * @param columns Optional. Specific columns to select, defaults to '*'.
 * @returns A promise that resolves with the fetched data or an error.
 */
export async function fetchData(tableName: string, columns: string = '*'): Promise<{ data: any[] | null; error: any | null }> {
  if (!supabase) {
    console.error(`[Supabase fetchData] Attempted to fetch from ${tableName} but Supabase client not initialized.`);
    return { data: null, error: { message: "Supabase client not initialized." } };
  }
  console.log(`[Supabase fetchData] Fetching data from ${tableName} (columns: ${columns})...`);
  const { data, error } = await supabase.from(tableName).select(columns);
  if (error) {
    console.error(`[Supabase fetchData] Error fetching from ${tableName}:`, error.message);
  }
  return { data, error };
}

/**
 * Placeholder function to insert data.
 * @param tableName The name of the table to insert into.
 * @param row The data to insert.
 * @returns A promise that resolves with the inserted data or an error.
 */
export async function insertData(tableName: string, row: any): Promise<{ data: any[] | null; error: any | null }> {
  if (!supabase) {
    console.error(`[Supabase insertData] Attempted to insert into ${tableName} but Supabase client not initialized.`);
    return { data: null, error: { message: "Supabase client not initialized." } };
  }
  console.log(`[Supabase insertData] Inserting data into ${tableName}:`, row);
  const { data, error } = await supabase.from(tableName).insert([row]).select();
   if (error) {
    console.error(`[Supabase insertData] Error inserting into ${tableName}:`, error.message);
  }
  return { data, error };
}
