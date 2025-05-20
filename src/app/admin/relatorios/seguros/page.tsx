
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
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface SeguroReportItem {
  id: string;
  numeroApolice: string;
  seguradoraNome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  valorIndenizacao: number | null;
  nomeTitular: string | null;
  tipoTitular: 'Pessoa Física' | 'Organização' | 'N/A';
  veiculoAssociadoPlaca: string | null;
}

const placeholderSeguradoras = [
  { value: "todos", label: "Todas" },
  { value: "seg_001", label: "Porto Seguro" },
  { value: "seg_002", label: "Azul Seguros" },
];
const placeholderVeiculos = [
  { value: "todos", label: "Todos" },
  { value: "vei_001", label: "ABC-1234 (Fiat Uno)" },
  { value: "vei_002", label: "DEF-5678 (VW Gol)" },
];
const placeholderPessoasFisicas = [
  { value: "pf_001", label: "João da Silva Sauro (123.456.789-00)" },
];
const placeholderOrganizacoes = [
  { value: "org_001", label: "Cooperativa Alfa (11.222.333/0001-44)" },
];


const initialSeguros: SeguroReportItem[] = [
  { id: "seg_001", numeroApolice: "AP-2024-001", seguradoraNome: "Porto Seguro", vigenciaInicio: "2024-01-01", vigenciaFim: "2024-12-31", valorIndenizacao: 50000, nomeTitular: "João da Silva Sauro", tipoTitular: "Pessoa Física", veiculoAssociadoPlaca: "ABC-1234" },
  { id: "seg_002", numeroApolice: "AP-2024-002", seguradoraNome: "Azul Seguros", vigenciaInicio: "2024-03-15", vigenciaFim: "2025-03-14", valorIndenizacao: 75000, nomeTitular: "Cooperativa Alfa", tipoTitular: "Organização", veiculoAssociadoPlaca: "DEF-5678" },
];

const initialFilters = {
  numeroApolice: '',
  seguradora: 'todos',
  vigenciaInicio: undefined as Date | undefined,
  vigenciaFim: undefined as Date | undefined,
  valorTotalMin: '',
  valorTotalMax: '',
  tipoTitular: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  nomeTitularId: '',
  veiculoAssociado: 'todos',
};

