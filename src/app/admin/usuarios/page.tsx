
"use client"; 

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit3, Trash2, Users, AlertTriangle, Search, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

// Interface for data directly from Supabase profiles table
interface UserFromSupabase {
  id: string;
  full_name: string | null;
  // email is not directly on profiles, would need a JOIN or view
  role: string | null;
  created_at: string; 
}

// Interface for data displayed in the table row
interface UserRow {
  id: string;
  nome: string;
  email: string; // Will be a placeholder if not fetched
  perfil: string;
  dataCadastro: string;
}

const userProfilesForFilter = [
  { value: "todos", label: "Todos os Perfis" },
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operador" },
  { value: "client", label: "Cliente" },
];

export default function GerenciamentoUsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; nome: string } | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false);
      setUsers([]);
      return;
    }
    setIsLoading(true);
    console.log("GerenciamentoUsuariosPage: Fetching users. Search:", searchTerm, "Profile Filter:", profileFilter);

    // Diagnostic: Check current user role via RPC
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
      if (roleError) {
        console.error("GerenciamentoUsuariosPage: Erro ao chamar RPC get_user_role:", JSON.stringify(roleError, null, 2));
      } else {
        console.log("GerenciamentoUsuariosPage: Papel do usuário (antes da query de profiles):", roleData);
      }
    } catch (e: any) {
      console.error("GerenciamentoUsuariosPage: Exceção ao chamar RPC get_user_role:", e.message);
    }

    let query = supabase
      .from('profiles')
      .select('id, full_name, role, created_at') 
      .order('full_name', { ascending: true });

    if (searchTerm) {
      // Simplified search to direct 'profiles' columns. Email search would require a view or different approach.
      query = query.ilike('full_name', `%${searchTerm}%`);
    }
    if (profileFilter !== 'todos') {
      query = query.eq('role', profileFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GerenciamentoUsuariosPage: Erro ao buscar usuários (full error object):", JSON.stringify(error, null, 2), error);
      toast({ 
        title: "Erro ao Buscar Usuários", 
        description: error.message || "Não foi possível carregar os usuários. Verifique o console e as RLS.", 
        variant: "destructive",
        duration: 7000
      });
      setUsers([]);
    } else {
      console.log("GerenciamentoUsuariosPage: Usuários recebidos do Supabase:", data);
      const formattedUsers: UserRow[] = (data || []).map((user: UserFromSupabase) => ({
        id: user.id,
        nome: user.full_name || 'N/A',
        email: 'E-mail não disponível', // Placeholder as email is not directly in profiles
        perfil: user.role || 'N/A',
        dataCadastro: user.created_at ? format(parseISO(user.created_at), 'dd/MM/yyyy HH:mm') : 'N/A',
      }));
      setUsers(formattedUsers);
      console.log("GerenciamentoUsuariosPage: Usuários formatados para tabela:", formattedUsers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileFilter]); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchUsers(); 
  };
  
  const handleProfileFilterChange = (value: string) => {
    setProfileFilter(value);
    // fetchUsers will be called by the useEffect dependency on profileFilter
  };

  const handleDeleteClick = (user: UserRow) => {
    setUserToDelete({ id: user.id, nome: user.nome });
    setIsAlertOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !supabase) return;
    setIsLoading(true);
    
    console.log(`GerenciamentoUsuariosPage: Attempting to delete user profile ID: ${userToDelete.id}`);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userToDelete.id);

    if (error) {
      console.error('GerenciamentoUsuariosPage: Falha ao excluir perfil do usuário:', JSON.stringify(error, null, 2), error);
      toast({ title: "Erro ao Excluir Perfil", description: error.message || "Falha ao excluir o perfil do usuário.", variant: "destructive" });
    } else {
      toast({ title: "Perfil de Usuário Excluído!", description: `O perfil de ${userToDelete.nome} foi excluído.` });
      fetchUsers(); 
    }
    setIsLoading(false);
    setIsAlertOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Users className="mr-3 h-8 w-8" /> Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova usuários do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/usuarios/novo">
              <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Usuário
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar e Filtrar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
                type="text"
                placeholder="Pesquisar por Nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
                disabled={isLoading}
            />
            <Select value={profileFilter} onValueChange={handleProfileFilterChange} disabled={isLoading}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por Perfil" />
                </SelectTrigger>
                <SelectContent>
                {userProfilesForFilter.map(profile => (
                    <SelectItem key={profile.value} value={profile.value}>{profile.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Button type="submit" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" /> {isLoading ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : 'Buscar'}
            </Button>
            </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuários Cadastrados</CardTitle>
          <CardDescription>
            Total de {users.length} usuários no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading && users.length === 0 && !searchTerm && profileFilter === 'todos' ? (
                 <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
                </div>
            ) : !isLoading && users.length === 0 ? (
                 <p className="text-center text-muted-foreground py-10">
                    {searchTerm || profileFilter !== 'todos' ? `Nenhum usuário encontrado para os filtros aplicados.` : "Nenhum usuário cadastrado."}
                </p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[180px] text-center hidden lg:table-cell">Data de Cadastro</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.perfil === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        user.perfil === 'supervisor' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        user.perfil === 'operator' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        user.perfil === 'client' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        'bg-muted text-muted-foreground'
                        }`}>
                        {user.perfil}
                        </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground hidden lg:table-cell">
                        {user.dataCadastro}
                    </TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" asChild aria-label={`Editar usuário ${user.nome}`}>
                        <Link href={`/admin/usuarios/${user.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                        </Link>
                        </Button>
                        <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        aria-label={`Excluir usuário ${user.nome}`}
                        disabled={isLoading}
                        >
                        <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o perfil do usuário <strong>{userToDelete.nome}</strong> (ID: {userToDelete.id})? 
                Esta ação removerá o perfil do banco de dados, mas **não** a conta de autenticação do usuário. 
                A exclusão completa do usuário (Auth + Profile) deve ser feita por um administrador via Supabase Studio ou uma função de backend.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setUserToDelete(null); }} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : "Confirmar Exclusão do Perfil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* 
        Supabase Integration RLS Notes for public.profiles:
        - SELECT: Users with 'admin', 'supervisor' roles should be able to read all profiles.
                  Operators might see some (e.g., clients) or only their own. Clients only see their own.
                  The `get_user_role()` function and appropriate RLS policies are crucial here.
        - DELETE on public.profiles: Restricted to 'admin' and/or 'supervisor'.
        - Deleting from public.profiles DOES NOT delete from auth.users automatically unless cascade is set up differently.
          True user deletion needs `supabase.auth.admin.deleteUser(userId)` via an Edge Function or Supabase Studio.
        - Email Fetching: To display email, you either need to add an 'email' column to 'profiles' (populated during signup/update, potentially redundant)
          OR create a database VIEW that joins 'profiles' with 'auth.users' and query that view.
          The current select `('id, full_name, role, created_at')` does not include email.
      */}
    </div>
  );
}

    

    