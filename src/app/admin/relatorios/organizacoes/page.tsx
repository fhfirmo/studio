
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

interface OrganizacaoReportItem {
  id: string;
  nomeOrganizacao: string;
  tipoOrganizacaoNome: string;
  cnpj: string;
  telefone: string | null;
  dataCadastro: string;
}

const placeholderTiposOrganizacao = [
  { value: "todos", label: "Todos" },
  { value: "coop_principal", label: "Cooperativa Principal" },
  { value: "associacao_principal", label: "Associação Principal" },
  { value: "empresa_privada", label: "Empresa Privada" },
];

const initialOrganizacoes: OrganizacaoReportItem[] = [
  { id: "org_001", nomeOrganizacao: "Cooperativa Alfa", tipoOrganizacaoNome: "Cooperativa Principal", cnpj: "11.222.333/0001-44", telefone: "(11) 91234-5678", dataCadastro: "2024-01-10" },
  { id: "org_002", nomeOrganizacao: "Associação Beta", tipoOrganizacaoNome: "Associação Principal", cnpj: "22.333.444/0001-55", telefone: "(22) 92345-6789", dataCadastro: "2023-12-05" },
  { id: "org_003", nomeOrganizacao: "Empresa Gama Soluções", tipoOrganizacaoNome: "Empresa Privada", cnpj: "33.444.555/0001-66", telefone: "(33) 93456-7890", dataCadastro: "2024-02-20" },
];

const initialFilters = {
  nomeOrganizacao: '',
  cnpj: '',
  tipoOrganizacao: 'todos',
  dataCadastroInicio: undefined as Date | undefined,
  dataCadastroFim: undefined as Date | undefined,
};

export default function RelatorioOrganizacoesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<OrganizacaoReportItem[]>(initialOrganizacoes);
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
    console.log("Applying filters for Organizações (placeholder):", filters);

    let results = initialOrganizacoes;
    if (filters.nomeOrganizacao) {
      results = results.filter(org => org.nomeOrganizacao.toLowerCase().includes(filters.nomeOrganizacao.toLowerCase()));
    }
    if (filters.cnpj) {
      results = results.filter(org => org.cnpj.replace(/[./-]/g, '').includes(filters.cnpj.replace(/[./-]/g, '')));
    }
    if (filters.tipoOrganizacao !== 'todos') {
      results = results.filter(org => org.tipoOrganizacaoNome === placeholderTiposOrganizacao.find(to => to.value === filters.tipoOrganizacao)?.label);
    }
    if (filters.dataCadastroInicio) {
      const startDate = startOfDay(filters.dataCadastroInicio);
      results = results.filter(org => {
        const orgDate = parseISO(org.dataCadastro);
        return isValid(orgDate) && orgDate >= startDate;
      });
    }
    if (filters.dataCadastroFim) {
      const endDate = endOfDay(filters.dataCadastroFim);
      results = results.filter(org => {
        const orgDate = parseISO(org.dataCadastro);
        return isValid(orgDate) && orgDate <= endDate;
      });
    }
    
    setTimeout(() => { 
      setFilteredResults(results);
      setIsLoading(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setFilteredResults(initialOrganizacoes); 
  };
  
  useEffect(() => {
    // applyFilters(); // Optionally apply filters on initial load
  }, []);

  const handleExportExcel = () => {
    console.log("Exporting Organizações to Excel (placeholder)... Data:", filteredResults);
  };

  const handleExportPDF = () => {
    console.log("Exporting Organizações to PDF (placeholder)... Data:", filteredResults);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Organizações
            </h1>
            <Button variant="outline" size="sm" asChild>
                <Link href="/admin/relatorios">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Relatórios
                </Link>
            </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="mr-2 h-5 w-5 text-primary" /> Filtros do Relatório</CardTitle>
          <CardDescription>Refine os resultados do relatório aplicando os filtros abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="nomeOrganizacao">Nome da Organização</Label>
              <Input id="nomeOrganizacao" name="nomeOrganizacao" value={filters.nomeOrganizacao} onChange={handleFilterChange} placeholder="Pesquisar por nome..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" value={filters.cnpj} onChange={handleFilterChange} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tipoOrganizacao">Tipo de Organização</Label>
              {/* Supabase: Options for this select should be loaded from public.TiposEntidade */}
              <Select name="tipoOrganizacao" value={filters.tipoOrganizacao} onValueChange={(value) => handleSelectFilterChange('tipoOrganizacao', value)}>
                <SelectTrigger id="tipoOrganizacao"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {placeholderTiposOrganizacao.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dataCadastroInicio">Data de Cadastro (Início)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.dataCadastroInicio ? format(filters.dataCadastroInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataCadastroInicio} onSelect={(d) => handleDateFilterChange('dataCadastroInicio', d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
             <div className="space-y-1">
              <Label htmlFor="dataCadastroFim">Data de Cadastro (Fim)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.dataCadastroFim ? format(filters.dataCadastroFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataCadastroFim} onSelect={(d) => handleDateFilterChange('dataCadastroFim', d)} disabled={(date) => filters.dataCadastroInicio ? date < filters.dataCadastroInicio : false} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={clearFilters} disabled={isLoading}><XSquare className="mr-2 h-4 w-4"/> Limpar Filtros</Button>
            <Button onClick={applyFilters} disabled={isLoading}>
              <Filter className="mr-2 h-4 w-4"/> {isLoading ? "Aplicando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Resultados do Relatório</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardDescription>
                Total de {filteredResults.length} Organizações encontradas.
            </CardDescription>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || filteredResults.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar para Excel
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || filteredResults.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Exportar para PDF
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome da Organização</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo da Organização</TableHead>
                  <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Carregando resultados...</TableCell></TableRow>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{org.id}</TableCell>
                      <TableCell>{org.nomeOrganizacao}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.tipoOrganizacaoNome}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.cnpj}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.telefone || "N/A"}</TableCell>
                       <TableCell className="hidden lg:table-cell">{format(parseISO(org.dataCadastro), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhuma organização encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* 
        Supabase Integration Notes:
        - Fetch data from public."Entidades".
        - JOIN with public."TiposEntidade" on "id_tipo_entidade" to get "nome_tipo" for "Tipo da Organização".
        - Filters (nome_fantasia, cnpj, id_tipo_entidade, data_cadastro) to be applied in Supabase query.
        - Select for "Tipo de Organização" options: Fetch from public."TiposEntidade".
        - Export functionality: Send filtered data (or filter params) to backend/Edge Function to generate file.
      */}
    </div>
  );
}
