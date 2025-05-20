
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldPlus, Save, XCircle, CalendarDays, Car, User, Building, DollarSign, Library, ShieldQuestion, Sparkles } from 'lucide-react';
import { format } from "date-fns";
// import { useToast } from "@/hooks/use-toast";

// Placeholder data - In a real app, these would come from Supabase
const placeholderSeguradoras = [
  { id: "seguradora_001", nome: "Porto Seguro" },
  { id: "seguradora_002", nome: "Bradesco Seguros" },
  { id: "seguradora_003", nome: "Tokio Marine" },
];

const placeholderPessoasFisicas = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99" },
];

const placeholderOrganizacoes = [
  { id: "org_001", nome: "Cooperativa Alfa", cnpj: "11.222.333/0001-44" },
  { id: "org_002", nome: "Associação Beta", cnpj: "22.333.444/0001-55" },
];

const placeholderVeiculos = [
  { id: "vei_001", description: "Fiat Uno - ABC-1234" },
  { id: "vei_002", description: "VW Gol - DEF-5678" },
  { id: "vei_003", description: "Chevrolet Onix - GHI-9012" },
];

const placeholderCoberturas = [
  { id: "cob_001", nome: "Colisão, Incêndio e Roubo (Compreensiva)" },
  { id: "cob_002", nome: "Danos a Terceiros (RCF-V)" },
  { id: "cob_003", nome: "Cobertura para Vidros" },
  { id: "cob_004", nome: "Carro Reserva" },
];

const placeholderAssistencias = [
  { id: "ass_001", nome: "Assistência 24h (Guincho, Chaveiro)" },
  { id: "ass_002", nome: "Reparo Residencial" },
  { id: "ass_003", nome: "Assistência Pet" },
];


