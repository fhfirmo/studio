
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon, Loader2 } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface SeguroSupabase {
  id_seguro: number;
  numero_apolice: string;
  vigencia_inicio: string;
  vigencia_fim: string;
  valor_indenizacao: number | null;
  id_seguradora: number;
  id_titular_pessoa_fisica: number | null;
  id_titular_entidade: number | null;
  id_veiculo: number | null;
  Seguradoras?: { nome_seguradora: string } | null;
  Veiculos?: { placa_atual: string } | null; 
  PessoasFisicas?: { nome_completo: string } | null; 
  Entidades?: { nome: string } | null;
}

interface SeguroReportItem {
  id: string;
  numeroApolice: string;
  seguradoraNome: string | null;
  vigenciaInicio: string;
  vigenciaFim: string;
  valorIndenizacao: number | null;
  nomeTitular: string | null;
  tipoTitular: 'Pessoa Física' | 'Organização' | 'N/A';
  veiculoAssociadoPlaca: string | null;
}

const initialFilters = {
  numeroApolice: '',
  seguradoraId: 'todos',
  vigenciaInicio: undefined as Date | undefined,
  vigenciaFim: undefined as Date | undefined,
  valorIndenizacaoMin: '',
  valorIndenizacaoMax: '',
  tipoTitular: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  nomeTitularId: '',
  veiculoId: 'todos',
};

