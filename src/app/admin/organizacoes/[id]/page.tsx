
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input"; // For Modals
import { Label } from "@/components/ui/label"; // For Modals & InfoItem
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // For Modals
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // For Modals
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For Modals
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building, Edit3, Trash2, AlertTriangle, Info, MapPin, Users, Car, CalendarDays, Mail, Phone, Hash, Workflow, UserPlus, GripVertical } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface OrganizacaoDetailed {
  id: string;
  nome: string;
  codigoEntidade: string;
  cnpj: string;
  tipoOrganizacaoNome: string; 
  telefone: string | null;
  email: string | null;
  dataCadastro: string;
  // Endereço direto
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  estado_uf: string | null;
  membros: Membro[];
  veiculos: VeiculoAssociado[];
}

interface Membro {
  id_membro_entidade: string;
  id_membro_original: string; // ID da PessoaFisica ou Entidade
  nome: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
  funcao: string;
  dataAssociacao: string | null;
}

interface VeiculoAssociado {
  id_veiculo: string;
  placa_atual: string;
  modelo_nome: string; // Nome do modelo
  marca: string;
  ano_fabricacao: number;
}

// Placeholder data for Pessoas Físicas and Entidades (for "Add Member" select)
const placeholderPessoasFisicas = [
    { id: "1", nomeCompleto: "João da Silva Sauro (123.456.789-00)" }, // Assuming ID is numeric string from DB
    { id: "3", nomeCompleto: "Carlos Pereira Lima (111.222.333-44)" },
];
const placeholderOutrasEntidades = [ // Assuming IDs are numeric strings from DB
    { id: "101", nome: "Empresa Filial X (55.666.777/0001-88)" },
    { id: "102", nome: "Associação Parceira Y (99.888.777/0001-99)" },
];


