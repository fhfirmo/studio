
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldCheck, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

interface SeguroSupabase {
  id_seguro: number;
  numero_apolice: string;
  vigencia_inicio: string;
  vigencia_fim: string;
  valor_indenizacao: number | null;
  Seguradoras: { nome_seguradora: string } | null;
  Veiculos: { placa_atual: string, marca?: string, modelo?: string } | null; // marca and modelo are now direct on Veiculos
  PessoasFisicas: { nome_completo: string } | null;
  Entidades: { nome: string } | null;
}

interface SeguroRow {
  id: number;
  numeroApolice: string;
  veiculoDesc: string | null;
  seguradoraNome: string | null;
  dataInicio: string;
  dataFim: string;
  valorIndenizacao: string | null; // Formatted currency
  titularNome: string | null;
}

export default function GerenciamentoSegurosPage() {
  const [seguros, setSeguros] = useState<SeguroRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [seguroToDelete, setSeguroToDelete] = useState<{ id: number; numeroApolice: string } | null>(null);
  const { toast } = useToast();

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchSeguros = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setSeguros([]); return;
    }
    setIsLoading(true);
    console.log(`GerenciamentoSegurosPage: Fetching Seguros. Search: "${searchTerm}"`);

    // Diagnostic: Check current user role via RPC
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
      if (roleError) {
        console.error("GerenciamentoSegurosPage: Erro ao chamar RPC get_user_role:", JSON.stringify(roleError, null, 2));
      } else {
        console.log("GerenciamentoSegurosPage: Papel do usuário:", roleData);
      }
    } catch (e: any) {
      console.error("GerenciamentoSegurosPage: Exceção ao chamar RPC get_user_role:", e.message);
    }
    
    let query = supabase
      .from('Seguros')
      .select(`
        id_seguro,
        numero_apolice,
        vigencia_inicio,
        vigencia_fim,
        valor_indenizacao,
        Seguradoras ( nome_seguradora ),
        Veiculos ( placa_atual, marca, modelo ), 
        PessoasFisicas!Seguros_id_titular_pessoa_fisica_fkey ( nome_completo ),
        Entidades!Seguros_id_titular_entidade_fkey ( nome )
      `)
      .order('numero_apolice', { ascending: true });

    if (searchTerm) {
      const LIKESearchTerm = `%${searchTerm}%`;
      query = query.or(
        `numero_apolice.ilike.${LIKESearchTerm},` +
        `Veiculos.placa_atual.ilike.${LIKESearchTerm}` 
        // Note: Searching on titular name would require a more complex query or a database view.
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar seguros:", JSON.stringify(error, null, 2), error);
      toast({ 
          title: "Erro ao Buscar Dados", 
          description: error.message || "Falha ao carregar seguros. Verifique as permissões (RLS) e a estrutura da consulta. Detalhes no console.", 
          variant: "destructive",
          duration: 10000 
      });
      setSeguros([]);
    } else {
      console.log("GerenciamentoSegurosPage: Dados brutos de seguros recebidos:", data);
      const formattedData: SeguroRow[] = (data || []).map((s: SeguroSupabase) => ({
        id: s.id_seguro,
        numeroApolice: s.numero_apolice,
        veiculoDesc: s.Veiculos ? `${s.Veiculos.placa_atual} (${s.Veiculos.marca || ''} ${s.Veiculos.modelo || ''})`.trim() : 'N/A',
        seguradoraNome: s.Seguradoras?.nome_seguradora || 'N/A',
        dataInicio: formatDateForDisplay(s.vigencia_inicio),
        dataFim: formatDateForDisplay(s.vigencia_fim),
        valorIndenizacao: formatCurrency(s.valor_indenizacao),
        titularNome: s.PessoasFisicas?.nome_completo || s.Entidades?.nome || 'N/A',
      }));
      console.log("GerenciamentoSegurosPage: Dados formatados para a tabela:", formattedData);
      setSeguros(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchSeguros();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchSeguros();
  };

  const handleDeleteClick = (seguro: SeguroRow) => {
    setSeguroToDelete({ id: seguro.id, numeroApolice: seguro.numeroApolice });
    setIsAlertOpen(true);
  };

  const confirmDeleteSeguro = async () => {
    if (!seguroToDelete || !supabase) return;
    
    setIsLoading(true); // Disable buttons during operation

    // It's often better to handle cascading deletes (SeguroCoberturas, SeguroAssistencias)
    // via database constraints (ON DELETE CASCADE) or an Edge Function for atomicity.
    // For client-side, we'll attempt to delete these first, then the main seguro.
    try {
      console.log(`Attempting to delete related SeguroCoberturas for id_seguro: ${seguroToDelete.id}`);
      const { error: coberturasError } = await supabase.from('SeguroCoberturas').delete().eq('id_seguro', seguroToDelete.id);
      if (coberturasError) console.warn("Erro ao deletar SeguroCoberturas (pode não existir):", JSON.stringify(coberturasError, null, 2));

      console.log(`Attempting to delete related SeguroAssistencias for id_seguro: ${seguroToDelete.id}`);
      const { error: assistenciasError } = await supabase.from('SeguroAssistencias').delete().eq('id_seguro', seguroToDelete.id);
      if (assistenciasError) console.warn("Erro ao deletar SeguroAssistencias (pode não existir):", JSON.stringify(assistenciasError, null, 2));

      console.log(`Attempting to delete Seguro ID: ${seguroToDelete.id}`);
      const { error } = await supabase
        .from('Seguros')
        .delete()
        .eq('id_seguro', seguroToDelete.id);

      if (error) {
        throw error; // This will be caught by the outer catch block
      }

      toast({ title: "Seguro Excluído!", description: `O seguro ${seguroToDelete.numeroApolice} foi excluído.` });
      fetchSeguros(); 
    
    } catch (error: any) {
        console.error('Falha ao excluir seguro:', JSON.stringify(error, null, 2));
        toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir o seguro. Verifique RLS e dependências.", variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsAlertOpen(false);
        setSeguroToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <ShieldCheck className="mr-3 h-8 w-8" /> Listagem de Seguros
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova seguros do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/seguros/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Seguro
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Seguros</CardTitle>
          <CardDescription>Filtre seguros por número da apólice ou placa do veículo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Nº Apólice ou Placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</> : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seguros Cadastrados</CardTitle>
          <CardDescription>
            Total de {seguros.length} seguros no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nº Apólice</TableHead>
                  <TableHead className="hidden md:table-cell">Titular</TableHead>
                  <TableHead className="hidden md:table-cell">Veículo</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Início Vig.</TableHead>
                  <TableHead>Fim Vig.</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Valor</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && seguros.length === 0 && !searchTerm ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />Carregando...</TableCell></TableRow>
                ) : !isLoading && seguros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? `Nenhum seguro encontrado para "${searchTerm}".` : "Nenhum seguro cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  seguros.map((seguro) => (
                    <TableRow key={seguro.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{seguro.id}</TableCell>
                      <TableCell className="font-semibold">{seguro.numeroApolice}</TableCell>
                      <TableCell className="hidden md:table-cell">{seguro.titularNome}</TableCell>
                      <TableCell className="hidden md:table-cell">{seguro.veiculoDesc}</TableCell>
                      <TableCell>{seguro.seguradoraNome}</TableCell>
                      <TableCell>{seguro.dataInicio}</TableCell>
                      <TableCell>{seguro.dataFim}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{seguro.valorIndenizacao}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do seguro ${seguro.numeroApolice}`}>
                           <Link href={`/admin/seguros/${seguro.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar seguro ${seguro.numeroApolice}`}>
                          <Link href={`/admin/seguros/${seguro.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(seguro)}
                          aria-label={`Excluir seguro ${seguro.numeroApolice}`}
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

      {seguroToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={(open) => {if (!isLoading) setIsAlertOpen(open)}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Seguro</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o seguro com apólice <strong>{seguroToDelete.numeroApolice}</strong> (ID: {seguroToDelete.id})? Esta ação é irreversível e também removerá as coberturas e assistências associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setSeguroToDelete(null); }} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSeguro} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</> : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Fetch from 'Seguros'.
        - JOINs/Nested Selects needed for:
          - 'Seguradoras' (for nome_seguradora)
          - 'Veiculos' (for placa_atual, marca, modelo) -> FK: Seguros.id_veiculo = Veiculos.id_veiculo
          - 'PessoasFisicas' (for nome_completo as titular) -> FK: Seguros.id_titular_pessoa_fisica = PessoasFisicas.id_pessoa_fisica
          - 'Entidades' (for nome as titular) -> FK: Seguros.id_titular_entidade = Entidades.id_entidade
        - Search: On numero_apolice (Seguros) and Veiculos.placa_atual.
        - Delete: Deletes from 'Seguros'. Ensure related 'SeguroCoberturas' and 'SeguroAssistencias' are handled (CASCADE or explicit deletes before main record).
        - RLS: Ensure user has SELECT permissions on all these tables and DELETE on Seguros (and related junction tables if explicit delete).
      */}
    </div>
  );
}
    
