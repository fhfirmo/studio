
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
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface DocumentoReportItem {
  id: string;
  titulo: string;
  tipoDocumento: string;
  dataUpload: string;
  tamanho: string; // e.g., "500 KB"
  associadoANome: string | null;
  tipoAssociacao: 'Todos' |'Pessoa Física' | 'Organização' | 'Veículo' | 'Seguro' | 'Nenhum';
}

const placeholderTiposDocumento = [
  { value: "todos", label: "Todos" },
  { value: "contrato", label: "Contrato" },
  { value: "laudo", label: "Laudo" },
  { value: "apolice", label: "Apólice" },
];
const placeholderTiposAssociacao = [
  { value: "todos", label: "Todos" },
  { value: "pessoa_fisica", label: "Pessoa Física" },
  { value: "organizacao", label: "Organização" },
  { value: "veiculo", label: "Veículo" },
  { value: "seguro", label: "Seguro" },
  { value: "nenhum", label: "Nenhum" },
];
// Placeholder options for dynamic 'Associado a' select
const placeholderPessoasFisicas = [ { value: "pf_001", label: "João da Silva Sauro (123.456.789-00)" }];
const placeholderOrganizacoes = [ { value: "org_001", label: "Cooperativa Alfa (11.222.333/0001-44)" }];
const placeholderVeiculos = [ { value: "vei_001", label: "ABC-1234 (Fiat Uno)" }];
const placeholderSeguros = [ { value: "seg_001", label: "AP-2024-001 (Titular: João)" }];


const initialDocumentos: DocumentoReportItem[] = [
  { id: "doc_001", titulo: "Contrato João PF", tipoDocumento: "Contrato", dataUpload: "2024-01-01", tamanho: "500 KB", associadoANome: "João da Silva Sauro", tipoAssociacao: "Pessoa Física" },
  { id: "doc_002", titulo: "Apólice Veículo ABC", tipoDocumento: "Apólice", dataUpload: "2024-01-15", tamanho: "1.2 MB", associadoANome: "ABC-1234 (Fiat Uno)", tipoAssociacao: "Veículo" },
  { id: "doc_003", titulo: "Manual Interno", tipoDocumento: "Manual", dataUpload: "2023-12-20", tamanho: "2.5 MB", associadoANome: null, tipoAssociacao: "Nenhum" },
];

const initialFilters = {
  titulo: '',
  tipoDocumento: 'todos',
  dataUploadInicio: undefined as Date | undefined,
  dataUploadFim: undefined as Date | undefined,
  tipoAssociacao: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao' | 'veiculo' | 'seguro' | 'nenhum',
  associadoAId: '', // ID of the associated entity
};

