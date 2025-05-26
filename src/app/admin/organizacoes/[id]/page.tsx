
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input"; 
import { Label as InfoItemLabel } from "@/components/ui/label"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building, Edit3, Trash2, AlertTriangle, Info, MapPin, Users, Car, CalendarDays, Mail, Phone, Hash, Workflow, UserPlus, GripVertical, DollarSign, FileText, Contact, UserCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface QSAItemFromDB {
  id_qsa?: number;
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade?: string | null; // YYYY-MM-DD
  observacoes?: string | null;
}

interface OrganizacaoDetailed {
  id: string; // Corresponds to id_entidade
  nome: string;
  codigoEntidade: string | null;
  cnpj: string;
  tipoOrganizacaoNome: string | null; 
  telefone: string | null;
  email: string | null;
  dataCadastro: string;
  
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado_uf: string | null;
  cep: string | null;

  endereco2_logradouro?: string | null;
  endereco2_numero?: string | null;
  endereco2_complemento?: string | null;
  endereco2_bairro?: string | null;
  endereco2_cidade?: string | null;
  endereco2_estado_uf?: string | null;
  endereco2_cep?: string | null;

  nome_contato_responsavel?: string | null;
  cargo_contato_responsavel?: string | null;
  email_contato?: string | null;
  telefone_contato?: string | null;
  observacoes_contato?: string | null;

  data_inicio_atividade?: string | null;
  porte_empresa?: string | null;
  natureza_juridica?: string | null;
  cnae_principal?: string | null;
  cnae_secundarios?: { codigo: string, descricao: string }[] | null;
  descricao_situacao_cadastral?: string | null;
  
  observacoes: string | null;
  membros: Membro[];
  veiculos: VeiculoAssociado[];
  qsa: QSAItemFromDB[];
}

interface Membro {
  id_membro_entidade: string;
  id_membro_original: string; 
  nome: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  funcao: string;
  dataAssociacao: string | null;
}

interface VeiculoAssociado {
  id_veiculo: string;
  placa_atual: string;
  modelo_nome: string;
  marca: string;
  ano_fabricacao: number | null;
}

const placeholderPessoasFisicas = [ // For "Add Member" modal
    { value: "pf_1", label: "João da Silva (123.456.789-00)" },
    { value: "pf_2", label: "Maria Oliveira (987.654.321-99)" },
];
const placeholderOutrasEntidades = [ // For "Add Member" modal
    { value: "org_101", label: "Filial ABC (11.111.111/0001-11)" },
    { value: "org_102", label: "Parceiro XYZ (22.222.222/0001-22)" },
];


