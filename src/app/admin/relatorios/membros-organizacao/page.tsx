
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
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon, Users } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface MembroOrganizacaoReportItem {
  idVinculo: string;
  nomeOrganizacaoPrincipal: string;
  nomeMembro: string;
  tipoMembro: 'Pessoa Física' | 'Pessoa Jurídica';
  funcaoMembro: string | null;
  dataAssociacao: string;
}

const placeholderOrganizacoes = [
  { value: "todos", label: "Todas" },
  { value: "org_001", label: "Cooperativa Alfa" },
  { value: "org_002", label: "Associação Beta" },
];
const placeholderTiposMembro = [
  { value: "todos", label: "Todos" },
  { value: "pessoa_fisica", label: "Pessoa Física" },
  { value: "pessoa_juridica", label: "Pessoa Jurídica" },
];

const initialMembros: MembroOrganizacaoReportItem[] = [
  { idVinculo: "me_001A", nomeOrganizacaoPrincipal: "Cooperativa Alfa", nomeMembro: "João da Silva Sauro", tipoMembro: "Pessoa Física", funcaoMembro: "Presidente", dataAssociacao: "2023-01-01" },
  { idVinculo: "me_001B", nomeOrganizacaoPrincipal: "Cooperativa Alfa", nomeMembro: "Empresa Membro Cicla", tipoMembro: "Pessoa Jurídica", funcaoMembro: "Conselheira", dataAssociacao: "2023-02-15" },
  { idVinculo: "me_002A", nomeOrganizacaoPrincipal: "Associação Beta", nomeMembro: "Maria Oliveira Costa", tipoMembro: "Pessoa Física", funcaoMembro: "Secretária", dataAssociacao: "2023-03-10" },
];

const initialFilters = {
  organizacaoPrincipalId: 'todos',
  nomeMembro: '',
  tipoMembro: 'todos',
  funcaoMembro: '',
  dataAssociacaoInicio: undefined as Date | undefined,
  dataAssociacaoFim: undefined as Date | undefined,
};

export default function RelatorioMembrosOrganizacaoPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<MembroOrganizacaoReportItem[]>(initialMembros);
  const [isLoading, setIsLoading] = useState(false);

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
    console.log("Applying filters for Membros por Organização (placeholder):", filters);
    let results = initialMembros;

    if (filters.organizacaoPrincipalId !== 'todos') results = results.filter(m => m.nomeOrganizacaoPrincipal === placeholderOrganizacoes.find(o => o.value === filters.organizacaoPrincipalId)?.label);
    if (filters.nomeMembro) results = results.filter(m => m.nomeMembro.toLowerCase().includes(filters.nomeMembro.toLowerCase()));
    if (filters.tipoMembro !== 'todos') results = results.filter(m => m.tipoMembro.toLowerCase().replace('í', 'i').replace('ú', 'u') === filters.tipoMembro);
    if (filters.funcaoMembro) results = results.filter(m => m.funcaoMembro?.toLowerCase().includes(filters.funcaoMembro.toLowerCase()));
    if (filters.dataAssociacaoInicio) {
        const startDate = startOfDay(filters.dataAssociacaoInicio);
        results = results.filter(m => parseISO(m.dataAssociacao) >= startDate);
    }
    if (filters.dataAssociacaoFim) {
        const endDate = endOfDay(filters.dataAssociacaoFim);
        results = results.filter(m => parseISO(m.dataAssociacao) <= endDate);
    }
    
    setTimeout(() => { setFilteredResults(results); setIsLoading(false); }, 500);
  };

  const clearFilters = () => { setFilters(initialFilters); setFilteredResults(initialMembros); };
  const handleExportExcel = () => { console.log("Exporting Membros por Organização to Excel (placeholder)... Data:", filteredResults); };
  const handleExportPDF = () => { console.log("Exporting Membros por Organização to PDF (placeholder)... Data:", filteredResults); };

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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1"><Label htmlFor="organizacaoPrincipalId">Organização Principal</Label>
              <Select name="organizacaoPrincipalId" value={filters.organizacaoPrincipalId} onValueChange={(v) => handleSelectFilterChange('organizacaoPrincipalId', v)}><SelectTrigger id="organizacaoPrincipalId"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderOrganizacoes.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label htmlFor="nomeMembro">Nome do Membro</Label><Input id="nomeMembro" name="nomeMembro" value={filters.nomeMembro} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="tipoMembro">Tipo de Membro</Label>
              <Select name="tipoMembro" value={filters.tipoMembro} onValueChange={(v) => handleSelectFilterChange('tipoMembro', v)}><SelectTrigger id="tipoMembro"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderTiposMembro.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
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
            <Button variant="outline" onClick={clearFilters} disabled={isLoading}><XSquare className="mr-2 h-4 w-4"/> Limpar</Button>
            <Button onClick={applyFilters} disabled={isLoading}><Filter className="mr-2 h-4 w-4"/> {isLoading ? "Aplicando..." : "Aplicar"}</Button>
          </div>
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
                {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((m) => (
                    <TableRow key={m.idVinculo}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{m.idVinculo}</TableCell>
                      <TableCell>{m.nomeOrganizacaoPrincipal}</TableCell>
                      <TableCell>{m.nomeMembro}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.tipoMembro}</TableCell>
                      <TableCell className="hidden md:table-cell">{m.funcaoMembro || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{format(parseISO(m.dataAssociacao), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Nenhum vínculo encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* 
        Supabase Integration Notes:
        - Fetch from public."MembrosEntidade".
        - JOIN public."Entidades" as EntidadePai ON MembrosEntidade.id_entidade_pai = EntidadePai.id_entidade (for "Nome Organização Principal").
        - Conditionally JOIN public."PessoasFisicas" ON MembrosEntidade.id_membro_pessoa_fisica = PessoasFisicas.id (if tipo_membro = 'pessoa_fisica').
        - Conditionally JOIN public."Entidades" as EntidadeMembro ON MembrosEntidade.id_membro_entidade_juridica = EntidadeMembro.id_entidade (if tipo_membro = 'pessoa_juridica').
        - Filters to be applied in Supabase query (e.g., on EntidadePai.nome_fantasia, PessoasFisicas.nome_completo, EntidadeMembro.nome_fantasia, MembrosEntidade.tipo_membro, MembrosEntidade.funcao_no_membro, MembrosEntidade.data_associacao).
        - Dynamic select options: "Organização Principal" from public."Entidades".
      */}
    </div>
  );
}

