
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Renamed
import { UserCog, Save, XCircle, HomeIcon, InfoIcon, AlertTriangle, Users, Briefcase, Link2, CalendarDays, ClipboardUser, Edit3 as EditIcon, PlusCircle } from 'lucide-react'; // Added ClipboardUser, EditIcon
import { format, parseISO, isValid } from "date-fns";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog'; // Added Dialog components
// import { useToast } from "@/hooks/use-toast";

const brazilianStates = [
  { value: "AC", label: "Acre" }, { value: "AL", label: "Alagoas" }, { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" }, { value: "BA", label: "Bahia" }, { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" }, { value: "ES", label: "Espírito Santo" }, { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" }, { value: "MT", label: "Mato Grosso" }, { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" }, { value: "PA", label: "Pará" }, { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" }, { value: "PE", label: "Pernambuco" }, { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" }, { value: "RN", label: "Rio Grande do Norte" }, { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" }, { value: "RR", label: "Roraima" }, { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" }, { value: "SE", label: "Sergipe" }, { value: "TO", label: "Tocantins" }
];

const placeholderMunicipios: Record<string, {value: string, label: string}[]> = {
  SP: [{ value: "sao_paulo", label: "São Paulo" }, { value: "campinas", label: "Campinas" }],
  RJ: [{ value: "rio_de_janeiro", label: "Rio de Janeiro" }, { value: "niteroi", label: "Niterói" }],
  MG: [{ value: "belo_horizonte", label: "Belo Horizonte" }, { value: "uberlandia", label: "Uberlândia"}],
  BA: [{ value: "salvador", label: "Salvador" }, { value: "feira_de_santana", label: "Feira de Santana"}],
};

const tiposRelacao = [
  { value: "associado", label: "Associado" },
  { value: "cooperado", label: "Cooperado" },
  { value: "funcionario", label: "Funcionário" },
  { value: "cliente_geral", label: "Cliente Geral" },
];

const organizacoesDisponiveis = [
  { value: "org_001", label: "Cooperativa Alfa" },
  { value: "org_002", label: "Associação Beta" },
  { value: "org_003", label: "Empresa Gama" },
];

interface CNHData {
  id_cnh?: string; // Optional for new CNH
  numero_registro: string;
  categoria: string;
  data_emissao: string; // YYYY-MM-DD
  data_validade: string; // YYYY-MM-DD
  primeira_habilitacao: string | null; // YYYY-MM-DD
  local_emissao_cidade: string | null;
  local_emissao_uf: string | null;
  observacoes_cnh: string | null;
}

const initialCnhFormData: CNHData = {
  numero_registro: '', categoria: '', data_emissao: '', data_validade: '',
  primeira_habilitacao: null, local_emissao_cidade: null, local_emissao_uf: null, observacoes_cnh: null,
};

