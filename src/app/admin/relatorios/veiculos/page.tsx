
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface VeiculoReportItem {
  id: string;
  placa: string;
  modeloNome: string;
  marcaNome: string;
  ano: number;
  tipoEspecie: string | null;
  combustivel: string | null;
  nomeProprietario: string | null;
  tipoProprietario: 'Pessoa Física' | 'Organização' | 'N/A';
}

const placeholderModelosVeiculo = [
  { value: "todos", label: "Todos" },
  { value: "mod_001", label: "Fiat Uno Mille" },
  { value: "mod_002", label: "Volkswagen Gol G5" },
];
const placeholderMarcasVeiculo = [
  { value: "todos", label: "Todas" },
  { value: "fiat", label: "Fiat" },
  { value: "volkswagen", label: "Volkswagen" },
];
const placeholderPessoasFisicas = [
  { value: "pf_001", label: "João da Silva Sauro (123.456.789-00)" },
];
const placeholderOrganizacoes = [
  { value: "org_001", label: "Cooperativa Alfa (11.222.333/0001-44)" },
];

const initialVeiculos: VeiculoReportItem[] = [
  { id: "vei_001", placa: "ABC-1234", modeloNome: "Fiat Uno Mille", marcaNome: "Fiat", ano: 2020, tipoEspecie: "Passageiro", combustivel: "Flex", nomeProprietario: "João da Silva Sauro", tipoProprietario: "Pessoa Física" },
  { id: "vei_002", placa: "DEF-5678", modeloNome: "Volkswagen Gol G5", marcaNome: "Volkswagen", ano: 2021, tipoEspecie: "Passageiro", combustivel: "Gasolina", nomeProprietario: "Cooperativa Alfa", tipoProprietario: "Organização" },
];

const initialFilters = {
  placa: '',
  modelo: 'todos',
  marca: 'todos',
  ano: '',
  tipoProprietario: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  nomeProprietarioId: '', // Store ID of selected owner
};

