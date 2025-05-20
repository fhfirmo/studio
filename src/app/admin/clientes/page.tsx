
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; 
import { UserPlus, Edit3, Trash2, Search, Info, Users, AlertTriangle, DownloadCloud } from "lucide-react";
import { ExportDataDialog } from '@/components/shared/ExportDataDialog'; 
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

interface PessoaFisica {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  tipoRelacao: string; // e.g., Associado, Cooperado, Funcionário, Cliente Geral
  organizacaoVinculada: string | null; // Name of the organization or null
  dataCadastro: string;
}

// Placeholder data - In a real app, this would come from Supabase from public.PessoasFisicas
const initialPessoasFisicas: PessoaFisica[] = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00", email: "joao.silva@example.com", telefone: "(11) 98888-7777", tipoRelacao: "Associado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2024-02-15" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99", email: "maria.costa@example.net", telefone: "(22) 97777-6666", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2024-04-05" },
  { id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", email: "carlos.lima@example.com", telefone: "(33) 96666-5555", tipoRelacao: "Cooperado", organizacaoVinculada: "Federação Beta", dataCadastro: "2024-01-10" },
  { id: "pf_004", nomeCompleto: "Ana Souza Almeida", cpf: "444.555.666-77", email: "ana.almeida@example.org", telefone: "(44) 95555-4444", tipoRelacao: "Funcionário", organizacaoVinculada: "INBM Matriz", dataCadastro: "2024-03-20" },
  { id: "pf_005", nomeCompleto: "Pedro Martins Rocha", cpf: "777.888.999-00", email: "pedro.rocha@example.com", telefone: "(55) 94444-3333", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2024-05-25" },
];


export default function GerenciamentoPessoasFisicasPage() {
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisica[]>(initialPessoasFisicas);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pessoaToDelete, setPessoaToDelete] = useState<{ id: string; nome: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, PessoasFisicas would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchPessoasFisicas() {
  //     // const { data, error } = await supabase.from('PessoasFisicas')
  //     // .select(`
  //     //   *,
  //     //   MembrosEntidade (
  //     //     Entidades ( nome_fantasia ),
  //     //     tipo_relacao 
  //     //   )
  //     // `); 
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar pessoas físicas."}) */ }
  //     // else { 
  //     //   const formattedData = data.map(pf => ({
  //     //      id: pf.id,
  //     //      nomeCompleto: pf.nome_completo,
  //     //      cpf: pf.cpf,
  //     //      email: pf.email_principal,
  //     //      telefone: pf.telefone_principal,
  //     //      tipoRelacao: pf.MembrosEntidade[0]?.tipo_relacao || 'Cliente Geral', // Adjust based on your data model
  //     //      organizacaoVinculada: pf.MembrosEntidade[0]?.Entidades?.nome_fantasia || null, // Adjust
  //     //      dataCadastro: pf.data_cadastro,
  //     //   }));
  //     //   setPessoasFisicas(formattedData || []); 
  //     // }
  //   }
  //   fetchPessoasFisicas();
  // }, []);

  // Placeholder for search logic - will query Supabase in a real app
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for: ${searchTerm} (placeholder - Supabase query needed for 'PessoasFisicas' table, potentially joining with MembrosEntidade and Entidades)`);
    // const filteredPessoas = initialPessoasFisicas.filter(pf => 
    //   pf.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   pf.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   pf.cpf.includes(searchTerm) ||
    //   (pf.organizacaoVinculada && pf.organizacaoVinculada.toLowerCase().includes(searchTerm.toLowerCase()))
    // );
    // setPessoasFisicas(filteredPessoas);
    // if (filteredPessoas.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontradas pessoas para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (pessoa: PessoaFisica) => {
    setPessoaToDelete({ id: pessoa.id, nome: pessoa.nomeCompleto });
    setIsAlertOpen(true);
  };

  const confirmDeletePessoa = async () => {
    if (!pessoaToDelete) return;
    
    console.log(`Attempting to delete Pessoa Física ID: ${pessoaToDelete.id}, Name: ${pessoaToDelete.nome}`);
    // Placeholder for Supabase API call to delete from PessoasFisicas table
    // try {
    //   // const { error } = await supabase.from('PessoasFisicas').delete().eq('id', pessoaToDelete.id);
    //   // if (error) throw error;
    //   setPessoasFisicas(prevPessoas => prevPessoas.filter(p => p.id !== pessoaToDelete.id));
    //   // toast({ title: "Pessoa Física Excluída!", description: `A pessoa ${pessoaToDelete.nome} foi excluída com sucesso.` });
    // } catch (error: any) {
    //   console.error('Failed to delete pessoa física:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir pessoa: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setPessoaToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setPessoasFisicas(prevPessoas => prevPessoas.filter(p => p.id !== pessoaToDelete!.id));
    console.log(`Pessoa Física ${pessoaToDelete.nome} (ID: ${pessoaToDelete.id}) deleted (simulated).`);
    // toast({ title: "Pessoa Física Excluída! (Simulado)", description: `A pessoa ${pessoaToDelete.nome} foi excluída com sucesso.` });
    setIsAlertOpen(false);
    setPessoaToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Users className="mr-3 h-8 w-8" /> Listagem de Pessoas Físicas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova pessoas físicas do sistema.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <ExportDataDialog dataTypeName="Pessoas Físicas" />
            <Button asChild>
              <Link href="/admin/clientes/novo"> {/* Link to client creation, will be refactored to PF creation */}
                <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Nova Pessoa Física
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Pessoas Físicas</CardTitle>
          <CardDescription>Filtre por nome, CPF ou organização vinculada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Nome, CPF ou Organização Vinculada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pessoas Físicas Cadastradas</CardTitle>
          <CardDescription>
            Total de {pessoasFisicas.length} pessoas físicas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden xl:table-cell">Tipo Relação</TableHead>
                  <TableHead className="hidden xl:table-cell">Organização Vinculada</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pessoasFisicas.length > 0 ? (
                  pessoasFisicas.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{pessoa.id}</TableCell>
                      <TableCell>{pessoa.nomeCompleto}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.cpf}</TableCell>
                      <TableCell className="hidden lg:table-cell">{pessoa.email}</TableCell>
                      <TableCell className="hidden lg:table-cell">{pessoa.telefone}</TableCell>
                      <TableCell className="hidden xl:table-cell">{pessoa.tipoRelacao}</TableCell>
                      <TableCell className="hidden xl:table-cell">{pessoa.organizacaoVinculada || "N/A"}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes de ${pessoa.nomeCompleto}`}>
                           <Link href={`/cliente/${pessoa.id}`}> {/* This link takes user to public client detail page */}
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar ${pessoa.nomeCompleto}`}>
                          <Link href={`/admin/clientes/${pessoa.id}/editar`}> {/* Link to client edit, will be refactored */}
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(pessoa)}
                          aria-label={`Excluir ${pessoa.nomeCompleto}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      Nenhuma pessoa física cadastrada no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pessoaToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Pessoa Física</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a pessoa física <strong>{pessoaToDelete.nome}</strong> (ID: {pessoaToDelete.id})? Esta ação é irreversível e todos os dados associados serão perdidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setPessoaToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePessoa} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Pessoa Física list will be fetched from public.PessoasFisicas.
        - To display 'Organização Vinculada' and 'Tipo Relação', a JOIN or nested query with public.MembrosEntidade 
          (which links PessoasFisicas.id_membro_entidade to MembrosEntidade.id) 
          and then public.Entidades (via MembrosEntidade.entidade_principal_id or entidade_membro_id to Entidades.id_entidade)
          will be needed to get Entidades.nome_fantasia. The MembrosEntidade table should also store the 'tipo_relacao'.
          If a PessoaFisica is not in MembrosEntidade or if MembrosEntidade.id_entidade_principal is null, 
          they might be a "Cliente Geral" or have no direct organization link.
        - Search functionality will query the PessoasFisicas table and potentially related tables for organization name.
        - "Cadastrar Nova Pessoa Física" button links to '/admin/clientes/novo' (this page will need refactoring).
        - "Detalhes" button links to `/cliente/[id]`.
        - "Editar" button links to '/admin/clientes/[id]/editar' (this page will need refactoring).
        - "Excluir" button will trigger a Supabase API call (DELETE request to 'PessoasFisicas' table).
        - Export functionality will call a Supabase endpoint/function to generate and download data.
      */}
    </div>
  );
}
