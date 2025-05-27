
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Car, Save, XCircle, AlertTriangle, User, Building, UserPlus, Users, Trash2, CalendarDays, Shield, FileText, DollarSignIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";

interface GenericOption { value: string; label: string; }
const placeholderPessoasFisicas: GenericOption[] = [{ value: "pf_1", label: "João Silva (123.456.789-00)" }];
const placeholderOrganizacoes: GenericOption[] = [{ value: "org_1", label: "Empresa Alfa (00.111.222/0001-33)" }];
const placeholderCNHs: GenericOption[] = [{value: "cnh_1", label: "987654321 (Cat: AB, Val: 2028-10-10)"}];


interface VehicleDataFromDB {
  id_veiculo: string;
  placa_atual: string;
  placa_anterior?: string | null;
  chassi: string;
  tipo_especie?: string | null;
  combustivel?: string | null;
  marca: string;
  modelo: string;
  versao?: string | null;
  ano_fabricacao?: number | null;
  ano_modelo?: number | null;
  cor?: string | null;
  codigo_renavam: string;
  estado_crlv?: string | null;
  numero_serie_crlv?: string | null;
  data_expedicao_crlv?: string | null; // YYYY-MM-DD
  data_validade_crlv?: string | null;  // YYYY-MM-DD
  id_proprietario_pessoa_fisica?: string | null;
  id_proprietario_entidade?: string | null;
  data_aquisicao?: string | null;      // YYYY-MM-DD
  valor_fipe?: number | null;
  data_consulta_fipe?: string | null; // YYYY-MM-DD
  observacao?: string | null;
  VeiculoMotoristas?: {
    id_veiculo_motorista: string;
    id_motorista: string;
    PessoasFisicas: { nome_completo: string; cpf: string; }; // Joined motorista name
    id_cnh: string;
    CNHs: { numero_registro: string; categoria: string; data_validade: string }; // Joined CNH info
    categoria_cnh: string; // Categoria para este veículo
  }[];
}

interface StagedMotorista {
  id_veiculo_motorista?: string; // Present if it's an existing record
  tempId?: string; // For new client-side additions
  id_motorista: string;
  nome_motorista: string;
  id_cnh: string;
  numero_cnh: string;
  categoria_cnh: string;
}

const initialFormData = {
  placa_atual: '', placa_anterior: '', chassi: '', tipo_especie: '', combustivel: '',
  marca: '', modelo: '', versao: '', ano_fabricacao: '', ano_modelo: '', cor: '',
  codigo_renavam: '', estado_crlv: '', numero_serie_crlv: '',
  data_expedicao_crlv: undefined as Date | undefined, data_validade_crlv: undefined as Date | undefined,
  tipo_proprietario: '' as 'pessoa_fisica' | 'organizacao' | '', id_proprietario: '',
  data_aquisicao: undefined as Date | undefined,
  valor_fipe: '', data_consulta_fipe: undefined as Date | undefined, observacao: '',
};

// Placeholder function to fetch vehicle data
async function getVehicleById(vehicleId: string): Promise<VehicleDataFromDB | null> {
  if (!supabase) return null;
  console.log(`Fetching vehicle data for ID: ${vehicleId} (placeholder)`);
  
  // Simulate Supabase fetch
  const { data, error } = await supabase
    .from('Veiculos')
    .select(`
      *,
      VeiculoMotoristas (
        id_veiculo_motorista,
        id_motorista,
        categoria_cnh,
        PessoasFisicas!inner ( id_pessoa_fisica, nome_completo, cpf ),
        CNHs!inner (id_cnh, numero_registro, categoria, data_validade)
      )
    `)
    .eq('id_veiculo', parseInt(vehicleId, 10))
    .single();

  if (error) { console.error("Error fetching vehicle for edit:", error); return null; }
  if (!data) return null;

  return {
      ...data,
      id_veiculo: data.id_veiculo.toString(),
      id_proprietario_pessoa_fisica: data.id_proprietario_pessoa_fisica?.toString() || null,
      id_proprietario_entidade: data.id_proprietario_entidade?.toString() || null,
      ano_fabricacao: data.ano_fabricacao,
      ano_modelo: data.ano_modelo,
      valor_fipe: data.valor_fipe,
      VeiculoMotoristas: (data.VeiculoMotoristas || []).map((vm: any) => ({
        id_veiculo_motorista: vm.id_veiculo_motorista.toString(),
        id_motorista: vm.PessoasFisicas.id_pessoa_fisica.toString(),
        PessoasFisicas: vm.PessoasFisicas,
        id_cnh: vm.CNHs.id_cnh.toString(),
        CNHs: vm.CNHs,
        categoria_cnh: vm.categoria_cnh
      }))
  } as VehicleDataFromDB;
}


