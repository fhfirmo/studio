
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

// Placeholder data for PessoasFisicas
interface PessoaFisica {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  tipoRelacao: string;
  organizacaoVinculada: string | null;
  dataCadastro: string; // YYYY-MM-DD format
  cnhNumeroRegistro?: string;
  cnhCategoria?: string;
  cnhDataValidade?: string; // YYYY-MM-DD format
}

const initialPessoasFisicas: PessoaFisica[] = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00", email: "joao@exemplo.com", telefone: "(11) 9876-5432", tipoRelacao: "Associado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2024-01-15", cnhNumeroRegistro: "01234567890", cnhCategoria: "AB", cnhDataValidade: "2027-08-14" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99", email: "maria@exemplo.com", telefone: "(21) 1234-5678", tipoRelacao: "Funcionário", organizacaoVinculada: "Empresa Gama", dataCadastro: "2024-02-20", cnhNumeroRegistro: "12345678901", cnhCategoria: "B", cnhDataValidade: "2026-05-20" },
  { id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", email: "carlos@exemplo.com", telefone: "(31) 9988-7766", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2024-03-10" },
  { id: "pf_004", nomeCompleto: "Ana Souza Almeida", cpf: "444.555.666-77", email: "ana@exemplo.com", telefone: "(41) 8765-4321", tipoRelacao: "Associado", organizacaoVinculada: "Associação Beta", dataCadastro: "2024-04-05", cnhNumeroRegistro: "23456789012", cnhCategoria: "A", cnhDataValidade: "2025-11-10" },
  { id: "pf_005", nomeCompleto: "Pedro Martins Rocha", cpf: "777.888.999-00", email: "pedro@exemplo.com", telefone: "(51) 6543-2109", tipoRelacao: "Cooperado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2024-05-01", cnhDataValidade: "2027-08-14" },
  { id: "pf_006", nomeCompleto: "Laura Ferreira Mendes", cpf: "222.333.444-55", email: "laura@exemplo.com", telefone: "(61) 7654-3210", tipoRelacao: "Cliente Geral", organizacaoVinculada: null, dataCadastro: "2023-12-01", cnhCategoria: "B" },
  { id: "pf_007", nomeCompleto: "Bruno Alves Pinto", cpf: "555.666.777-88", email: "bruno@exemplo.com", telefone: "(71) 5432-1098", tipoRelacao: "Associado", organizacaoVinculada: "Cooperativa Alfa", dataCadastro: "2023-11-15", cnhNumeroRegistro: "34567890123", cnhDataValidade: "2028-01-30" },
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
];

const mesesOptions = [
  { value: "todos", label: "Todos" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(0, i), "MMMM", { locale: ptBR }) }))
];

const initialFilters = {
  nomeCompleto: '',
  cpf: '',
  tipoRelacao: 'todos',
  organizacaoVinculada: 'todos',
  dataVencimentoCnhInicio: undefined as Date | undefined, // Renamed
  dataVencimentoCnhFim: undefined as Date | undefined,    // Renamed
  numeroCNH: '',
  categoriaCNH: '',
  mesVencimentoCNH: 'todos',
  anoVencimentoCNH: '',
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
    console.log("Applying filters (placeholder):", filters);

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
    if (filters.numeroCNH) {
      results = results.filter(pf => pf.cnhNumeroRegistro?.includes(filters.numeroCNH));
    }
    if (filters.categoriaCNH) {
      results = results.filter(pf => pf.cnhCategoria?.toLowerCase().includes(filters.categoriaCNH.toLowerCase()));
    }
    if (filters.mesVencimentoCNH !== 'todos') {
      results = results.filter(pf => pf.cnhDataValidade && (parseISO(pf.cnhDataValidade).getMonth() + 1).toString() === filters.mesVencimentoCNH);
    }
    if (filters.anoVencimentoCNH) {
      results = results.filter(pf => pf.cnhDataValidade && parseISO(pf.cnhDataValidade).getFullYear().toString() === filters.anoVencimentoCNH);
    }
    if (filters.dataVencimentoCnhInicio) {
      const startDate = startOfDay(filters.dataVencimentoCnhInicio);
      results = results.filter(pf => {
        if (!pf.cnhDataValidade) return false;
        const pfDate = parseISO(pf.cnhDataValidade);
        return isValid(pfDate) && pfDate >= startDate;
      });
    }
    if (filters.dataVencimentoCnhFim) {
      const endDate = endOfDay(filters.dataVencimentoCnhFim);
      results = results.filter(pf => {
        if (!pf.cnhDataValidade) return false;
        const pfDate = parseISO(pf.cnhDataValidade);
        return isValid(pfDate) && pfDate <= endDate;
      });
    }
    
    setTimeout(() => { 
      setFilteredResults(results);
      setIsLoading(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setFilteredResults(initialPessoasFisicas); 
  };
  
  useEffect(() => {
    // applyFilters(); 
  }, []);

  const handleExportExcel = () => {
    console.log("Exporting to Excel (placeholder)... Data to export:", filteredResults);
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF (placeholder)... Data to export:", filteredResults);
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
              <Select name="organizacaoVinculada" value={filters.organizacaoVinculada} onValueChange={(value) => handleSelectFilterChange('organizacaoVinculada', value)}>
                <SelectTrigger id="organizacaoVinculada"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {organizacoesVinculadasOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="numeroCNH">Número da CNH</Label>
              <Input id="numeroCNH" name="numeroCNH" value={filters.numeroCNH} onChange={handleFilterChange} placeholder="Nº Registro CNH..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="categoriaCNH">Categoria CNH</Label>
              <Input id="categoriaCNH" name="categoriaCNH" value={filters.categoriaCNH} onChange={handleFilterChange} placeholder="Ex: AB, B..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dataVencimentoCnhInicio">Data Vencimento CNH (Início)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.dataVencimentoCnhInicio ? format(filters.dataVencimentoCnhInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataVencimentoCnhInicio} onSelect={(d) => handleDateFilterChange('dataVencimentoCnhInicio', d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
             <div className="space-y-1">
              <Label htmlFor="dataVencimentoCnhFim">Data Vencimento CNH (Fim)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {filters.dataVencimentoCnhFim ? format(filters.dataVencimentoCnhFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataVencimentoCnhFim} onSelect={(d) => handleDateFilterChange('dataVencimentoCnhFim', d)} disabled={(date) => filters.dataVencimentoCnhInicio ? date < filters.dataVencimentoCnhInicio : false} initialFocus /></PopoverContent>
              </Popover>
            </div>
             <div className="space-y-1">
              <Label htmlFor="mesVencimentoCNH">Mês de Vencimento CNH</Label>
              <Select name="mesVencimentoCNH" value={filters.mesVencimentoCNH} onValueChange={(value) => handleSelectFilterChange('mesVencimentoCNH', value)}>
                <SelectTrigger id="mesVencimentoCNH"><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                <SelectContent>
                  {mesesOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="anoVencimentoCNH">Ano de Vencimento CNH</Label>
              <Input id="anoVencimentoCNH" name="anoVencimentoCNH" type="number" value={filters.anoVencimentoCNH} onChange={handleFilterChange} placeholder="AAAA" min={new Date().getFullYear() - 10} max={new Date().getFullYear() + 20} />
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
        </CardContent>
      </Card>
    </div>
  );
}

