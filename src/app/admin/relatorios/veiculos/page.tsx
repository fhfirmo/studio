
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
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface VeiculoSupabase {
  id_veiculo: number;
  placa_atual: string;
  marca: string;
  modelo: string;
  ano_fabricacao: number | null;
  tipo_especie: string | null;
  combustivel: string | null;
  codigo_renavam: string | null;
  id_proprietario_pessoa_fisica: number | null;
  id_proprietario_entidade: number | null;
  PessoasFisicas?: { nome_completo: string } | null;
  Entidades?: { nome: string } | null;
}

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

const initialFilters = {
  placa: '',
  modelo: '',
  marca: '',
  ano_fabricacao: '',
  tipo_proprietario: 'todos' as 'todos' | 'pessoa_fisica' | 'organizacao',
  id_proprietario: '', 
  codigo_renavam: '',
  tipo_especie: '',
  combustivel: '',
};

export default function RelatorioVeiculosPage() {
  console.log("RelatorioVeiculosPage: Component Mounting");
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<VeiculoReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [proprietarioPessoaFisicaOptions, setProprietarioPessoaFisicaOptions] = useState<{value: string, label: string}[]>([]);
  const [proprietarioOrganizacaoOptions, setProprietarioOrganizacaoOptions] = useState<{value: string, label: string}[]>([]);
  const [currentProprietarioOptions, setCurrentProprietarioOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    console.log("RelatorioVeiculosPage: Initial useEffect triggered, calling applyFilters and fetchDropdownOptions.");
    applyFilters();
    fetchDropdownOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    if (filters.tipo_proprietario === 'pessoa_fisica') {
      setCurrentProprietarioOptions(proprietarioPessoaFisicaOptions);
    } else if (filters.tipo_proprietario === 'organizacao') {
      setCurrentProprietarioOptions(proprietarioOrganizacaoOptions);
    } else {
      setCurrentProprietarioOptions([]);
    }
    // Reset id_proprietario if type changes and current selection might be invalid
    if (filters.id_proprietario && 
        (filters.tipo_proprietario === 'pessoa_fisica' && !proprietarioPessoaFisicaOptions.find(o => o.value === filters.id_proprietario)) ||
        (filters.tipo_proprietario === 'organizacao' && !proprietarioOrganizacaoOptions.find(o => o.value === filters.id_proprietario)) ) {
      setFilters(prev => ({ ...prev, id_proprietario: '' }));
    }
  }, [filters.tipo_proprietario, filters.id_proprietario, proprietarioPessoaFisicaOptions, proprietarioOrganizacaoOptions]);


  const fetchDropdownOptions = async () => {
    if (!supabase) return;
    console.log("RelatorioVeiculosPage: Fetching dropdown options for Proprietarios.");
    const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo');
    if (pfError) toast({ title: "Erro ao buscar Pessoas Físicas", description: pfError.message, variant: "destructive" });
    else if (pfData) setProprietarioPessoaFisicaOptions(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: `${pf.nome_completo} (${pf.cpf})` })));

    const { data: orgData, error: orgError } = await supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome');
    if (orgError) toast({ title: "Erro ao buscar Organizações", description: orgError.message, variant: "destructive" });
    else if (orgData) setProprietarioOrganizacaoOptions(orgData.map(org => ({ value: org.id_entidade.toString(), label: `${org.nome} (${org.cnpj})` })));
  };

  const applyFilters = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setFilteredResults([]);
      return;
    }
    setIsLoading(true);
    console.log("RelatorioVeiculosPage: applyFilters called. Filters:", filters);

    try {
      let query = supabase
        .from('Veiculos')
        .select(`
          id_veiculo,
          placa_atual,
          marca,
          modelo,
          ano_fabricacao,
          tipo_especie,
          combustivel,
          codigo_renavam,
          id_proprietario_pessoa_fisica,
          id_proprietario_entidade,
          PessoasFisicas!Veiculos_id_proprietario_pessoa_fisica_fkey ( nome_completo ),
          Entidades!Veiculos_id_proprietario_entidade_fkey ( nome )
        `);

      if (filters.placa) query = query.ilike('placa_atual', `%${filters.placa}%`);
      if (filters.marca) query = query.ilike('marca', `%${filters.marca}%`);
      if (filters.modelo) query = query.ilike('modelo', `%${filters.modelo}%`);
      if (filters.ano_fabricacao) query = query.eq('ano_fabricacao', parseInt(filters.ano_fabricacao));
      if (filters.codigo_renavam) query = query.ilike('codigo_renavam', `%${filters.codigo_renavam}%`);
      if (filters.tipo_especie) query = query.ilike('tipo_especie', `%${filters.tipo_especie}%`);
      if (filters.combustivel) query = query.ilike('combustivel', `%${filters.combustivel}%`);

      if (filters.tipo_proprietario === 'pessoa_fisica' && filters.id_proprietario) {
        query = query.eq('id_proprietario_pessoa_fisica', parseInt(filters.id_proprietario));
      } else if (filters.tipo_proprietario === 'organizacao' && filters.id_proprietario) {
        query = query.eq('id_proprietario_entidade', parseInt(filters.id_proprietario));
      } else if (filters.tipo_proprietario === 'pessoa_fisica' && !filters.id_proprietario) {
          query = query.not('id_proprietario_pessoa_fisica', 'is', null);
      } else if (filters.tipo_proprietario === 'organizacao' && !filters.id_proprietario) {
          query = query.not('id_proprietario_entidade', 'is', null);
      }
      
      console.log("RelatorioVeiculosPage: Querying Supabase...");
      const { data, error } = await query;
      console.log("RelatorioVeiculosPage: Supabase response. Error:", error, "Data length:", data?.length);

      if (error) throw error;

      const mappedData = (data || []).map((v: VeiculoSupabase): VeiculoReportItem => {
        let nomeProp: string | null = null;
        let tipoProp: VeiculoReportItem['tipo_proprietario'] = 'N/A';
        if (v.id_proprietario_pessoa_fisica && v.PessoasFisicas) {
          nomeProp = v.PessoasFisicas.nome_completo;
          tipoProp = 'Pessoa Física';
        } else if (v.id_proprietario_entidade && v.Entidades) {
          nomeProp = v.Entidades.nome;
          tipoProp = 'Organização';
        }
        return {
          id: v.id_veiculo.toString(),
          placa_atual: v.placa_atual,
          marca: v.marca,
          modelo: v.modelo,
          ano_fabricacao: v.ano_fabricacao,
          tipo_especie: v.tipo_especie,
          combustivel: v.combustivel,
          nome_proprietario: nomeProp,
          tipo_proprietario: tipoProp,
          codigo_renavam: v.codigo_renavam,
        };
      });
      console.log("RelatorioVeiculosPage: Setting filteredResults with", mappedData.length, "items.");
      setFilteredResults(mappedData);
    } catch (error: any) {
      console.error("RelatorioVeiculosPage: Erro ao aplicar filtros/buscar dados:", JSON.stringify(error, null, 2));
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
  
  const handleRadioFilterChange = (name: keyof typeof initialFilters, value: 'todos' | 'pessoa_fisica' | 'organizacao') => {
    setFilters(prev => ({ ...prev, [name]: value, id_proprietario: '' })); 
  };

  const clearFilters = () => { 
    setFilters(initialFilters); 
    applyFilters();
  };
  
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleExportExcel = () => { console.log("Exporting Veículos to Excel (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (Excel)"}) };
  const handleExportPDF = () => { console.log("Exporting Veículos to PDF (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (PDF)"}) };

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
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1"><Label htmlFor="placa">Placa</Label><Input id="placa" name="placa" value={filters.placa} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="marca">Marca</Label><Input id="marca" name="marca" value={filters.marca} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="modelo">Modelo</Label><Input id="modelo" name="modelo" value={filters.modelo} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="ano_fabricacao">Ano Fabricação</Label><Input id="ano_fabricacao" name="ano_fabricacao" type="number" value={filters.ano_fabricacao} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="codigo_renavam">Renavam</Label><Input id="codigo_renavam" name="codigo_renavam" value={filters.codigo_renavam} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="tipo_especie">Tipo/Espécie</Label><Input id="tipo_especie" name="tipo_especie" value={filters.tipo_especie} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="combustivel">Combustível</Label><Input id="combustivel" name="combustivel" value={filters.combustivel} onChange={handleFilterChange} /></div>
              
              <div className="space-y-1 md:col-span-1"><Label>Tipo de Proprietário</Label>
                  <RadioGroup name="tipo_proprietario" value={filters.tipo_proprietario} onValueChange={(v) => handleRadioFilterChange('tipo_proprietario', v as any)} className="flex space-x-4 mt-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="todos" id="tipoPropTodos" /><Label htmlFor="tipoPropTodos" className="font-normal">Todos</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="pessoa_fisica" id="tipoPropPF" /><Label htmlFor="tipoPropPF" className="font-normal">Pessoa Física</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="organizacao" id="tipoPropOrg" /><Label htmlFor="tipoPropOrg" className="font-normal">Organização</Label></div>
                  </RadioGroup>
              </div>
              {filters.tipo_proprietario !== 'todos' && (
                  <div className="space-y-1 md:col-span-2">
                      <Label htmlFor="id_proprietario">Nome do Proprietário</Label>
                      <Select name="id_proprietario" value={filters.id_proprietario} onValueChange={(v) => handleSelectFilterChange('id_proprietario', v)} disabled={currentProprietarioOptions.length === 0}>
                          <SelectTrigger id="id_proprietario"><SelectValue placeholder="Selecione o proprietário" /></SelectTrigger>
                          <SelectContent>{currentProprietarioOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
              )}
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
                {isLoading ? (<TableRow><TableCell colSpan={10} className="text-center h-24"><Loader2 className="inline-block mr-2 h-6 w-6 animate-spin"/>Carregando...</TableCell></TableRow>)
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
