
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
// import { format, parseISO, isValid } from "date-fns"; // Not strictly needed for current placeholder logic
// import { ptBR } from 'date-fns/locale'; // Not strictly needed

interface VeiculoReportItem {
  id: string;
  placa_atual: string;
  modelo: string;
  marca: string;
  ano_fabricacao: number | null;
  tipo_especie: string | null;
  combustivel: string | null;
  nome_proprietario: string | null;
  tipo_proprietario: 'Pessoa Física' | 'Organização' | 'N/A';
  codigo_renavam: string | null;
}

// Placeholder data for dynamic selects
const placeholderPessoasFisicas = [ { value: "pf_001", label: "João da Silva Sauro (123.456.789-00)" }];
const placeholderOrganizacoes = [ { value: "org_001", label: "Cooperativa Alfa (11.222.333/0001-44)" }];

const initialVeiculos: VeiculoReportItem[] = [
  { id: "vei_001", placa_atual: "ABC-1234", modelo: "Uno Mille", marca: "Fiat", ano_fabricacao: 2020, tipo_especie: "Passageiro", combustivel: "Flex", nome_proprietario: "João da Silva Sauro", tipo_proprietario: "Pessoa Física", codigo_renavam: "12345678901" },
  { id: "vei_002", placa_atual: "DEF-5678", modelo: "Gol G5", marca: "Volkswagen", ano_fabricacao: 2021, tipo_especie: "Passageiro", combustivel: "Gasolina", nome_proprietario: "Cooperativa Alfa", tipo_proprietario: "Organização", codigo_renavam: "23456789012" },
];

const initialFilters = {
  placa: '',
  modelo: '', // Now text input
  marca: '',  // Now text input
  ano_fabricacao: '',
  tipo_proprietario: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  id_proprietario: '', 
  codigo_renavam: '',
  tipo_especie: '',
  combustivel: '',
};