async function getOrganizacaoDetails(organizacaoId: string): Promise<OrganizacaoDetailed | null> {
  if (!supabase) {
    console.error("Supabase client not init in getOrganizacaoDetails (Details Page)");
    return null;
  }
  const numericOrgId = parseInt(organizacaoId, 10);
  if (isNaN(numericOrgId)) {
     console.error("Invalid orgId for getOrganizacaoDetails (Details Page):", organizacaoId);
     return null;
  }
  console.log(`Fetching organization details for ID: ${numericOrgId} (Details Page)`);
  
  const { data: orgData, error: orgError } = await supabase
    .from('Entidades')
    .select(`
      *, 
      TiposEntidade ( nome_tipo ),
      QSA ( * ),
      MembrosEntidade!MembrosEntidade_id_entidade_pai_fkey (
        id_membro_entidade,
        tipo_membro,
        funcao_no_membro,
        data_associacao,
        PessoasFisicas!MembrosEntidade_id_membro_pessoa_fisica_fkey ( id_pessoa_fisica, nome_completo ),
        Entidades!MembrosEntidade_id_membro_entidade_juridica_fkey ( id_entidade, nome )
      ),
      Veiculos!Veiculos_id_proprietario_entidade_fkey (
        id_veiculo,
        placa_atual,
        marca,
        ano_fabricacao,
        ModelosVeiculo ( nome_modelo )
      )
    `)
    .eq('id_entidade', numericOrgId)
    .single();

  if (orgError) { 
    console.error("Erro ao buscar detalhes da organização (Details Page):", JSON.stringify(orgError, null, 2)); 
    return null; 
  }
  if (!orgData) return null;

  const membrosFormatados: Membro[] = (orgData.MembrosEntidade || []).map((m: any) => ({
    id_membro_entidade: m.id_membro_entidade.toString(),
    id_membro_original: (m.PessoasFisicas?.id_pessoa_fisica || m.Entidades?.id_entidade)?.toString() || 'N/A_MEMBER_ID',
    nome: m.PessoasFisicas?.nome_completo || m.Entidades?.nome || 'Membro Desconhecido',
    tipo: m.tipo_membro === 'Pessoa Fisica' ? 'Pessoa Física' : 'Pessoa Jurídica',
    funcao: m.funcao_no_membro || 'N/A',
    dataAssociacao: m.data_associacao,
  }));

  const veiculosFormatados: VeiculoAssociado[] = (orgData.Veiculos || []).map((v: any) => ({
    id_veiculo: v.id_veiculo.toString(),
    placa_atual: v.placa_atual,
    modelo_nome: v.ModelosVeiculo?.nome_modelo || 'N/A',
    marca: v.marca || 'N/A',
    ano_fabricacao: v.ano_fabricacao,
  }));
  
  const qsaFormatado: QSAItemFromDB[] = (orgData.QSA || []).map((q: any) => ({
      id_qsa: q.id_qsa,
      nome_socio: q.nome_socio,
      qualificacao_socio: q.qualificacao_socio,
      data_entrada_sociedade: q.data_entrada_sociedade,
      observacoes: q.observacoes
  }));

  return {
    id: orgData.id_entidade.toString(),
    nome: orgData.nome,
    codigoEntidade: orgData.codigo_entidade,
    cnpj: orgData.cnpj,
    tipoOrganizacaoNome: orgData.TiposEntidade?.nome_tipo || 'N/A',
    telefone: orgData.telefone,
    email: orgData.email,
    dataCadastro: orgData.data_cadastro,
    logradouro: orgData.logradouro,
    numero: orgData.numero,
    complemento: orgData.complemento,
    bairro: orgData.bairro,
    cidade: orgData.cidade,
    estado_uf: orgData.estado_uf,
    cep: orgData.cep,
    endereco2_logradouro: orgData.endereco2_logradouro,
    endereco2_numero: orgData.endereco2_numero,
    endereco2_complemento: orgData.endereco2_complemento,
    endereco2_bairro: orgData.endereco2_bairro,
    endereco2_cidade: orgData.endereco2_cidade,
    endereco2_estado_uf: orgData.endereco2_estado_uf,
    endereco2_cep: orgData.endereco2_cep,
    nome_contato_responsavel: orgData.nome_contato_responsavel,
    cargo_contato_responsavel: orgData.cargo_contato_responsavel,
    email_contato: orgData.email_contato,
    telefone_contato: orgData.telefone_contato,
    observacoes_contato: orgData.observacoes_contato,
    data_inicio_atividade: orgData.data_inicio_atividade,
    porte_empresa: orgData.porte_empresa,
    natureza_juridica: orgData.natureza_juridica,
    cnae_principal: orgData.cnae_principal,
    cnae_secundarios: orgData.cnae_secundarios as any [] || null, 
    descricao_situacao_cadastral: orgData.descricao_situacao_cadastral,
    observacoes: orgData.observacoes,
    membros: membrosFormatados,
    veiculos: veiculosFormatados,
    qsa: qsaFormatado,
  };
}

