
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon, Users, Loader2 } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface MembroEntidadeSupabase {
  id_membro_entidade: number;
  funcao_no_membro: string | null;
  data_associacao: string;
  tipo_membro: 'Pessoa Fisica' | 'Pessoa Juridica';
  id_entidade_pai: number;
  id_membro_pessoa_fisica: number | null;
  id_membro_entidade_juridica: number | null;
  EntidadePai?: { nome: string } | null;
  MembroPessoaFisica?: { nome_completo: string } | null;
  MembroEntidadeJuridica?: { nome: string } | null;
}

interface MembroOrganizacaoReportItem {
  idVinculo: string;
  nomeOrganizacaoPrincipal: string | null;
  nomeMembro: string | null;
  tipoMembro: 'Pessoa Física' | 'Pessoa Jurídica';
  funcaoMembro: string | null;
  dataAssociacao: string;
}

const tiposMembroOptions = [
  { value: "todos", label: "Todos" },
  { value: "Pessoa Fisica", label: "Pessoa Física" },
  { value: "Pessoa Juridica", label: "Pessoa Jurídica" },
];

const initialFilters = {
  organizacaoPrincipalId: 'todos',
  nomeMembro: '',
  tipoMembro: 'todos' as 'todos' | 'Pessoa Fisica' | 'Pessoa Juridica',
  funcaoMembro: '',
  dataAssociacaoInicio: undefined as Date | undefined,
  dataAssociacaoFim: undefined as Date | undefined,
};

