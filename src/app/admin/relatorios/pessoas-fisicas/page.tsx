
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
import { LineChart, ArrowLeft, Filter, XSquare, FileSpreadsheet, FileText as FileTextIcon, Loader2 } from "lucide-react";
import { format, parseISO, isValid, startOfDay, endOfDay, getMonth, getYear } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface PessoaFisicaSupabase {
  id_pessoa_fisica: number;
  nome_completo: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipo_relacao: string | null;
  data_cadastro: string;
  MembrosEntidade?: {
    id_entidade_pai: number; 
    "Entidades!MembrosEntidade_id_entidade_pai_fkey": { nome: string } | null;
  }[] | null;
  CNHs?: {
    numero_registro: string;
    categoria: string;
    data_validade: string;
  }[] | null;
}

interface PessoaFisicaReportItem {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  tipoRelacao: string | null;
  organizacaoVinculada: string | null;
  dataCadastro: string;
  cnhNumeroRegistro?: string | null;
  cnhCategoria?: string | null;
  cnhDataValidade?: string | null;
  _organizacaoId?: string; // Internal for client-side filtering if needed
}

const tiposRelacaoOptions = [
  { value: "todos", label: "Todos" },
  { value: "Associado", label: "Associado" },
  { value: "Cooperado", label: "Cooperado" },
  { value: "Funcionário", label: "Funcionário" },
  { value: "Cliente Geral", label: "Cliente Geral" },
];

const mesesOptions = [
  { value: "todos", label: "Todos" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(2000, i), "MMMM", { locale: ptBR }) }))
];

const initialFilters = {
  nomeCompleto: '',
  cpf: '',
  tipoRelacao: 'todos',
  organizacaoVinculadaId: 'todos',
  dataVencimentoCnhInicio: undefined as Date | undefined,
  dataVencimentoCnhFim: undefined as Date | undefined,
  numeroCNH: '',
  categoriaCNH: '',
  mesVencimentoCNH: 'todos',
  anoVencimentoCNH: '',
};

