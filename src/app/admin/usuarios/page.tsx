
// src/app/admin/usuarios/page.tsx
// This page will display a list of users and allow for their management.
// Data will be fetched from Supabase in a real application.

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Edit3, Trash2, Users } from "lucide-react";

// Placeholder data - In a real app, this would come from Supabase
const placeholderUsers = [
  { id: "usr_001", nome: "Administrador Principal", email: "admin@inbm.com.br", perfil: "Administrador", dataCadastro: "2024-01-15" },
  { id: "usr_002", nome: "Consultor Firmo", email: "consultor.firmo@inbm.com.br", perfil: "Operador", dataCadastro: "2024-02-20" },
  { id: "usr_003", nome: "Cliente Exemplo Alfa", email: "cliente.alfa@example.com", perfil: "Cliente", dataCadastro: "2024-03-10" },
  { id: "usr_004", nome: "Joana Silva", email: "joana.silva@example.com", perfil: "Cliente", dataCadastro: "2024-05-01" },
  { id: "usr_005", nome: "Carlos Pereira", email: "carlos.pereira@example.com", perfil: "Operador", dataCadastro: "2024-06-22" },
];

// Placeholder function for delete action
const handleDeleteUser = (userId: string) => {
  console.log(`Placeholder: Excluir usuário com ID: ${userId}`);
  // In a real app, this would open a confirmation modal and then call Supabase API
  // alert(`Simulando exclusão do usuário ID: ${userId}`);
};

export default function GerenciamentoUsuariosPage() {
  // In a real app, users would be fetched from Supabase:
  // const { data: users, error } = await supabase.from('users_table_name').select('*');
  const users = placeholderUsers;

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
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[150px] text-center">Data de Cadastro</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs">{user.id}</TableCell>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.perfil === 'Administrador' ? 'bg-primary/10 text-primary' : 
                          user.perfil === 'Operador' ? 'bg-accent/10 text-accent' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.perfil}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {new Date(user.dataCadastro).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild aria-label={`Editar usuário ${user.nome}`}>
                          <Link href={`/admin/usuarios/${user.id}/editar`}> {/* Placeholder link */}
                            <Edit3 className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id)}  // Placeholder action
                          aria-label={`Excluir usuário ${user.nome}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-2 hidden sm:inline">Excluir</span>
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