export default function RelatorioSegurosPage() {
  console.log("RelatorioSegurosPage: Component Mounting");
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<SeguroReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [seguradoraOptions, setSeguradoraOptions] = useState<{value: string, label: string}[]>([]);
  const [titularPessoaFisicaOptions, setTitularPessoaFisicaOptions] = useState<{value: string, label: string}[]>([]);
  const [titularOrganizacaoOptions, setTitularOrganizacaoOptions] = useState<{value: string, label: string}[]>([]);
  const [veiculoOptions, setVeiculoOptions] = useState<{value: string, label: string}[]>([]);
  const [currentTitularOptions, setCurrentTitularOptions] = useState<{value: string, label: string}[]>([]);
  
  useEffect(() => {
    console.log("RelatorioSegurosPage: Initial useEffect triggered, calling applyFilters and fetchDropdownOptions.");
    applyFilters();
    fetchDropdownOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    if (filters.tipoTitular === 'pessoa_fisica') {
      setCurrentTitularOptions(titularPessoaFisicaOptions);
    } else if (filters.tipoTitular === 'organizacao') {
      setCurrentTitularOptions(titularOrganizacaoOptions);
    } else {
      setCurrentTitularOptions([]);
    }
    // Reset nomeTitularId if the current selection is no longer valid for the new type
    if (filters.nomeTitularId && !currentTitularOptions.find(opt => opt.value === filters.nomeTitularId)) {
        setFilters(prev => ({ ...prev, nomeTitularId: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.tipoTitular, titularPessoaFisicaOptions, titularOrganizacaoOptions]); // Removed filters.nomeTitularId from deps

  const fetchDropdownOptions = async () => {
    if (!supabase) return;
    console.log("RelatorioSegurosPage: Fetching dropdown options.");
    const { data: segData, error: segError } = await supabase.from('Seguradoras').select('id_seguradora, nome_seguradora').order('nome_seguradora');
    if (segError) toast({ title: "Erro ao buscar Seguradoras", description: segError.message, variant: "destructive" });
    else if (segData) setSeguradoraOptions([{value: 'todos', label: 'Todas'}, ...segData.map(s => ({ value: s.id_seguradora.toString(), label: s.nome_seguradora }))]);
    
    const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo').order('nome_completo');
    if (pfError) toast({ title: "Erro ao buscar Pessoas Físicas", description: pfError.message, variant: "destructive" });
    else if (pfData) setTitularPessoaFisicaOptions(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: pf.nome_completo })));
    
    const { data: orgData, error: orgError } = await supabase.from('Entidades').select('id_entidade, nome').order('nome');
    if (orgError) toast({ title: "Erro ao buscar Organizações", description: orgError.message, variant: "destructive" });
    else if (orgData) setTitularOrganizacaoOptions(orgData.map(org => ({ value: org.id_entidade.toString(), label: org.nome })));
    
    const { data: veiData, error: veiError } = await supabase.from('Veiculos').select('id_veiculo, placa_atual, marca, modelo').order('placa_atual');
    if (veiError) toast({ title: "Erro ao buscar Veículos", description: veiError.message, variant: "destructive" });
    else if (veiData) setVeiculoOptions([{value: 'todos', label: 'Todos'}, ...veiData.map(v => ({ value: v.id_veiculo.toString(), label: `${v.placa_atual} (${v.marca} ${v.modelo})` }))]);
  };

  const applyFilters = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setFilteredResults([]);
      return;
    }
    setIsLoading(true);
    console.log("RelatorioSegurosPage: applyFilters called. Filters:", filters);

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
          id_veiculo,
          Seguradoras ( nome_seguradora ),
          Veiculos ( placa_atual ),
          PessoasFisicas!Seguros_id_titular_pessoa_fisica_fkey ( nome_completo ),
          Entidades!Seguros_id_titular_entidade_fkey ( nome )
        `);

      if (filters.numeroApolice) query = query.ilike('numero_apolice', `%${filters.numeroApolice}%`);
      if (filters.seguradoraId !== 'todos') query = query.eq('id_seguradora', parseInt(filters.seguradoraId));
      if (filters.vigenciaInicio) query = query.gte('vigencia_inicio', format(startOfDay(filters.vigenciaInicio), 'yyyy-MM-dd'));
      if (filters.vigenciaFim) query = query.lte('vigencia_fim', format(endOfDay(filters.vigenciaFim), 'yyyy-MM-dd'));
      if (filters.valorIndenizacaoMin) query = query.gte('valor_indenizacao', parseFloat(filters.valorIndenizacaoMin));
      if (filters.valorIndenizacaoMax) query = query.lte('valor_indenizacao', parseFloat(filters.valorIndenizacaoMax));
      if (filters.veiculoId !== 'todos') query = query.eq('id_veiculo', parseInt(filters.veiculoId));

      if (filters.tipoTitular === 'pessoa_fisica' && filters.nomeTitularId) {
        query = query.eq('id_titular_pessoa_fisica', parseInt(filters.nomeTitularId));
      } else if (filters.tipoTitular === 'organizacao' && filters.nomeTitularId) {
        query = query.eq('id_titular_entidade', parseInt(filters.nomeTitularId));
      } else if (filters.tipoTitular === 'pessoa_fisica' && !filters.nomeTitularId) {
          query = query.not('id_titular_pessoa_fisica', 'is', null);
      } else if (filters.tipoTitular === 'organizacao' && !filters.nomeTitularId) {
          query = query.not('id_titular_entidade', 'is', null);
      }
      
      console.log("RelatorioSegurosPage: Querying Supabase...");
      const { data, error } = await query;
      console.log("RelatorioSegurosPage: Supabase response. Error:", error, "Data length:", data?.length);

      if (error) throw error;

      const mappedData = (data || []).map((s: SeguroSupabase): SeguroReportItem => {
        let nomeTit: string | null = null;
        let tipoTit: SeguroReportItem['tipoTitular'] = 'N/A';
        if (s.id_titular_pessoa_fisica && s.PessoasFisicas) {
          nomeTit = s.PessoasFisicas.nome_completo;
          tipoTit = 'Pessoa Física';
        } else if (s.id_titular_entidade && s.Entidades) {
          nomeTit = s.Entidades.nome;
          tipoTit = 'Organização';
        }
        return {
          id: s.id_seguro.toString(),
          numeroApolice: s.numero_apolice,
          seguradoraNome: s.Seguradoras?.nome_seguradora || null,
          vigenciaInicio: s.vigencia_inicio ? format(parseISO(s.vigencia_inicio), 'dd/MM/yyyy') : 'N/A',
          vigenciaFim: s.vigencia_fim ? format(parseISO(s.vigencia_fim), 'dd/MM/yyyy') : 'N/A',
          valorIndenizacao: s.valor_indenizacao,
          nomeTitular: nomeTit,
          tipoTitular: tipoTit,
          veiculoAssociadoPlaca: s.Veiculos?.placa_atual || null,
        };
      });
      console.log("RelatorioSegurosPage: Setting filteredResults with", mappedData.length, "items.");
      setFilteredResults(mappedData);
    } catch (error: any) {
      console.error("RelatorioSegurosPage: Erro ao aplicar filtros/buscar dados:", JSON.stringify(error, null, 2));
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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (name: keyof typeof initialFilters, date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  const handleRadioFilterChange = (name: keyof typeof initialFilters, value: 'todos' | 'pessoa_fisica' | 'organizacao') => {
    setFilters(prev => ({ ...prev, [name]: value, nomeTitularId: '' }));
  };

  const clearFilters = () => { 
    setFilters(initialFilters); 
    applyFilters();
  };
  
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleExportExcel = () => { console.log("Exporting Seguros to Excel (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (Excel)"}) };
  const handleExportPDF = () => { console.log("Exporting Seguros to PDF (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (PDF)"}) };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Seguros
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
              <div className="space-y-1"><Label htmlFor="numeroApolice">Nº Apólice</Label><Input id="numeroApolice" name="numeroApolice" value={filters.numeroApolice} onChange={handleFilterChange} /></div>
              <div className="space-y-1">
                <Label htmlFor="seguradoraId">Seguradora</Label>
                <Select name="seguradoraId" value={filters.seguradoraId} onValueChange={(v) => handleSelectFilterChange('seguradoraId', v)}>
                  <SelectTrigger id="seguradoraId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{seguradoraOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="vigenciaInicio">Vigência Início</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.vigenciaInicio ? format(filters.vigenciaInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.vigenciaInicio} onSelect={(d) => handleDateFilterChange('vigenciaInicio', d)} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="vigenciaFim">Vigência Fim</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.vigenciaFim ? format(filters.vigenciaFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.vigenciaFim} onSelect={(d) => handleDateFilterChange('vigenciaFim', d)} disabled={(date) => filters.vigenciaInicio ? date < filters.vigenciaInicio : false} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="valorIndenizacaoMin">Valor Indenização (Min)</Label><Input id="valorIndenizacaoMin" name="valorIndenizacaoMin" type="number" value={filters.valorIndenizacaoMin} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="valorIndenizacaoMax">Valor Indenização (Max)</Label><Input id="valorIndenizacaoMax" name="valorIndenizacaoMax" type="number" value={filters.valorIndenizacaoMax} onChange={handleFilterChange} /></div>
              
              <div className="space-y-1 md:col-span-1"><Label>Tipo de Titular</Label>
                  <RadioGroup name="tipoTitular" value={filters.tipoTitular} onValueChange={(v: 'todos' | 'pessoa_fisica' | 'organizacao') => handleRadioFilterChange('tipoTitular', v)} className="flex space-x-4 mt-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="todos" id="tipoTitularTodosSeg" /><Label htmlFor="tipoTitularTodosSeg" className="font-normal">Todos</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa_fisica" id="tipoTitularPFSeg" /><Label htmlFor="tipoTitularPFSeg" className="font-normal">Pessoa Física</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="organizacao" id="tipoTitularOrgSeg" /><Label htmlFor="tipoTitularOrgSeg" className="font-normal">Organização</Label></div>
                  </RadioGroup>
              </div>
              {filters.tipoTitular !== 'todos' && (
                  <div className="space-y-1 md:col-span-1"> 
                      <Label htmlFor="nomeTitularId">Nome do Titular</Label>
                      <Select name="nomeTitularId" value={filters.nomeTitularId} onValueChange={(v) => handleSelectFilterChange('nomeTitularId', v)} disabled={currentTitularOptions.length === 0}>
                          <SelectTrigger id="nomeTitularId"><SelectValue placeholder="Selecione o titular" /></SelectTrigger>
                          <SelectContent>{currentTitularOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
              )}
              <div className="space-y-1 md:col-span-1"> 
                  <Label htmlFor="veiculoId">Veículo Associado</Label>
                  <Select name="veiculoId" value={filters.veiculoId} onValueChange={(v) => handleSelectFilterChange('veiculoId', v)}>
                      <SelectTrigger id="veiculoId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{veiculoOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
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
            <CardDescription>Total de {filteredResults.length} Seguros.</CardDescription>
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
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nº Apólice</TableHead>
                  <TableHead className="hidden md:table-cell">Seguradora</TableHead>
                  <TableHead>Vigência Início</TableHead>
                  <TableHead>Vigência Fim</TableHead>
                  <TableHead className="hidden lg:table-cell">Valor Indenização</TableHead>
                  <TableHead className="hidden md:table-cell">Titular</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Titular</TableHead>
                  <TableHead className="hidden lg:table-cell">Veículo (Placa)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={9} className="text-center h-24"><Loader2 className="inline-block mr-2 h-6 w-6 animate-spin"/>Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{s.id}</TableCell>
                      <TableCell>{s.numeroApolice}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.seguradoraNome || "N/A"}</TableCell>
                      <TableCell>{s.vigenciaInicio}</TableCell>
                      <TableCell>{s.vigenciaFim}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.valorIndenizacao?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.nomeTitular || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.tipoTitular}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.veiculoAssociadoPlaca || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={9} className="text-center h-24 text-muted-foreground">Nenhum seguro encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
