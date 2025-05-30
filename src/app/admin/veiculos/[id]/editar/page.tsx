
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Car, Save, XCircle, AlertTriangle, User, Building, UserPlus, Users, Trash2, CalendarDays, Tags, Search as SearchIcon, Loader2, HelpCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parse, isValid as isValidDate, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface VehicleDataFromDB {
  id_veiculo: string;
  placa_atual: string;
  placa_anterior?: string | null;
  chassi: string;
  tipo_especie?: string | null;
  combustivel?: string | null;
  marca: string; 
  modelo: string; 
  ano_fabricacao?: number | null;
  ano_modelo?: number | null;
  cor?: string | null;
  codigo_renavam: string;
  estado_crlv?: string | null;
  numero_serie_crlv?: string | null;
  data_expedicao_crlv?: string | null; 
  data_validade_crlv?: string | null;  
  id_proprietario_pessoa_fisica?: string | null;
  id_proprietario_entidade?: string | null;
  data_aquisicao?: string | null;      
  codigo_fipe?: string | null;
  valor_fipe?: number | null;
  data_consulta_fipe?: string | null; 
  mes_referencia_fipe?: string | null;
  observacao?: string | null;
  VeiculoMotoristas?: { 
    id_veiculo_motorista: string;
    id_motorista: string;
    PessoasFisicas: { nome_completo: string; cpf: string; }; 
    id_cnh: string;
    CNHs: { numero_registro: string; categoria: string; data_validade: string }; 
    categoria_cnh: string; 
  }[];
}

interface GenericOption { value: string; label: string; }

interface StagedMotorista {
  id_veiculo_motorista?: string; 
  tempId?: string; 
  id_motorista: string;
  nome_motorista: string;
  id_cnh: string;
  numero_cnh: string;
  categoria_cnh: string;
}

const initialFormData = {
  placa_atual: '', placa_anterior: '', chassi: '', tipo_especie: '--select--', combustivel: '',
  marca: '', modelo: '', ano_fabricacao: '', ano_modelo: '', cor: '',
  codigo_renavam: '', estado_crlv: '', numero_serie_crlv: '',
  data_expedicao_crlv: undefined as Date | undefined, data_validade_crlv: undefined as Date | undefined,
  tipo_proprietario: '' as 'pessoa_fisica' | 'organizacao' | '', id_proprietario: '',
  data_aquisicao: undefined as Date | undefined,
  codigo_fipe: '', valor_fipe: '', data_consulta_fipe: undefined as Date | undefined, mes_referencia_fipe: '',
  observacao: '',
};

const tipoEspecieOptions: GenericOption[] = [
  { value: "--select--", label: "Selecione o Tipo/Espécie" },
  { value: "Moto - Motocicleta", label: "Moto - Motocicleta" },
  { value: "Carro passeio - Automóvel de passeio", label: "Carro passeio - Automóvel de passeio" },
  { value: "Van - Utilitário/ Comercial Leve", label: "Van - Utilitário/ Comercial Leve" },
  { value: "Pickup - Caminhonete (ou Pickup)", label: "Pickup - Caminhonete (ou Pickup)" },
  { value: "Micro-ônibus - Veículo de transporte coletivo leve", label: "Micro-ônibus - Veículo de transporte coletivo leve" },
  { value: "Ônibus - Veículo de transporte coletivo pesado", label: "Ônibus - Veículo de transporte coletivo pesado" },
  { value: "Outro", label: "Outro (Especificar em Observações)"},
];

interface FipeMarca { codigo: string; nome: string; }
interface FipeModelo { codigo: string; nome: string; }
interface FipeAno { codigo: string; nome: string; }
interface FipeModelosAnosResponse { modelos: FipeModelo[]; anos: FipeAno[]; }
interface FipeVeiculoDetalhesResponse {
  Valor: string; Marca: string; Modelo: string; AnoModelo: number; Combustivel: string;
  CodigoFipe: string; MesReferencia: string; TipoVeiculo: number; SiglaCombustivel: string; DataConsulta: string;
}