export default function RelatorioVeiculosPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<VeiculoReportItem[]>(initialVeiculos);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProprietarioOptions, setCurrentProprietarioOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (filters.tipo_proprietario === 'pessoa_fisica') {
      setCurrentProprietarioOptions(placeholderPessoasFisicas);
    } else if (filters.tipo_proprietario === 'organizacao') {
      setCurrentProprietarioOptions(placeholderOrganizacoes);
    } else {
      setCurrentProprietarioOptions([]);
    }
    setFilters(prev => ({ ...prev, id_proprietario: '' }));
  }, [filters.tipo_proprietario]);


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
    // Placeholder: Simulate filtering based on state
    // In real app, this would call Supabase with filter params
    let results = initialVeiculos;
    if (filters.placa) results = results.filter(v => v.placa_atual.toLowerCase().includes(filters.placa.toLowerCase()));
    if (filters.modelo) results = results.filter(v => v.modelo.toLowerCase().includes(filters.modelo.toLowerCase()));
    if (filters.marca) results = results.filter(v => v.marca.toLowerCase().includes(filters.marca.toLowerCase()));
    if (filters.ano_fabricacao) results = results.filter(v => v.ano_fabricacao?.toString() === filters.ano_fabricacao);
    if (filters.codigo_renavam) results = results.filter(v => v.codigo_renavam?.toLowerCase().includes(filters.codigo_renavam.toLowerCase()));
    if (filters.tipo_especie) results = results.filter(v => v.tipo_especie?.toLowerCase().includes(filters.tipo_especie.toLowerCase()));
    if (filters.combustivel) results = results.filter(v => v.combustivel?.toLowerCase().includes(filters.combustivel.toLowerCase()));
    
    if (filters.tipo_proprietario !== 'todos') {
      results = results.filter(v => v.tipo_proprietario.toLowerCase().replace('í', 'i').replace('ç', 'c') === filters.tipo_proprietario);
        if (filters.id_proprietario) {
             results = results.filter(v => {
                // This is a simplified match on name. In Supabase, you'd filter by ID.
                const selectedProprietarioLabel = currentProprietarioOptions.find(p => p.value === filters.id_proprietario)?.label.split(' (')[0];
                return v.nome_proprietario === selectedProprietarioLabel;
             });
        }
    }
    
    setTimeout(() => { setFilteredResults(results); setIsLoading(false); }, 500);
  };

  const clearFilters = () => { setFilters(initialFilters); setFilteredResults(initialVeiculos); };
  const handleExportExcel = () => { console.log("Exporting Veículos to Excel (placeholder)... Data:", filteredResults); };
  const handleExportPDF = () => { console.log("Exporting Veículos to PDF (placeholder)... Data:", filteredResults); };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Veículos
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
            <div className="space-y-1"><Label htmlFor="placa">Placa</Label><Input id="placa" name="placa" value={filters.placa} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="marca">Marca</Label><Input id="marca" name="marca" value={filters.marca} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="modelo">Modelo</Label><Input id="modelo" name="modelo" value={filters.modelo} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="ano_fabricacao">Ano Fabricação</Label><Input id="ano_fabricacao" name="ano_fabricacao" type="number" value={filters.ano_fabricacao} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="codigo_renavam">Renavam</Label><Input id="codigo_renavam" name="codigo_renavam" value={filters.codigo_renavam} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="tipo_especie">Tipo/Espécie</Label><Input id="tipo_especie" name="tipo_especie" value={filters.tipo_especie} onChange={handleFilterChange} /></div>
            <div className="space-y-1"><Label htmlFor="combustivel">Combustível</Label><Input id="combustivel" name="combustivel" value={filters.combustivel} onChange={handleFilterChange} /></div>
            
            <div className="space-y-1 md:col-span-2 lg:col-span-1"><Label>Tipo de Proprietário</Label>
                <RadioGroup name="tipo_proprietario" value={filters.tipo_proprietario} onValueChange={(v) => handleRadioFilterChange('tipo_proprietario', v as any)} className="flex space-x-4 mt-1">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="todos" id="tipoPropTodos" /><Label htmlFor="tipoPropTodos" className="font-normal">Todos</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa_fisica" id="tipoPropPF" /><Label htmlFor="tipoPropPF" className="font-normal">Pessoa Física</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="organizacao" id="tipoPropOrg" /><Label htmlFor="tipoPropOrg" className="font-normal">Organização</Label></div>
                </RadioGroup>
            </div>
            {filters.tipo_proprietario !== 'todos' && (
                <div className="space-y-1">
                    <Label htmlFor="id_proprietario">Nome do Proprietário</Label>
                    <Select name="id_proprietario" value={filters.id_proprietario} onValueChange={(v) => handleSelectFilterChange('id_proprietario', v)} disabled={currentProprietarioOptions.length === 0}>
                        <SelectTrigger id="id_proprietario"><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                        <SelectContent>{currentProprietarioOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
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
            <CardDescription>Total de {filteredResults.length} Veículos.</CardDescription>
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
                  <TableHead className="w-[60px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Ano Fab.</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo/Espécie</TableHead>
                  <TableHead className="hidden lg:table-cell">Combustível</TableHead>
                  <TableHead className="hidden lg:table-cell">Renavam</TableHead>
                  <TableHead className="hidden md:table-cell">Proprietário</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Proprietário</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={10} className="text-center h-24">Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{v.id}</TableCell>
                      <TableCell>{v.placa_atual}</TableCell>
                      <TableCell>{v.marca}</TableCell>
                      <TableCell>{v.modelo}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.ano_fabricacao || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.tipo_especie || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.combustivel || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.codigo_renavam || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{v.nome_proprietario || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{v.tipo_proprietario}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={10} className="text-center h-24 text-muted-foreground">Nenhum veículo encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/* 
Supabase Integration Notes:
- Fetch data from public."Veiculos".
- No more JOIN with ModelosVeiculo as marca/modelo are direct.
- JOIN PessoasFisicas OR Entidades for proprietario details.
- Filters for marca, modelo are now text inputs.
- Dynamic select options for proprietário based on tipo_proprietario selection.
*/

    