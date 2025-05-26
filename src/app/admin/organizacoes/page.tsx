
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface OrganizacaoSupabase {
  id_entidade: number;
  nome: string;
  cnpj: string;
  telefone: string | null;
  TiposEntidade: { nome_tipo: string } | null;
  cidade?: string | null;
  estado_uf?: string | null;
  descricao_situacao_cadastral?: string | null; 
  porte_empresa?: string | null; 
  cnae_principal?: string | null; 
}

interface OrganizacaoRow {
  id: number;
  nome: string;
  tipoOrganizacao: string | null;
  cnpj: string;
  telefone: string | null;
  localidade?: string | null;
  situacaoCadastral?: string | null; 
  porte?: string | null; 
  cnaePrincipal?: string | null; 
}

export default function GerenciamentoOrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState<OrganizacaoRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPorte, setFilterPorte] = useState('');
  const [filterCnae, setFilterCnae] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [organizacaoToDelete, setOrganizacaoToDelete] = useState<{ id: number; nome: string } | null>(null);
  const { toast } = useToast();

  const fetchOrganizacoes = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setOrganizacoes([]); return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('Entidades')
      .select(`
        id_entidade,
        nome,
        cnpj,
        telefone,
        TiposEntidade ( nome_tipo ),
        cidade, 
        estado_uf,
        descricao_situacao_cadastral,
        porte_empresa,
        cnae_principal 
      `)
      .order('nome', { ascending: true });

    if (searchTerm) {
      query = query.or(`nome.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`);
    }
    if (filterPorte) {
      query = query.ilike('porte_empresa', `%${filterPorte}%`);
    }
    if (filterCnae) {
      query = query.ilike('cnae_principal', `%${filterCnae}%`); 
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar organizações:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar as organizações.", variant: "destructive" });
      setOrganizacoes([]);
    } else {
      const formattedData: OrganizacaoRow[] = (data || []).map((org: OrganizacaoSupabase) => ({
        id: org.id_entidade,
        nome: org.nome,
        tipoOrganizacao: org.TiposEntidade?.nome_tipo || 'N/A',
        cnpj: org.cnpj,
        telefone: org.telefone,
        localidade: (org.cidade && org.estado_uf) ? `${org.cidade} - ${org.estado_uf}` : (org.cidade || org.estado_uf || 'N/A'),
        situacaoCadastral: org.descricao_situacao_cadastral || 'N/A',
        porte: org.porte_empresa || 'N/A',
        cnaePrincipal: org.cnae_principal || 'N/A',
      }));
      setOrganizacoes(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchOrganizacoes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchOrganizacoes();
  };

  const handleDeleteClick = (organizacao: OrganizacaoRow) => {
    setOrganizacaoToDelete({ id: organizacao.id, nome: organizacao.nome });
    setIsAlertOpen(true);
  };

  const confirmDeleteOrganizacao = async () => {
    if (!organizacaoToDelete || !supabase) return;
    setIsLoading(true);
    
    // First, delete related QSA entries (if ON DELETE CASCADE is not set on FK)
    // This step might be skippable if your DB handles cascade deletes for QSA.
    const { error: qsaError } = await supabase
        .from('QSA')
        .delete()
        .eq('id_entidade', organizacaoToDelete.id);

    if (qsaError) {
        console.error('Falha ao excluir QSA da organização:', JSON.stringify(qsaError, null, 2));
        toast({ title: "Erro ao Excluir QSA", description: `Falha: ${qsaError.message || 'Erro desconhecido'}.`, variant: "destructive" });
        // Decide if you want to proceed with Entidade deletion or stop
    }

    // Then delete the Entidade itself
    const { error } = await supabase
      .from('Entidades')
      .delete()
      .eq('id_entidade', organizacaoToDelete.id);

    if (error) {
      console.error('Falha ao excluir organização:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir Organização", description: `Falha: ${error.message || 'Erro desconhecido'}. Verifique RLS e dependências.`, variant: "destructive" });
    } else {
      toast({ title: "Organização Excluída!", description: `${organizacaoToDelete.nome} foi excluída.` });
      fetchOrganizacoes(); 
    }
    setIsAlertOpen(false);
    setOrganizacaoToDelete(null);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Building className="mr-3 h-8 w-8" /> Listagem de Organizações
            </h1>
            <p className="text-muted-foreground mt-1">Visualize, cadastre, edite e remova.</p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/organizacoes/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Organização
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar e Filtrar</CardTitle><CardDescription>Filtre por nome, CNPJ, porte ou CNAE principal.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input type="text" placeholder="Nome ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:col-span-1" disabled={isLoading} />
              <Input type="text" placeholder="Porte da Empresa..." value={filterPorte} onChange={(e) => setFilterPorte(e.target.value)} className="sm:col-span-1" disabled={isLoading} />
              <Input type="text" placeholder="CNAE Principal..." value={filterCnae} onChange={(e) => setFilterCnae(e.target.value)} className="sm:col-span-1" disabled={isLoading} />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Buscar/Filtrar'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle>Organizações Cadastradas</CardTitle><CardDescription>Total de {organizacoes.length}.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden xl:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Localidade</TableHead>
                  <TableHead className="hidden lg:table-cell">Situação</TableHead>
                  <TableHead className="hidden xl:table-cell">Porte</TableHead>
                  <TableHead className="hidden xl:table-cell">CNAE</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && organizacoes.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : !isLoading && organizacoes.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center h-24 text-muted-foreground">{searchTerm || filterPorte || filterCnae ? `Nenhuma organização para os filtros aplicados.` : "Nenhuma organização."}</TableCell></TableRow>
                ) : (
                  organizacoes.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{org.id}</TableCell>
                      <TableCell className="font-semibold">{org.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.tipoOrganizacao}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.cnpj}</TableCell>
                      <TableCell className="hidden xl:table-cell">{org.telefone || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.localidade || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.situacaoCadastral || "N/A"}</TableCell>
                      <TableCell className="hidden xl:table-cell">{org.porte || "N/A"}</TableCell>
                      <TableCell className="hidden xl:table-cell">{org.cnaePrincipal || "N/A"}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild><Link href={`/admin/organizacoes/${org.id}`}><Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span></Link></Button>
                        <Button variant="outline" size="sm" asChild><Link href={`/admin/organizacoes/${org.id}/editar`}><Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span></Link></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(org)} disabled={isLoading}><Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {organizacaoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader><div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div><AlertDialogDescription className="pt-2">Deseja excluir <strong>{organizacaoToDelete.nome}</strong> (ID: {organizacaoToDelete.id})? Esta ação é irreversível e também removerá os QSA associados.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => { setIsAlertOpen(false); setOrganizacaoToDelete(null); }} disabled={isLoading}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteOrganizacao} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>Confirmar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
/* Supabase Integration Notes:
- Entidades table now has direct address fields and new economic/tax fields.
- List page query needs to select these new fields for display and filtering.
- QSA data is related via public."QSA" table.
- CNPJ API integration is for auto-filling on create/edit.
- Ensure RLS allows reads from Entidades, TiposEntidade, and QSA as needed by the user's role.
- When deleting an Entidade, ensure related QSA records are also deleted (either by DB cascade or explicitly in the delete function).
*/

    