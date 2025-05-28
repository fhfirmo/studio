
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldPlus, Save, XCircle, CalendarDays, Car, User, Building, Library, ShieldQuestion, Sparkles, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface GenericOption {
  id: string;
  nome: string;
  [key: string]: any; 
}

interface AssistenciaOption extends GenericOption {
  tipo_assistencia?: string;
}

export default function NovoSeguroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tipoTitular, setTipoTitular] = useState<'pessoa_fisica' | 'organizacao' | ''>('');

  const [formData, setFormData] = useState({
    numeroApolice: '',
    id_seguradora: '',
    vigenciaInicio: undefined as Date | undefined,
    vigenciaFim: undefined as Date | undefined,
    valorIndenizacao: '',
    franquia: '',
    dataContratacao: new Date() as Date | undefined,
    observacoes: '', // This will remain in UI state but not sent to DB
    id_titular: '', // Generic ID for selected titular
    id_veiculo: '--none--', // Default to no vehicle
    coberturasSelecionadas: [] as string[],
    assistenciasSelecionadas: [] as string[],
  });

  const [pessoasFisicasOptions, setPessoasFisicasOptions] = useState<GenericOption[]>([]);
  const [organizacoesOptions, setOrganizacoesOptions] = useState<GenericOption[]>([]);
  const [veiculosOptions, setVeiculosOptions] = useState<GenericOption[]>([]);
  const [seguradorasOptions, setSeguradorasOptions] = useState<GenericOption[]>([]);
  const [coberturasOptions, setCoberturasOptions] = useState<GenericOption[]>([]);
  const [assistenciasOptions, setAssistenciasOptions] = useState<AssistenciaOption[]>([]);

  const [isLoadingPessoasFisicas, setIsLoadingPessoasFisicas] = useState(false);
  const [isLoadingOrganizacoes, setIsLoadingOrganizacoes] = useState(false);
  const [isLoadingVeiculos, setIsLoadingVeiculos] = useState(false);
  const [isLoadingSeguradoras, setIsLoadingSeguradoras] = useState(false);
  const [isLoadingCoberturas, setIsLoadingCoberturas] = useState(false);
  const [isLoadingAssistencias, setIsLoadingAssistencias] = useState(false);


  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!supabase) return;

      setIsLoadingPessoasFisicas(true);
      supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro ao Carregar Pessoas Físicas", description: error.message, variant: "destructive" });
          else setPessoasFisicasOptions(data.map(pf => ({ id: pf.id_pessoa_fisica.toString(), nome: `${pf.nome_completo} (${pf.cpf})` })));
          setIsLoadingPessoasFisicas(false);
        });

      setIsLoadingOrganizacoes(true);
      supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro ao Carregar Organizações", description: error.message, variant: "destructive" });
          else setOrganizacoesOptions(data.map(org => ({ id: org.id_entidade.toString(), nome: `${org.nome} (${org.cnpj})` })));
          setIsLoadingOrganizacoes(false);
        });
      
      setIsLoadingVeiculos(true);
      supabase.from('Veiculos').select('id_veiculo, placa_atual, modelo, marca').order('placa_atual')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro ao Carregar Veículos", description: error.message, variant: "destructive" });
          else setVeiculosOptions(data.map(v => ({ id: v.id_veiculo.toString(), nome: `${v.placa_atual} (${v.marca || ''} ${v.modelo || ''})`.trim() })));
          setIsLoadingVeiculos(false);
        });

      setIsLoadingSeguradoras(true);
      supabase.from('Seguradoras').select('id_seguradora, nome_seguradora').order('nome_seguradora')
        .then(({data, error}) => {
            if (error) toast({ title: "Erro ao Carregar Seguradoras", description: error.message, variant: "destructive" });
            else setSeguradorasOptions(data.map(s => ({ id: s.id_seguradora.toString(), nome: s.nome_seguradora })));
            setIsLoadingSeguradoras(false);
        });

      setIsLoadingCoberturas(true);
      supabase.from('Coberturas').select('id_cobertura, nome_cobertura').order('nome_cobertura')
        .then(({data, error}) => {
            if (error) toast({ title: "Erro ao Carregar Coberturas", description: error.message, variant: "destructive" });
            else setCoberturasOptions(data.map(c => ({ id: c.id_cobertura.toString(), nome: c.nome_cobertura })));
            setIsLoadingCoberturas(false);
        });

      setIsLoadingAssistencias(true);
      supabase.from('Assistencias').select('id_assistencia, nome_assistencia, tipo_assistencia').order('nome_assistencia')
        .then(({data, error}) => {
            if (error) toast({ title: "Erro ao Carregar Assistências", description: error.message, variant: "destructive" });
            else setAssistenciasOptions(data.map(a => ({ id: a.id_assistencia.toString(), nome: a.nome_assistencia, tipo_assistencia: a.tipo_assistencia || undefined })));
            setIsLoadingAssistencias(false);
        });
    };
    fetchDropdownData();
  }, [toast]);


  const handleTipoTitularChange = (value: 'pessoa_fisica' | 'organizacao' | '') => {
    setTipoTitular(value);
    setFormData(prev => ({ ...prev, id_titular: '' })); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const handleCheckboxChange = (collection: 'coberturasSelecionadas' | 'assistenciasSelecionadas', itemId: string, checked: boolean) => {
    setFormData(prev => {
      const currentSelection = prev[collection];
      if (checked) {
        return { ...prev, [collection]: [...currentSelection, itemId] };
      } else {
        return { ...prev, [collection]: currentSelection.filter(id => id !== itemId) };
      }
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
        toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
        return;
    }
    setIsLoading(true);

    if (!formData.numeroApolice || !formData.id_seguradora || !formData.vigenciaInicio || !formData.vigenciaFim || !tipoTitular || !formData.id_titular) {
      toast({ title: "Campos Obrigatórios", description: "Apólice, Seguradora, Vigências e Titular são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (formData.vigenciaFim && formData.vigenciaInicio && formData.vigenciaFim <= formData.vigenciaInicio) {
      toast({ title: "Data Inválida", description: "A Data de Fim da Vigência deve ser posterior à Data de Início.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const seguroPayload = {
      numero_apolice: formData.numeroApolice,
      id_seguradora: parseInt(formData.id_seguradora),
      vigencia_inicio: formData.vigenciaInicio ? format(formData.vigenciaInicio, "yyyy-MM-dd") : null,
      vigencia_fim: formData.vigenciaFim ? format(formData.vigenciaFim, "yyyy-MM-dd") : null,
      valor_indenizacao: formData.valorIndenizacao ? parseFloat(formData.valorIndenizacao.replace(',', '.')) : null,
      franquia: formData.franquia ? parseFloat(formData.franquia.replace(',', '.')) : null,
      data_contratacao: formData.dataContratacao ? format(formData.dataContratacao, "yyyy-MM-dd") : null,
      // observacoes: formData.observacoes || null, // Removed as column doesn't exist
      id_titular_pessoa_fisica: tipoTitular === 'pessoa_fisica' ? parseInt(formData.id_titular) : null,
      id_titular_entidade: tipoTitular === 'organizacao' ? parseInt(formData.id_titular) : null,
      id_veiculo: formData.id_veiculo && formData.id_veiculo !== '--none--' ? parseInt(formData.id_veiculo) : null,
    };

    try {
        console.log('Salvando Seguro:', seguroPayload);
        const { data: newSeguro, error: seguroError } = await supabase
            .from('Seguros')
            .insert(seguroPayload)
            .select('id_seguro')
            .single();

        if (seguroError) throw seguroError;
        if (!newSeguro?.id_seguro) throw new Error("Falha ao obter ID do novo seguro.");
        
        const newSeguroId = newSeguro.id_seguro;

        if (formData.coberturasSelecionadas.length > 0) {
            const seguroCoberturasPayload = formData.coberturasSelecionadas.map(cobId => ({
                id_seguro: newSeguroId,
                id_cobertura: parseInt(cobId),
            }));
            const { error: scError } = await supabase.from('SeguroCoberturas').insert(seguroCoberturasPayload);
             if (scError) console.warn("Erro ao salvar Coberturas:", JSON.stringify(scError, null, 2)); 
        }

        if (formData.assistenciasSelecionadas.length > 0) {
            const seguroAssistenciasPayload = formData.assistenciasSelecionadas.map(assId => ({
                id_seguro: newSeguroId,
                id_assistencia: parseInt(assId),
            }));
            const { error: saError } = await supabase.from('SeguroAssistencias').insert(seguroAssistenciasPayload);
             if (saError) console.warn("Erro ao salvar Assistências:", JSON.stringify(saError, null, 2));
        }
        
        toast({ title: "Seguro Cadastrado!", description: "Novo seguro adicionado com sucesso." });
        router.push('/admin/seguros');

    } catch (error: any) {
        console.error('Erro ao cadastrar Seguro:', JSON.stringify(error, null, 2), error);
        toast({ title: "Erro ao Cadastrar Seguro", description: error.message || "Verifique os dados e as permissões (RLS).", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <ShieldPlus className="mr-3 h-8 w-8" /> Cadastro de Novo Seguro
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/seguros">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar um novo seguro ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="dadosApolice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="dadosApolice">Dados da Apólice</TabsTrigger>
            <TabsTrigger value="titular">Titular</TabsTrigger>
            <TabsTrigger value="veiculo">Veículo (Opcional)</TabsTrigger>
            <TabsTrigger value="coberturasAssistencias">Coberturas & Assistências</TabsTrigger>
          </TabsList>

          <TabsContent value="dadosApolice">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Informações da Apólice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="numeroApolice">Número da Apólice <span className="text-destructive">*</span></Label>
                    <Input id="numeroApolice" name="numeroApolice" value={formData.numeroApolice} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_seguradora">Seguradora <span className="text-destructive">*</span></Label>
                    <Select name="id_seguradora" value={formData.id_seguradora} onValueChange={(value) => handleSelectChange('id_seguradora', value)} required disabled={isLoadingSeguradoras}>
                      <SelectTrigger id="id_seguradora">
                        <Library className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder={isLoadingSeguradoras ? "Carregando..." : "Selecione a seguradora"} />
                      </SelectTrigger>
                      <SelectContent>
                        {seguradorasOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vigenciaInicio">Vigência - Início <span className="text-destructive">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formData.vigenciaInicio && "text-muted-foreground"}`}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.vigenciaInicio ? format(formData.vigenciaInicio, "dd/MM/yyyy") : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.vigenciaInicio} onSelect={(d) => handleDateChange('vigenciaInicio', d)} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vigenciaFim">Vigência - Fim <span className="text-destructive">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formData.vigenciaFim && "text-muted-foreground"}`}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.vigenciaFim ? format(formData.vigenciaFim, "dd/MM/yyyy") : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.vigenciaFim} onSelect={(d) => handleDateChange('vigenciaFim', d)} disabled={(date) => formData.vigenciaInicio ? date <= formData.vigenciaInicio : false} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="valorIndenizacao">Valor Indenização (R$)</Label>
                    <Input id="valorIndenizacao" name="valorIndenizacao" value={formData.valorIndenizacao} onChange={handleChange} placeholder="Ex: 100000,00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="franquia">Franquia (R$)</Label>
                    <Input id="franquia" name="franquia" value={formData.franquia} onChange={handleChange} placeholder="Ex: 2500,00" />
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="dataContratacao">Data de Contratação</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={`w-full justify-start text-left font-normal ${!formData.dataContratacao && "text-muted-foreground"}`}>
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {formData.dataContratacao ? format(formData.dataContratacao, "dd/MM/yyyy") : <span>Selecione</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.dataContratacao} onSelect={(d) => handleDateChange('dataContratacao', d)} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações da Apólice</Label>
                  <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="titular">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Titular da Apólice</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tipoTitular">Tipo de Titular <span className="text-destructive">*</span></Label>
                  <Select name="tipoTitular" value={tipoTitular} onValueChange={(value: 'pessoa_fisica' | 'organizacao' | '') => handleTipoTitularChange(value)} required>
                    <SelectTrigger id="tipoTitular"><SelectValue placeholder="Selecione o tipo de titular" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                      <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tipoTitular && (
                  <div className="space-y-2">
                    <Label htmlFor="id_titular">Titular <span className="text-destructive">*</span></Label>
                    <Select name="id_titular" value={formData.id_titular} onValueChange={(value) => handleSelectChange('id_titular', value)} required disabled={tipoTitular === 'pessoa_fisica' ? isLoadingPessoasFisicas : isLoadingOrganizacoes}>
                      <SelectTrigger id="id_titular">
                        <SelectValue placeholder={
                            (tipoTitular === 'pessoa_fisica' && isLoadingPessoasFisicas) || (tipoTitular === 'organizacao' && isLoadingOrganizacoes) 
                            ? "Carregando..." 
                            : `Selecione ${tipoTitular === 'pessoa_fisica' ? 'a Pessoa Física' : 'a Organização'}`
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoTitular === 'pessoa_fisica' && pessoasFisicasOptions.map(pf => <SelectItem key={pf.id} value={pf.id}>{pf.nome}</SelectItem>)}
                        {tipoTitular === 'organizacao' && organizacoesOptions.map(org => <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="veiculo">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Veículo Associado (Opcional)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="id_veiculo">Veículo</Label>
                <Select name="id_veiculo" value={formData.id_veiculo} onValueChange={(value) => handleSelectChange('id_veiculo', value)} disabled={isLoadingVeiculos}>
                  <SelectTrigger id="id_veiculo">
                    <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={isLoadingVeiculos ? "Carregando..." : "Selecione o veículo (se aplicável)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--none--">Nenhum Veículo</SelectItem>
                    {veiculosOptions.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coberturasAssistencias">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="flex items-center"><ShieldQuestion className="mr-2 h-5 w-5 text-primary"/> Coberturas</CardTitle></CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {isLoadingCoberturas ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-primary" /> : coberturasOptions.length > 0 ? (
                            coberturasOptions.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                id={`cobertura-${item.id}`}
                                checked={formData.coberturasSelecionadas.includes(item.id)}
                                onCheckedChange={(checked) => handleCheckboxChange('coberturasSelecionadas', item.id, checked as boolean)}
                                />
                                <Label htmlFor={`cobertura-${item.id}`} className="font-normal cursor-pointer">{item.nome}</Label>
                            </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground">Nenhuma cobertura encontrada.</p>}
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/> Assistências</CardTitle></CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {isLoadingAssistencias ? <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-primary" /> : assistenciasOptions.length > 0 ? (
                            assistenciasOptions.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                id={`assistencia-${item.id}`}
                                checked={formData.assistenciasSelecionadas.includes(item.id)}
                                onCheckedChange={(checked) => handleCheckboxChange('assistenciasSelecionadas', item.id, checked as boolean)}
                                />
                                <Label htmlFor={`assistencia-${item.id}`} className="font-normal cursor-pointer">{item.nome} {item.tipo_assistencia && `(${item.tipo_assistencia})`}</Label>
                            </div>
                            ))
                        ) : <p className="text-sm text-muted-foreground">Nenhuma assistência encontrada.</p>}
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/seguros')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isLoadingPessoasFisicas || isLoadingOrganizacoes || isLoadingVeiculos || isLoadingSeguradoras || isLoadingCoberturas || isLoadingAssistencias}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Seguro'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
// Supabase Integration Notes:
// - Dynamic Selects: Fetch PessoasFisicas, Entidades, Veiculos, Seguradoras, Coberturas, Assistencias from Supabase.
// - Form Submission:
//   1. INSERT into public.Seguros. Get the new id_seguro.
//   2. INSERT selected coberturas into public.SeguroCoberturas (id_seguro, id_cobertura).
//   3. INSERT selected assistencias into public.SeguroAssistencias (id_seguro, id_assistencia).
//   (Ideally, these three steps should be in a transaction via a Supabase Edge Function).
// - RLS: Ensure user has INSERT permissions on Seguros, SeguroCoberturas, SeguroAssistencias and SELECT on related tables.