async function fetchFipeMarcasParallelum(): Promise<FipeMarca[]> {
  console.log("Fetching FIPE Marcas from Parallelum API...");
  try {
    const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas`);
    if (!response.ok) { console.error(`Parallelum FIPE Marcas API error: ${response.status} ${response.statusText}`); return []; }
    return await response.json();
  } catch (error) { console.error("Error fetching FIPE Marcas:", error); return []; }
}

async function fetchFipeModelosAnosParallelum(marcaCodigo: string): Promise<FipeModelosAnosResponse | null> {
  if (!marcaCodigo) return null;
  console.log(`Fetching FIPE Modelos/Anos for marca ${marcaCodigo} from Parallelum API...`);
  try {
    const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaCodigo}/modelos`);
    if (!response.ok) { console.error(`Parallelum FIPE Modelos/Anos API error: ${response.status} ${response.statusText}`); return null; }
    const data = await response.json();
    const modelosWithStringCodes = (data.modelos || []).map((m: any) => ({ ...m, codigo: String(m.codigo) }));
    return { modelos: modelosWithStringCodes, anos: data.anos || [] };
  } catch (error) { console.error("Error fetching FIPE Modelos/Anos:", error); return null; }
}

async function fetchFipeDetalhesVeiculoParallelum(marcaCodigo: string, modeloCodigo: string, anoCodigo: string): Promise<FipeVeiculoDetalhesResponse | null> {
  if (!marcaCodigo || !modeloCodigo || !anoCodigo) return null;
  console.log(`Fetching FIPE Detalhes for ${marcaCodigo}/${modeloCodigo}/${anoCodigo} from Parallelum API...`);
  try {
    const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos/${anoCodigo}`);
    if (!response.ok) { console.error(`Parallelum FIPE Detalhes API error: ${response.status} ${response.statusText}`); return null; }
    return await response.json();
  } catch (error) { console.error("Error fetching FIPE Detalhes:", error); return null; }
}

async function getVehicleById(vehicleId: string): Promise<VehicleDataFromDB | null> {
  if (!supabase) {
    console.error("EditarVeiculoPage: Supabase client not initialized.");
    return null;
  }
  const numericId = parseInt(vehicleId, 10);
  if (isNaN(numericId)) {
    console.error("EditarVeiculoPage: Invalid vehicle ID provided:", vehicleId);
    return null;
  }

  console.log(`Fetching vehicle data for ID: ${numericId} from Supabase`);
  const { data, error } = await supabase
    .from('Veiculos')
    .select(`
      *, 
      VeiculoMotoristas (
        id_veiculo_motorista,
        id_motorista,
        id_cnh,
        categoria_cnh,
        PessoasFisicas!inner ( nome_completo, cpf ),
        CNHs!inner ( numero_registro, categoria, data_validade )
      )
    `)
    .eq('id_veiculo', numericId)
    .single<VehicleDataFromDB>(); 

  if (error) {
    console.error("Erro ao buscar dados do veículo:", JSON.stringify(error, null, 2));
    return null;
  }
  return data;
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
  
  const [availablePessoasFisicas, setAvailablePessoasFisicas] = useState<GenericOption[]>([]);
  const [availableOrganizacoes, setAvailableOrganizacoes] = useState<GenericOption[]>([]);
  const [availableMotoristas, setAvailableMotoristas] = useState<GenericOption[]>([]);
  const [availableCNHsForSelectedMotorista, setAvailableCNHsForSelectedMotorista] = useState<GenericOption[]>([]);

  const [isMotoristaModalOpen, setIsMotoristaModalOpen] = useState(false);
  const [motoristaModalData, setMotoristaModalData] = useState({ id_motorista: '', id_cnh: '', categoria_cnh_veiculo: '' });

  const [fipeMarcas, setFipeMarcas] = useState<FipeMarca[]>([]);
  const [fipeModelos, setFipeModelos] = useState<FipeModelo[]>([]);
  const [fipeAnos, setFipeAnos] = useState<FipeAno[]>([]);
  const [selectedFipeMarcaCodigo, setSelectedFipeMarcaCodigo] = useState('');
  const [selectedFipeModeloCodigo, setSelectedFipeModeloCodigo] = useState('');
  const [selectedFipeAnoCodigo, setSelectedFipeAnoCodigo] = useState('');
  const [fipeVeiculoDetalhes, setFipeVeiculoDetalhes] = useState<FipeVeiculoDetalhesResponse | null>(null);
  const [isLoadingFipeMarcas, setIsLoadingFipeMarcas] = useState(false);
  const [isLoadingFipeModelosAnos, setIsLoadingFipeModelosAnos] = useState(false);
  const [isLoadingFipeDetalhes, setIsLoadingFipeDetalhes] = useState(false);

  useEffect(() => {
    const loadMarcas = async () => {
      setIsLoadingFipeMarcas(true);
      const marcasData = await fetchFipeMarcasParallelum();
      setFipeMarcas(marcasData);
      setIsLoadingFipeMarcas(false);
    };
    loadMarcas();
  }, []);

  useEffect(() => {
    const loadModelosAnos = async () => {
      if (selectedFipeMarcaCodigo) {
        setIsLoadingFipeModelosAnos(true);
        setFipeModelos([]); setFipeAnos([]);
        setSelectedFipeModeloCodigo(''); setSelectedFipeAnoCodigo('');
        setFipeVeiculoDetalhes(null);
        const data = await fetchFipeModelosAnosParallelum(selectedFipeMarcaCodigo);
        if (data) {
          setFipeModelos(data.modelos || []);
          setFipeAnos(data.anos || []);
        } else {
          toast({ title: "Erro ao buscar modelos/anos FIPE", variant: "destructive" });
        }
        setIsLoadingFipeModelosAnos(false);
      }
    };
    if (selectedFipeMarcaCodigo) loadModelosAnos();
  }, [selectedFipeMarcaCodigo, toast]);

  useEffect(() => {
    if (selectedFipeModeloCodigo) {
        setSelectedFipeAnoCodigo('');
        setFipeVeiculoDetalhes(null);
    }
  }, [selectedFipeModeloCodigo]);

  useEffect(() => {
    setFipeVeiculoDetalhes(null);
  }, [selectedFipeAnoCodigo]);


  useEffect(() => {
    const fetchInitialData = async () => {
      if (!vehicleId || !supabase) { setIsLoading(false); setVehicleFound(false); return; }
      setIsLoading(true);

      const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo');
      if (pfError) toast({ title: "Erro Pessoas Físicas", description: pfError.message, variant: "destructive" });
      else {
         setAvailablePessoasFisicas(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: `${pf.nome_completo} (${pf.cpf})` })));
         setAvailableMotoristas(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: `${pf.nome_completo} (${pf.cpf})` })));
      }

      const { data: orgData, error: orgError } = await supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome');
      if (orgError) toast({ title: "Erro Organizações", description: orgError.message, variant: "destructive" });
      else setAvailableOrganizacoes(orgData.map(org => ({ value: org.id_entidade.toString(), label: `${org.nome} (${org.cnpj})` })));
      
      const data = await getVehicleById(vehicleId);
      if (data) {
        setFormData({
          placa_atual: data.placa_atual || '',
          placa_anterior: data.placa_anterior || '',
          chassi: data.chassi || '',
          tipo_especie: data.tipo_especie || '--select--',
          combustivel: data.combustivel || '',
          marca: data.marca || '',
          modelo: data.modelo || '',
          ano_fabricacao: data.ano_fabricacao?.toString() || '',
          ano_modelo: data.ano_modelo?.toString() || '',
          cor: data.cor || '',
          codigo_renavam: data.codigo_renavam || '',
          estado_crlv: data.estado_crlv || '',
          numero_serie_crlv: data.numero_serie_crlv || '',
          data_expedicao_crlv: data.data_expedicao_crlv && isValidDate(parseISO(data.data_expedicao_crlv)) ? parseISO(data.data_expedicao_crlv) : undefined,
          data_validade_crlv: data.data_validade_crlv && isValidDate(parseISO(data.data_validade_crlv)) ? parseISO(data.data_validade_crlv) : undefined,
          tipo_proprietario: data.id_proprietario_pessoa_fisica ? 'pessoa_fisica' : (data.id_proprietario_entidade ? 'organizacao' : ''),
          id_proprietario: (data.id_proprietario_pessoa_fisica || data.id_proprietario_entidade || '').toString(),
          data_aquisicao: data.data_aquisicao && isValidDate(parseISO(data.data_aquisicao)) ? parseISO(data.data_aquisicao) : undefined,
          codigo_fipe: data.codigo_fipe || '',
          valor_fipe: data.valor_fipe?.toString() || '',
          data_consulta_fipe: data.data_consulta_fipe && isValidDate(parseISO(data.data_consulta_fipe)) ? parseISO(data.data_consulta_fipe) : undefined,
          mes_referencia_fipe: data.mes_referencia_fipe || '',
          observacao: data.observacao || '',
        });
        setStagedMotoristas((data.VeiculoMotoristas || []).map(vm => ({
            id_veiculo_motorista: vm.id_veiculo_motorista,
            tempId: vm.id_veiculo_motorista, 
            id_motorista: vm.id_motorista.toString(),
            nome_motorista: vm.PessoasFisicas.nome_completo,
            id_cnh: vm.id_cnh.toString(),
            numero_cnh: `${vm.CNHs.numero_registro} (Cat: ${vm.CNHs.categoria}, Val: ${vm.CNHs.data_validade && isValidDate(parseISO(vm.CNHs.data_validade)) ? format(parseISO(vm.CNHs.data_validade), 'dd/MM/yyyy') : 'Data Inválida'})`,
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
      else setAvailableCNHsForSelectedMotorista(cnhData.map(cnh => ({ value: cnh.id_cnh.toString(), label: `${cnh.numero_registro} (Cat: ${cnh.categoria}, Val: ${cnh.data_validade && isValidDate(parseISO(cnh.data_validade)) ? format(parseISO(cnh.data_validade), 'dd/MM/yyyy') : 'Data Inválida'})` })));
    };
    if(motoristaModalData.id_motorista) fetchCNHs();
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

  const handleBuscarFipeDetalhes = async () => {
    if (!selectedFipeMarcaCodigo || !selectedFipeModeloCodigo || !selectedFipeAnoCodigo) {
      toast({ title: "Seleção Incompleta", description: "Por favor, selecione Marca, Modelo e Ano para buscar os detalhes da FIPE.", variant: "default" });
      return;
    }
    setIsLoadingFipeDetalhes(true);
    setFipeVeiculoDetalhes(null);
    const detalhes = await fetchFipeDetalhesVeiculoParallelum(selectedFipeMarcaCodigo, String(selectedFipeModeloCodigo), selectedFipeAnoCodigo);
    if (detalhes) {
      setFipeVeiculoDetalhes(detalhes);
      toast({ title: "Detalhes FIPE Carregados", description: "Verifique os dados abaixo e clique em 'Usar Dados FIPE' para preencher o formulário." });
    } else {
      toast({ title: "Erro ao Buscar Detalhes FIPE", description: "Não foi possível carregar os detalhes para a seleção. Verifique os dados ou tente novamente.", variant: "destructive" });
    }
    setIsLoadingFipeDetalhes(false);
  };

  const handleUsarDadosFipe = () => {
    if (!fipeVeiculoDetalhes) {
      toast({ title: "Nenhum Detalhe FIPE", description: "Busque os detalhes da FIPE primeiro.", variant: "default" });
      return;
    }
    setFormData(prev => ({
      ...prev,
      marca: fipeVeiculoDetalhes.Marca || prev.marca,
      modelo: fipeVeiculoDetalhes.Modelo || prev.modelo,
      ano_modelo: fipeVeiculoDetalhes.AnoModelo?.toString() || prev.ano_modelo,
      ano_fabricacao: fipeVeiculoDetalhes.AnoModelo?.toString() || prev.ano_fabricacao, // Often FIPE AnoModelo is used for both
      combustivel: fipeVeiculoDetalhes.Combustivel || prev.combustivel,
      codigo_fipe: fipeVeiculoDetalhes.CodigoFipe || prev.codigo_fipe,
      valor_fipe: fipeVeiculoDetalhes.Valor ? fipeVeiculoDetalhes.Valor.replace(/R\$ /g, '').replace(/\./g, '').replace(',', '.') : prev.valor_fipe,
      mes_referencia_fipe: fipeVeiculoDetalhes.MesReferencia?.trim() || prev.mes_referencia_fipe,
      data_consulta_fipe: new Date(),
    }));
    toast({ title: "Formulário Preenchido", description: "Dados da FIPE aplicados ao formulário principal." });
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

  const handleRemoveStagedMotorista = (idToRemove: string) => {
    setStagedMotoristas(prev => prev.filter(m => (m.id_veiculo_motorista || m.tempId) !== idToRemove));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !vehicleId) { toast({ title: "Erro de Configuração", variant: "destructive" }); return; }
    setIsLoading(true);

    if (!formData.placa_atual || !formData.marca || !formData.modelo || !formData.ano_fabricacao || !formData.codigo_renavam || !formData.tipo_proprietario || !formData.id_proprietario) {
      toast({ title: "Campos Obrigatórios", description: "Placa, Marca, Modelo, Ano Fabricação, Renavam e Proprietário são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    const veiculoUpdatePayload = {
      placa_atual: formData.placa_atual,
      placa_anterior: formData.placa_anterior || null,
      chassi: formData.chassi,
      tipo_especie: formData.tipo_especie === "--select--" ? null : formData.tipo_especie || null,
      combustivel: formData.combustivel || null,
      marca: formData.marca,
      modelo: formData.modelo,
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
      observacao: formData.observacao || null,
      codigo_fipe: formData.codigo_fipe || null,
      valor_fipe: formData.valor_fipe ? parseFloat(formData.valor_fipe) : null,
      data_consulta_fipe: formData.data_consulta_fipe ? format(formData.data_consulta_fipe, "yyyy-MM-dd") : null,
      mes_referencia_fipe: formData.mes_referencia_fipe || null,
    };

    try {
      const { error: veiculoError } = await supabase
        .from('Veiculos')
        .update(veiculoUpdatePayload)
        .eq('id_veiculo', parseInt(vehicleId));

      if (veiculoError) throw veiculoError;

      const { error: deleteMotoristasError } = await supabase
        .from('VeiculoMotoristas')
        .delete()
        .eq('id_veiculo', parseInt(vehicleId));
      
      if (deleteMotoristasError) {
        console.warn("Erro ao deletar motoristas antigos:", JSON.stringify(deleteMotoristasError, null, 2));
        toast({ title: "Aviso", description: "Erro ao limpar motoristas antigos. Por favor, verifique os vínculos dos motoristas.", variant: "default", duration: 6000 });
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
          console.warn("Erro ao salvar novos motoristas vinculados:", JSON.stringify(insertMotoristasError, null, 2));
          toast({ title: "Veículo Atualizado com Aviso", description: `Dados principais salvos, mas erro ao atualizar motoristas: ${insertMotoristasError.message}`, variant: "default", duration: 6000 });
        }
      }
      
      toast({ title: "Veículo Atualizado!", description: "Os dados do veículo foram salvos." });
      router.push('/admin/veiculos'); 

    } catch (error: any) {
      console.error('Erro ao atualizar veículo:', JSON.stringify(error, null, 2), error);
      if (error.code === '22001') { 
        toast({ title: "Erro ao Atualizar", description: `Um dos campos de texto é muito longo para o banco de dados. Verifique os dados e tente novamente. Detalhe: ${error.message}`, variant: "destructive", duration: 7000 });
      } else if (error.code === '23505') { 
        toast({ title: "Erro ao Atualizar", description: `Já existe um veículo com esta Placa, Chassi ou Renavam. Verifique os dados. Detalhe: ${error.message}`, variant: "destructive", duration: 7000 });
      } else {
        toast({ title: "Erro ao Atualizar", description: error.message || "Ocorreu um erro. Verifique RLS e os dados do formulário.", variant: "destructive" });
      }
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
        <Card className="shadow-lg mb-6">
             <CardHeader>
                <CardTitle className="flex items-center"><Tags className="mr-2 h-5 w-5 text-primary"/> Busca Tabela FIPE</CardTitle>
                <CardDescription>Selecione Marca, Modelo e Ano para buscar dados da FIPE e preencher o formulário.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="fipe_marca_edit">Marca</Label>
                        <Select 
                            value={selectedFipeMarcaCodigo} 
                            onValueChange={(value) => {
                                console.log("FIPE Marca Selecionada (value):", value);
                                setSelectedFipeMarcaCodigo(value);
                            }}
                            disabled={isLoadingFipeMarcas}
                        >
                            <SelectTrigger id="fipe_marca_edit" className="w-full"><SelectValue placeholder={isLoadingFipeMarcas ? "Carregando..." : "Selecione a Marca"} /></SelectTrigger>
                            <SelectContent>
                                {fipeMarcas.map(marca => <SelectItem key={marca.codigo} value={marca.codigo}>{marca.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="fipe_modelo_edit">Modelo</Label>
                         <Select 
                            value={selectedFipeModeloCodigo} 
                            onValueChange={(value) => {
                                console.log("FIPE Modelo Selecionado (value):", value);
                                setSelectedFipeModeloCodigo(value);
                            }}
                            disabled={!selectedFipeMarcaCodigo || isLoadingFipeModelosAnos}
                        >
                           <SelectTrigger id="fipe_modelo_edit" className="w-full">
                                {(() => {
                                    // console.log("Rendering Modelo Trigger Edit: selectedCode:", selectedFipeModeloCodigo, "Models available:", fipeModelos.length);
                                    if (isLoadingFipeModelosAnos && !selectedFipeModeloCodigo) { 
                                    return <span className="text-muted-foreground">Carregando...</span>;
                                    }
                                    if (selectedFipeModeloCodigo && fipeModelos.length > 0) {
                                      const selectedModel = fipeModelos.find(m => String(m.codigo) === String(selectedFipeModeloCodigo));
                                      if (selectedModel && selectedModel.nome) {
                                          return <span className="text-foreground">{selectedModel.nome}</span>;
                                      } else if (selectedModel && !selectedModel.nome) {
                                          return <span className="text-muted-foreground">Modelo Cód: {selectedFipeModeloCodigo} (sem nome)</span>;
                                      } else {
                                          return <span className="text-muted-foreground">Cód: {selectedFipeModeloCodigo}</span>;
                                      }
                                    }
                                    return <SelectValue placeholder="Selecione o Modelo" />;
                                })()}
                           </SelectTrigger>
                            <SelectContent>
                                {fipeModelos.map(modelo => (
                                  <SelectItem key={modelo.codigo} value={String(modelo.codigo)}> 
                                      {modelo.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="fipe_ano_edit">Ano</Label>
                        <Select 
                            value={selectedFipeAnoCodigo} 
                            onValueChange={(value) => {
                                console.log("FIPE Ano Selecionado (value):", value);
                                setSelectedFipeAnoCodigo(value);
                            }}
                            disabled={!selectedFipeMarcaCodigo || !selectedFipeModeloCodigo || isLoadingFipeModelosAnos}
                        >
                            <SelectTrigger id="fipe_ano_edit" className="w-full">
                               <SelectValue placeholder={isLoadingFipeModelosAnos ? "Carregando..." : "Selecione o Ano"} />
                            </SelectTrigger>
                            <SelectContent>
                                {fipeAnos.map(ano => <SelectItem key={ano.codigo} value={ano.codigo}>{ano.nome}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <Button type="button" onClick={handleBuscarFipeDetalhes} disabled={isLoadingFipeDetalhes || !selectedFipeMarcaCodigo || !selectedFipeModeloCodigo || !selectedFipeAnoCodigo}>
                        {isLoadingFipeDetalhes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                        Buscar Detalhes FIPE
                    </Button>
                    {fipeVeiculoDetalhes && (
                        <Button type="button" variant="outline" onClick={handleUsarDadosFipe}>
                            Usar Dados FIPE no Formulário
                        </Button>
                    )}
                </div>
                 {fipeVeiculoDetalhes && (
                    <Card className="mt-4 bg-muted/50 p-4">
                        <CardHeader className="p-0 pb-2"><CardTitle className="text-md flex items-center"><HelpCircle className="mr-2 h-4 w-4 text-primary"/> Detalhes FIPE Encontrados:</CardTitle></CardHeader>
                        <CardContent className="p-0 text-sm space-y-1">
                            <p><strong>Valor:</strong> {fipeVeiculoDetalhes.Valor}</p>
                            <p><strong>Marca:</strong> {fipeVeiculoDetalhes.Marca} / <strong>Modelo:</strong> {fipeVeiculoDetalhes.Modelo}</p>
                            <p><strong>Ano Modelo:</strong> {fipeVeiculoDetalhes.AnoModelo} / <strong>Combustível:</strong> {fipeVeiculoDetalhes.Combustivel}</p>
                            <p><strong>Código FIPE:</strong> {fipeVeiculoDetalhes.CodigoFipe}</p>
                            <p><strong>Mês Referência:</strong> {fipeVeiculoDetalhes.MesReferencia} / <strong>Data Consulta:</strong> {fipeVeiculoDetalhes.DataConsulta ? format(parse(fipeVeiculoDetalhes.DataConsulta, "EEEE, d 'de' MMMM 'de' yyyy HH:mm:ss", new Date(), { locale: ptBR }), "dd/MM/yyyy HH:mm") : 'N/A'}</p>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados Principais do Veículo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2"><Label htmlFor="placa_atual_edit">Placa Atual <span className="text-destructive">*</span></Label><Input id="placa_atual_edit" name="placa_atual" value={formData.placa_atual} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="chassi_edit">Chassi <span className="text-destructive">*</span></Label><Input id="chassi_edit" name="chassi" value={formData.chassi} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="marca_edit">Marca <span className="text-destructive">*</span></Label><Input id="marca_edit" name="marca" value={formData.marca} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="modelo_edit">Modelo <span className="text-destructive">*</span></Label><Input id="modelo_edit" name="modelo" value={formData.modelo} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="ano_fabricacao_edit">Ano Fabricação <span className="text-destructive">*</span></Label><Input id="ano_fabricacao_edit" name="ano_fabricacao" type="number" value={formData.ano_fabricacao} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="ano_modelo_edit">Ano Modelo</Label><Input id="ano_modelo_edit" name="ano_modelo" type="number" value={formData.ano_modelo} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="cor_edit">Cor</Label><Input id="cor_edit" name="cor" value={formData.cor} onChange={handleChange} /></div>
            <div className="space-y-2">
                <Label htmlFor="tipo_especie_trigger_edit">Tipo/Espécie</Label>
                 <Select name="tipo_especie" value={formData.tipo_especie} onValueChange={(v) => handleSelectChange('tipo_especie', v)}>
                    <SelectTrigger id="tipo_especie_trigger_edit"><SelectValue placeholder="Selecione o Tipo/Espécie" /></SelectTrigger>
                    <SelectContent>
                        {tipoEspecieOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="combustivel_edit">Combustível</Label><Input id="combustivel_edit" name="combustivel" value={formData.combustivel} onChange={handleChange} /></div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados do CRLV</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2"><Label htmlFor="codigo_renavam_edit">Código Renavam <span className="text-destructive">*</span></Label><Input id="codigo_renavam_edit" name="codigo_renavam" value={formData.codigo_renavam} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label htmlFor="numero_serie_crlv_edit">Nº Série CRLV</Label><Input id="numero_serie_crlv_edit" name="numero_serie_crlv" value={formData.numero_serie_crlv} onChange={handleChange} /></div>
            <div className="space-y-2"><Label htmlFor="data_expedicao_crlv_edit">Data Expedição CRLV</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_expedicao_crlv ? format(formData.data_expedicao_crlv, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_expedicao_crlv} onSelect={(d) => handleDateChange('data_expedicao_crlv', d)} /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label htmlFor="data_validade_crlv_edit">Data Validade CRLV</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_validade_crlv ? format(formData.data_validade_crlv, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_validade_crlv} onSelect={(d) => handleDateChange('data_validade_crlv', d)} /></PopoverContent></Popover></div>
            <div className="space-y-2"><Label htmlFor="estado_crlv_edit">Estado CRLV</Label><Input id="estado_crlv_edit" name="estado_crlv" value={formData.estado_crlv} onChange={handleChange} maxLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="placa_anterior_edit">Placa Anterior</Label><Input id="placa_anterior_edit" name="placa_anterior" value={formData.placa_anterior} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-6">
          <CardHeader><CardTitle>Dados do Proprietário</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipo_proprietario_edit">Tipo de Proprietário <span className="text-destructive">*</span></Label>
              <Select name="tipo_proprietario" value={formData.tipo_proprietario} onValueChange={(v) => handleSelectChange('tipo_proprietario', v as any)} required>
                <SelectTrigger id="tipo_proprietario_edit"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                  <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_proprietario && (
              <div className="space-y-2">
                <Label htmlFor="id_proprietario_edit">Proprietário <span className="text-destructive">*</span></Label>
                <Select name="id_proprietario" value={formData.id_proprietario} onValueChange={(v) => handleSelectChange('id_proprietario', v)} required>
                  <SelectTrigger id="id_proprietario_edit"><SelectValue placeholder={`Selecione ${formData.tipo_proprietario === 'pessoa_fisica' ? 'Pessoa Física' : 'Organização'}`} /></SelectTrigger>
                  <SelectContent>
                    {(formData.tipo_proprietario === 'pessoa_fisica' ? availablePessoasFisicas : availableOrganizacoes).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="data_aquisicao_edit">Data Aquisição</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_aquisicao ? format(formData.data_aquisicao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_aquisicao} onSelect={(d) => handleDateChange('data_aquisicao', d)} /></PopoverContent></Popover></div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg mb-6">
            <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/> Dados de Mercado (FIPE Preenchidos)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label htmlFor="codigo_fipe_form_edit">Código FIPE</Label><Input id="codigo_fipe_form_edit" name="codigo_fipe" value={formData.codigo_fipe} onChange={handleChange} placeholder="Preenchido pela busca FIPE" /></div>
                <div className="space-y-2"><Label htmlFor="valor_fipe_form_edit">Valor Tabela FIPE (R$)</Label><Input id="valor_fipe_form_edit" name="valor_fipe" value={formData.valor_fipe} onChange={handleChange} /></div>
                <div className="space-y-2"><Label htmlFor="mes_referencia_fipe_form_edit">Mês Referência FIPE</Label><Input id="mes_referencia_fipe_form_edit" name="mes_referencia_fipe" value={formData.mes_referencia_fipe} onChange={handleChange} /></div>
                <div className="space-y-2 md:col-span-3"><Label htmlFor="data_consulta_fipe_form_edit">Data da Consulta FIPE</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData.data_consulta_fipe ? format(formData.data_consulta_fipe, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.data_consulta_fipe} onSelect={(d) => handleDateChange('data_consulta_fipe', d)} /></PopoverContent>
                  </Popover>
                </div>
            </CardContent>
        </Card>

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

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent><Textarea id="observacao_edit" name="observacao" value={formData.observacao} onChange={handleChange} rows={4} /></CardContent>
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
              <Label htmlFor="id_motorista_modal_edit">Motorista (Pessoa Física)</Label>
              <Select value={motoristaModalData.id_motorista} onValueChange={(v) => setMotoristaModalData(prev => ({...prev, id_motorista: v, id_cnh: ''}))}>
                <SelectTrigger id="id_motorista_modal_edit"><SelectValue placeholder="Selecione o motorista"/></SelectTrigger>
                <SelectContent>
                  {availableMotoristas.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {motoristaModalData.id_motorista && (
            <div>
              <Label htmlFor="id_cnh_modal_edit">CNH do Motorista</Label>
              <Select value={motoristaModalData.id_cnh} onValueChange={(v) => setMotoristaModalData(prev => ({...prev, id_cnh: v}))} disabled={availableCNHsForSelectedMotorista.length === 0}>
                <SelectTrigger id="id_cnh_modal_edit"><SelectValue placeholder={availableCNHsForSelectedMotorista.length > 0 ? "Selecione a CNH" : "Nenhuma CNH cadastrada para este motorista"}/></SelectTrigger>
                <SelectContent>
                  {availableCNHsForSelectedMotorista.map(cnh => <SelectItem key={cnh.value} value={cnh.value}>{cnh.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            )}
            <div>
              <Label htmlFor="categoria_cnh_veiculo_modal_edit">Categoria da CNH para este Veículo <span className="text-destructive">*</span></Label>
              <Input id="categoria_cnh_veiculo_modal_edit" value={motoristaModalData.categoria_cnh_veiculo} onChange={(e) => setMotoristaModalData(prev => ({...prev, categoria_cnh_veiculo: e.target.value.toUpperCase()}))} placeholder="Ex: B, AB, D"/>
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
- Database schema:
  - `Veiculos` table now has direct `marca`, `modelo` fields. `versao` is removed.
  - CRLV fields are incorporated directly.
  - FIPE fields (`codigo_fipe VARCHAR(20)`, `valor_fipe NUMERIC(10,2)`, `data_consulta_fipe DATE`, `mes_referencia_fipe VARCHAR(50)`) are included.
- FIPE API (Parallelum): Multi-step fetch logic (Marca -> Modelo/Ano -> Detalhes) is implemented.
- `handleSubmit`: Saves vehicle data including direct FIPE fields and linked motoristas (to `VeiculoMotoristas`).
- Dynamic selects for Proprietário (PessoasFisicas/Entidades) and CNHs (for selected motorista).
- Tipo/Espécie is now a dropdown.
*/

    