export default function RelatorioVeiculosPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<VeiculoReportItem[]>(initialVeiculos);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProprietarioOptions, setCurrentProprietarioOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (filters.tipoProprietario === 'pessoa_fisica') {
      setCurrentProprietarioOptions(placeholderPessoasFisicas);
    } else if (filters.tipoProprietario === 'organizacao') {
      setCurrentProprietarioOptions(placeholderOrganizacoes);
    } else {
      setCurrentProprietarioOptions([]);
    }
    // Reset nomeProprietarioId if tipoProprietario changes
    setFilters(prev => ({ ...prev, nomeProprietarioId: '' }));
  }, [filters.tipoProprietario]);


  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectFilterChange = (name: keyof typeof initialFilters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRadioFilterChange = (name: keyof typeof initialFilters, value: 'todos' | 'pessoa_fisica' | 'organizacao') => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setIsLoading(true);
    console.log("Applying filters for Veículos (placeholder):", filters);

    let results = initialVeiculos;
    if (filters.placa) {
      results = results.filter(v => v.placa.toLowerCase().includes(filters.placa.toLowerCase()));
    }
    if (filters.modelo !== 'todos') {
      results = results.filter(v => v.modeloNome === placeholderModelosVeiculo.find(m => m.value === filters.modelo)?.label);
    }
    if (filters.marca !== 'todos') {
      results = results.filter(v => v.marcaNome === placeholderMarcasVeiculo.find(m => m.value === filters.marca)?.label);
    }
    if (filters.ano) {
      results = results.filter(v => v.ano.toString() === filters.ano);
    }
    if (filters.tipoProprietario !== 'todos') {
      results = results.filter(v => v.tipoProprietario.toLowerCase().replace('í', 'i').replace('ç', 'c') === filters.tipoProprietario);
        if (filters.nomeProprietarioId) {
             results = results.filter(v => {
                if (filters.tipoProprietario === 'pessoa_fisica') {
                    return v.nomeProprietario === placeholderPessoasFisicas.find(pf => pf.value === filters.nomeProprietarioId)?.label.split(' (')[0];
                } else if (filters.tipoProprietario === 'organizacao') {
                    return v.nomeProprietario === placeholderOrganizacoes.find(org => org.value === filters.nomeProprietarioId)?.label.split(' (')[0];
                }
                return true;
             });
        }
    }
    
    setTimeout(() => { 
      setFilteredResults(results);
      setIsLoading(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setFilteredResults(initialVeiculos); 
  };

  const handleExportExcel = () => {
    console.log("Exporting Veículos to Excel (placeholder)... Data:", filteredResults);
  };

  const handleExportPDF = () => {
    console.log("Exporting Veículos to PDF (placeholder)... Data:", filteredResults);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Veículos
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
            <div className="space-y-1"><Label htmlFor="placa">Placa</Label><Input id="placa" name="placa" value={filters.placa} onChange={handleFilterChange} placeholder="ABC-1234" /></div>
            <div className="space-y-1"><Label htmlFor="modelo">Modelo</Label>
              {/* Supabase: Options from public.ModelosVeiculo */}
              <Select name="modelo" value={filters.modelo} onValueChange={(v) => handleSelectFilterChange('modelo', v)}><SelectTrigger id="modelo"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderModelosVeiculo.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label htmlFor="marca">Marca</Label>
              {/* Supabase: Options from public.ModelosVeiculo (distinct) or Veiculos (distinct) */}
              <Select name="marca" value={filters.marca} onValueChange={(v) => handleSelectFilterChange('marca', v)}><SelectTrigger id="marca"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderMarcasVeiculo.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label htmlFor="ano">Ano</Label><Input id="ano" name="ano" type="number" value={filters.ano} onChange={handleFilterChange} placeholder="AAAA" /></div>
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-3"><Label>Tipo de Proprietário</Label>
                <RadioGroup defaultValue="todos" name="tipoProprietario" value={filters.tipoProprietario} onValueChange={(v: 'todos' | 'pessoa_fisica' | 'organizacao') => handleRadioFilterChange('tipoProprietario', v)} className="flex space-x-4 mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="todos" id="tipoPropTodos" /><Label htmlFor="tipoPropTodos" className="font-normal">Todos</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa_fisica" id="tipoPropPF" /><Label htmlFor="tipoPropPF" className="font-normal">Pessoa Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="organizacao" id="tipoPropOrg" /><Label htmlFor="tipoPropOrg" className="font-normal">Organização</Label></div>
                </RadioGroup>
            </div>
            {filters.tipoProprietario !== 'todos' && (
                <div className="space-y-1">
                    <Label htmlFor="nomeProprietarioId">Nome do Proprietário</Label>
                    {/* Supabase: Options from public.PessoasFisicas or public.Entidades */}
                    <Select name="nomeProprietarioId" value={filters.nomeProprietarioId} onValueChange={(v) => handleSelectFilterChange('nomeProprietarioId', v)} disabled={currentProprietarioOptions.length === 0}>
                        <SelectTrigger id="nomeProprietarioId"><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                        <SelectContent>{currentProprietarioOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
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
            <CardDescription>Total de {filteredResults.length} Veículos encontrados.</CardDescription>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || filteredResults.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isLoading || filteredResults.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Exportar PDF
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
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Marca</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo/Espécie</TableHead>
                  <TableHead className="hidden lg:table-cell">Combustível</TableHead>
                  <TableHead className="hidden md:table-cell">Proprietário</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Proprietário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{v.id}</TableCell>
                      <TableCell>{v.placa}</TableCell>
                      <TableCell>{v.modeloNome}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.marcaNome}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.ano}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.tipoEspecie || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.combustivel || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.nomeProprietario || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.tipoProprietario}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">Nenhum veículo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* 
        Supabase Integration Notes:
        - Fetch data from public."Veiculos".
        - JOIN public."ModelosVeiculo" on "id_modelo_veiculo" for "modeloNome" and "marcaNome" (if marca is on ModelosVeiculo).
        - Conditionally JOIN public."PessoasFisicas" OR public."Entidades" based on "id_proprietario_pessoa_fisica" / "id_proprietario_entidade" to get "nomeProprietario".
        - Filters to be applied in Supabase query.
        - Dynamic select options: "Modelo" and "Marca" from public."ModelosVeiculo" (or distinct values from Veiculos). "Nome do Proprietário" from PessoasFisicas/Entidades.
      */}
    </div>
  );
}

