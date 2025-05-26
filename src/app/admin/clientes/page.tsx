
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

// Interface for data fetched from Supabase for PessoasFisicas, including related Entidade name
interface PessoaFisicaSupabase {
  id_pessoa_fisica: number;
  nome_completo: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipo_relacao: string | null; 
  data_cadastro: string;
  MembrosEntidade?: { 
    "Entidades!MembrosEntidade_id_entidade_pai_fkey": { nome: string } | null 
  }[] | null; 
}

// Interface for data displayed in the table row
interface PessoaFisicaRow {
  id: number; 
  nomeCompleto: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipoRelacao: string | null;
  organizacaoVinculada: string | null; 
  dataCadastro: string;
}

export default function GerenciamentoPessoasFisicasPage() {
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisicaRow[]>([]);
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
    console.log("GerenciamentoPessoasFisicasPage: Fetching PessoasFisicas, search:", searchTerm);
    
    // Diagnostic: Check current user role via RPC
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
      if (roleError) {
        console.error("Erro ao chamar RPC get_user_role ANTES da query principal:", JSON.stringify(roleError, null, 2));
        toast({ title: "Erro de Diagnóstico de Role", description: `Falha ao verificar papel do usuário: ${roleError.message || 'Erro desconhecido na RPC.'}`, variant: "destructive", duration: 7000 });
      } else {
        console.log("Papel do usuário (antes da query de PessoasFisicas):", roleData);
        if (!roleData) {
          console.warn("Papel do usuário retornado pela RPC é NULO. A query principal pode falhar devido a RLS.");
        }
      }
    } catch (e: any) {
      console.error("Exceção ao chamar RPC get_user_role:", e.message);
      toast({ title: "Exceção Diagnóstico Role", description: e.message, variant: "destructive" });
    }

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
          Entidades!MembrosEntidade_id_entidade_pai_fkey ( 
            nome 
          )
        )
      `)
      .order('nome_completo', { ascending: true });

    if (searchTerm) {
      query = query.or(`nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      const errorMessage = (error && error.message) ? error.message : "Falha ao carregar dados. Verifique as permissões (RLS) e a estrutura da consulta. Detalhes no console.";
      console.error("Erro ao buscar pessoas físicas:", JSON.stringify(error, null, 2), error); 
      toast({ 
        title: "Erro ao Buscar Dados", 
        description: errorMessage, 
        variant: "destructive",
        duration: 10000 
      });
      setPessoasFisicas([]);
    } else {
      const formattedData: PessoaFisicaRow[] = (data || []).map((pf: PessoaFisicaSupabase) => ({
        id: pf.id_pessoa_fisica,
        nomeCompleto: pf.nome_completo,
        cpf: pf.cpf,
        email: pf.email,
        telefone: pf.telefone,
        tipoRelacao: pf.tipo_relacao,
        organizacaoVinculada: pf.MembrosEntidade && pf.MembrosEntidade.length > 0 && pf.MembrosEntidade[0]["Entidades!MembrosEntidade_id_entidade_pai_fkey"] ? pf.MembrosEntidade[0]["Entidades!MembrosEntidade_id_entidade_pai_fkey"].nome : null,
        dataCadastro: pf.data_cadastro,
      }));
      setPessoasFisicas(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchPessoasFisicas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchPessoasFisicas(); 
  };

  const handleDeleteClick = (pessoa: PessoaFisicaRow) => {
    setPessoaToDelete({ id: pessoa.id, nome: pessoa.nomeCompleto });
    setIsAlertOpen(true);
  };

  const confirmDeletePessoa = async () => {
    if (!pessoaToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log(`Attempting to delete Pessoa Física ID: ${pessoaToDelete.id}, Name: ${pessoaToDelete.nome}`);
    
    const { error } = await supabase
      .from('PessoasFisicas')
      .delete()
      .eq('id_pessoa_fisica', pessoaToDelete.id);

    if (error) {
      console.error('Failed to delete pessoa física:', JSON.stringify(error, null, 2), error);
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir pessoa. Verifique as permissões (RLS) e dependências.", variant: "destructive" });
    } else {
      toast({ title: "Pessoa Física Excluída!", description: `A pessoa ${pessoaToDelete.nome} foi excluída com sucesso.` });
      fetchPessoasFisicas(); 
    }
    setIsLoading(false);
    setIsAlertOpen(false);
    setPessoaToDelete(null);
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        if (isValid(date)) {
            if (dateString.length === 10) { // YYYY-MM-DD
                 return format(date, "dd/MM/yyyy");
            }
            return format(date, "dd/MM/yyyy HH:mm"); // Full timestamp
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
                { id: 'id', label: 'ID'},
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
          <CardDescription>Filtre por Nome Completo ou CPF.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Nome Completo ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isLoading}
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
                {isLoading && pessoasFisicas.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : !isLoading && pessoasFisicas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? `Nenhuma pessoa física encontrada para "${searchTerm}".` : "Nenhuma pessoa física cadastrada."}
                    </TableCell>
                  </TableRow>
                ) : (
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
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
              <AlertDialogAction onClick={confirmDeletePessoa} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
  
// Supabase Integration RLS Notes:
// - SELECT on public."PessoasFisicas":
//   - Admins/Supervisors/Operators should be able to read all (or based on their scope if applicable).
//   - RLS policies must allow access to 'id_pessoa_fisica', 'nome_completo', 'cpf', 'email', 'telefone', 'tipo_relacao', 'data_cadastro'.
// - SELECT on public."MembrosEntidade" and public."Entidades":
//   - The user performing the query needs SELECT permission on these tables as well for the JOIN to work.
//   - Specifically, on "Entidades", access to the 'nome' column is required.
// - DELETE on public."PessoasFisicas":
//   - The user role must have DELETE permission on "PessoasFisicas" table.
//   - Consider ON DELETE CASCADE for related data in CNHs, MembrosEntidade, Veiculos (proprietario_pessoa_fisica), Seguros (titular_pessoa_fisica), Arquivos (pessoa_fisica_associada)
//     or handle these deletions explicitly if cascade is not set.
// - Ensure `public.get_user_role()` function correctly returns the role of the currently authenticated user.
// - If any of these RLS are not met, the query may return empty data or an error (sometimes an empty error object {} if permissions are restrictive).
```