
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger as it's not used directly when opening programmatically
import { UserPlus, Edit3, Trash2, Search, Info, Users, AlertTriangle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

// Placeholder data - In a real app, this would come from Supabase
const initialClients = [
  { id: "cli_001", nomeCompleto: "Empresa Alfa Ltda", email: "contato@alfa.com", cpfCnpj: "11.222.333/0001-44", dataCadastro: "2024-01-10" },
  { id: "cli_002", nomeCompleto: "João da Silva Sauro", email: "joao.silva@example.com", cpfCnpj: "123.456.789-00", dataCadastro: "2024-02-15" },
  { id: "cli_003", nomeCompleto: "Consultoria Beta S.A.", email: "financeiro@beta.com", cpfCnpj: "44.555.666/0001-77", dataCadastro: "2024-03-20" },
  { id: "cli_004", nomeCompleto: "Maria Oliveira Costa", email: "maria.costa@example.net", cpfCnpj: "987.654.321-99", dataCadastro: "2024-04-05" },
  { id: "cli_005", nomeCompleto: "Serviços Gama MEI", email: "servicos@gama.me", cpfCnpj: "77.888.999/0001-00", dataCadastro: "2024-05-25" },
];

interface Client {
  id: string;
  nomeCompleto: string;
  email: string;
  cpfCnpj: string; // Combined field for CPF or CNPJ
  dataCadastro: string;
}

export default function GerenciamentoClientesPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; nome: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, clients would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchClients() {
  //     // const { data, error } = await supabase.from('clientes').select('*'); // Replace 'clientes' with your table name
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar clientes."}) */ }
  //     // else { setClients(data || []); }
  //   }
  //   fetchClients();
  // }, []);

  // Placeholder for search logic - will query Supabase in a real app
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for: ${searchTerm} (placeholder - Supabase query needed for 'clientes' table)`);
    // const filteredClients = initialClients.filter(client => 
    //   client.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   client.cpfCnpj.includes(searchTerm)
    // );
    // setClients(filteredClients);
    // if (filteredClients.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontrados clientes para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete({ id: client.id, nome: client.nomeCompleto });
    setIsAlertOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    
    console.log(`Attempting to delete client ID: ${clientToDelete.id}, Name: ${clientToDelete.nome}`);
    // Placeholder for Supabase API call to delete client
    // try {
    //   // const { error } = await supabase.from('clientes').delete().eq('id', clientToDelete.id); // Replace 'clientes'
    //   // if (error) throw error;
    //   setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
    //   // toast({ title: "Cliente Excluído!", description: `O cliente ${clientToDelete.nome} foi excluído com sucesso.` });
    // } catch (error: any) {
    //   console.error('Failed to delete client:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir cliente: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setClientToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete!.id));
    console.log(`Client ${clientToDelete.nome} (ID: ${clientToDelete.id}) deleted (simulated).`);
    // toast({ title: "Cliente Excluído! (Simulado)", description: `O cliente ${clientToDelete.nome} foi excluído com sucesso.` });
    setIsAlertOpen(false);
    setClientToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Users className="mr-3 h-8 w-8" /> Listagem de Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova clientes do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/clientes/novo">
              <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Novo Cliente
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Clientes</CardTitle>
          <CardDescription>Filtre clientes por nome, e-mail, CPF/CNPJ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Digite para pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
            {/* Placeholder for more advanced filter button */}
            {/* <Button variant="outline">
              <ListFilter className="mr-2 h-4 w-4" /> Filtros Avançados
            </Button> */}
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>
            Total de {clients.length} clientes no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">CPF/CNPJ</TableHead>
                  <TableHead className="w-[150px] text-center hidden lg:table-cell">Data de Cadastro</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{client.id}</TableCell>
                      <TableCell>{client.nomeCompleto}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                      <TableCell className="hidden lg:table-cell">{client.cpfCnpj}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(client.dataCadastro).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do cliente ${client.nomeCompleto}`}>
                           <Link href={`/cliente/${client.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar cliente ${client.nomeCompleto}`}>
                          <Link href={`/admin/clientes/${client.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(client)}
                          aria-label={`Excluir cliente ${client.nomeCompleto}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhum cliente cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Add pagination controls here in the future if needed */}
        </CardContent>
      </Card>

      {clientToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Cliente</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o cliente <strong>{clientToDelete.nome}</strong> (ID: {clientToDelete.id})? Esta ação é irreversível e todos os dados associados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setClientToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteClient} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Client list will be fetched from a Supabase table (e.g., 'clientes') using Supabase API calls.
        - Search functionality will query the Supabase 'clientes' table.
        - "Cadastrar Novo Cliente" button links to '/admin/clientes/novo'.
        - The "Detalhes" button in the Ações column dynamically links to `/cliente/[id]`, passing the client's ID.
          The `/cliente/[id]` page is set up to receive this ID and fetch/display detailed client information from Supabase.
        - "Editar" button will link to '/admin/clientes/[id]/editar', dynamically passing the client's ID.
        - "Excluir" button will trigger a Supabase API call (e.g., DELETE request to 'clientes' table using the client's ID) 
          after user confirmation via the modal. The list should be re-fetched or updated locally upon successful deletion.
      */}
    </div>
  );
}

      