export default function RelatorioDocumentosPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<DocumentoReportItem[]>(initialDocumentos);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssociadoAOptions, setCurrentAssociadoAOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    switch(filters.tipoAssociacao) {
        case 'pessoa_fisica': setCurrentAssociadoAOptions(placeholderPessoasFisicas); break;
        case 'organizacao': setCurrentAssociadoAOptions(placeholderOrganizacoes); break;
        case 'veiculo': setCurrentAssociadoAOptions(placeholderVeiculos); break;
        case 'seguro': setCurrentAssociadoAOptions(placeholderSeguros); break;
        default: setCurrentAssociadoAOptions([]); break;
    }
    setFilters(prev => ({ ...prev, associadoAId: '' }));
  }, [filters.tipoAssociacao]);


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

  const applyFilters = () => {
    setIsLoading(true);
    console.log("Applying filters for Documentos (placeholder):", filters);
    let results = initialDocumentos;

    if (filters.titulo) results = results.filter(d => d.titulo.toLowerCase().includes(filters.titulo.toLowerCase()));
    if (filters.tipoDocumento !== 'todos') results = results.filter(d => d.tipoDocumento.toLowerCase() === filters.tipoDocumento);
    if (filters.dataUploadInicio) {
        const startDate = startOfDay(filters.dataUploadInicio);
        results = results.filter(d => parseISO(d.dataUpload) >= startDate);
    }
    if (filters.dataUploadFim) {
        const endDate = endOfDay(filters.dataUploadFim);
        results = results.filter(d => parseISO(d.dataUpload) <= endDate);
    }
    if (filters.tipoAssociacao !== 'todos') {
        results = results.filter(d => d.tipoAssociacao.toLowerCase().replace('í', 'i').replace('ç', 'c').replace('ú', 'u') === filters.tipoAssociacao);
        if (filters.associadoAId) {
            results = results.filter(d => {
                // This part of the filter is highly dependent on how the ID is stored or if filtering by name is preferred
                // For simplicity, we'll assume filtering by name for the placeholder
                let selectedLabel = '';
                if (filters.tipoAssociacao === 'pessoa_fisica') selectedLabel = placeholderPessoasFisicas.find(o => o.value === filters.associadoAId)?.label.split(' (')[0] || '';
                else if (filters.tipoAssociacao === 'organizacao') selectedLabel = placeholderOrganizacoes.find(o => o.value === filters.associadoAId)?.label.split(' (')[0] || '';
                else if (filters.tipoAssociacao === 'veiculo') selectedLabel = placeholderVeiculos.find(o => o.value === filters.associadoAId)?.label.split(' (')[0] || '';
                else if (filters.tipoAssociacao === 'seguro') selectedLabel = placeholderSeguros.find(o => o.value === filters.associadoAId)?.label.split(' (')[0] || '';
                return d.associadoANome === selectedLabel;
            });
        }
    }
    
    setTimeout(() => { setFilteredResults(results); setIsLoading(false); }, 500);
  };

  const clearFilters = () => { setFilters(initialFilters); setFilteredResults(initialDocumentos); };
  const handleExportExcel = () => { console.log("Exporting Documentos to Excel (placeholder)... Data:", filteredResults); };
  const handleExportPDF = () => { console.log("Exporting Documentos to PDF (placeholder)... Data:", filteredResults); };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Documentos
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
            <div className="space-y-1"><Label htmlFor="titulo">Título</Label><Input id="titulo" name="titulo" value={filters.titulo} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="tipoDocumento">Tipo de Documento</Label>
              {/* Supabase: Options from public.TiposDocumento or predefined */}
              <Select name="tipoDocumento" value={filters.tipoDocumento} onValueChange={(v) => handleSelectFilterChange('tipoDocumento', v)}><SelectTrigger id="tipoDocumento"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderTiposDocumento.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label htmlFor="dataUploadInicio">Data Upload (Início)</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataUploadInicio ? format(filters.dataUploadInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataUploadInicio} onSelect={(d) => handleDateFilterChange('dataUploadInicio', d)} /></PopoverContent></Popover>
            </div>
            <div className="space-y-1"><Label htmlFor="dataUploadFim">Data Upload (Fim)</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataUploadFim ? format(filters.dataUploadFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataUploadFim} onSelect={(d) => handleDateFilterChange('dataUploadFim', d)} disabled={(date) => filters.dataUploadInicio ? date < filters.dataUploadInicio : false} /></PopoverContent></Popover>
            </div>
            <div className="space-y-1"><Label htmlFor="tipoAssociacao">Tipo de Associação</Label>
                <Select name="tipoAssociacao" value={filters.tipoAssociacao} onValueChange={(v) => handleSelectFilterChange('tipoAssociacao', v as any)}>
                    <SelectTrigger id="tipoAssociacao"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{placeholderTiposAssociacao.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            {filters.tipoAssociacao !== 'todos' && filters.tipoAssociacao !== 'nenhum' && (
                <div className="space-y-1">
                    <Label htmlFor="associadoAId">Associado a</Label>
                    {/* Supabase: Dynamic options based on tipoAssociacao */}
                    <Select name="associadoAId" value={filters.associadoAId} onValueChange={(v) => handleSelectFilterChange('associadoAId', v)} disabled={currentAssociadoAOptions.length === 0}>
                        <SelectTrigger id="associadoAId"><SelectValue placeholder="Selecione a entidade" /></SelectTrigger>
                        <SelectContent>{currentAssociadoAOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
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
            <CardDescription>Total de {filteredResults.length} Documentos.</CardDescription>
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
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Documento</TableHead>
                  <TableHead>Data Upload</TableHead>
                  <TableHead className="hidden md:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden lg:table-cell">Associado a</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Associação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={7} className="text-center h-24">Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{d.id}</TableCell>
                      <TableCell>{d.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.tipoDocumento}</TableCell>
                      <TableCell>{format(parseISO(d.dataUpload), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.tamanho}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.associadoANome || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.tipoAssociacao}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum documento encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* 
        Supabase Integration Notes:
        - Fetch from public."Arquivos".
        - Conditionally JOIN public."PessoasFisicas", "Entidades", "Veiculos", "Seguros" based on which association FK is populated.
        - Filters to be applied in Supabase query.
        - Dynamic select options for "Tipo de Documento" (if applicable) and "Associado a" (based on "Tipo de Associação" selection).
      */}
    </div>
  );
}