export default function NovoSeguroPage() {
  const router = useRouter();
  // const { toast } = useToast();
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
    observacoes: '',
    id_titular: '', // Will store ID of selected PessoaFisica or Entidade
    id_veiculo: '', // Optional
    coberturasSelecionadas: [] as string[],
    assistenciasSelecionadas: [] as string[],
  });

  const handleTipoTitularChange = (value: 'pessoa_fisica' | 'organizacao' | '') => {
    setTipoTitular(value);
    setFormData(prev => ({ ...prev, id_titular: '' })); // Reset titularId when type changes
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
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.numeroApolice || !formData.id_seguradora || !formData.vigenciaInicio || !formData.vigenciaFim || !tipoTitular || !formData.id_titular) {
      // toast({ title: "Campos Obrigatórios", description: "Verifique os campos obrigatórios.", variant: "destructive" });
      console.error("Validação: Campos obrigatórios não preenchidos.");
      setIsLoading(false);
      return;
    }
    if (formData.vigenciaFim && formData.vigenciaInicio && formData.vigenciaFim <= formData.vigenciaInicio) {
      // toast({ title: "Data Inválida", description: "A Data de Fim da Vigência deve ser posterior à Data de Início.", variant: "destructive" });
      console.error("Validação: A Data de Fim da Vigência deve ser posterior à Data de Início.");
      setIsLoading(false);
      return;
    }
    
    const payload = {
      ...formData,
      valorIndenizacao: formData.valorIndenizacao ? parseFloat(formData.valorIndenizacao.replace(',', '.')) : null,
      franquia: formData.franquia ? parseFloat(formData.franquia.replace(',', '.')) : null,
      vigenciaInicio: formData.vigenciaInicio ? format(formData.vigenciaInicio, "yyyy-MM-dd") : null,
      vigenciaFim: formData.vigenciaFim ? format(formData.vigenciaFim, "yyyy-MM-dd") : null,
      dataContratacao: formData.dataContratacao ? format(formData.dataContratacao, "yyyy-MM-dd") : null,
      id_titular_pessoa_fisica: tipoTitular === 'pessoa_fisica' ? formData.id_titular : null,
      id_titular_entidade: tipoTitular === 'organizacao' ? formData.id_titular : null,
      id_veiculo: formData.id_veiculo === '--none--' ? null : (formData.id_veiculo || null),
      // coberturasSelecionadas and assistenciasSelecionadas will be handled separately for linking tables
    };
    // Remove id_titular from main payload as it's split
    // @ts-ignore
    delete payload.id_titular; 

    console.log('Form data to be submitted (Seguro):', payload);
    console.log('Coberturas Selecionadas IDs:', formData.coberturasSelecionadas);
    console.log('Assistências Selecionadas IDs:', formData.assistenciasSelecionadas);


    // Supabase:
    // 1. Insert into public.Seguros table with payload.
    // 2. Get the ID of the newly created seguro.
    // 3. For each ID in formData.coberturasSelecionadas, insert into public.SeguroCoberturas (id_seguro, id_cobertura).
    // 4. For each ID in formData.assistenciasSelecionadas, insert into public.SeguroAssistencias (id_seguro, id_assistencia).
    // (This should ideally be done in a transaction if your Supabase setup allows)

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated seguro creation finished');
    // toast({ title: "Seguro Cadastrado! (Simulado)", description: "O novo seguro foi adicionado com sucesso." });
    setIsLoading(false);
    router.push('/admin/seguros'); 
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
                    {/* Supabase: Options for this select should be loaded from public.Seguradoras */}
                    <Select name="id_seguradora" value={formData.id_seguradora} onValueChange={(value) => handleSelectChange('id_seguradora', value)} required>
                      <SelectTrigger id="id_seguradora"><Library className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione a seguradora" /></SelectTrigger>
                      <SelectContent>
                        {placeholderSeguradoras.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
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
                    {/* Supabase: Options load from public.PessoasFisicas or public.Entidades */}
                    <Select name="id_titular" value={formData.id_titular} onValueChange={(value) => handleSelectChange('id_titular', value)} required>
                      <SelectTrigger id="id_titular">
                        <SelectValue placeholder={`Selecione ${tipoTitular === 'pessoa_fisica' ? 'a Pessoa Física' : 'a Organização'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoTitular === 'pessoa_fisica' && placeholderPessoasFisicas.map(pf => <SelectItem key={pf.id} value={pf.id}>{pf.nomeCompleto} ({pf.cpf})</SelectItem>)}
                        {tipoTitular === 'organizacao' && placeholderOrganizacoes.map(org => <SelectItem key={org.id} value={org.id}>{org.nome} ({org.cnpj})</SelectItem>)}
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
                {/* Supabase: Options load from public.Veiculos */}
                <Select name="id_veiculo" value={formData.id_veiculo} onValueChange={(value) => handleSelectChange('id_veiculo', value)}>
                  <SelectTrigger id="id_veiculo"><Car className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione o veículo (se aplicável)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--none--">Nenhum Veículo</SelectItem>
                    {placeholderVeiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.description}</SelectItem>)}
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
                        {/* Supabase: Options load from public.Coberturas */}
                        {placeholderCoberturas.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                            id={`cobertura-${item.id}`}
                            checked={formData.coberturasSelecionadas.includes(item.id)}
                            onCheckedChange={(checked) => handleCheckboxChange('coberturasSelecionadas', item.id, checked as boolean)}
                            />
                            <Label htmlFor={`cobertura-${item.id}`} className="font-normal cursor-pointer">{item.nome}</Label>
                        </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader><CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary"/> Assistências</CardTitle></CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {/* Supabase: Options load from public.Assistencias */}
                        {placeholderAssistencias.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                            id={`assistencia-${item.id}`}
                            checked={formData.assistenciasSelecionadas.includes(item.id)}
                            onCheckedChange={(checked) => handleCheckboxChange('assistenciasSelecionadas', item.id, checked as boolean)}
                            />
                            <Label htmlFor={`assistencia-${item.id}`} className="font-normal cursor-pointer">{item.nome}</Label>
                        </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/seguros')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Seguro'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
