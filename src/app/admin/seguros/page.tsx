
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Removed RadioGroup import as it's not used for filters here.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldCheck, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

interface GenericOption { value: string; label: string; }

interface SeguroSupabase {
  id_seguro: number;
  numero_apolice: string;
  vigencia_inicio: string;
  vigencia_fim: string;
  valor_indenizacao: number | null;
  id_seguradora: number;
  id_titular_pessoa_fisica: number | null;
  id_titular_entidade: number | null;
  Seguradoras: { nome_seguradora: string } | null;
  Veiculos: { placa_atual: string, marca?: string | null, modelo?: string | null } | null; // marca and modelo are direct from Veiculos
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
  valorIndenizacao: string | null;
  titularNome: string | null;
}

const initialFilters = {
  searchTerm: '',
  idSeguradora: 'todos',
  tipoTitular: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  idTitular: '',
};

export default function GerenciamentoSegurosPage() {
  const [seguros, setSeguros] = useState<SeguroRow[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [seguroToDelete, setSeguroToDelete] = useState<{ id: number; numeroApolice: string } | null>(null);
  
  const [seguradoraOptions, setSeguradoraOptions] = useState<GenericOption[]>([]);
  const [titularPessoaFisicaOptions, setTitularPessoaFisicaOptions] = useState<GenericOption[]>([]);
  const [titularOrganizacaoOptions, setTitularOrganizacaoOptions] = useState<GenericOption[]>([]);
  const [currentTitularOptions, setCurrentTitularOptions] = useState<GenericOption[]>([]);

  const [isLoadingSeguradoras, setIsLoadingSeguradoras] = useState(false);
  const [isLoadingTitularesPF, setIsLoadingTitularesPF] = useState(false);
  const [isLoadingTitularesOrg, setIsLoadingTitularesOrg] = useState(false);

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

  const fetchDropdownOptions = async () => {
    if (!supabase) return;
    console.log("GerenciamentoSegurosPage: Fetching dropdown options.");
    setIsLoadingSeguradoras(true);
    supabase.from('Seguradoras').select('id_seguradora, nome_seguradora').order('nome_seguradora')
      .then(({ data, error }) => {
        if (error) toast({ title: "Erro ao buscar Seguradoras", description: error.message, variant: "destructive" });
        else setSeguradoraOptions([{ value: 'todos', label: 'Todas Seguradoras' }, ...(data || []).map(s => ({ value: s.id_seguradora.toString(), label: s.nome_seguradora }))]);
        setIsLoadingSeguradoras(false);
      });

    setIsLoadingTitularesPF(true);
    supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo').order('nome_completo')
      .then(({ data, error }) => {
        if (error) toast({ title: "Erro ao buscar Pessoas Físicas", description: error.message, variant: "destructive" });
        else setTitularPessoaFisicaOptions((data || []).map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: pf.nome_completo })));
        setIsLoadingTitularesPF(false);
      });
    
    setIsLoadingTitularesOrg(true);
    supabase.from('Entidades').select('id_entidade, nome').order('nome')
      .then(({ data, error }) => {
        if (error) toast({ title: "Erro ao buscar Organizações", description: error.message, variant: "destructive" });
        else setTitularOrganizacaoOptions((data || []).map(org => ({ value: org.id_entidade.toString(), label: org.nome })));
        setIsLoadingTitularesOrg(false);
      });
  };

  useEffect(() => {
    fetchDropdownOptions();
    fetchSeguros();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Effect to update currentTitularOptions based on filters.tipoTitular
  useEffect(() => {
    console.log("GerenciamentoSegurosPage: Effect for currentTitularOptions. filters.tipoTitular:", filters.tipoTitular);
    if (filters.tipoTitular === 'pessoa_fisica') {
      setCurrentTitularOptions(titularPessoaFisicaOptions);
    } else if (filters.tipoTitular === 'organizacao') {
      setCurrentTitularOptions(titularOrganizacaoOptions);
    } else { // 'todos' or empty
      setCurrentTitularOptions([]);
    }
  }, [filters.tipoTitular, titularPessoaFisicaOptions, titularOrganizacaoOptions]);


  const fetchSeguros = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setSeguros([]); return;
    }
    setIsLoading(true);
    console.log(`GerenciamentoSegurosPage: Fetching Seguros. Filters:`, filters);
    
    try {
      let query = supabase
        .from('Seguros')
        .select(`
          id_seguro,
          numero_apolice,
          vigencia_inicio,
          vigencia_fim,
          valor_indenizacao,
          id_seguradora,
          id_titular_pessoa_fisica,
          id_titular_entidade,
          Seguradoras ( nome_seguradora ),
          Veiculos ( placa_atual, marca, modelo ), 
          PessoasFisicas!Seguros_id_titular_pessoa_fisica_fkey ( nome_completo ),
          Entidades!Seguros_id_titular_entidade_fkey ( nome )
        `)
        .order('numero_apolice', { ascending: true });

      if (filters.searchTerm) {
        const LIKESearchTerm = `%${filters.searchTerm}%`;
        query = query.or(
          `numero_apolice.ilike.${LIKESearchTerm},` +
          `Veiculos.placa_atual.ilike.${LIKESearchTerm}` 
        );
      }

      if (filters.idSeguradora !== 'todos') {
        query = query.eq('id_seguradora', parseInt(filters.idSeguradora));
      }

      if (filters.tipoTitular === 'pessoa_fisica' && filters.idTitular) {
        query = query.eq('id_titular_pessoa_fisica', parseInt(filters.idTitular));
      } else if (filters.tipoTitular === 'organizacao' && filters.idTitular) {
        query = query.eq('id_titular_entidade', parseInt(filters.idTitular));
      } else if (filters.tipoTitular === 'pessoa_fisica' && !filters.idTitular) {
        query = query.not('id_titular_pessoa_fisica', 'is', null);
      } else if (filters.tipoTitular === 'organizacao' && !filters.idTitular) {
        query = query.not('id_titular_entidade', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

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
      setSeguros(formattedData);
    } catch (error: any) {
      console.error("Erro ao buscar seguros:", JSON.stringify(error, null, 2), error);
      toast({ 
          title: "Erro ao Buscar Dados", 
          description: error.message || "Falha ao carregar seguros. Verifique as permissões (RLS) e a estrutura da consulta. Detalhes no console.", 
          variant: "destructive",
          duration: 10000 
      });
      setSeguros([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectFilterChange = (name: keyof typeof initialFilters, value: string) => {
    setFilters(prevFiltros => {
      const newFilters = { ...prevFiltros, [name]: value };
      if (name === 'tipoTitular') {
        console.log("GerenciamentoSegurosPage: tipoTitular changed, resetting idTitular.");
        newFilters.idTitular = ''; // Reset idTitular when tipoTitular changes
      }
      return newFilters;
    });
  };

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
    
    setIsLoading(true);
    try {
      // It's safer to rely on DB cascade deletes or handle this in an Edge Function.
      // For now, attempting client-side sequential delete for related tables.
      const { error: coberturasError } = await supabase.from('SeguroCoberturas').delete().eq('id_seguro', seguroToDelete.id);
      if (coberturasError) console.warn("Erro ao deletar SeguroCoberturas:", JSON.stringify(coberturasError, null, 2));

      const { error: assistenciasError } = await supabase.from('SeguroAssistencias').delete().eq('id_seguro', seguroToDelete.id);
      if (assistenciasError) console.warn("Erro ao deletar SeguroAssistencias:", JSON.stringify(assistenciasError, null, 2));

      const { error } = await supabase.from('Seguros').delete().eq('id_seguro', seguroToDelete.id);
      if (error) throw error;

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
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar e Filtrar Seguros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="searchTerm">Nº Apólice / Placa Veículo</Label>
                <Input
                  id="searchTerm"
                  name="searchTerm"
                  placeholder="Pesquisar..."
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="idSeguradora">Seguradora</Label>
                <Select 
                  name="idSeguradora" 
                  value={filters.idSeguradora} 
                  onValueChange={(v) => handleSelectFilterChange('idSeguradora', v)}
                  disabled={isLoading || isLoadingSeguradoras}
                >
                  <SelectTrigger id="idSeguradora">
                    <SelectValue placeholder={isLoadingSeguradoras ? "Carregando..." : "Todas Seguradoras"} />
                  </SelectTrigger>
                  <SelectContent>
                    {seguradoraOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="tipoTitular">Tipo de Titular</Label>
                <Select 
                  name="tipoTitular" 
                  value={filters.tipoTitular} 
                  onValueChange={(v) => handleSelectFilterChange('tipoTitular', v as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="tipoTitular">
                    <SelectValue placeholder="Todos os Tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                    <SelectItem value="organizacao">Organização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filters.tipoTitular !== 'todos' && (
                <div className="space-y-1">
                  <Label htmlFor="idTitular">Nome do Titular</Label>
                  <Select 
                    name="idTitular" 
                    value={filters.idTitular} 
                    onValueChange={(v) => handleSelectFilterChange('idTitular', v)}
                    disabled={isLoading || (filters.tipoTitular === 'pessoa_fisica' && isLoadingTitularesPF) || (filters.tipoTitular === 'organizacao' && isLoadingTitularesOrg) || currentTitularOptions.length === 0}
                  >
                    <SelectTrigger id="idTitular">
                      <SelectValue placeholder={
                        (filters.tipoTitular === 'pessoa_fisica' && isLoadingTitularesPF) || (filters.tipoTitular === 'organizacao' && isLoadingTitularesOrg) 
                        ? "Carregando..." 
                        : currentTitularOptions.length === 0 ? "Nenhum titular disponível" : "Selecione o Titular"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {currentTitularOptions.length > 0 ? 
                        currentTitularOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)
                        : <SelectItem value="" disabled>Nenhuma opção</SelectItem>
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" /> {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</> : 'Buscar'}
              </Button>
            </div>
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
                {isLoading && seguros.length === 0 && !filters.searchTerm ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />Carregando...</TableCell></TableRow>
                ) : !isLoading && seguros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                      {filters.searchTerm || filters.idSeguradora !== 'todos' || filters.idTitular ? `Nenhum seguro encontrado para os filtros aplicados.` : "Nenhum seguro cadastrado."}
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
    </div>
  );
}
    

    