
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { format, parseISO, isValid } from 'date-fns';

interface PessoaFisicaSupabase {
  id_pessoa_fisica: number;
  nome_completo: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipo_relacao: string | null; // Assuming this column exists in PessoasFisicas
  MembrosEntidade?: { Entidades: { nome_fantasia: string } | null }[] | null;
  data_cadastro: string;
}

interface PessoaFisicaRow {
  id: number; // Corresponds to id_pessoa_fisica
  nomeCompleto: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipoRelacao: string | null;
  organizacaoVinculada: string | null;
  dataCadastro: string;
}

const initialPessoasFisicasData: PessoaFisicaRow[] = [
  { id: 1, nomeCompleto: "Carregando...", cpf: "...", email: "...", telefone: "...", tipoRelacao: "...", organizacaoVinculada: "...", dataCadastro: new Date().toISOString() },
];


export default function GerenciamentoPessoasFisicasPage() {
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisicaRow[]>(initialPessoasFisicasData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pessoaToDelete, setPessoaToDelete] = useState<{ id: number; nome: string } | null>(null);
  const { toast } = useToast();

  const fetchPessoasFisicas = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Supabase.", variant: "destructive" });
      setIsLoading(false);
      setPessoasFisicas([]);
      return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('PessoasFisicas')
      .select(`
        id_pessoa_fisica,
        nome_completo,
        cpf,
        email,
        telefone,
        tipo_relacao, 
        data_cadastro,
        MembrosEntidade!left ( 
          Entidades!inner (
            nome_fantasia
          )
        )
      `)
      .order('nome_completo', { ascending: true });

    if (searchTerm) {
      query = query.or(`nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
      // Add organization search if needed, might require a more complex query or view
      // Example: .ilike('MembrosEntidade.Entidades.nome_fantasia', `%${searchTerm}%`) - this is tricky with array results from join
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar pessoas físicas:", error);
      toast({ title: "Erro ao Buscar Dados", description: error.message, variant: "destructive" });
      setPessoasFisicas([]);
    } else {
      const formattedData: PessoaFisicaRow[] = data.map((pf: PessoaFisicaSupabase) => ({
        id: pf.id_pessoa_fisica,
        nomeCompleto: pf.nome_completo,
        cpf: pf.cpf,
        email: pf.email,
        telefone: pf.telefone,
        tipoRelacao: pf.tipo_relacao,
        organizacaoVinculada: pf.MembrosEntidade && pf.MembrosEntidade.length > 0 && pf.MembrosEntidade[0].Entidades ? pf.MembrosEntidade[0].Entidades.nome_fantasia : null,
        dataCadastro: pf.data_cadastro,
      }));
      setPessoasFisicas(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchPessoasFisicas();
  }, []); // Initial fetch

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    fetchPessoasFisicas(); // Re-fetch with current searchTerm
  };

  const handleDeleteClick = (pessoa: PessoaFisicaRow) => {
    setPessoaToDelete({ id: pessoa.id, nome: pessoa.nomeCompleto });
    setIsAlertOpen(true);
  };

  const confirmDeletePessoa = async () => {
    if (!pessoaToDelete || !supabase) return;
    
    console.log(`Attempting to delete Pessoa Física ID: ${pessoaToDelete.id}, Name: ${pessoaToDelete.nome}`);
    const { error } = await supabase
      .from('PessoasFisicas')
      .delete()
      .eq('id_pessoa_fisica', pessoaToDelete.id);

    if (error) {
      console.error('Failed to delete pessoa física:', error.message);
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir pessoa: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Pessoa Física Excluída!", description: `A pessoa ${pessoaToDelete.nome} foi excluída com sucesso.` });
      fetchPessoasFisicas(); // Refresh the list
    }
    setIsAlertOpen(false);
    setPessoaToDelete(null);
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        if (isValid(date)) {
            return format(date, "dd/MM/yyyy");
        }
        return "Data inválida";
    } catch (e) {
        return "Data inválida";
    }
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
            <ExportDataDialog 
              dataTypeName="Pessoas Físicas" 
              exportableFields={[
                { id: 'nomeCompleto', label: 'Nome Completo'},
                { id: 'cpf', label: 'CPF'},
                { id: 'email', label: 'Email'},
                { id: 'telefone', label: 'Telefone'},
                { id: 'tipoRelacao', label: 'Tipo de Relação'},
                { id: 'organizacaoVinculada', label: 'Organização Vinculada'},
                { id: 'dataCadastro', label: 'Data de Cadastro'},
              ]}
            />
            <Button asChild>
              <Link href="/admin/clientes/novo">
                <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Nova Pessoa Física
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Pessoas Físicas</CardTitle>
          <CardDescription>Filtre por Nome, CPF ou Organização Vinculada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Nome Completo ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Buscar'}
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
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Relação</TableHead>
                  <TableHead className="hidden md:table-cell">Organização Vinculada</TableHead>
                  <TableHead className="hidden lg:table-cell">Data Cadastro</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : pessoasFisicas.length > 0 ? (
                  pessoasFisicas.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{pessoa.id}</TableCell>
                      <TableCell>{pessoa.nomeCompleto}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.cpf}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.email || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.telefone || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.tipoRelacao || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.organizacaoVinculada || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDateForDisplay(pessoa.dataCadastro)}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes de ${pessoa.nomeCompleto}`}>
                           <Link href={`/cliente/${pessoa.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar ${pessoa.nomeCompleto}`}>
                          <Link href={`/admin/clientes/${pessoa.id}/editar`}>
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
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
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
        - Pessoa Física list will be fetched from public."PessoasFisicas".
        - To display 'Organização Vinculada':
          - The query will need to join with 'public.MembrosEntidade' on 'PessoasFisicas.id_pessoa_fisica' = 'MembrosEntidade.id_membro_pessoa_fisica'
            and then join 'public.MembrosEntidade' with 'public.Entidades' on 'MembrosEntidade.id_entidade_pai' = 'Entidades.id_entidade'
            to get 'Entidades.nome_fantasia'. This assumes the link is from PessoaFisica as a member TO an EntidadePai.
          - If a 'tipo_relacao' implies an organization but isn't 'Cliente Geral', and no link exists in MembrosEntidade, special handling might be needed.
          - A 'tipo_relacao' column is assumed to exist on PessoasFisicas table.
        - Search functionality will query the PessoasFisicas table and potentially related tables for organization name.
        - "Cadastrar Nova Pessoa Física" button links to '/admin/clientes/novo'.
        - "Detalhes" button links to `/cliente/[id]` (public-facing detail page).
        - "Editar" button links to '/admin/clientes/[id_pessoa_fisica]/editar'.
        - "Excluir" button will trigger a Supabase API call (DELETE request to 'PessoasFisicas' table).
      */}
    </div>
  );
}

    