async function getOrganizacaoDetails(organizacaoId: string): Promise<OrganizacaoDetailed | null> {
  console.log(`Fetching organization details for ID: ${organizacaoId} (placeholder - with direct address)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (organizacaoId === "org_001" || organizacaoId === "1") {
    return {
      id: organizacaoId,
      nome: `Cooperativa Exemplo 1`,
      codigoEntidade: `COD-ENT-001`,
      cnpj: `11.222.333/0001-44`,
      tipoOrganizacaoNome: "Cooperativa Principal", 
      telefone: `(11) 91234-5671`,
      email: `contato@coopexemplo1.com`,
      dataCadastro: `2024-01-10T10:00:00Z`,
      logradouro: `Rua das Cooperativas 10`, numero: `100`, complemento: `Bloco A`,
      bairro: "Distrito Industrial", cep: `70000-001`, cidade: `Município Exemplo 1`, estado_uf: `EX`,
      membros: [
        { id_membro_entidade: `me_001A`, id_membro_original: "1", nome: `Associado Fulano 1`, tipo: "Pessoa Física", funcao: "Presidente", dataAssociacao: `2023-01-01` },
        { id_membro_entidade: `me_001B`, id_membro_original: "101", nome: `Empresa Membro Cicla 1`, tipo: "Pessoa Jurídica", funcao: "Conselheira", dataAssociacao: `2023-02-15` },
      ],
      veiculos: [
        { id_veiculo: `vei_001A`, placa_atual: `ORG-001A`, modelo_nome: `Caminhão Carga 1`, marca: "Marca X", ano_fabricacao: 2021 },
        { id_veiculo: `vei_001B`, placa_atual: `ORG-001B`, modelo_nome: `Utilitário Leve 1`, marca: "Marca Y", ano_fabricacao: 2022 },
      ]
    };
  }
  return null;
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
    membroId: '', // Stores id_pessoa_fisica or id_entidade
    funcao: '',
    dataAssociacao: new Date() as Date | undefined,
  });

  const [isEditVinculoModalOpen, setIsEditVinculoModalOpen] = useState(false);
  const [editVinculoFormData, setEditVinculoFormData] = useState<{ id_membro_entidade: string; funcao: string; dataAssociacao: Date | undefined }>({
    id_membro_entidade: '', funcao: '', dataAssociacao: undefined,
  });
  
  const [memberToRemove, setMemberToRemove] = useState<Membro | null>(null);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);

  useEffect(() => {
    if (organizacaoId && supabase) {
      setIsLoading(true);
      // Supabase: Fetch from public.Entidades where id_entidade = organizacaoId
      // JOIN public.TiposEntidade ON Entidades.id_tipo_entidade = TiposEntidade.id_tipo_entidade
      // Fetch MembrosEntidade (JOIN PessoasFisicas, Entidades as Membro)
      // Fetch Veiculos where id_proprietario_entidade = organizacaoId (JOIN ModelosVeiculo)
      getOrganizacaoDetails(organizacaoId) // Using placeholder for now
        .then(data => {
          setOrganizacao(data);
        })
        .catch(error => {
            console.error("Erro ao buscar detalhes da organização:", error);
            toast({title: "Erro ao Carregar", description: "Não foi possível carregar os detalhes da organização.", variant: "destructive"});
        })
        .finally(() => setIsLoading(false));
    }
  }, [organizacaoId, toast]);

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
    // Supabase: INSERT into public.MembrosEntidade
    console.log("Submitting new member link:", { organizacaoId: organizacao?.id, ...addMemberFormData, dataAssociacao: addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "yyyy-MM-dd") : null });
    toast({ title: "Vínculo Salvo! (Simulado)"});
    setIsAddMemberModalOpen(false);
    setAddMemberFormData({ tipoMembro: 'pessoa_fisica', membroId: '', funcao: '', dataAssociacao: new Date() });
    // TODO: Refresh member list by re-fetching organizacao details
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
    // Supabase: PATCH public.MembrosEntidade
    console.log("Submitting Vínculo Update:", editVinculoFormData);
    toast({ title: "Vínculo Atualizado! (Simulado)"});
    setIsEditVinculoModalOpen(false);
    // TODO: Refresh member list
  };
  
  const openRemoveMemberModal = (membro: Membro) => {
    setMemberToRemove(membro);
    setIsRemoveMemberModalOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    // Supabase: DELETE from public.MembrosEntidade
    console.log("Removing member link:", memberToRemove.id_membro_entidade);
    toast({ title: "Vínculo Removido! (Simulado)"});
    setIsRemoveMemberModalOpen(false);
    setMemberToRemove(null);
    // TODO: Refresh member list
  };
  
  const handleDeleteOrganizacao = async () => {
      if (!organizacao) return;
      console.log(`Excluir Organização ID: ${organizacao.id} (placeholder)`);
      // Supabase: DELETE FROM public."Entidades" WHERE id_entidade = organizacao.id;
      // Considere ON DELETE CASCADE ou tratar exclusões relacionadas.
      toast({title: "Exclusão (Simulada)", description: `Organização ${organizacao.nome} seria excluída.`});
      router.push('/admin/organizacoes');
  };


  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center">Carregando...</div>;
  if (!organizacao) return <div className="container mx-auto px-4 py-12 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1><Button asChild className="mt-6"><Link href="/admin/organizacoes">Voltar</Link></Button></div>;

  const fullAddress = [
    organizacao.logradouro,
    organizacao.numero,
    organizacao.complemento,
    organizacao.bairro,
    organizacao.cidade ? `${organizacao.cidade} - ${organizacao.estado_uf || ''}` : '',
    organizacao.cep,
  ].filter(Boolean).join(', ');

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Building className="mr-3 h-8 w-8" /> Detalhes da Organização: {organizacao.nome}
        </h1>
        <p className="text-muted-foreground mt-1">Informações completas e entidades relacionadas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome" value={organizacao.nome} icon={Building} />
              <InfoItem label="Código" value={organizacao.codigoEntidade} icon={Hash} />
              <InfoItem label="CNPJ" value={organizacao.cnpj} icon={GripVertical} />
              <InfoItem label="Tipo" value={organizacao.tipoOrganizacaoNome} icon={Workflow} />
              <InfoItem label="Telefone" value={organizacao.telefone || "N/A"} icon={Phone} />
              <InfoItem label="E-mail" value={organizacao.email || "N/A"} icon={Mail} />
              <InfoItem label="Data Cadastro" value={formatDate(organizacao.dataCadastro, "dd/MM/yyyy HH:mm")} icon={CalendarDays} />
            </CardContent>
          </Card>

          {(organizacao.logradouro || organizacao.cidade) && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço</CardTitle></CardHeader>
              <CardContent>
                <InfoItem label="Endereço Completo" value={fullAddress} />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary" /> Membros</CardTitle><CardDescription>Pessoas físicas ou jurídicas associadas.</CardDescription></div>
              <Button onClick={() => setIsAddMemberModalOpen(true)} size="sm"><UserPlus className="mr-2 h-4 w-4" /> Adicionar</Button>
            </CardHeader>
            <CardContent>
              {organizacao.membros && organizacao.membros.length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="hidden sm:table-cell">Tipo</TableHead><TableHead>Função</TableHead><TableHead className="hidden md:table-cell">Data Associação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{organizacao.membros.map(m => (<TableRow key={m.id_membro_entidade}><TableCell className="font-medium">{m.nome}</TableCell><TableCell className="hidden sm:table-cell">{m.tipo}</TableCell><TableCell>{m.funcao}</TableCell><TableCell className="hidden md:table-cell">{formatDate(m.dataAssociacao)}</TableCell><TableCell className="text-right space-x-1"><Button variant="ghost" size="sm" asChild><Link href={m.tipo === 'Pessoa Física' ? `/cliente/${m.id_membro_original}` : `/admin/organizacoes/${m.id_membro_original}`}><Info className="h-4 w-4" /></Link></Button><Button variant="ghost" size="sm" onClick={() => openEditVinculoModal(m)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => openRemoveMemberModal(m)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum membro associado.</p>)}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados</CardTitle></CardHeader>
            <CardContent>
              {organizacao.veiculos && organizacao.veiculos.length > 0 ? (
                 <Table><TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead className="hidden sm:table-cell">Marca</TableHead><TableHead className="hidden md:table-cell text-right">Ano</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{organizacao.veiculos.map(v => (<TableRow key={v.id_veiculo}><TableCell className="font-medium">{v.placa_atual}</TableCell><TableCell>{v.modelo_nome}</TableCell><TableCell className="hidden sm:table-cell">{v.marca}</TableCell><TableCell className="hidden md:table-cell text-right">{v.ano_fabricacao}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href={`/admin/veiculos/${v.id_veiculo}`}>Detalhes</Link></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum veículo associado.</p>)}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild><Link href={`/admin/organizacoes/${organizacao.id}/editar`}><Edit3 className="mr-2 h-4 w-4" /> Editar Organização</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button className="w-full" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir Organização</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a organização <strong>{organizacao.nome}</strong>? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteOrganizacao} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
            <div><Label htmlFor="tipoMembro">Tipo de Membro</Label><Select name="tipoMembro" value={addMemberFormData.tipoMembro} onValueChange={(v) => handleAddMemberSelectChange('tipoMembro', v as any)}><SelectTrigger id="tipoMembro"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pessoa_fisica">Pessoa Física</SelectItem><SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem></SelectContent></Select></div>
            <div><Label htmlFor="membroId">{addMemberFormData.tipoMembro === 'pessoa_fisica' ? 'Pessoa Física' : 'Organização'}</Label>
              <Select name="membroId" value={addMemberFormData.membroId} onValueChange={(v) => handleAddMemberSelectChange('membroId', v)}><SelectTrigger id="membroId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(addMemberFormData.tipoMembro === 'pessoa_fisica' ? placeholderPessoasFisicas : placeholderOutrasEntidades).map(item => <SelectItem key={item.id} value={item.id}>{item.nomeCompleto || item.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="funcao">Função na Organização</Label><Input id="funcao" name="funcao" value={addMemberFormData.funcao} onChange={handleAddMemberChange} /></div>
            <div><Label htmlFor="dataAssociacao">Data de Associação</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !addMemberFormData.dataAssociacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{addMemberFormData.dataAssociacao ? format(addMemberFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={addMemberFormData.dataAssociacao} onSelect={handleAddMemberDateChange} initialFocus /></PopoverContent></Popover></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar Vínculo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditVinculoModalOpen} onOpenChange={setIsEditVinculoModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Vínculo do Membro</DialogTitle></DialogHeader>
          <form onSubmit={handleEditVinculoSubmit} className="space-y-4 py-2">
             <div><Label htmlFor="editFuncao">Função</Label><Input id="editFuncao" name="funcao" value={editVinculoFormData.funcao} onChange={handleEditVinculoChange} /></div>
            <div><Label htmlFor="editDataAssociacao">Data Associação</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editVinculoFormData.dataAssociacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{editVinculoFormData.dataAssociacao ? format(editVinculoFormData.dataAssociacao, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={editVinculoFormData.dataAssociacao} onSelect={handleEditVinculoDateChange} initialFocus /></PopoverContent></Popover></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {memberToRemove && (<AlertDialog open={isRemoveMemberModalOpen} onOpenChange={setIsRemoveMemberModalOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Remoção</AlertDialogTitle><AlertDialogDescription>Deseja remover o vínculo de <strong>{memberToRemove.nome}</strong> ({memberToRemove.funcao})?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmRemoveMember} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
    </div>
  );
}

const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
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

/* Supabase Integration Notes (Refactored Address):
- Fetch Entidade details by ID from public.Entidades. Address fields are now direct.
- JOIN public.TiposEntidade for tipoOrganizacaoNome.
- Fetch MembrosEntidade (JOIN PessoasFisicas, Entidades as Membro).
- Fetch Veiculos where id_proprietario_entidade = organizacaoId (JOIN ModelosVeiculo).
- Add/Edit/Remove Membro: Interact with public.MembrosEntidade.
- Delete Organizacao: Consider ON DELETE CASCADE or handle related deletions.
*/

