
"use client"; 

import Link from 'next/link';
import { useState, useEffect } from 'react'; // Added useState and useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Edit3, Trash2, Users, AlertTriangle } from "lucide-react"; // Added AlertTriangle

// Placeholder data - In a real app, this would come from Supabase
const initialUsers = [
  { id: "usr_001", nome: "Administrador Principal", email: "admin@inbm.com.br", perfil: "Administrador", dataCadastro: "2024-01-15" },
  { id: "usr_002", nome: "Consultor Firmo", email: "consultor.firmo@inbm.com.br", perfil: "Operador", dataCadastro: "2024-02-20" },
  { id: "usr_003", nome: "Cliente Exemplo Alfa", email: "cliente.alfa@example.com", perfil: "Cliente", dataCadastro: "2024-03-10" },
  { id: "usr_004", nome: "Joana Silva", email: "joana.silva@example.com", perfil: "Cliente", dataCadastro: "2024-05-01" },
  { id: "usr_005", nome: "Carlos Pereira", email: "carlos.pereira@example.com", perfil: "Operador", dataCadastro: "2024-06-22" },
];

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  dataCadastro: string;
}

export default function GerenciamentoUsuariosPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; nome: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, users would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchUsers() {
  //     // const { data, error } = await supabase.from('users_table_name').select('*');
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar usuários."}) */ }
  //     // else { setUsers(data || []); }
  //   }
  //   fetchUsers();
  // }, []);

  const handleDeleteClick = (user: User) => {
    setUserToDelete({ id: user.id, nome: user.nome });
    setIsAlertOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    console.log(`Attempting to delete user ID: ${userToDelete.id}, Name: ${userToDelete.nome}`);
    // Placeholder for Supabase API call to delete user
    // try {
    //   // const { error } = await supabase.from('users_table_name').delete().eq('id', userToDelete.id);
    //   // if (error) throw error;
    //   setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    //   // toast({ title: "Usuário Excluído!", description: `O usuário ${userToDelete.nome} foi excluído com sucesso.` });
    // } catch (error: any) {
    //   console.error('Failed to delete user:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setUserToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete!.id));
    console.log(`User ${userToDelete.nome} (ID: ${userToDelete.id}) deleted (simulated).`);
    // toast({ title: "Usuário Excluído! (Simulado)", description: `O usuário ${userToDelete.nome} foi excluído com sucesso.` });
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuários Cadastrados</CardTitle>
          <CardDescription>
            Total de {users.length} usuários no sistema.
            {/* Implement search/filter controls here in the future */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[150px] text-center hidden lg:table-cell">Data de Cadastro</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{user.id}</TableCell>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.perfil === 'Administrador' ? 'bg-primary/10 text-primary-foreground dark:text-primary' :
                          user.perfil === 'Operador' ? 'bg-accent/10 text-accent-foreground dark:text-accent' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.perfil}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(user.dataCadastro).toLocaleDateString('pt-BR')}
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
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhum usuário cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Add pagination controls here in the future if needed */}
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o usuário <strong>{userToDelete.nome}</strong> (ID: {userToDelete.id})? Esta ação é irreversível e todos os dados associados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - User list will be fetched from a Supabase table (e.g., 'profiles' or 'users').
        - "Cadastrar Novo Usuário" button will navigate to a form page which, upon submission,
          will call Supabase to insert a new user (e.g., using Supabase Auth and a 'profiles' table).
        - "Editar" button will navigate to a form page pre-filled with user data (fetched from Supabase by ID),
          which upon submission will call Supabase to update the user's record.
        - "Excluir" button will trigger a Supabase API call to delete the user's record,
          likely after a confirmation modal.
        - Search/filter functionality will query the Supabase table.
      */}
    </div>
  );
}
