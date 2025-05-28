
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
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface DocumentoSupabase {
  id_arquivo: string;
  nome_arquivo: string;
  tipo_documento: string | null;
  data_upload: string;
  tamanho_bytes: number;
  id_pessoa_fisica_associada: number | null;
  id_entidade_associada: number | null;
  id_veiculo: number | null;
  id_seguro: number | null;
  PessoasFisicas?: { nome_completo: string } | null;
  Entidades?: { nome: string } | null;
  Veiculos?: { placa_atual: string, marca?: string | null, modelo?: string | null } | null;
  Seguros?: { numero_apolice: string } | null;
}

interface DocumentoReportItem {
  id: string;
  titulo: string;
  tipoDocumento: string | null;
  dataUpload: string;
  tamanho: string;
  associadoANome: string | null;
  tipoAssociacao: 'Todos' | 'Pessoa Física' | 'Organização' | 'Veículo' | 'Seguro' | 'Nenhum';
}

const documentTypesFilterOptions = [ 
  { value: "todos", label: "Todos" }, { value: "contrato", label: "Contrato" },
  { value: "laudo", label: "Laudo" }, { value: "apolice", label: "Apólice" },
  { value: "proposta", label: "Proposta Comercial" }, { value: "termo", label: "Termo" },
  { value: "documento_pessoal", label: "Documento Pessoal" }, { value: "comprovante", label: "Comprovante" },
  { value: "manual", label: "Manual" }, { value: "outro", label: "Outro" },
];

const tiposAssociacaoFilterOptions = [
  { value: "todos", label: "Todos Tipos" }, { value: "Pessoa Física", label: "Pessoa Física" },
  { value: "Organização", label: "Organização" }, { value: "Veículo", label: "Veículo" },
  { value: "Seguro", label: "Seguro" }, { value: "Nenhum", label: "Nenhum" },
];

const initialFilters = {
  titulo: '',
  tipoDocumento: 'todos',
  dataUploadInicio: undefined as Date | undefined,
  dataUploadFim: undefined as Date | undefined,
  tipoAssociacao: 'todos' as DocumentoReportItem['tipoAssociacao'] | 'todos',
  associadoAId: '',
};

