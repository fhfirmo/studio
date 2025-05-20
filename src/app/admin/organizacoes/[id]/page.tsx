
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Renamed to avoid conflict
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building, Edit3, Trash2, AlertTriangle, Info, MapPin, Users, Car, CalendarDays, Mail, Phone, Hash, Workflow, UserPlus, GripVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
// import { useToast } from "@/hooks/use-toast";

// Placeholder data for Pessoas Físicas and Entidades (for "Add Member" select)
const placeholderPessoasFisicas = [
    { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00" },
    { id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44" },
    { id: "pf_exemplo_1", nomeCompleto: "Maria Oliveira", cpf: "987.654.321-00" },
];
const placeholderOutrasEntidades = [
    { id: "org_memb_1", nome: "Empresa Filial X", cnpj: "55.666.777/0001-88" },
    { id: "org_memb_2", nome: "Associação Parceira Y", cnpj: "99.888.777/0001-99" },
];

// Placeholder function to get organization data by ID
async function getOrganizacaoDetails(organizacaoId: string) {
  console.log(`Fetching organization details for ID: ${organizacaoId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (organizacaoId === "org_001" || organizacaoId === "org_002" || organizacaoId === "org_003" || organizacaoId === "org_004" || organizacaoId === "org_005" ) {
    const baseId = parseInt(organizacaoId.slice(-1), 10);
    return {
      id: organizacaoId,
      nome: `Cooperativa Exemplo ${baseId}`,
      codigoEntidade: `COD-ENT-${organizacaoId.slice(-3)}`,
      cnpj: `11.222.333/000${baseId}-44`,
      tipoOrganizacao: { id: `tipo_${baseId}`, nome_tipo: "Cooperativa Principal" }, 
      telefone: `(1${baseId}) 91234-567${baseId%9}`,
      email: `contato@coopexemplo${baseId}.com`,
      dataCadastro: `2024-0${baseId}-10`,
      endereco: {
        logradouro: `Rua das Cooperativas ${baseId*10}`,
        numero: `${baseId*100}`,
        complemento: `Bloco ${String.fromCharCode(65 + baseId -1)}`,
        bairro: "Distrito Industrial",
        cep: `70000-00${baseId}`,
        municipio: { id: `mun_${baseId}`, nome_municipio: `Município Exemplo ${baseId}` },
        estado: { id: `uf_${baseId}`, sigla_estado: `UF${baseId}`, nome_estado: `Estado Exemplo ${baseId}` },
      },
      membros: [ // Updated member structure
        { id_membro_entidade: `me_00${baseId}A`, id_membro_original: "pf_001", nome: `Associado Fulano ${baseId}`, tipo: "Pessoa Física", funcao: "Presidente", dataAssociacao: `2023-0${baseId}-01` },
        { id_membro_entidade: `me_00${baseId}B`, id_membro_original: "org_memb_1", nome: `Empresa Membro Cicla ${baseId}`, tipo: "Pessoa Jurídica", funcao: "Conselheira", dataAssociacao: `2023-0${baseId+1}-15` },
      ],
      veiculos: [
        { id: `vei_00${baseId}A`, placa: `ORG-00${baseId}A`, modelo: `Caminhão Carga ${baseId}`, marca: "Marca X", ano: 2020 + baseId },
        { id: `vei_00${baseId}B`, placa: `ORG-00${baseId}B`, modelo: `Utilitário Leve ${baseId}`, marca: "Marca Y", ano: 2021 + baseId },
      ]
    };
  }
  return null;
}

interface OrganizacaoDetailsPageProps {
  params: {
    id: string;
  };
}

interface Membro {
  id_membro_entidade: string;
  id_membro_original: string;
  nome: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  funcao: string;
  dataAssociacao: string | null;
}

export default function OrganizacaoDetailsPage({ params }: OrganizacaoDetailsPageProps) {
  const organizacaoId = params.id;
  // const { toast } = useToast();
  const [organizacao, setOrganizacao] = useState<Awaited<ReturnType<typeof getOrganizacaoDetails>> | null>(null);
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
    id_membro_entidade: '',
    funcao: '',
    dataAssociacao: undefined,
  });
  
  const [memberToRemove, setMemberToRemove] = useState<Membro | null>(null);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);

  useEffect(() => {
    if (organizacaoId) {
      setIsLoading(true);
      getOrganizacaoDetails(organizacaoId)
        .then(data => {
          setOrganizacao(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [organizacaoId]);

  const formatDate = (dateString: string | null | undefined, outputFormat = "dd/MM/yyyy") => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Data inválida";
      return format(date, outputFormat);
    } catch (e) {
      return "Data inválida";
    }
  };

  const handleAddMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddMemberFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMemberSelectChange = (name: string, value: string) => {
    setAddMemberFormData(prev => ({ ...prev, [name]: value }));
    if (name === "tipoMembro") {
        setAddMemberFormData(prev => ({ ...prev, membroId: '' })); // Reset selected member on type change
    }
  };
  
  const handleAddMemberDateChange = (date: Date | undefined) => {
    setAddMemberFormData(prev => ({ ...prev, dataAssociacao: date }));
  };

  const handleAddMemberSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Supabase: POST to public.MembrosEntidade
    // id_entidade_pai: organizacao.id
    // id_membro_pessoa_fisica OR id_membro_entidade_juridica: addMemberFormData.membroId
    // tipo_membro: addMemberFormData.tipoMembro (map to DB enum/value)
    // funcao_no_membro: addMemberFormData.funcao
    // data_associacao: format(addMemberFormData.dataAssociacao, "yyyy-MM-dd")
    console.log("Submitting new member link:", { organizacaoId: organizacao?.id, ...addMemberFormData, dataAssociacao: addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "yyyy-MM-dd") : null });
    // toast({ title: "Vínculo Salvo!", description: "Novo membro vinculado com sucesso (simulado)." });
    // Refresh member list here
    setIsAddMemberModalOpen(false);
    setAddMemberFormData({ tipoMembro: 'pessoa_fisica', membroId: '', funcao: '', dataAssociacao: new Date() });
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
    // Supabase: PATCH public.MembrosEntidade for id_membro_entidade
    // Update: funcao_no_membro, data_associacao
    console.log("Submitting Vínculo Update:", editVinculoFormData);
    // toast({ title: "Vínculo Atualizado!", description: "Função/Data do membro atualizada (simulado)." });
    // Refresh member list here
    setIsEditVinculoModalOpen(false);
  };
  
  const openRemoveMemberModal = (membro: Membro) => {
    setMemberToRemove(membro);
    setIsRemoveMemberModalOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    // Supabase: DELETE from public.MembrosEntidade where id_membro_entidade = memberToRemove.id_membro_entidade
    console.log("Removing member link:", memberToRemove.id_membro_entidade);
    // toast({ title: "Vínculo Removido!", description: `Vínculo com ${memberToRemove.nome} removido (simulado).` });
    // Refresh member list here
    setIsRemoveMemberModalOpen(false);
    setMemberToRemove(null);
  };


  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Carregando dados da organização...</div>;
  }

  if (!organizacao) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          A organização com o ID "{organizacaoId}" não foi encontrada. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/organizacoes">Voltar para Lista de Organizações</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Building className="mr-3 h-8 w-8" /> Detalhes da Organização: {organizacao.nome}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas e entidades relacionadas à organização.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              <ItemDisplay label="Nome da Organização" value={organizacao.nome} icon={Building} />
              <ItemDisplay label="Código da Entidade" value={organizacao.codigoEntidade} icon={Hash} />
              <ItemDisplay label="CNPJ" value={organizacao.cnpj} icon={GripVertical} />
              <ItemDisplay label="Tipo de Organização" value={organizacao.tipoOrganizacao?.nome_tipo || "N/A"} icon={Workflow} />
              <ItemDisplay label="Telefone" value={organizacao.telefone || "N/A"} icon={Phone} />
              <ItemDisplay label="E-mail" value={organizacao.email || "N/A"} icon={Mail} />
              <ItemDisplay label="Data de Cadastro" value={formatDate(organizacao.dataCadastro)} icon={CalendarDays} />
            </CardContent>
          </Card>

          {organizacao.endereco && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                <ItemDisplay label="Logradouro" value={`${organizacao.endereco.logradouro || ""}, ${organizacao.endereco.numero || ""}`} />
                {organizacao.endereco.complemento && <ItemDisplay label="Complemento" value={organizacao.endereco.complemento} />}
                <ItemDisplay label="Bairro" value={organizacao.endereco.bairro || "N/A"} />
                <ItemDisplay label="CEP" value={organizacao.endereco.cep || "N/A"} />
                <ItemDisplay label="Município" value={organizacao.endereco.municipio?.nome_municipio || "N/A"} />
                <ItemDisplay label="Estado" value={organizacao.endereco.estado?.nome_estado || organizacao.endereco.estado?.sigla_estado || "N/A"} />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-2 h-5 w-5 text-primary" /> Membros da Organização
                </CardTitle>
                <CardDescription>Pessoas físicas ou jurídicas associadas.</CardDescription>
              </div>
              <Button onClick={() => setIsAddMemberModalOpen(true)} size="sm">
                <UserPlus className="mr-2 h-4 w-4" /> Adicionar Novo Membro
              </Button>
            </CardHeader>
            <CardContent>
              {organizacao.membros && organizacao.membros.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Membro</TableHead>
                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="hidden md:table-cell">Data de Associação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizacao.membros.map(membro => (
                        <TableRow key={membro.id_membro_entidade}>
                          <TableCell className="font-medium">{membro.nome}</TableCell>
                          <TableCell className="hidden sm:table-cell">{membro.tipo}</TableCell>
                          <TableCell>{membro.funcao}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(membro.dataAssociacao)}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={membro.tipo === 'Pessoa Física' ? `/cliente/${membro.id_membro_original}` : `/admin/organizacoes/${membro.id_membro_original}`}>
                                <Info className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditVinculoModal(membro)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openRemoveMemberModal(membro)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum membro associado a esta organização.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organizacao.veiculos && organizacao.veiculos.length > 0 ? (
                 <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="hidden sm:table-cell">Marca</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Ano</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizacao.veiculos.map(veiculo => (
                        <TableRow key={veiculo.id}>
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell className="hidden sm:table-cell">{veiculo.marca}</TableCell>
                          <TableCell className="hidden md:table-cell text-right">{veiculo.ano}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum veículo associado a esta organização.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/organizacoes/${organizacao.id}/editar`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Editar Organização
                </Link>
              </Button>
              <Button className="w-full" variant="destructive" onClick={() => console.log("Excluir organização (placeholder)")}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Organização
              </Button>
            </CardContent>
            <CardFooter>
                 <Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto">
                    <Link href="/admin/organizacoes">
                        &larr; Voltar para Lista de Organizações
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal Adicionar Novo Membro */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Membro à Organização</DialogTitle>
            <DialogDescription>Selecione o tipo de membro e preencha os detalhes do vínculo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMemberSubmit} className="space-y-4 py-2">
            <div>
              <Label htmlFor="tipoMembro">Tipo de Membro</Label>
              <Select name="tipoMembro" value={addMemberFormData.tipoMembro} onValueChange={(value) => handleAddMemberSelectChange('tipoMembro', value as 'pessoa_fisica' | 'pessoa_juridica')}>
                <SelectTrigger id="tipoMembro"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  <SelectItem value="pessoa_juridica">Pessoa Jurídica (Outra Entidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="membroId">
                {addMemberFormData.tipoMembro === 'pessoa_fisica' ? 'Pessoa Física' : 'Organização (Entidade)'}
              </Label>
              {/* Supabase: Select options should be dynamically loaded based on tipoMembro with search capability */}
              <Select name="membroId" value={addMemberFormData.membroId} onValueChange={(value) => handleAddMemberSelectChange('membroId', value)}>
                <SelectTrigger id="membroId"><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
                <SelectContent>
                  {addMemberFormData.tipoMembro === 'pessoa_fisica' ? 
                    placeholderPessoasFisicas.map(pf => <SelectItem key={pf.id} value={pf.id}>{pf.nomeCompleto} ({pf.cpf})</SelectItem>) :
                    placeholderOutrasEntidades.map(org => <SelectItem key={org.id} value={org.id}>{org.nome} ({org.cnpj})</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="funcao">Função do Membro na Organização</Label>
              <Input id="funcao" name="funcao" value={addMemberFormData.funcao} onChange={handleAddMemberChange} placeholder="Ex: Diretor, Conselheiro, Associado" />
            </div>
            <div>
              <Label htmlFor="dataAssociacao">Data de Associação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !addMemberFormData.dataAssociacao && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={addMemberFormData.dataAssociacao} onSelect={handleAddMemberDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar Vínculo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Vínculo de Membro */}
      <Dialog open={isEditVinculoModalOpen} onOpenChange={setIsEditVinculoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vínculo do Membro</DialogTitle>
            <DialogDescription>Atualize a função e a data de associação do membro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVinculoSubmit} className="space-y-4 py-2">
             <div>
              <Label htmlFor="editFuncao">Função do Membro na Organização</Label>
              <Input id="editFuncao" name="funcao" value={editVinculoFormData.funcao} onChange={handleEditVinculoChange} />
            </div>
            <div>
              <Label htmlFor="editDataAssociacao">Data de Associação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editVinculoFormData.dataAssociacao && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {editVinculoFormData.dataAssociacao ? format(editVinculoFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={editVinculoFormData.dataAssociacao} onSelect={handleEditVinculoDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Remover Membro */}
      {memberToRemove && (
        <AlertDialog open={isRemoveMemberModalOpen} onOpenChange={setIsRemoveMemberModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção de Vínculo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o vínculo de <strong>{memberToRemove.nome}</strong> ({memberToRemove.funcao}) desta organização? Esta ação não exclui a Pessoa Física ou Entidade em si, apenas o seu vínculo como membro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemoveMember} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Remoção
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 
        Supabase Integration Notes:
        - Fetch organization details by ID from 'Entidades' table.
        - For 'Tipo de Organização', join/fetch from 'TiposEntidade'.
        - For 'Endereço':
          - If 'endereco_id' is in 'Entidades', fetch from 'Enderecos'.
          - Join/fetch from 'Municipios' and 'Estados'.
        - For 'Membros da Organização':
          - Fetch from 'MembrosEntidade' filtering by 'id_entidade_pai' = organizacao.id.
          - JOIN with 'PessoasFisicas' (if tipo_membro = 'pessoa_fisica') ON MembrosEntidade.id_membro_pessoa_fisica = PessoasFisicas.id
          - JOIN with 'Entidades' (if tipo_membro = 'pessoa_juridica') ON MembrosEntidade.id_membro_entidade_juridica = Entidades.id
          - To display member name and type.
        - Add Member Modal:
          - Select for 'Pessoa Física': query 'PessoasFisicas' (nome_completo, cpf, id)
          - Select for 'Pessoa Jurídica': query 'Entidades' (nome_fantasia, cnpj, id), excluding current organizacaoId.
          - On "Salvar Vínculo": INSERT into 'MembrosEntidade' (id_entidade_pai, id_membro_pessoa_fisica OR id_membro_entidade_juridica, tipo_membro, funcao_no_membro, data_associacao).
        - Edit Vínculo Modal:
          - On "Salvar Alterações": UPDATE 'MembrosEntidade' SET funcao_no_membro, data_associacao WHERE id_membro_entidade = X.
        - Remove Membro:
          - On "Confirmar Remoção": DELETE FROM 'MembrosEntidade' WHERE id_membro_entidade = X.
        - "Excluir Organização" button will trigger a delete operation via Supabase API.
      */}
    </div>
  );
}

// Helper component for consistent key-value display
const ItemDisplay = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={cn("mb-1", className)}>
      <span className="text-sm font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-primary/80" />}
        {label}
      </span>
      <div className="text-foreground mt-0.5">{typeof value === 'string' ? <p>{value}</p> : value}</div>
    </div>
  );
};
