// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// It's crucial to use environment variables for your Supabase URL and Anon Key.
// Do NOT hardcode them in your application.
// For Next.js, prefix them with NEXT_PUBLIC_ if they need to be accessible on the client-side.
// Create a .env.local file in your project root and add:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // In a real app, you might want to throw an error or handle this more gracefully.
  // For this prototyping phase, a console warning is sufficient.
  console.warn(
    'Supabase URL or Anon Key is not defined. Supabase client will not be initialized. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
  );
}

export const supabase = supabaseInstance;

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

// ... (other placeholder functions like updateData, deleteData can be similarly updated or removed)

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
