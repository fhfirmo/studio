
// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    // Check if the URL is a valid string before attempting to create the client
    if (typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '' || !supabaseUrl.startsWith('http')) {
      console.error('Invalid Supabase URL:', supabaseUrl);
      console.warn('Supabase client will not be initialized due to invalid URL.');
    } else {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  } catch (e) {
    console.error("Error creating Supabase client instance:", e);
    console.error("Supabase URL used during error:", supabaseUrl); // Log the URL to help debug
    supabaseInstance = null; // Ensure it's null if creation fails
  }
} else {
  console.warn(
    'Supabase URL or Anon Key is not defined. Supabase client will not be initialized. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file and the server is restarted.'
  );
  if (!supabaseUrl) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is missing or empty. Value received:", supabaseUrl);
  } else {
    console.warn("NEXT_PUBLIC_SUPABASE_URL value:", supabaseUrl);
  }
  if (!supabaseAnonKey) {
    console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty. Value received:", supabaseAnonKey);
  } else {
    // Be cautious logging the anon key, even parts of it, in shared environments.
    // For local debugging, this might be acceptable:
    // console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY is present. Length:", supabaseAnonKey.length);
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
  if (!supabase) return { data: null, error: { message: "Supabase client not initialized." } };
  console.log(`Fetching data from ${tableName} (columns: ${columns})... (using Supabase)`);
  const { data, error } = await supabase.from(tableName).select(columns);
  return { data, error };
}

/**
 * Placeholder function to insert data.
 * @param tableName The name of the table to insert into.
 * @param row The data to insert.
 * @returns A promise that resolves with the inserted data or an error.
 */
export async function insertData(tableName: string, row: any): Promise<{ data: any[] | null; error: any | null }> {
  if (!supabase) return { data: null, error: { message: "Supabase client not initialized." } };
  console.log(`Inserting data into ${tableName}:`, row, `(using Supabase)`);
  const { data, error } = await supabase.from(tableName).insert([row]).select();
  return { data, error };
}