export default function RelatorioSegurosPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<SeguroReportItem[]>(initialSeguros);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTitularOptions, setCurrentTitularOptions] = useState<{value: string, label: string}[]>([]);
  
  useEffect(() => {
    if (filters.tipoTitular === 'pessoa_fisica') {
      setCurrentTitularOptions(placeholderPessoasFisicas);
    } else if (filters.tipoTitular === 'organizacao') {
      setCurrentTitularOptions(placeholderOrganizacoes);
    } else {
      setCurrentTitularOptions([]);
    }
    setFilters(prev => ({ ...prev, nomeTitularId: '' }));
  }, [filters.tipoTitular]);

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
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setIsLoading(true);
    console.log("Applying filters for Seguros (placeholder):", filters);
    let results = initialSeguros;

    if (filters.numeroApolice) results = results.filter(s => s.numeroApolice.toLowerCase().includes(filters.numeroApolice.toLowerCase()));
    if (filters.seguradora !== 'todos') results = results.filter(s => s.seguradoraNome === placeholderSeguradoras.find(sg => sg.value === filters.seguradora)?.label);
    if (filters.vigenciaInicio) {
        const startDate = startOfDay(filters.vigenciaInicio);
        results = results.filter(s => parseISO(s.vigenciaInicio) >= startDate);
    }
    if (filters.vigenciaFim) {
        const endDate = endOfDay(filters.vigenciaFim);
        results = results.filter(s => parseISO(s.vigenciaFim) <= endDate);
    }
    if (filters.valorTotalMin) results = results.filter(s => s.valorIndenizacao !== null && s.valorIndenizacao >= parseFloat(filters.valorTotalMin));
    if (filters.valorTotalMax) results = results.filter(s => s.valorIndenizacao !== null && s.valorIndenizacao <= parseFloat(filters.valorTotalMax));
    if (filters.tipoTitular !== 'todos') {
        results = results.filter(s => s.tipoTitular.toLowerCase().replace('í', 'i').replace('ç', 'c') === filters.tipoTitular);
        if (filters.nomeTitularId) {
            results = results.filter(s => {
                if (filters.tipoTitular === 'pessoa_fisica') return s.nomeTitular === placeholderPessoasFisicas.find(pf => pf.value === filters.nomeTitularId)?.label.split(' (')[0];
                if (filters.tipoTitular === 'organizacao') return s.nomeTitular === placeholderOrganizacoes.find(org => org.value === filters.nomeTitularId)?.label.split(' (')[0];
                return true;
            });
        }
    }
    if (filters.veiculoAssociado !== 'todos') results = results.filter(s => s.veiculoAssociadoPlaca === placeholderVeiculos.find(v => v.value === filters.veiculoAssociado)?.label.split(' (')[0]);

    setTimeout(() => { setFilteredResults(results); setIsLoading(false); }, 500);
  };

  const clearFilters = () => { setFilters(initialFilters); setFilteredResults(initialSeguros); };
  const handleExportExcel = () => { console.log("Exporting Seguros to Excel (placeholder)... Data:", filteredResults); };
  const handleExportPDF = () => { console.log("Exporting Seguros to PDF (placeholder)... Data:", filteredResults); };

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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1"><Label htmlFor="numeroApolice">Nº Apólice</Label><Input id="numeroApolice" name="numeroApolice" value={filters.numeroApolice} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="seguradora">Seguradora</Label>
              {/* Supabase: Options from public.Seguradoras */}
              <Select name="seguradora" value={filters.seguradora} onValueChange={(v) => handleSelectFilterChange('seguradora', v)}><SelectTrigger id="seguradora"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderSeguradoras.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label htmlFor="vigenciaInicio">Vigência Início</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.vigenciaInicio ? format(filters.vigenciaInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.vigenciaInicio} onSelect={(d) => handleDateFilterChange('vigenciaInicio', d)} /></PopoverContent></Popover>
            </div>
            <div className="space-y-1"><Label htmlFor="vigenciaFim">Vigência Fim</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.vigenciaFim ? format(filters.vigenciaFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.vigenciaFim} onSelect={(d) => handleDateFilterChange('vigenciaFim', d)} disabled={(date) => filters.vigenciaInicio ? date < filters.vigenciaInicio : false} /></PopoverContent></Popover>
            </div>
            <div className="space-y-1"><Label htmlFor="valorTotalMin">Valor Total (Min)</Label><Input id="valorTotalMin" name="valorTotalMin" type="number" value={filters.valorTotalMin} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="valorTotalMax">Valor Total (Max)</Label><Input id="valorTotalMax" name="valorTotalMax" type="number" value={filters.valorTotalMax} onChange={handleFilterChange} /></div>
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-3"><Label>Tipo de Titular</Label>
                <RadioGroup name="tipoTitular" value={filters.tipoTitular} onValueChange={(v: 'todos' | 'pessoa_fisica' | 'organizacao') => handleRadioFilterChange('tipoTitular', v)} className="flex space-x-4 mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="todos" id="tipoTitularTodos" /><Label htmlFor="tipoTitularTodos" className="font-normal">Todos</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa_fisica" id="tipoTitularPF" /><Label htmlFor="tipoTitularPF" className="font-normal">Pessoa Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="organizacao" id="tipoTitularOrg" /><Label htmlFor="tipoTitularOrg" className="font-normal">Organização</Label></div>
                </RadioGroup>
            </div>
            {filters.tipoTitular !== 'todos' && (
                <div className="space-y-1">
                    <Label htmlFor="nomeTitularId">Nome do Titular</Label>
                    {/* Supabase: Options from PessoasFisicas/Entidades */}
                    <Select name="nomeTitularId" value={filters.nomeTitularId} onValueChange={(v) => handleSelectFilterChange('nomeTitularId', v)} disabled={currentTitularOptions.length === 0}>
                        <SelectTrigger id="nomeTitularId"><SelectValue placeholder="Selecione o titular" /></SelectTrigger>
                        <SelectContent>{currentTitularOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-1"><Label htmlFor="veiculoAssociado">Veículo Associado</Label>
                {/* Supabase: Options from public.Veiculos */}
                <Select name="veiculoAssociado" value={filters.veiculoAssociado} onValueChange={(v) => handleSelectFilterChange('veiculoAssociado', v)}>
                    <SelectTrigger id="veiculoAssociado"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{placeholderVeiculos.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={clearFilters} disabled={isLoading}><XSquare className="mr-2 h-4 w-4"/> Limpar</Button>
            <Button onClick={applyFilters} disabled={isLoading}><Filter className="mr-2 h-4 w-4"/> {isLoading ? "Aplicando..." : "Aplicar"}</Button>
          </div>
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
                {isLoading ? (<TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{s.id}</TableCell>
                      <TableCell>{s.numeroApolice}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.seguradoraNome}</TableCell>
                      <TableCell>{format(parseISO(s.vigenciaInicio), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(parseISO(s.vigenciaFim), "dd/MM/yyyy")}</TableCell>
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
      {/* 
        Supabase Integration Notes:
        - Fetch from public."Seguros".
        - JOIN public."Seguradoras" for "seguradoraNome".
        - Conditionally JOIN public."PessoasFisicas" or public."Entidades" for "nomeTitular" & "tipoTitular".
        - JOIN public."Veiculos" for "veiculoAssociadoPlaca".
        - Filters to be applied in Supabase query.
        - Dynamic select options: "Seguradora" from Seguradoras, "Nome do Titular" from PessoasFisicas/Entidades, "Veículo Associado" from Veiculos.
      */}
    </div>
  );
}