export default function OrganizacaoDetailsPage() {
  const params = useParams();
  const organizacaoId = params.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const [organizacao, setOrganizacao] = useState<OrganizacaoDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberFormData, setAddMemberFormData] = useState({
    tipoMembro: 'pessoa_fisica' as 'pessoa_fisica' | 'pessoa_juridica',
    membroId: '', 
    funcao: '',
    dataAssociacao: new Date() as Date | undefined,
  });

  const [isEditVinculoModalOpen, setIsEditVinculoModalOpen] = useState(false);
  const [editVinculoFormData, setEditVinculoFormData] = useState<{ id_membro_entidade: string; funcao: string; dataAssociacao: Date | undefined }>({
    id_membro_entidade: '', funcao: '', dataAssociacao: undefined,
  });
  
  const [memberToRemove, setMemberToRemove] = useState<Membro | null>(null);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [availablePessoasFisicas, setAvailablePessoasFisicas] = useState<{value: string, label: string}[]>(placeholderPessoasFisicas);
  const [availableOutrasEntidades, setAvailableOutrasEntidades] = useState<{value: string, label: string}[]>(placeholderOutrasEntidades);

  const fetchSelectOptions = async () => {
    if (!supabase) return;
    // Fetch Pessoas Fisicas
    const { data: pfData, error: pfError } = await supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo');
    if (pfError) console.error("Erro ao buscar Pessoas Físicas para select:", pfError);
    else setAvailablePessoasFisicas(pfData.map(pf => ({ value: pf.id_pessoa_fisica.toString(), label: `${pf.nome_completo} (${pf.cpf})` })));

    // Fetch Outras Entidades (excluding the current one)
    const numericOrgId = parseInt(organizacaoId, 10);
    let queryEntidades = supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome');
    if (!isNaN(numericOrgId)) {
        queryEntidades = queryEntidades.neq('id_entidade', numericOrgId);
    }
    const { data: entData, error: entError } = await queryEntidades;
    if (entError) console.error("Erro ao buscar Outras Entidades para select:", entError);
    else setAvailableOutrasEntidades(entData.map(ent => ({ value: ent.id_entidade.toString(), label: `${ent.nome} (${ent.cnpj})` })));
  };
  
  const refreshOrganizacaoDetails = async () => {
    if (organizacaoId && supabase) {
      setIsLoading(true);
      const data = await getOrganizacaoDetails(organizacaoId);
      setOrganizacao(data);
      setIsLoading(false);
      if (!data) {
        toast({title: "Erro ao Carregar", description: "Não foi possível recarregar os detalhes da organização.", variant: "destructive"});
      }
    }
  };

  useEffect(() => {
    refreshOrganizacaoDetails();
    fetchSelectOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacaoId]);

  const formatDate = (dateString: string | null | undefined, outputFormat = "dd/MM/yyyy") => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, outputFormat) : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const handleAddMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddMemberFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMemberSelectChange = (name: string, value: string) => {
    setAddMemberFormData(prev => ({ ...prev, [name]: value }));
    if (name === "tipoMembro") setAddMemberFormData(prev => ({ ...prev, membroId: '' }));
  };
  
  const handleAddMemberDateChange = (date: Date | undefined) => {
    setAddMemberFormData(prev => ({ ...prev, dataAssociacao: date }));
  };

  const handleAddMemberSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !organizacao || !addMemberFormData.membroId) {
      toast({ title: "Erro", description: "Dados incompletos para adicionar membro.", variant: "destructive" });
      return;
    }
    
    const payload = {
      id_entidade_pai: parseInt(organizacao.id),
      id_membro_pessoa_fisica: addMemberFormData.tipoMembro === 'pessoa_fisica' ? parseInt(addMemberFormData.membroId) : null,
      id_membro_entidade_juridica: addMemberFormData.tipoMembro === 'pessoa_juridica' ? parseInt(addMemberFormData.membroId) : null,
      tipo_membro: addMemberFormData.tipoMembro === 'pessoa_fisica' ? 'Pessoa Fisica' : 'Pessoa Juridica',
      funcao_no_membro: addMemberFormData.funcao || null,
      data_associacao: addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "yyyy-MM-dd") : null,
    };

    console.log("Adicionando membro:", payload);
    const { error } = await supabase.from('MembrosEntidade').insert(payload);
    if (error) {
      console.error("Erro ao adicionar membro:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Membro vinculado à organização."});
      setIsAddMemberModalOpen(false);
      setAddMemberFormData({ tipoMembro: 'pessoa_fisica', membroId: '', funcao: '', dataAssociacao: new Date() });
      refreshOrganizacaoDetails();
    }
  };

  const openEditVinculoModal = (membro: Membro) => {
    setEditVinculoFormData({
      id_membro_entidade: membro.id_membro_entidade,
      funcao: membro.funcao,
      dataAssociacao: membro.dataAssociacao ? parseISO(membro.dataAssociacao) : new Date(),
    });
    setIsEditVinculoModalOpen(true);
  };

  const handleEditVinculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditVinculoFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditVinculoDateChange = (date: Date | undefined) => {
    setEditVinculoFormData(prev => ({ ...prev, dataAssociacao: date }));
  };
  
  const handleEditVinculoSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const payload = {
      funcao_no_membro: editVinculoFormData.funcao || null,
      data_associacao: editVinculoFormData.dataAssociacao ? format(editVinculoFormData.dataAssociacao, "yyyy-MM-dd") : null,
    };
    console.log("Atualizando Vínculo ID:", editVinculoFormData.id_membro_entidade, "com:", payload);
    const { error } = await supabase.from('MembrosEntidade').update(payload).eq('id_membro_entidade', editVinculoFormData.id_membro_entidade);
    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Vínculo do membro atualizado."});
      setIsEditVinculoModalOpen(false);
      refreshOrganizacaoDetails();
    }
  };
  
  const openRemoveMemberModal = (membro: Membro) => {
    setMemberToRemove(membro);
    setIsRemoveMemberModalOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !supabase) return;
    console.log("Removendo vínculo ID:", memberToRemove.id_membro_entidade);
    const { error } = await supabase.from('MembrosEntidade').delete().eq('id_membro_entidade', memberToRemove.id_membro_entidade);
    if (error) {
      toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Vínculo do membro removido."});
      refreshOrganizacaoDetails();
    }
    setIsRemoveMemberModalOpen(false);
    setMemberToRemove(null);
  };
  
  const handleDeleteOrganizacao = async () => {
      if (!organizacao || !supabase) return;
      console.log(`Excluindo Organização ID: ${organizacao.id}`);
      const { error } = await supabase.from('Entidades').delete().eq('id_entidade', organizacao.id);
      if (error) {
        toast({title: "Erro ao Excluir", description: error.message, variant: "destructive"});
      } else {
        toast({title: "Organização Excluída", description: `Organização ${organizacao.nome} foi excluída.`});
        router.push('/admin/organizacoes');
      }
  };

  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center">Carregando...</div>;
  if (!organizacao) return <div className="container mx-auto px-4 py-12 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1><Button asChild className="mt-6"><Link href="/admin/organizacoes">Voltar</Link></Button></div>;

  const fullAddress = [ organizacao.logradouro, organizacao.numero, organizacao.complemento, organizacao.bairro, organizacao.cidade ? `${organizacao.cidade} - ${organizacao.estado_uf || ''}` : '', organizacao.cep ].filter(Boolean).join(', ') || "N/A";
  const fullAddress2 = [ organizacao.endereco2_logradouro, organizacao.endereco2_numero, organizacao.endereco2_complemento, organizacao.endereco2_bairro, organizacao.endereco2_cidade ? `${organizacao.endereco2_cidade} - ${organizacao.endereco2_estado_uf || ''}` : '', organizacao.endereco2_cep ].filter(Boolean).join(', ') || "N/A";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Building className="mr-3 h-8 w-8" /> Detalhes da Organização: {organizacao.nome}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome" value={organizacao.nome} icon={Building} />
              <InfoItem label="Código" value={organizacao.codigoEntidade || "N/A"} icon={Hash} />
              <InfoItem label="CNPJ" value={organizacao.cnpj} icon={GripVertical} />
              <InfoItem label="Tipo" value={organizacao.tipoOrganizacaoNome || "N/A"} icon={Workflow} />
              <InfoItem label="Telefone Principal" value={organizacao.telefone || "N/A"} icon={Phone} />
              <InfoItem label="E-mail Principal" value={organizacao.email || "N/A"} icon={Mail} />
              <InfoItem label="Data Cadastro" value={formatDate(organizacao.dataCadastro, "dd/MM/yyyy HH:mm")} icon={CalendarDays} />
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> Dados da Empresa (API)</CardTitle></CardHeader>
             <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                <InfoItem label="Data Início Atividade" value={formatDate(organizacao.data_inicio_atividade)} />
                <InfoItem label="Porte" value={organizacao.porte_empresa || "N/A"} />
                <InfoItem label="Natureza Jurídica" value={organizacao.natureza_juridica || "N/A"} />
                <InfoItem label="Situação Cadastral" value={organizacao.descricao_situacao_cadastral || "N/A"} />
                <InfoItem label="CNAE Principal" value={organizacao.cnae_principal || "N/A"} className="sm:col-span-2 lg:col-span-3"/>
                {organizacao.cnae_secundarios && organizacao.cnae_secundarios.length > 0 && (
                    <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                        <InfoItemLabel>CNAEs Secundários</InfoItemLabel>
                        <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground bg-muted/10 p-2 rounded-md max-h-32 overflow-y-auto">
                            {organizacao.cnae_secundarios.map(cnae => <li key={cnae.codigo}>{cnae.codigo} - {cnae.descricao}</li>)}
                        </ul>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço Principal</CardTitle></CardHeader>
            <CardContent><InfoItem label="Endereço Completo" value={fullAddress} /></CardContent>
          </Card>

          {organizacao.endereco2_logradouro && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço Adicional/Correspondência</CardTitle></CardHeader>
              <CardContent><InfoItem label="Endereço Completo 2" value={fullAddress2} /></CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Contact className="mr-2 h-5 w-5 text-primary" /> Informações de Contato</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoItem label="Nome do Contato" value={organizacao.nome_contato_responsavel || "N/A"} />
                <InfoItem label="Cargo do Contato" value={organizacao.cargo_contato_responsavel || "N/A"} />
                <InfoItem label="E-mail de Contato" value={organizacao.email_contato || "N/A"} />
                <InfoItem label="Telefone de Contato" value={organizacao.telefone_contato || "N/A"} />
                <InfoItem label="Observações de Contato" value={organizacao.observacoes_contato || "N/A"} className="sm:col-span-2"/>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary" /> Quadro de Sócios e Administradores (QSA)</CardTitle></CardHeader>
            <CardContent>
              {organizacao.qsa && organizacao.qsa.length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Qualificação</TableHead><TableHead className="hidden md:table-cell">Data Entrada</TableHead></TableRow></TableHeader>
                  <TableBody>{organizacao.qsa.map(q => (<TableRow key={q.id_qsa || q.nome_socio}><TableCell className="font-medium">{q.nome_socio}</TableCell><TableCell>{q.qualificacao_socio}</TableCell><TableCell className="hidden md:table-cell">{formatDate(q.data_entrada_sociedade)}</TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum QSA informado.</p>)}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary" /> Membros Vinculados</CardTitle><CardDescription>Pessoas físicas ou jurídicas associadas.</CardDescription></div>
              <Button onClick={() => setIsAddMemberModalOpen(true)} size="sm"><UserPlus className="mr-2 h-4 w-4" /> Adicionar</Button>
            </CardHeader>
            <CardContent>
              {organizacao.membros && organizacao.membros.length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Tipo</TableHead><TableHead>Função</TableHead><TableHead className="hidden md:table-cell">Data Associação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{organizacao.membros.map(m => (<TableRow key={m.id_membro_entidade}><TableCell className="font-medium">{m.nome}</TableCell><TableCell className="hidden sm:table-cell">{m.tipo}</TableCell><TableCell>{m.funcao}</TableCell><TableCell className="hidden md:table-cell">{formatDate(m.dataAssociacao)}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="icon" asChild><Link href={m.tipo === 'Pessoa Física' ? `/cliente/${m.id_membro_original}` : `/admin/organizacoes/${m.id_membro_original}`}><Info className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={() => openEditVinculoModal(m)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => openRemoveMemberModal(m)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum membro vinculado.</p>)}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados</CardTitle></CardHeader>
            <CardContent>
              {organizacao.veiculos && organizacao.veiculos.length > 0 ? (
                 <Table><TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead className="hidden sm:table-cell">Marca</TableHead><TableHead className="hidden md:table-cell text-right">Ano</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{organizacao.veiculos.map(v => (<TableRow key={v.id_veiculo}><TableCell className="font-medium">{v.placa_atual}</TableCell><TableCell>{v.modelo_nome}</TableCell><TableCell className="hidden sm:table-cell">{v.marca}</TableCell><TableCell className="hidden md:table-cell text-right">{v.ano_fabricacao || 'N/A'}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href={`/admin/veiculos/${v.id_veiculo}`}>Detalhes</Link></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum veículo associado.</p>)}
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><UserCheck className="mr-2 h-5 w-5 text-primary" /> Observações Gerais</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{organizacao.observacoes || "Nenhuma observação."}</p></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild><Link href={`/admin/organizacoes/${organizacao.id}/editar`}><Edit3 className="mr-2 h-4 w-4" /> Editar Organização</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button className="w-full" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir Organização</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a organização <strong>{organizacao.nome}</strong>? Esta ação é irreversível e pode afetar membros e veículos associados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteOrganizacao} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter><Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto"><Link href="/admin/organizacoes">&larr; Voltar</Link></Button></CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle><DialogDescription>Vincule uma Pessoa Física ou Jurídica.</DialogDescription></DialogHeader>
          <form onSubmit={handleAddMemberSubmit} className="space-y-4 py-2">
            <div><InfoItemLabel htmlFor="tipoMembro">Tipo de Membro</InfoItemLabel><Select name="tipoMembro" value={addMemberFormData.tipoMembro} onValueChange={(v) => handleAddMemberSelectChange('tipoMembro', v as any)}><SelectTrigger id="tipoMembro"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pessoa_fisica">Pessoa Física</SelectItem><SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem></SelectContent></Select></div>
            <div><InfoItemLabel htmlFor="membroId">{addMemberFormData.tipoMembro === 'pessoa_fisica' ? 'Pessoa Física' : 'Organização'}</InfoItemLabel>
              <Select name="membroId" value={addMemberFormData.membroId} onValueChange={(v) => handleAddMemberSelectChange('membroId', v)}><SelectTrigger id="membroId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(addMemberFormData.tipoMembro === 'pessoa_fisica' ? availablePessoasFisicas : availableOutrasEntidades).map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><InfoItemLabel htmlFor="funcao">Função na Organização</InfoItemLabel><Input id="funcao" name="funcao" value={addMemberFormData.funcao} onChange={handleAddMemberChange} /></div>
            <div><InfoItemLabel htmlFor="dataAssociacao">Data de Associação</InfoItemLabel><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !addMemberFormData.dataAssociacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={addMemberFormData.dataAssociacao} onSelect={handleAddMemberDateChange} initialFocus /></PopoverContent></Popover></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar Vínculo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVinculoModalOpen} onOpenChange={setIsEditVinculoModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Vínculo do Membro</DialogTitle></DialogHeader>
          <form onSubmit={handleEditVinculoSubmit} className="space-y-4 py-2">
             <div><InfoItemLabel htmlFor="editFuncao">Função</InfoItemLabel><Input id="editFuncao" name="funcao" value={editVinculoFormData.funcao} onChange={handleEditVinculoChange} /></div>
            <div><InfoItemLabel htmlFor="editDataAssociacao">Data Associação</InfoItemLabel><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editVinculoFormData.dataAssociacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{editVinculoFormData.dataAssociacao ? format(editVinculoFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={editVinculoFormData.dataAssociacao} onSelect={handleEditVinculoDateChange} initialFocus /></PopoverContent></Popover></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {memberToRemove && (<AlertDialog open={isRemoveMemberModalOpen} onOpenChange={setIsRemoveMemberModalOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Remoção</AlertDialogTitle><AlertDialogDescription>Deseja remover o vínculo de <strong>{memberToRemove.nome}</strong> ({memberToRemove.funcao})?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmRemoveMember} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
    </div>
  );
}

const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '' && value !== "N/A")) return null;
  return (
    <div className={cn("mb-3", className)}>
      <span className="text-sm font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-primary/80" />}
        {label}
      </span>
      <div className="text-foreground mt-0.5">{typeof value === 'string' ? <p>{value}</p> : value}</div>
    </div>
  );
};

/* Supabase Integration Notes:
- `getOrganizacaoDetails`: Fetch Entidade by ID, including direct address fields, TipoEntidade.nome_tipo, QSA, MembrosEntidade (with PessoasFisicas/Entidades names), and Veiculos.
- `fetchSelectOptions`: Dynamically load PessoasFisicas and Entidades (excluding current) for "Add Member" modal.
- Add/Edit/Remove Membro: Interact with public."MembrosEntidade".
- Delete Organizacao: Consider ON DELETE CASCADE or handle related deletions.
*/
      
    