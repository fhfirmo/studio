
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldCheck, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
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
  Veiculos: { placa_atual: string, ModelosVeiculo: { nome_modelo: string } | null } | null;
  PessoasFisicas: { nome_completo: string } | null; // Titular PF
  Entidades: { nome: string } | null; // Titular PJ
}

interface SeguroRow {
  id: number; // Corresponds to id_seguro
  numeroApolice: string;
  veiculoDesc: string | null;
  seguradoraNome: string | null;
  dataInicio: string;
  dataFim: string;
  valorIndenizacao: number | null;
  titularNome: string | null;
}

const initialSeguros: SeguroRow[] = []; // Start empty

export default function GerenciamentoSegurosPage() {
  const [seguros, setSeguros] = useState<SeguroRow[]>(initialSeguros);
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

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fetchSeguros = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Supabase.", variant: "destructive" });
      setIsLoading(false); setSeguros([]); return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('Seguros')
      .select(`
        id_seguro,
        numero_apolice,
        vigencia_inicio,
        vigencia_fim,
        valor_indenizacao,
        Seguradoras ( nome_seguradora ),
        Veiculos ( placa_atual, ModelosVeiculo ( nome_modelo ) ),
        PessoasFisicas ( nome_completo ),
        Entidades ( nome )
      `)
      .order('numero_apolice', { ascending: true });

    if (searchTerm) {
      query = query.or(
        `numero_apolice.ilike.%${searchTerm}%,` +
        `Veiculos.placa_atual.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar seguros:", error);
      toast({ title: "Erro ao Buscar Dados", description: error.message, variant: "destructive" });
      setSeguros([]);
    } else {
      const formattedData: SeguroRow[] = data.map((s: SeguroSupabase) => ({
        id: s.id_seguro,
        numeroApolice: s.numero_apolice,
        veiculoDesc: s.Veiculos ? `${s.Veiculos.placa_atual} (${s.Veiculos.ModelosVeiculo?.nome_modelo || 'N/A'})` : 'N/A',
        seguradoraNome: s.Seguradoras?.nome_seguradora || 'N/A',
        dataInicio: formatDateForDisplay(s.vigencia_inicio),
        dataFim: formatDateForDisplay(s.vigencia_fim),
        valorIndenizacao: s.valor_indenizacao,
        titularNome: s.PessoasFisicas?.nome_completo || s.Entidades?.nome || 'N/A',
      }));
      setSeguros(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchSeguros();
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
    
    const { error } = await supabase
      .from('Seguros')
      .delete()
      .eq('id_seguro', seguroToDelete.id);

    if (error) {
      console.error('Falha ao excluir seguro:', error.message);
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir seguro: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Seguro Excluído!", description: `O seguro ${seguroToDelete.numeroApolice} foi excluído.` });
      fetchSeguros(); 
    }
    setIsAlertOpen(false);
    setSeguroToDelete(null);
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
              <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Buscar'}
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : seguros.length > 0 ? (
                  seguros.map((seguro) => (
                    <TableRow key={seguro.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{seguro.id}</TableCell>
                      <TableCell className="font-semibold">{seguro.numeroApolice}</TableCell>
                      <TableCell className="hidden md:table-cell">{seguro.titularNome}</TableCell>
                      <TableCell className="hidden md:table-cell">{seguro.veiculoDesc}</TableCell>
                      <TableCell>{seguro.seguradoraNome}</TableCell>
                      <TableCell>{seguro.dataInicio}</TableCell>
                      <TableCell>{seguro.dataFim}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{formatCurrency(seguro.valorIndenizacao)}</TableCell>
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
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                      Nenhum seguro cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {seguroToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Seguro</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o seguro com apólice <strong>{seguroToDelete.numeroApolice}</strong> (ID: {seguroToDelete.id})? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setSeguroToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSeguro} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    