async function getPessoaFisicaById(id: string) {
  console.log(`Fetching PessoaFisica data for ID: ${id} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const sampleCnh: CNHData | null = id === "pf_001" || id === "cli_001" || id === "1" ? {
    id_cnh: "cnh_001", numero_registro: "01234567890", categoria: "AB", data_emissao: "2022-08-15",
    data_validade: "2027-08-14", primeira_habilitacao: "2010-08-15", local_emissao_cidade: "Cidade Exemplo",
    local_emissao_uf: "EX", observacoes_cnh: "Nenhuma observação específica."
  } : null;

  if (id === "pf_001" || id === "cli_001" || id === "1" ) { 
    return {
      id: "pf_001", nomeCompleto: `João da Silva Sauro`, cpf: `123.456.789-00`, rg: `12.345.678-9`,
      dataNascimento: `1985-05-15`, email: `joao@exemplo.com`, telefone: `(11) 9876-5432`,
      tipoRelacao: "associado", organizacaoVinculadaId: "org_001", logradouro: 'Rua Exemplo das Couves',
      numero: '123', complemento: 'Apto 101', bairro: 'Bairro Modelo', municipio: 'sao_paulo', 
      estado: 'SP', cep: '01234-567', observacoes: `Obs sobre João.`, dataCadastro: '2024-01-15',
      cnh: sampleCnh,
    };
  }
  if (id === "pf_003") {
     return {
      id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", rg: "33.444.555-6",
      dataNascimento: "1990-10-20", email: "carlos@exemplo.com", telefone: "(31) 9988-7766",
      tipoRelacao: "cliente_geral", organizacaoVinculadaId: "", logradouro: 'Avenida Principal',
      numero: '1500', complemento: 'Loja B', bairro: 'Centro', municipio: 'belo_horizonte',
      estado: 'MG', cep: '30123-000', observacoes: `Carlos é cliente geral.`, dataCadastro: '2024-03-10',
      cnh: null,
    };
  }
  return null; 
}

export default function EditarPessoaFisicaPage() {
  const router = useRouter();
  const params = useParams();
  const pessoaFisicaId = params.id as string;
  // const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [pessoaFisicaFound, setPessoaFisicaFound] = useState<boolean | null>(null);
  const [currentMunicipios, setCurrentMunicipios] = useState<{value: string, label: string}[]>([]);
  const [dataCadastroDisplay, setDataCadastroDisplay] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: '', cpf: '', rg: '', dataNascimento: undefined as Date | undefined, email: '', 
    telefone: '', tipoRelacao: '', organizacaoVinculadaId: '', logradouro: '', numero: '',
    complemento: '', bairro: '', cep: '', estado: '', municipio: '', observacoes: '',
  });
  
  const [isCnhModalOpen, setIsCnhModalOpen] = useState(false);
  const [cnhModalMode, setCnhModalMode] = useState<'create' | 'edit'>('create');
  const [cnhFormData, setCnhFormData] = useState<CNHData>(initialCnhFormData);
  const [currentDbCnh, setCurrentDbCnh] = useState<CNHData | null>(null); // Stores CNH data from DB

  const isOrganizacaoRequired = formData.tipoRelacao !== '' && formData.tipoRelacao !== 'cliente_geral';

  useEffect(() => {
    if (pessoaFisicaId) {
      setIsLoading(true);
      getPessoaFisicaById(pessoaFisicaId)
        .then(data => {
          if (data) {
            setFormData({
              nomeCompleto: data.nomeCompleto || '', cpf: data.cpf || '', rg: data.rg || '',
              dataNascimento: data.dataNascimento ? parseISO(data.dataNascimento) : undefined,
              email: data.email || '', telefone: data.telefone || '', tipoRelacao: data.tipoRelacao || '',
              organizacaoVinculadaId: data.organizacaoVinculadaId || '',
              logradouro: data.logradouro || '', numero: data.numero || '', complemento: data.complemento || '',
              bairro: data.bairro || '', cep: data.cep || '', estado: data.estado || '',
              municipio: data.municipio || '', observacoes: data.observacoes || '',
            });
            if (data.estado) { /* @ts-ignore */ setCurrentMunicipios(placeholderMunicipios[data.estado] || []); }
            if (data.dataCadastro) {
              try { setDataCadastroDisplay(format(parseISO(data.dataCadastro), "dd/MM/yyyy")); } 
              catch (e) { console.error("Error formatting dataCadastro:", e); setDataCadastroDisplay("Data inválida");}
            }
            setCurrentDbCnh(data.cnh || null); // Store CNH data from DB
            setPessoaFisicaFound(true);
          } else { setPessoaFisicaFound(false); }
        })
        .catch(err => { console.error("Failed to fetch data:", err); setPessoaFisicaFound(false); })
        .finally(() => setIsLoading(false));
    }
  }, [pessoaFisicaId]);
  
  useEffect(() => {
    if (formData.estado) { /* @ts-ignore */ setCurrentMunicipios(placeholderMunicipios[formData.estado] || []); } 
    else { setCurrentMunicipios([]); }
    if (formData.tipoRelacao === 'cliente_geral' && formData.organizacaoVinculadaId) {
      setFormData(prev => ({ ...prev, organizacaoVinculadaId: '' }));
    }
  }, [formData.estado, formData.tipoRelacao, formData.organizacaoVinculadaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'estado') { setFormData(prev => ({ ...prev, municipio: '' })); }
  };
  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({...prev, [name]: date }));
  };

  // CNH Modal Handlers
  const handleOpenCnhModal = () => {
    if (currentDbCnh) {
      setCnhModalMode('edit');
      setCnhFormData({
        numero_registro: currentDbCnh.numero_registro, categoria: currentDbCnh.categoria,
        data_emissao: currentDbCnh.data_emissao, data_validade: currentDbCnh.data_validade,
        primeira_habilitacao: currentDbCnh.primeira_habilitacao,
        local_emissao_cidade: currentDbCnh.local_emissao_cidade,
        local_emissao_uf: currentDbCnh.local_emissao_uf,
        observacoes_cnh: currentDbCnh.observacoes_cnh,
        id_cnh: currentDbCnh.id_cnh // Keep existing ID for edits
      });
    } else {
      setCnhModalMode('create');
      setCnhFormData(initialCnhFormData);
    }
    setIsCnhModalOpen(true);
  };
  const handleCnhFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCnhFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCnhDateChange = (name: keyof CNHData, date: Date | undefined) => {
    setCnhFormData(prev => ({ ...prev, [name]: date ? format(date, "yyyy-MM-dd") : '' }));
  };
  const handleCnhSelectChange = (name: keyof CNHData, value: string) => {
     setCnhFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCnhSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Basic CNH validation
    if (!cnhFormData.numero_registro || !cnhFormData.categoria || !cnhFormData.data_emissao || !cnhFormData.data_validade) {
      console.error("Validação CNH: Campos obrigatórios (Número, Categoria, Emissão, Validade) não preenchidos.");
      // toast({ title: "CNH: Campos Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    console.log("Submitting CNH Data:", { id_pessoa_fisica: pessoaFisicaId, ...cnhFormData });
    // Supabase: POST (create) or PUT/PATCH (edit) to public.CNHs
    // On success, update currentDbCnh state and close modal
    // toast({ title: "CNH Salva! (Simulado)", description: "Dados da CNH salvos." });
    const newCnhData: CNHData = {
        ...initialCnhFormData, // ensures all fields exist even if not set in cnhFormData
        ...cnhFormData,
        id_cnh: cnhModalMode === 'edit' && currentDbCnh ? currentDbCnh.id_cnh : `cnh_temp_${Date.now()}`
    };
    setCurrentDbCnh(newCnhData);
    setIsCnhModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (!formData.nomeCompleto || !formData.cpf || !formData.email || !formData.tipoRelacao) {
      console.error("Validação: Nome, CPF, E-mail e Tipo de Relação são obrigatórios.");
      setIsLoading(false); return;
    }
    if (isOrganizacaoRequired && !formData.organizacaoVinculadaId) {
      console.error("Validação: Organização Vinculada é obrigatória.");
      setIsLoading(false); return;
    }
    const updatePayload = { ...formData, dataNascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null };
    console.log('Submitting PessoaFisica update:', updatePayload);
    console.log('CNH data to be handled separately if changed:', currentDbCnh); // CNH is saved via its own modal
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false); router.push('/admin/clientes'); 
  };

  if (isLoading && pessoaFisicaFound === null) return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  if (pessoaFisicaFound === false) return <div className="container mx-auto p-8 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1><Button asChild className="mt-6"><Link href="/admin/clientes">Voltar</Link></Button></div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Editar Pessoa Física: {formData.nomeCompleto}
          </h1>
          <Button variant="outline" size="sm" asChild><Link href="/admin/clientes"><XCircle className="mr-2 h-4 w-4" /> Cancelar</Link></Button>
        </div>
        {dataCadastroDisplay && <p className="text-sm text-muted-foreground mt-1">Data de Cadastro: {dataCadastroDisplay}</p>}
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoPessoais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 mb-6"> {/* Added CNH tab */}
             <TabsTrigger value="infoPessoais" className="flex items-center gap-2"><Users className="h-4 w-4" /> Informações Pessoais</TabsTrigger>
             <TabsTrigger value="vinculo" className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Vínculo e Relação</TabsTrigger>
             <TabsTrigger value="cnh" className="flex items-center gap-2"><ClipboardUser className="h-4 w-4" /> CNH</TabsTrigger> {/* CNH Tab */}
             <TabsTrigger value="endereco" className="flex items-center gap-2"><HomeIcon className="h-4 w-4" /> Endereço</TabsTrigger>
             <TabsTrigger value="outrasInfo" className="flex items-center gap-2"><InfoIcon className="h-4 w-4" /> Outras Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="infoPessoais">
            <Card className="shadow-lg"><CardHeader><CardTitle>Dados Pessoais</CardTitle><CardDescription>Informações básicas de identificação.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nomeCompleto">Nome <span className="text-destructive">*</span></Label><Input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label><Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="00.000.000-0" /></div>
                  <div className="space-y-2"><Label htmlFor="dataNascimento">Nascimento</Label>
                     <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!formData.dataNascimento && "text-muted-foreground"}`}><CalendarDays className="mr-2 h-4 w-4" /> {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.dataNascimento} onSelect={(d) => handleDateChange('dataNascimento', d)} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required readOnly className="bg-muted/50 cursor-not-allowed" title="O e-mail é usado como identificador."/></div>
                  <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculo">
            <Card className="shadow-lg"><CardHeader><CardTitle>Vínculo e Relação</CardTitle><CardDescription>Tipo de relação e organização vinculada.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2"><Label htmlFor="tipoRelacao">Tipo de Relação <span className="text-destructive">*</span></Label>
                    <Select name="tipoRelacao" value={formData.tipoRelacao} onValueChange={(value) => handleSelectChange('tipoRelacao', value)} required><SelectTrigger id="tipoRelacao"><Link2 className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent>{tiposRelacao.map(tipo => (<SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                  {isOrganizacaoRequired && (<div className="space-y-2"><Label htmlFor="organizacaoVinculadaId">Organização <span className="text-destructive">*</span></Label>
                        <Select name="organizacaoVinculadaId" value={formData.organizacaoVinculadaId} onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} required={isOrganizacaoRequired}><SelectTrigger id="organizacaoVinculadaId"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{organizacoesDisponiveis.map(org => (<SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>))}</SelectContent></Select>
                    </div>)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cnh">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Dados da CNH</CardTitle><CardDescription>Informações da Carteira Nacional de Habilitação.</CardDescription></div>
                <Button type="button" variant="outline" onClick={handleOpenCnhModal}>
                  {currentDbCnh ? <><EditIcon className="mr-2 h-4 w-4"/>Editar CNH</> : <><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar CNH</>}
                </Button>
              </CardHeader>
              <CardContent>
                {currentDbCnh ? (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <p><strong>Nº Registro:</strong> {currentDbCnh.numero_registro}</p>
                        <p><strong>Categoria:</strong> {currentDbCnh.categoria}</p>
                        <p><strong>Emissão:</strong> {formatDate(currentDbCnh.data_emissao)}</p>
                        <p><strong>Validade:</strong> {formatDate(currentDbCnh.data_validade)}</p>
                        <p><strong>Primeira Habilitação:</strong> {formatDate(currentDbCnh.primeira_habilitacao)}</p>
                        <p><strong>Local:</strong> {currentDbCnh.local_emissao_cidade || 'N/A'} - {currentDbCnh.local_emissao_uf || 'N/A'}</p>
                        {currentDbCnh.observacoes_cnh && <p className="sm:col-span-2"><strong>Observações:</strong> {currentDbCnh.observacoes_cnh}</p>}
                    </div>
                ) : (<p className="text-muted-foreground">Nenhuma CNH cadastrada para esta pessoa física.</p>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
             <Card className="shadow-lg"><CardHeader><CardTitle>Endereço</CardTitle><CardDescription>Informações de localização.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero} onChange={handleChange}/></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange}/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="cep">CEP</Label><Input id="cep" name="cep" value={formData.cep} onChange={handleChange}/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="estado">Estado</Label>
                    <Select name="estado" value={formData.estado} onValueChange={(v) => handleSelectChange('estado', v)}><SelectTrigger id="estado"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{brazilianStates.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="municipio">Município</Label>
                    <Select name="municipio" value={formData.municipio} onValueChange={(v) => handleSelectChange('municipio', v)} disabled={!formData.estado || currentMunicipios.length === 0}><SelectTrigger id="municipio"><SelectValue placeholder={formData.estado && currentMunicipios.length > 0 ? "Selecione" : (formData.estado ? "Carregando..." : "Selecione o estado")} /></SelectTrigger><SelectContent>{currentMunicipios.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg"><CardHeader><CardTitle>Outras Informações</CardTitle><CardDescription>Observações e detalhes adicionais.</CardDescription></CardHeader>
              <CardContent className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={6}/></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clientes')} disabled={isLoading}><XCircle className="mr-2 h-5 w-5" /> Cancelar</Button>
          <Button type="submit" disabled={isLoading || pessoaFisicaFound === false}><Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </CardFooter>
      </form>

      {/* CNH Management Modal */}
      <Dialog open={isCnhModalOpen} onOpenChange={setIsCnhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{cnhModalMode === 'create' ? 'Cadastrar Nova CNH' : 'Editar CNH'}</DialogTitle>
            <DialogDescription>Preencha os dados da Carteira Nacional de Habilitação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCnhSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="cnh_numero_registro_modal">Número de Registro <span className="text-destructive">*</span></Label><Input id="cnh_numero_registro_modal" name="numero_registro" value={cnhFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><Label htmlFor="cnh_categoria_modal">Categoria <span className="text-destructive">*</span></Label><Input id="cnh_categoria_modal" name="categoria" value={cnhFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B, C"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_data_emissao_modal">Data de Emissão <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_emissao ? format(parseISO(cnhFormData.data_emissao), "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_emissao ? parseISO(cnhFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><Label htmlFor="cnh_data_validade_modal">Data de Validade <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_validade ? format(parseISO(cnhFormData.data_validade), "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_validade ? parseISO(cnhFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><Label htmlFor="cnh_primeira_habilitacao_modal">Primeira Habilitação</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.primeira_habilitacao ? format(parseISO(cnhFormData.primeira_habilitacao), "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.primeira_habilitacao ? parseISO(cnhFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_local_emissao_cidade_modal">Cidade de Emissão</Label><Input id="cnh_local_emissao_cidade_modal" name="local_emissao_cidade" value={cnhFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><Label htmlFor="cnh_local_emissao_uf_modal">UF de Emissão</Label>
                <Select name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}><SelectTrigger id="cnh_local_emissao_uf_modal"><SelectValue placeholder="Selecione UF" /></SelectTrigger><SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
            <div><Label htmlFor="cnh_observacoes_cnh_modal">Observações da CNH</Label><Textarea id="cnh_observacoes_cnh_modal" name="observacoes_cnh" value={cnhFormData.observacoes_cnh || ''} onChange={handleCnhFormChange} rows={3} /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{cnhModalMode === 'create' ? 'Salvar CNH' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Supabase Integration:
        - Fetch PessoaFisica data by ID (including Endereco, MembrosEntidade -> Entidades -> TiposEntidade).
        - Fetch CNH data from public.CNHs by id_pessoa_fisica.
        - Populate Selects (Tipo Relação, Estado, Município, Organização Vinculada) from respective Supabase tables.
        - On main form submit: PUT/PATCH to public.PessoasFisicas; handle Endereco (create/update); handle MembrosEntidade (create/update/delete).
        - On CNH modal submit: POST/PUT to public.CNHs.
      */}
    </div>
  );
}
