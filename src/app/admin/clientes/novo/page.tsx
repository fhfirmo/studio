
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { UserPlus, Save, XCircle, HomeIcon, InfoIcon, Users, Briefcase, Link2 } from 'lucide-react';
import { format } from "date-fns";
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


export default function NovaPessoaFisicaPage() {
  const router = useRouter();
  // const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentMunicipios, setCurrentMunicipios] = useState<{value: string, label: string}[]>([]);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    rg: '',
    dataNascimento: undefined as Date | undefined,
    email: '',
    telefone: '',
    tipoRelacao: '',
    organizacaoVinculadaId: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    estado: '',
    municipio: '',
    observacoes: '',
  });

  const isOrganizacaoRequired = formData.tipoRelacao !== '' && formData.tipoRelacao !== 'cliente_geral';

  useEffect(() => {
    if (formData.estado) {
      // @ts-ignore
      setCurrentMunicipios(placeholderMunicipios[formData.estado] || []);
    } else {
      setCurrentMunicipios([]);
    }
    // If tipoRelacao changes to 'cliente_geral', clear organizacaoVinculadaId
    if (formData.tipoRelacao === 'cliente_geral') {
      setFormData(prev => ({ ...prev, organizacaoVinculadaId: '' }));
    }
  }, [formData.estado, formData.tipoRelacao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
     if (name === 'estado') { 
        setFormData(prev => ({ ...prev, municipio: '' }));
    }
  };
  
  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({...prev, [name]: date }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formData.nomeCompleto || !formData.cpf || !formData.email || !formData.tipoRelacao) {
      console.error("Validação: Nome, CPF, E-mail e Tipo de Relação são obrigatórios.");
      setIsLoading(false);
      return;
    }
    if (isOrganizacaoRequired && !formData.organizacaoVinculadaId) {
      console.error("Validação: Organização Vinculada é obrigatória para este tipo de relação.");
      setIsLoading(false);
      return;
    }
    
    const payload = {
      ...formData,
      dataNascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null,
    };
    console.log('Form data to be submitted (Pessoa Física):', payload);

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated pessoa física creation finished');
    setIsLoading(false);
    router.push('/admin/clientes'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserPlus className="mr-3 h-8 w-8" /> Cadastro de Nova Pessoa Física
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clientes">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar uma nova pessoa física ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoPessoais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="infoPessoais" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="vinculo" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Vínculo e Relação
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="outrasInfo" className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4" /> Outras Informações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infoPessoais">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações básicas de identificação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label>
                    <Input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
                    <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="00.000.000-0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!formData.dataNascimento && "text-muted-foreground"}`}
                            >
                            <Save className="mr-2 h-4 w-4" /> 
                            {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : <span>Selecione a data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={formData.dataNascimento}
                            onSelect={(date) => handleDateChange('dataNascimento', date)}
                            captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Vínculo e Relação com Entidades</CardTitle>
                <CardDescription>Defina o tipo de relação e a organização vinculada, se aplicável.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="tipoRelacao">Tipo de Relação <span className="text-destructive">*</span></Label>
                    <Select name="tipoRelacao" value={formData.tipoRelacao} onValueChange={(value) => handleSelectChange('tipoRelacao', value)} required>
                      <SelectTrigger id="tipoRelacao" aria-label="Selecionar tipo de relação">
                        <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione o tipo de relação" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposRelacao.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isOrganizacaoRequired && (
                    <div className="space-y-2">
                        <Label htmlFor="organizacaoVinculadaId">Organização Vinculada <span className="text-destructive">*</span></Label>
                        <Select name="organizacaoVinculadaId" value={formData.organizacaoVinculadaId} onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} required={isOrganizacaoRequired}>
                        <SelectTrigger id="organizacaoVinculadaId" aria-label="Selecionar organização vinculada">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a organização" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizacoesDisponiveis.map(org => (
                            <SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informações de localização da pessoa física.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ex: 123" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Bloco, Casa, etc." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Nome do bairro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select name="estado" value={formData.estado} onValueChange={(value) => handleSelectChange('estado', value)}>
                      <SelectTrigger id="estado" aria-label="Selecionar estado">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map(state => (
                          <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Município</Label>
                    <Select name="municipio" value={formData.municipio} onValueChange={(value) => handleSelectChange('municipio', value)} disabled={!formData.estado || currentMunicipios.length === 0}>
                      <SelectTrigger id="municipio" aria-label="Selecionar município">
                        <SelectValue placeholder={formData.estado && currentMunicipios.length > 0 ? "Selecione o município" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {currentMunicipios.map(municipio => (
                          <SelectItem key={municipio.value} value={municipio.value}>{municipio.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Outras Informações</CardTitle>
                <CardDescription>Observações e detalhes adicionais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Digite aqui quaisquer observações relevantes..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clientes')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Pessoa Física'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