export default function RelatorioPessoasFisicasPage() {
  console.log("RelatorioPessoasFisicasPage: Component Mounting");
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<PessoaFisicaReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [organizacaoOptions, setOrganizacaoOptions] = useState<{ value: string; label: string }[]>([{ value: "todos", label: "Todas" }]);

  useEffect(() => {
    console.log("RelatorioPessoasFisicasPage: Initial useEffect triggered, calling applyFilters and fetchOrganizacoes.");
    applyFilters();
    fetchOrganizacoes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  const fetchOrganizacoes = async () => {
    if (!supabase) return;
    console.log("RelatorioPessoasFisicasPage: Fetching organizações for filter dropdown.");
    const { data, error } = await supabase.from('Entidades').select('id_entidade, nome').order('nome');
    if (error) {
      toast({ title: "Erro ao buscar organizações", description: error.message, variant: "destructive" });
    } else if (data) {
      setOrganizacaoOptions([{ value: "todos", label: "Todas" }, ...data.map(org => ({ value: org.id_entidade.toString(), label: org.nome }))]);
    }
  };

  const applyFilters = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setFilteredResults([]);
      return;
    }
    setIsLoading(true);
    console.log("RelatorioPessoasFisicasPage: applyFilters called. Filters:", filters);

    try {
      let query = supabase
        .from('PessoasFisicas')
        .select(`
          id_pessoa_fisica,
          nome_completo,
          cpf,
          email,
          telefone,
          tipo_relacao,
          data_cadastro,
          MembrosEntidade!left (
            id_entidade_pai, 
            Entidades!MembrosEntidade_id_entidade_pai_fkey ( nome )
          ),
          CNHs!left (
            numero_registro,
            categoria,
            data_validade
          )
        `);

      if (filters.nomeCompleto) query = query.ilike('nome_completo', `%${filters.nomeCompleto}%`);
      if (filters.cpf) query = query.ilike('cpf', `%${filters.cpf.replace(/\D/g, '')}%`);
      if (filters.tipoRelacao !== 'todos') query = query.eq('tipo_relacao', filters.tipoRelacao);
      
      // Filtering by organizacaoVinculadaId on the server-side for related table ID
      // This requires that 'MembrosEntidade.id_entidade_pai' is directly accessible or filtered in a way Supabase understands.
      // The current select will fetch it, then we can filter client-side or refine query.
      // For more complex relation filtering, a view or RPC might be better.
      // If direct filtering isn't working: perform it client-side after fetch for now.

      if (filters.numeroCNH) query = query.ilike('CNHs.numero_registro', `%${filters.numeroCNH}%`);
      if (filters.categoriaCNH) query = query.ilike('CNHs.categoria', `%${filters.categoriaCNH}%`);
      
      if (filters.dataVencimentoCnhInicio) query = query.gte('CNHs.data_validade', format(startOfDay(filters.dataVencimentoCnhInicio), 'yyyy-MM-dd'));
      if (filters.dataVencimentoCnhFim) query = query.lte('CNHs.data_validade', format(endOfDay(filters.dataVencimentoCnhFim), 'yyyy-MM-dd'));
      
      console.log("RelatorioPessoasFisicasPage: Querying Supabase...");
      const { data, error } = await query;
      console.log("RelatorioPessoasFisicasPage: Supabase response. Error:", error, "Data length:", data?.length);

      if (error) throw error;

      let mappedData = (data || []).map((pf: PessoaFisicaSupabase): PessoaFisicaReportItem => {
        const cnh = pf.CNHs && pf.CNHs.length > 0 ? pf.CNHs[0] : null;
        const orgVinculadaInfo = pf.MembrosEntidade && pf.MembrosEntidade.length > 0 
            ? pf.MembrosEntidade[0]
            : null;
        const orgNome = orgVinculadaInfo && orgVinculadaInfo["Entidades!MembrosEntidade_id_entidade_pai_fkey"]
            ? orgVinculadaInfo["Entidades!MembrosEntidade_id_entidade_pai_fkey"].nome
            : null;
        
        return {
          id: pf.id_pessoa_fisica.toString(),
          nomeCompleto: pf.nome_completo,
          cpf: pf.cpf,
          email: pf.email,
          telefone: pf.telefone,
          tipoRelacao: pf.tipo_relacao,
          organizacaoVinculada: orgNome,
          dataCadastro: pf.data_cadastro ? format(parseISO(pf.data_cadastro), 'dd/MM/yyyy') : 'N/A',
          cnhNumeroRegistro: cnh?.numero_registro,
          cnhCategoria: cnh?.categoria,
          cnhDataValidade: cnh?.data_validade,
          _organizacaoId: orgVinculadaInfo ? orgVinculadaInfo.id_entidade_pai?.toString() : undefined,
        };
      });

      // Client-side filtering for organizacaoVinculadaId
      if (filters.organizacaoVinculadaId !== 'todos') {
        mappedData = mappedData.filter(pf => pf._organizacaoId === filters.organizacaoVinculadaId);
      }
      
      if (filters.mesVencimentoCNH !== 'todos') {
        mappedData = mappedData.filter(pf => pf.cnhDataValidade && (getMonth(parseISO(pf.cnhDataValidade)) + 1).toString() === filters.mesVencimentoCNH);
      }
      if (filters.anoVencimentoCNH) {
        mappedData = mappedData.filter(pf => pf.cnhDataValidade && getYear(parseISO(pf.cnhDataValidade)).toString() === filters.anoVencimentoCNH);
      }
      
      console.log("RelatorioPessoasFisicasPage: Setting filteredResults with", mappedData.length, "items.");
      setFilteredResults(mappedData);

    } catch (error: any) {
      console.error("RelatorioPessoasFisicasPage: Erro ao aplicar filtros/buscar dados:", JSON.stringify(error, null, 2));
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

  const clearFilters = () => { 
    setFilters(initialFilters); 
    applyFilters();
  };
  
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  const handleExportExcel = () => { console.log("Exporting to Excel (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (Excel)"})};
  const handleExportPDF = () => { console.log("Exporting to PDF (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (PDF)"})};

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
                <LineChart className="mr-3 h-8 w-8" /> Relatório de Pessoas Físicas
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
              <div className="space-y-1"><Label htmlFor="nomeCompleto">Nome Completo</Label><Input id="nomeCompleto" name="nomeCompleto" value={filters.nomeCompleto} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="cpf">CPF</Label><Input id="cpf" name="cpf" value={filters.cpf} onChange={handleFilterChange} /></div>
              
              <div className="space-y-1"><Label htmlFor="tipoRelacao">Tipo de Relação</Label>
                <Select name="tipoRelacao" value={filters.tipoRelacao} onValueChange={(v) => handleSelectFilterChange('tipoRelacao', v)}>
                  <SelectTrigger id="tipoRelacao"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tiposRelacaoOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="organizacaoVinculadaId">Organização Vinculada</Label>
                <Select name="organizacaoVinculadaId" value={filters.organizacaoVinculadaId} onValueChange={(v) => handleSelectFilterChange('organizacaoVinculadaId', v)}>
                  <SelectTrigger id="organizacaoVinculadaId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{organizacaoOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="numeroCNH">Número da CNH</Label><Input id="numeroCNH" name="numeroCNH" value={filters.numeroCNH} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="categoriaCNH">Categoria CNH</Label><Input id="categoriaCNH" name="categoriaCNH" value={filters.categoriaCNH} onChange={handleFilterChange} /></div>
              
              <div className="space-y-1"><Label htmlFor="dataVencimentoCnhInicio">Data Venc. CNH (Início)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataVencimentoCnhInicio ? format(filters.dataVencimentoCnhInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataVencimentoCnhInicio} onSelect={(d) => handleDateFilterChange('dataVencimentoCnhInicio', d)} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="dataVencimentoCnhFim">Data Venc. CNH (Fim)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataVencimentoCnhFim ? format(filters.dataVencimentoCnhFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataVencimentoCnhFim} onSelect={(d) => handleDateFilterChange('dataVencimentoCnhFim', d)} disabled={(date) => filters.dataVencimentoCnhInicio ? date < filters.dataVencimentoCnhInicio : false} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="mesVencimentoCNH">Mês Venc. CNH</Label>
                <Select name="mesVencimentoCNH" value={filters.mesVencimentoCNH} onValueChange={(v) => handleSelectFilterChange('mesVencimentoCNH', v)}>
                  <SelectTrigger id="mesVencimentoCNH"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{mesesOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="anoVencimentoCNH">Ano Venc. CNH</Label><Input id="anoVencimentoCNH" name="anoVencimentoCNH" type="number" value={filters.anoVencimentoCNH} onChange={handleFilterChange} placeholder="AAAA" /></div>
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
            <CardDescription>Total de {filteredResults.length} Pessoas Físicas.</CardDescription>
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
                  <TableHead>Nome Completo</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Relação</TableHead>
                  <TableHead className="hidden lg:table-cell">Organização Vinculada</TableHead>
                  <TableHead className="hidden lg:table-cell">CNH (Nº)</TableHead>
                  <TableHead className="hidden xl:table-cell">CNH (Cat.)</TableHead>
                  <TableHead className="hidden xl:table-cell">CNH (Val.)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (<TableRow><TableCell colSpan={10} className="text-center h-24"><Loader2 className="inline-block mr-2 h-6 w-6 animate-spin"/>Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{d.id}</TableCell>
                      <TableCell>{d.nomeCompleto}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.cpf}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.email || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.telefone || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.tipoRelacao || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.organizacaoVinculada || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{d.cnhNumeroRegistro || "N/A"}</TableCell>
                      <TableCell className="hidden xl:table-cell">{d.cnhCategoria || "N/A"}</TableCell>
                      <TableCell className="hidden xl:table-cell">{d.cnhDataValidade ? format(parseISO(d.cnhDataValidade), 'dd/MM/yyyy') : "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={10} className="text-center h-24 text-muted-foreground">Nenhuma pessoa física encontrada.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