export default function RelatorioMembrosOrganizacaoPage() {
  console.log("RelatorioMembrosOrganizacaoPage: Component Mounting");
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<MembroOrganizacaoReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [organizacaoPrincipalOptions, setOrganizacaoPrincipalOptions] = useState<{ value: string; label: string }[]>([{ value: "todos", label: "Todas" }]);

  useEffect(() => {
    console.log("RelatorioMembrosOrganizacaoPage: Initial useEffect triggered, calling applyFilters and fetchOrganizacaoOptions.");
    applyFilters();
    fetchOrganizacaoOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  const fetchOrganizacaoOptions = async () => {
    if (!supabase) return;
    console.log("RelatorioMembrosOrganizacaoPage: Fetching organizacaoPrincipalOptions.");
    const { data, error } = await supabase.from('Entidades').select('id_entidade, nome').order('nome');
    if (error) {
      toast({ title: "Erro ao buscar Organizações Principais", description: error.message, variant: "destructive" });
    } else if (data) {
      setOrganizacaoPrincipalOptions([{ value: "todos", label: "Todas" }, ...data.map(org => ({ value: org.id_entidade.toString(), label: org.nome }))]);
    }
  };

  const applyFilters = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setFilteredResults([]);
      return;
    }
    setIsLoading(true);
    console.log("RelatorioMembrosOrganizacaoPage: applyFilters called. Filters:", filters);

    try {
      let query = supabase
        .from('MembrosEntidade')
        .select(`
          id_membro_entidade,
          funcao_no_membro,
          data_associacao,
          tipo_membro,
          id_entidade_pai,
          id_membro_pessoa_fisica,
          id_membro_entidade_juridica,
          EntidadePai:Entidades!MembrosEntidade_id_entidade_pai_fkey ( nome ),
          MembroPessoaFisica:PessoasFisicas!MembrosEntidade_id_membro_pessoa_fisica_fkey ( nome_completo ),
          MembroEntidadeJuridica:Entidades!MembrosEntidade_id_membro_entidade_juridica_fkey ( nome )
        `);

      if (filters.organizacaoPrincipalId !== 'todos') query = query.eq('id_entidade_pai', parseInt(filters.organizacaoPrincipalId));
      if (filters.tipoMembro !== 'todos') query = query.eq('tipo_membro', filters.tipoMembro);
      if (filters.funcaoMembro) query = query.ilike('funcao_no_membro', `%${filters.funcaoMembro}%`);
      if (filters.dataAssociacaoInicio) query = query.gte('data_associacao', format(startOfDay(filters.dataAssociacaoInicio), 'yyyy-MM-dd'));
      if (filters.dataAssociacaoFim) query = query.lte('data_associacao', format(endOfDay(filters.dataAssociacaoFim), 'yyyy-MM-dd'));
      
      console.log("RelatorioMembrosOrganizacaoPage: Querying Supabase...");
      const { data, error } = await query;
      console.log("RelatorioMembrosOrganizacaoPage: Supabase response. Error:", error, "Data length:", data?.length);

      if (error) throw error;

      let mappedData = (data || []).map((m: MembroEntidadeSupabase): MembroOrganizacaoReportItem => ({
        idVinculo: m.id_membro_entidade.toString(),
        nomeOrganizacaoPrincipal: m.EntidadePai?.nome || null,
        nomeMembro: m.tipo_membro === 'Pessoa Fisica' ? m.MembroPessoaFisica?.nome_completo : m.MembroEntidadeJuridica?.nome,
        tipoMembro: m.tipo_membro === 'Pessoa Fisica' ? 'Pessoa Física' : 'Pessoa Jurídica', // Ensure consistent casing
        funcaoMembro: m.funcao_no_membro,
        dataAssociacao: m.data_associacao ? format(parseISO(m.data_associacao), 'dd/MM/yyyy') : 'N/A',
      }));

      if (filters.nomeMembro) {
        mappedData = mappedData.filter(item => item.nomeMembro?.toLowerCase().includes(filters.nomeMembro.toLowerCase()));
      }
      
      console.log("RelatorioMembrosOrganizacaoPage: Setting filteredResults with", mappedData.length, "items.");
      setFilteredResults(mappedData);

    } catch (error: any) {
      console.error("RelatorioMembrosOrganizacaoPage: Erro ao aplicar filtros/buscar dados:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Falha ao carregar relatório.", variant: "destructive" });
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectFilterChange = (name: keyof typeof initialFilters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value as any }));
  };
  
  const handleDateFilterChange = (name: keyof typeof initialFilters, date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  const clearFilters = () => { 
    setFilters(initialFilters); 
    applyFilters();
  };
  
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const handleExportExcel = () => { console.log("Exporting Membros por Organização to Excel (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (Excel)"}) };
  const handleExportPDF = () => { console.log("Exporting Membros por Organização to PDF (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (PDF)"}) };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <Users className="mr-3 h-8 w-8" /> Relatório de Membros por Organização
            </h1>
            <Button variant="outline" size="sm" asChild>
                <Link href="/admin/relatorios"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
            </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader><CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" /> Filtros</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <Label htmlFor="organizacaoPrincipalId">Organização Principal</Label>
                <Select name="organizacaoPrincipalId" value={filters.organizacaoPrincipalId} onValueChange={(v) => handleSelectFilterChange('organizacaoPrincipalId', v)}>
                  <SelectTrigger id="organizacaoPrincipalId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{organizacaoPrincipalOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="nomeMembro">Nome do Membro</Label><Input id="nomeMembro" name="nomeMembro" value={filters.nomeMembro} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="tipoMembro">Tipo de Membro</Label>
                <Select name="tipoMembro" value={filters.tipoMembro} onValueChange={(v) => handleSelectFilterChange('tipoMembro', v as any)}>
                  <SelectTrigger id="tipoMembro"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tiposMembroOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="funcaoMembro">Função do Membro</Label><Input id="funcaoMembro" name="funcaoMembro" value={filters.funcaoMembro} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="dataAssociacaoInicio">Data Associação (Início)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataAssociacaoInicio ? format(filters.dataAssociacaoInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataAssociacaoInicio} onSelect={(d) => handleDateFilterChange('dataAssociacaoInicio', d)} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="dataAssociacaoFim">Data Associação (Fim)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataAssociacaoFim ? format(filters.dataAssociacaoFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataAssociacaoFim} onSelect={(d) => handleDateFilterChange('dataAssociacaoFim', d)} disabled={(date) => filters.dataAssociacaoInicio ? date < filters.dataAssociacaoInicio : false} /></PopoverContent></Popover>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={clearFilters} disabled={isLoading}><XSquare className="mr-2 h-4 w-4"/> Limpar</Button>
              <Button type="submit" disabled={isLoading}><Filter className="mr-2 h-4 w-4"/> {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Aplicando...</> : "Aplicar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardDescription>Total de {filteredResults.length} Vínculos.</CardDescription>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || filteredResults.length === 0}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || filteredResults.length === 0}><FileTextIcon className="mr-2 h-4 w-4" /> PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID Vínculo</TableHead>
                  <TableHead>Organização Principal</TableHead>
                  <TableHead>Nome do Membro</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Membro</TableHead>
                  <TableHead className="hidden md:table-cell">Função</TableHead>
                  <TableHead className="hidden lg:table-cell">Data Associação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="inline-block mr-2 h-6 w-6 animate-spin"/>Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((m) => (
                    <TableRow key={m.idVinculo}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{m.idVinculo}</TableCell>
                      <TableCell>{m.nomeOrganizacaoPrincipal || "N/A"}</TableCell>
                      <TableCell>{m.nomeMembro || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.tipoMembro}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.funcaoMembro || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{m.dataAssociacao}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum vínculo encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
