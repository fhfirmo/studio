
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';

// Placeholder data for PessoasFisicas (same as list page)
interface PessoaFisica {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  tipoRelacao: string;
  organizacaoVinculada: string | null;
  dataCadastro: string; // YYYY-MM-DD format
}

const initialPessoasFisicas: PessoaFisica[] = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00", email: "joao@exemplo.com", telefone: "(11) 9876-5432", tipoRelacao: "Associado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2024-01-15" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99", email: "maria@exemplo.com", telefone: "(21) 1234-5678", tipoRelacao: "Funcionário", organizacaoVinculada: "Empresa Gama", dataCadastro: "2024-02-20" },
  { id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", email: "carlos@exemplo.com", telefone: "(31) 9988-7766", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2024-03-10" },
  { id: "pf_004", nomeCompleto: "Ana Souza Almeida", cpf: "444.555.666-77", email: "ana@exemplo.com", telefone: "(41) 8765-4321", tipoRelacao: "Associado", organizacaoVinculada: "Associação Beta", dataCadastro: "2024-04-05" },
  { id: "pf_005", nomeCompleto: "Pedro Martins Rocha", cpf: "777.888.999-00", email: "pedro@exemplo.com", telefone: "(51) 6543-2109", tipoRelacao: "Cooperado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2024-05-01" },
  { id: "pf_006", nomeCompleto: "Laura Ferreira Mendes", cpf: "222.333.444-55", email: "laura@exemplo.com", telefone: "(61) 7654-3210", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2023-12-01" },
  { id: "pf_007", nomeCompleto: "Bruno Alves Pinto", cpf: "555.666.777-88", email: "bruno@exemplo.com", telefone: "(71) 5432-1098", tipoRelacao: "Associado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2023-11-15" },
];

const tiposRelacaoOptions = [
  { value: "todos", label: "Todos" },
  { value: "Associado", label: "Associado" },
  { value: "Cooperado", label: "Cooperado" },
  { value: "Funcionário", label: "Funcionário" },
  { value: "Cliente Geral", label: "Cliente Geral" },
];

const organizacoesVinculadasOptions = [
  { value: "todos", label: "Todas" },
  { value: "Cooperativa Alfa", label: "Cooperativa Alfa" },
  { value: "Empresa Gama", label: "Empresa Gama" },
  { value: "Associação Beta", label: "Associação Beta" },
  // Supabase: This list should be dynamically populated from public.Entidades
];

const initialFilters = {
  nomeCompleto: '',
  cpf: '',
  tipoRelacao: 'todos',
  organizacaoVinculada: 'todos',
  dataCadastroInicio: undefined as Date | undefined,
  dataCadastroFim: undefined as Date | undefined,
};

export default function RelatorioPessoasFisicasPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<PessoaFisica[]>(initialPessoasFisicas);
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
    // Supabase:
    // - Construct query based on 'filters' state.
    // - For text fields (nomeCompleto, cpf), use '.ilike()' or '.eq()' as appropriate.
    // - For select fields (tipoRelacao, organizacaoVinculada), use '.eq()' if not 'todos'.
    // - For date range (dataCadastroInicio, dataCadastroFim), use '.gte()' and '.lte()'.
    //   Remember to handle date formatting for Supabase (e.g., 'YYYY-MM-DD').
    // - Perform necessary JOINs (e.g., with public.MembrosEntidade and public.Entidades) to get organizacaoVinculada.nome.
    // - Fetch data from public.PessoasFisicas.
    console.log("Applying filters (placeholder):", filters);

    // Placeholder client-side filtering:
    let results = initialPessoasFisicas;
    if (filters.nomeCompleto) {
      results = results.filter(pf => pf.nomeCompleto.toLowerCase().includes(filters.nomeCompleto.toLowerCase()));
    }
    if (filters.cpf) {
      results = results.filter(pf => pf.cpf.replace(/[.-]/g, '').includes(filters.cpf.replace(/[.-]/g, '')));
    }
    if (filters.tipoRelacao !== 'todos') {
      results = results.filter(pf => pf.tipoRelacao === filters.tipoRelacao);
    }
    if (filters.organizacaoVinculada !== 'todos') {
      results = results.filter(pf => pf.organizacaoVinculada === filters.organizacaoVinculada);
    }
    if (filters.dataCadastroInicio) {
      const startDate = startOfDay(filters.dataCadastroInicio);
      results = results.filter(pf => {
        const pfDate = parseISO(pf.dataCadastro);
        return isValid(pfDate) && pfDate >= startDate;
      });
    }
    if (filters.dataCadastroFim) {
      const endDate = endOfDay(filters.dataCadastroFim);
      results = results.filter(pf => {
        const pfDate = parseISO(pf.dataCadastro);
        return isValid(pfDate) && pfDate <= endDate;
      });
    }
    
    setTimeout(() => { // Simulate API delay
      setFilteredResults(results);
      setIsLoading(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setFilteredResults(initialPessoasFisicas); // Reset to initial list or re-fetch all
  };
  
  useEffect(() => {
    // applyFilters(); // Optionally apply filters on initial load or when filters change
    // Supabase: Fetch initial list here if not applying filters by default
  }, []);

  const handleExportExcel = () => {
    console.log("Exporting to Excel (placeholder)... Data to export:", filteredResults);
    // Supabase:
    // - This might call a Supabase Edge Function that takes filter parameters.
    // - The Edge Function queries the database, generates an Excel file (e.g., using a library like 'exceljs'),
    //   and returns it or a URL to download it.
    // - Alternatively, use a frontend library like 'xlsx' to generate from 'filteredResults'.
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF (placeholder)... Data to export:", filteredResults);
    // Supabase:
    // - Similar to Excel, might call an Edge Function.
    // - The Edge Function queries data, generates a PDF (e.g., using 'pdfmake' or 'puppeteer'),
    //   and returns it or a URL.
    // - Alternatively, use frontend libraries like 'jspdf' and 'jspdf-autotable'.
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Pessoas Físicas
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
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input id="nomeCompleto" name="nomeCompleto" value={filters.nomeCompleto} onChange={handleFilterChange} placeholder="Pesquisar por nome..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" value={filters.cpf} onChange={handleFilterChange} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tipoRelacao">Tipo de Relação</Label>
              <Select name="tipoRelacao" value={filters.tipoRelacao} onValueChange={(value) => handleSelectFilterChange('tipoRelacao', value)}>
                <SelectTrigger id="tipoRelacao"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {tiposRelacaoOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="organizacaoVinculada">Organização Vinculada</Label>
              {/* Supabase: Options should be dynamically loaded from public.Entidades */}
              <Select name="organizacaoVinculada" value={filters.organizacaoVinculada} onValueChange={(value) => handleSelectFilterChange('organizacaoVinculada', value)}>
                <SelectTrigger id="organizacaoVinculada"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {organizacoesVinculadasOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                Total de {filteredResults.length} Pessoas Físicas encontradas.
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
                  <TableHead>Nome Completo</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo de Relação</TableHead>
                  <TableHead className="hidden lg:table-cell">Organização Vinculada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">Carregando resultados...</TableCell></TableRow>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{pessoa.id}</TableCell>
                      <TableCell>{pessoa.nomeCompleto}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.cpf}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{pessoa.telefone}</TableCell>
                      <TableCell className="hidden lg:table-cell">{pessoa.tipoRelacao}</TableCell>
                      <TableCell className="hidden lg:table-cell">{pessoa.organizacaoVinculada || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Nenhuma pessoa física encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Basic Pagination Placeholder */}
          {/* <CardFooter className="pt-4 flex justify-center">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <span className="mx-4 text-sm text-muted-foreground">Página 1 de 1</span>
            <Button variant="outline" size="sm" disabled>Próxima</Button>
          </CardFooter> */}
        </CardContent>
      </Card>

      {/* 
        Supabase Integration Comments:
        - Data Fetching (applyFilters):
          - Query public.PessoasFisicas.
          - Apply filters:
            - nomeCompleto: .ilike(`%${filters.nomeCompleto}%`)
            - cpf: .eq('cpf', filters.cpf) or .like() if partial allowed
            - tipoRelacao: .eq('tipo_relacao', filters.tipoRelacao) (if not 'todos')
            - organizacaoVinculada: This requires a JOIN.
              - If PessoasFisicas has a direct FK to Entidades (e.g., id_organizacao_principal):
                .eq('id_organizacao_principal', filters.organizacaoVinculada) (if not 'todos')
              - If PessoasFisicas is linked via MembrosEntidade:
                This becomes more complex. You might need a subquery or an RPC function in Supabase
                to filter PessoasFisicas based on their membership in a specific Entidade.
                Example conceptual filter: PessoasFisicas.id IN (SELECT id_pessoa_fisica FROM MembrosEntidade WHERE id_entidade_pai = filters.organizacaoVinculada)
            - dataCadastroInicio/Fim: .gte('data_cadastro', startDate), .lte('data_cadastro', endDate)
          - JOINs/Selects:
            - To get Organizacao Vinculada name: 
              ...select(`*, organizacao_vinculada:Entidades ( nome )` if direct FK) or more complex for MembrosEntidade.
        - Dynamic Selects:
          - Organizacao Vinculada select: Fetch from public.Entidades (id, nome_fantasia or nome).
        - Exporting:
          - The export functions (Excel/PDF) would ideally call a Supabase Edge Function.
          - Pass the current 'filters' object to the Edge Function.
          - The Edge Function re-queries the database with these filters.
          - Generates the file (Excel using 'exceljs', PDF using 'pdfmake' or 'puppeteer' in the Edge Function environment).
          - Returns the file content or a URL for download.
          - Frontend libraries (xlsx-js, jspdf) can also be used if data size is manageable and processing is preferred client-side.
      */}
    </div>
  );
}