export default function RelatorioDocumentosPage() {
  console.log("RelatorioDocumentosPage: Component Mounting");
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [filteredResults, setFilteredResults] = useState<DocumentoReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [associadoPessoaFisicaOptions, setAssociadoPessoaFisicaOptions] = useState<{value: string, label: string}[]>([]);
  const [associadoOrganizacaoOptions, setAssociadoOrganizacaoOptions] = useState<{value: string, label: string}[]>([]);
  const [associadoVeiculoOptions, setAssociadoVeiculoOptions] = useState<{value: string, label: string}[]>([]);
  const [associadoSeguroOptions, setAssociadoSeguroOptions] = useState<{value: string, label: string}[]>([]);
  const [currentAssociadoAOptions, setCurrentAssociadoAOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    console.log("RelatorioDocumentosPage: Initial useEffect triggered, calling applyFilters and fetchDropdownOptions.");
    applyFilters();
    fetchDropdownOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    switch(filters.tipoAssociacao) {
        case 'Pessoa Física': setCurrentAssociadoAOptions(associadoPessoaFisicaOptions); break;
        case 'Organização': setCurrentAssociadoAOptions(associadoOrganizacaoOptions); break;
        case 'Veículo': setCurrentAssociadoAOptions(associadoVeiculoOptions); break;
        case 'Seguro': setCurrentAssociadoAOptions(associadoSeguroOptions); break;
        default: setCurrentAssociadoAOptions([]); break;
    }
    if (filters.associadoAId && !currentAssociadoAOptions.find(opt => opt.value === filters.associadoAId)) {
        setFilters(prev => ({ ...prev, associadoAId: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.tipoAssociacao, associadoPessoaFisicaOptions, associadoOrganizacaoOptions, associadoVeiculoOptions, associadoSeguroOptions]);

  const fetchDropdownOptions = async () => {
    if(!supabase) return;
    console.log("RelatorioDocumentosPage: Fetching dropdown options for associations.");
    const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo').order('nome_completo');
    if(pfError) toast({title: "Erro Pessoas Físicas", description: pfError.message, variant: "destructive"}); else if(pfData) setAssociadoPessoaFisicaOptions(pfData.map(pf => ({value: pf.id_pessoa_fisica.toString(), label: pf.nome_completo})));

    const { data: orgData, error: orgError } = await supabase.from('Entidades').select('id_entidade, nome').order('nome');
    if(orgError) toast({title: "Erro Organizações", description: orgError.message, variant: "destructive"}); else if(orgData) setAssociadoOrganizacaoOptions(orgData.map(org => ({value: org.id_entidade.toString(), label: org.nome})));
    
    const { data: veiData, error: veiError } = await supabase.from('Veiculos').select('id_veiculo, placa_atual, marca, modelo').order('placa_atual');
    if(veiError) toast({title: "Erro Veículos", description: veiError.message, variant: "destructive"}); else if(veiData) setAssociadoVeiculoOptions(veiData.map(v => ({value: v.id_veiculo.toString(), label: `${v.placa_atual} (${v.marca} ${v.modelo})`})));

    const { data: segData, error: segError } = await supabase.from('Seguros').select('id_seguro, numero_apolice').order('numero_apolice');
    if(segError) toast({title: "Erro Seguros", description: segError.message, variant: "destructive"}); else if(segData) setAssociadoSeguroOptions(segData.map(s => ({value: s.id_seguro.toString(), label: s.numero_apolice})));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const applyFilters = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setFilteredResults([]);
      return;
    }
    setIsLoading(true);
    console.log("RelatorioDocumentosPage: applyFilters called. Filters:", filters);

    try {
      let query = supabase
        .from('Arquivos')
        .select(`
          id_arquivo,
          nome_arquivo,
          tipo_documento,
          data_upload,
          tamanho_bytes,
          id_pessoa_fisica_associada,
          id_entidade_associada,
          id_veiculo,
          id_seguro,
          PessoasFisicas ( nome_completo ),
          Entidades ( nome ),
          Veiculos ( placa_atual, marca, modelo ),
          Seguros ( numero_apolice )
        `);

      if (filters.titulo) query = query.ilike('nome_arquivo', `%${filters.titulo}%`);
      if (filters.tipoDocumento !== 'todos') query = query.eq('tipo_documento', filters.tipoDocumento);
      if (filters.dataUploadInicio) query = query.gte('data_upload', format(startOfDay(filters.dataUploadInicio), 'yyyy-MM-dd'));
      if (filters.dataUploadFim) query = query.lte('data_upload', format(endOfDay(filters.dataUploadFim), 'yyyy-MM-dd'));

      if (filters.tipoAssociacao !== 'todos' && filters.tipoAssociacao !== 'Nenhum') {
          if (filters.associadoAId) {
              if(filters.tipoAssociacao === 'Pessoa Física') query = query.eq('id_pessoa_fisica_associada', parseInt(filters.associadoAId));
              else if(filters.tipoAssociacao === 'Organização') query = query.eq('id_entidade_associada', parseInt(filters.associadoAId));
              else if(filters.tipoAssociacao === 'Veículo') query = query.eq('id_veiculo', parseInt(filters.associadoAId));
              else if(filters.tipoAssociacao === 'Seguro') query = query.eq('id_seguro', parseInt(filters.associadoAId));
          } else { 
              if(filters.tipoAssociacao === 'Pessoa Física') query = query.not('id_pessoa_fisica_associada', 'is', null);
              else if(filters.tipoAssociacao === 'Organização') query = query.not('id_entidade_associada', 'is', null);
              else if(filters.tipoAssociacao === 'Veículo') query = query.not('id_veiculo', 'is', null);
              else if(filters.tipoAssociacao === 'Seguro') query = query.not('id_seguro', 'is', null);
          }
      } else if (filters.tipoAssociacao === 'Nenhum') {
          query = query.is('id_pessoa_fisica_associada', null)
                       .is('id_entidade_associada', null)
                       .is('id_veiculo', null)
                       .is('id_seguro', null);
      }
      
      console.log("RelatorioDocumentosPage: Querying Supabase...");
      const { data, error } = await query;
      console.log("RelatorioDocumentosPage: Supabase response. Error:", error, "Data length:", data?.length);

      if (error) throw error;

      const mappedData = (data || []).map((doc: DocumentoSupabase): DocumentoReportItem => {
        let associadoNome: string | null = null;
        let associacaoTipo: DocumentoReportItem['tipoAssociacao'] = 'Nenhum';

        if (doc.id_pessoa_fisica_associada && doc.PessoasFisicas) {
          associadoNome = doc.PessoasFisicas.nome_completo;
          associacaoTipo = 'Pessoa Física';
        } else if (doc.id_entidade_associada && doc.Entidades) {
          associadoNome = doc.Entidades.nome;
          associacaoTipo = 'Organização';
        } else if (doc.id_veiculo && doc.Veiculos) {
          associadoNome = `${doc.Veiculos.placa_atual} (${doc.Veiculos.marca || ''} ${doc.Veiculos.modelo || ''})`.trim();
          associacaoTipo = 'Veículo';
        } else if (doc.id_seguro && doc.Seguros) {
          associadoNome = doc.Seguros.numero_apolice;
          associacaoTipo = 'Seguro';
        }
        return {
          id: doc.id_arquivo,
          titulo: doc.nome_arquivo,
          tipoDocumento: doc.tipo_documento,
          dataUpload: doc.data_upload ? format(parseISO(doc.data_upload), 'dd/MM/yyyy') : 'N/A',
          tamanho: formatBytes(doc.tamanho_bytes || 0),
          associadoANome: associadoNome,
          tipoAssociacao: associacaoTipo,
        };
      });
      console.log("RelatorioDocumentosPage: Setting filteredResults with", mappedData.length, "items.");
      setFilteredResults(mappedData);
    } catch (error: any) {
      console.error("RelatorioDocumentosPage: Erro ao aplicar filtros/buscar dados:", JSON.stringify(error, null, 2));
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
    setFilters(prev => ({ ...prev, [name]: value as any })); // Cast to any if type issues with name
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
  
  const handleExportExcel = () => { console.log("Exporting Documentos to Excel (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (Excel)"}) };
  const handleExportPDF = () => { console.log("Exporting Documentos to PDF (placeholder)... Data:", filteredResults); toast({title: "Exportação Iniciada (PDF)"}) };

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
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1"><Label htmlFor="titulo">Título</Label><Input id="titulo" name="titulo" value={filters.titulo} onChange={handleFilterChange} /></div>
              <div className="space-y-1"><Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                <Select name="tipoDocumento" value={filters.tipoDocumento} onValueChange={(v) => handleSelectFilterChange('tipoDocumento', v)}>
                  <SelectTrigger id="tipoDocumento"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{documentTypesFilterOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label htmlFor="dataUploadInicio">Data Upload (Início)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataUploadInicio ? format(filters.dataUploadInicio, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataUploadInicio} onSelect={(d) => handleDateFilterChange('dataUploadInicio', d)} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label htmlFor="dataUploadFim">Data Upload (Fim)</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{filters.dataUploadFim ? format(filters.dataUploadFim, "PPP", { locale: ptBR }) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={filters.dataUploadFim} onSelect={(d) => handleDateFilterChange('dataUploadFim', d)} disabled={(date) => filters.dataUploadInicio ? date < filters.dataUploadInicio : false} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1">
                  <Label htmlFor="tipoAssociacao">Tipo de Associação</Label>
                  <Select name="tipoAssociacao" value={filters.tipoAssociacao} onValueChange={(v) => handleSelectFilterChange('tipoAssociacao', v as any)}>
                      <SelectTrigger id="tipoAssociacao"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{tiposAssociacaoFilterOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
              </div>
              {filters.tipoAssociacao !== 'todos' && filters.tipoAssociacao !== 'Nenhum' && (
                  <div className="space-y-1">
                      <Label htmlFor="associadoAId">Associado a</Label>
                      <Select name="associadoAId" value={filters.associadoAId} onValueChange={(v) => handleSelectFilterChange('associadoAId', v)} disabled={currentAssociadoAOptions.length === 0}>
                          <SelectTrigger id="associadoAId"><SelectValue placeholder="Selecione a entidade" /></SelectTrigger>
                          <SelectContent>{currentAssociadoAOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
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
                {isLoading ? (<TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="inline-block mr-2 h-6 w-6 animate-spin"/>Carregando...</TableCell></TableRow>)
                : filteredResults.length > 0 ? (filteredResults.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{d.id.substring(0,8)}...</TableCell>
                      <TableCell>{d.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.tipoDocumento || "N/A"}</TableCell>
                      <TableCell>{d.dataUpload}</TableCell>
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
    </div>
  );
}