export default function EditarVeiculoPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  const { toast } = useToast(); 

  const [isLoading, setIsLoading] = useState(true);
  const [vehicleFound, setVehicleFound] = useState<boolean | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [stagedMotoristas, setStagedMotoristas] = useState<StagedMotorista[]>([]);
  
  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);
  const [motoristaModalData, setMotoristaModalData] = useState({
    id_motorista: '', id_cnh: '', categoria_cnh_veiculo: ''
  });
  const [availableMotoristas, setAvailableMotoristas] = useState<GenericOption[]>(placeholderPessoasFisicas);
  const [availableCNHsForSelectedMotorista, setAvailableCNHsForSelectedMotorista] = useState<GenericOption[]>([]);


  useEffect(() => {
    const fetchInitialData = async () => {
      if (!vehicleId || !supabase) {
        setIsLoading(false);
        setVehicleFound(false);
        return;
      }
      setIsLoading(true);

      // Fetch PessoasFisicas for motorista select
      const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf');
      if (pfError) toast({ title: "Erro ao carregar Pessoas Físicas", description: pfError.message, variant: "destructive" });
      else setAvailableMotoristas(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: `${pf.nome_completo} (${pf.cpf})` })));
      
      // Fetch Organizacoes (if needed for proprietario select) - similar logic

      const data = await getVehicleById(vehicleId);
      if (data) {
        setFormData({
          placa_atual: data.placa_atual || '',
          placa_anterior: data.placa_anterior || '',
          chassi: data.chassi || '',
          tipo_especie: data.tipo_especie || '',
          combustivel: data.combustivel || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          versao: data.versao || '',
          ano_fabricacao: data.ano_fabricacao?.toString() || '',
          ano_modelo: data.ano_modelo?.toString() || '',
          cor: data.cor || '',
          codigo_renavam: data.codigo_renavam || '',
          estado_crlv: data.estado_crlv || '',
          numero_serie_crlv: data.numero_serie_crlv || '',
          data_expedicao_crlv: data.data_expedicao_crlv ? parseISO(data.data_expedicao_crlv) : undefined,
          data_validade_crlv: data.data_validade_crlv ? parseISO(data.data_validade_crlv) : undefined,
          tipo_proprietario: data.id_proprietario_pessoa_fisica ? 'pessoa_fisica' : (data.id_proprietario_entidade ? 'organizacao' : ''),
          id_proprietario: (data.id_proprietario_pessoa_fisica || data.id_proprietario_entidade || '').toString(),
          data_aquisicao: data.data_aquisicao ? parseISO(data.data_aquisicao) : undefined,
          valor_fipe: data.valor_fipe?.toString() || '',
          data_consulta_fipe: data.data_consulta_fipe ? parseISO(data.data_consulta_fipe) : undefined,
          observacao: data.observacao || '',
        });
        setStagedMotoristas((data.VeiculoMotoristas || []).map(vm => ({
            id_veiculo_motorista: vm.id_veiculo_motorista,
            id_motorista: vm.id_motorista,
            nome_motorista: vm.PessoasFisicas.nome_completo,
            id_cnh: vm.id_cnh,
            numero_cnh: `${vm.CNHs.numero_registro} (Cat: ${vm.CNHs.categoria}, Val: ${format(parseISO(vm.CNHs.data_validade), 'dd/MM/yyyy')})`,
            categoria_cnh: vm.categoria_cnh,
        })));
        setVehicleFound(true);
      } else {
        setVehicleFound(false);
        toast({ title: "Erro", description: "Veículo não encontrado.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [vehicleId, toast]);

  useEffect(() => {
    const fetchCNHs = async () => {
      if (!supabase || !motoristaModalData.id_motorista) {
        setAvailableCNHsForSelectedMotorista([]); return;
      }
      const { data: cnhData, error: cnhError } = await supabase.from('CNHs').select('id_cnh, numero_registro, categoria, data_validade').eq('id_pessoa_fisica', motoristaModalData.id_motorista);
      if (cnhError) { toast({ title: "Erro CNHs", description: cnhError.message, variant: "destructive" }); setAvailableCNHsForSelectedMotorista([]); }
      else setAvailableCNHsForSelectedMotorista(cnhData.map(cnh => ({ value: cnh.id_cnh.toString(), label: `${cnh.numero_registro} (Cat: ${cnh.categoria}, Val: ${format(parseISO(cnh.data_validade!), 'dd/MM/yyyy')})` })));
    };
    fetchCNHs();
  }, [motoristaModalData.id_motorista, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: keyof typeof initialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
     if (name === 'tipo_proprietario') {
      setFormData(prev => ({ ...prev, id_proprietario: '' }));
    }
  };

  const handleDateChange = (name: keyof typeof initialFormData, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const handleAddMotorista = () => {
     if (!motoristaModalData.id_motorista || !motoristaModalData.id_cnh || !motoristaModalData.categoria_cnh_veiculo) {
      toast({ title: "Campos Incompletos", description: "Selecione motorista, CNH e categoria para o veículo.", variant: "destructive"}); return;
    }
    const selectedMotorista = availableMotoristas.find(m => m.value === motoristaModalData.id_motorista);
    const selectedCNH = availableCNHsForSelectedMotorista.find(c => c.value === motoristaModalData.id_cnh);
    if (!selectedMotorista || !selectedCNH) { toast({title: "Erro", description: "Motorista ou CNH não encontrado.", variant: "destructive"}); return; }

    setStagedMotoristas(prev => [...prev, {
      tempId: Date.now().toString(),
      id_motorista: motoristaModalData.id_motorista, nome_motorista: selectedMotorista.label,
      id_cnh: motoristaModalData.id_cnh, numero_cnh: selectedCNH.label,
      categoria_cnh: motoristaModalData.categoria_cnh_veiculo
    }]);
    setIsMotoristaModalOpen(false);
    setMotoristaModalData({ id_motorista: '', id_cnh: '', categoria_cnh_veiculo: '' });
  };

  const handleRemoveStagedMotorista = (idToRemove: string) => { // Can be tempId or id_veiculo_motorista
    setStagedMotoristas(prev => prev.filter(m => (m.tempId || m.id_veiculo_motorista) !== idToRemove));
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !vehicleId) { toast({ title: "Erro de Configuração", variant: "destructive" }); return; }
    setIsLoading(true);

    // Basic validation
    if (!formData.placa_atual || !formData.marca || !formData.modelo || !formData.ano_fabricacao || !formData.codigo_renavam || !formData.tipo_proprietario || !formData.id_proprietario) {
      toast({ title: "Campos Obrigatórios", description: "Placa, Marca, Modelo, Ano Fabricação, Renavam e Proprietário são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    const veiculoUpdatePayload = {
      placa_atual: formData.placa_atual,
      placa_anterior: formData.placa_anterior || null,
      chassi: formData.chassi,
      tipo_especie: formData.tipo_especie || null,
      combustivel: formData.combustivel || null,
      marca: formData.marca,
      modelo: formData.modelo,
      versao: formData.versao || null,
      ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao) : null,
      ano_modelo: formData.ano_modelo ? parseInt(formData.ano_modelo) : null,
      cor: formData.cor || null,
      codigo_renavam: formData.codigo_renavam,
      estado_crlv: formData.estado_crlv || null,
      numero_serie_crlv: formData.numero_serie_crlv || null,
      data_expedicao_crlv: formData.data_expedicao_crlv ? format(formData.data_expedicao_crlv, "yyyy-MM-dd") : null,
      data_validade_crlv: formData.data_validade_crlv ? format(formData.data_validade_crlv, "yyyy-MM-dd") : null,
      id_proprietario_pessoa_fisica: formData.tipo_proprietario === 'pessoa_fisica' ? parseInt(formData.id_proprietario) : null,
      id_proprietario_entidade: formData.tipo_proprietario === 'organizacao' ? parseInt(formData.id_proprietario) : null,
      data_aquisicao: formData.data_aquisicao ? format(formData.data_aquisicao, "yyyy-MM-dd") : null,
      valor_fipe: formData.valor_fipe ? parseFloat(formData.valor_fipe.replace(',', '.')) : null,
      data_consulta_fipe: formData.data_consulta_fipe ? format(formData.data_consulta_fipe, "yyyy-MM-dd") : null,
      observacao: formData.observacao || null,
    };

    try {
      const { error: veiculoError } = await supabase
        .from('Veiculos')
        .update(veiculoUpdatePayload)
        .eq('id_veiculo', parseInt(vehicleId));

      if (veiculoError) throw veiculoError;

      // Handle VeiculoMotoristas: Delete existing and insert new ones
      const { error: deleteMotoristasError } = await supabase
        .from('VeiculoMotoristas')
        .delete()
        .eq('id_veiculo', parseInt(vehicleId));
      
      if (deleteMotoristasError) {
        console.warn("Erro ao deletar motoristas antigos:", deleteMotoristasError);
        // Potentially don't throw, but log and continue if main update was fine
      }

      if (stagedMotoristas.length > 0) {
        const motoristasPayload = stagedMotoristas.map(m => ({
          id_veiculo: parseInt(vehicleId),
          id_motorista: parseInt(m.id_motorista),
          id_cnh: parseInt(m.id_cnh),
          categoria_cnh: m.categoria_cnh,
        }));
        const { error: insertMotoristasError } = await supabase.from('VeiculoMotoristas').insert(motoristasPayload);
        if (insertMotoristasError) {
          console.warn("Erro ao salvar novos motoristas vinculados:", insertMotoristasError);
          toast({ title: "Veículo Atualizado com Aviso", description: "Dados principais salvos, mas erro ao atualizar motoristas.", variant: "default", duration: 6000 });
        }
      }
      
      toast({ title: "Veículo Atualizado!", description: "Os dados do veículo foram salvos." });
      router.push('/admin/veiculos'); 

    } catch (error: any) {
      console.error('Erro ao atualizar veículo:', error);
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && vehicleFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando...</div>;
  }

  if (vehicleFound === false) {
    return (<div className="container mx-auto p-8 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Veículo não encontrado</h1><Button asChild className="mt-6"><Link href="/admin/veiculos">Voltar</Link></Button></div>);
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Car className="mr-3 h-8 w-8" /> Editar Veículo: {formData.placa_atual}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/veiculos"><XCircle className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Dados Principais do Veículo Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados Principais do Veículo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2"><Label htmlFor="placa_atual">Placa Atual <span className="text-destructive">*</span></Label><Input id="placa_atual" name="placa_atual" value={formData.placa_atual} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="placa_anterior">Placa Anterior</Label><Input id="placa_anterior" name="placa_anterior" value={formData.placa_anterior} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="chassi">Chassi <span className="text-destructive">*</span></Label><Input id="chassi" name="chassi" value={formData.chassi} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label><Input id="marca" name="marca" value={formData.marca} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label><Input id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="versao">Versão</Label><Input id="versao" name="versao" value={formData.versao} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="ano_fabricacao">Ano Fabricação <span className="text-destructive">*</span></Label><Input id="ano_fabricacao" name="ano_fabricacao" type="number" value={formData.ano_fabricacao} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="ano_modelo">Ano Modelo</Label><Input id="ano_modelo" name="ano_modelo" type="number" value={formData.ano_modelo} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="cor">Cor</Label><Input id="cor" name="cor" value={formData.cor} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="tipo_especie">Tipo/Espécie</Label><Input id="tipo_especie" name="tipo_especie" value={formData.tipo_especie} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="combustivel">Combustível</Label><Input id="combustivel" name="combustivel" value={formData.combustivel} onChange={handleChange} /></div>
          </CardContent>
        </Card>

        {/* Dados do CRLV Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados do CRLV</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2"><Label htmlFor="codigo_renavam">Código Renavam <span className="text-destructive">*</span></Label><Input id="codigo_renavam" name="codigo_renavam" value={formData.codigo_renavam} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="estado_crlv">Estado CRLV</Label><Input id="estado_crlv" name="estado_crlv" value={formData.estado_crlv} onChange={handleChange} maxLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="numero_serie_crlv">Nº Série CRLV</Label><Input id="numero_serie_crlv" name="numero_serie_crlv" value={formData.numero_serie_crlv} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="data_expedicao_crlv">Data Expedição CRLV</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_expedicao_crlv ? format(formData.data_expedicao_crlv, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_expedicao_crlv} onSelect={(d) => handleDateChange('data_expedicao_crlv', d)} /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label htmlFor="data_validade_crlv">Data Validade CRLV</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_validade_crlv ? format(formData.data_validade_crlv, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_validade_crlv} onSelect={(d) => handleDateChange('data_validade_crlv', d)} /></PopoverContent></Popover></div>
          </CardContent>
        </Card>
        
        {/* Dados do Proprietário Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados do Proprietário</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipo_proprietario">Tipo de Proprietário <span className="text-destructive">*</span></Label>
              <Select name="tipo_proprietario" value={formData.tipo_proprietario} onValueChange={(v) => handleSelectChange('tipo_proprietario', v as any)} required>
                <SelectTrigger id="tipo_proprietario"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                  <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_proprietario && (
              <div className="space-y-2">
                <Label htmlFor="id_proprietario">Proprietário <span className="text-destructive">*</span></Label>
                <Select name="id_proprietario" value={formData.id_proprietario} onValueChange={(v) => handleSelectChange('id_proprietario', v)} required>
                  <SelectTrigger id="id_proprietario"><SelectValue placeholder={`Selecione ${formData.tipo_proprietario === 'pessoa_fisica' ? 'Pessoa Física' : 'Organização'}`} /></SelectTrigger>
                  <SelectContent>
                    {(formData.tipo_proprietario === 'pessoa_fisica' ? placeholderPessoasFisicas : placeholderOrganizacoes).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="data_aquisicao">Data Aquisição</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_aquisicao ? format(formData.data_aquisicao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_aquisicao} onSelect={(d) => handleDateChange('data_aquisicao', d)} /></PopoverContent></Popover></div>
          </CardContent>
        </Card>

        {/* Dados FIPE Card */}
        <Card className="shadow-lg mb-6">
            <CardHeader><CardTitle>Dados FIPE (Opcional)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="valor_fipe">Valor Tabela FIPE (R$)</Label><Input id="valor_fipe" name="valor_fipe" value={formData.valor_fipe} onChange={handleChange} placeholder="Ex: 75000,00"/></div>
                <div className="space-y-2"><Label htmlFor="data_consulta_fipe">Data da Consulta FIPE</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_consulta_fipe ? format(formData.data_consulta_fipe, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_consulta_fipe} onSelect={(d) => handleDateChange('data_consulta_fipe', d)}/></PopoverContent></Popover></div>
            </CardContent>
        </Card>

        {/* Motoristas Vinculados Card */}
        <Card className="shadow-lg mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Motoristas Vinculados</CardTitle>
                <Button type="button" onClick={() => setIsMotoristaModalOpen(true)} size="sm"><UserPlus className="mr-2 h-4 w-4"/> Adicionar Motorista</Button>
            </CardHeader>
            <CardContent>
                {stagedMotoristas.length > 0 ? (
                    <ul className="space-y-2">
                        {stagedMotoristas.map(m => (
                            <li key={m.id_veiculo_motorista || m.tempId} className="flex justify-between items-center p-2 border rounded-md">
                                <div>
                                    <p className="font-medium">{m.nome_motorista}</p>
                                    <p className="text-sm text-muted-foreground">CNH: {m.numero_cnh} (Cat. Veículo: {m.categoria_cnh})</p>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveStagedMotorista(m.id_veiculo_motorista || m.tempId!)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </li>
                        ))}
                    </ul>
                ) : (<p className="text-muted-foreground">Nenhum motorista vinculado.</p>)}
            </CardContent>
        </Card>

        {/* Observação Card */}
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent><Textarea id="observacao" name="observacao" value={formData.observacao} onChange={handleChange} rows={4} /></CardContent>
        </Card>
        
        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/veiculos')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>

       <Dialog open={isMotoristaModalOpen} onOpenChange={setIsMotoristaModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Motorista ao Veículo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="id_motorista_modal">Motorista (Pessoa Física)</Label>
              <Select value={motoristaModalData.id_motorista} onValueChange={(v) => setMotoristaModalData(prev => ({...prev, id_motorista: v, id_cnh: ''}))}>
                <SelectTrigger><SelectValue placeholder="Selecione o motorista"/></SelectTrigger>
                <SelectContent>
                  {availableMotoristas.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {motoristaModalData.id_motorista && (
            <div>
              <Label htmlFor="id_cnh_modal">CNH do Motorista</Label>
              <Select value={motoristaModalData.id_cnh} onValueChange={(v) => setMotoristaModalData(prev => ({...prev, id_cnh: v}))} disabled={availableCNHsForSelectedMotorista.length === 0}>
                <SelectTrigger><SelectValue placeholder={availableCNHsForSelectedMotorista.length > 0 ? "Selecione a CNH" : "Nenhuma CNH cadastrada para este motorista"}/></SelectTrigger>
                <SelectContent>
                  {availableCNHsForSelectedMotorista.map(cnh => <SelectItem key={cnh.value} value={cnh.value}>{cnh.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            )}
            <div>
              <Label htmlFor="categoria_cnh_veiculo_modal">Categoria da CNH para este Veículo <span className="text-destructive">*</span></Label>
              <Input id="categoria_cnh_veiculo_modal" value={motoristaModalData.categoria_cnh_veiculo} onChange={(e) => setMotoristaModalData(prev => ({...prev, categoria_cnh_veiculo: e.target.value.toUpperCase()}))} placeholder="Ex: B, AB, D"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="button" onClick={handleAddMotorista}>Adicionar Motorista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/*
Supabase Integration Notes:
- `getVehicleById` placeholder needs to be replaced with actual Supabase fetch, including JOINs for VeiculoMotoristas -> PessoasFisicas & CNHs.
- On submit:
  - Update `Veiculos` table.
  - Manage `VeiculoMotoristas`: Determine new, existing, and removed driver links. This might involve deleting all existing for the vehicle and re-inserting from `stagedMotoristas`, or a more complex diffing logic.
- Ensure RLS policies are in place for `Veiculos` and `VeiculoMotoristas`.
*/

    