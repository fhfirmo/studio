
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
}

interface OrganizacaoRow {
  id: number; // Corresponds to id_entidade
  nome: string;
  tipoOrganizacao: string | null;
  cnpj: string;
  telefone: string | null;
}

const initialOrganizacoes: OrganizacaoRow[] = []; // Start with empty, will be fetched

export default function GerenciamentoOrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState<OrganizacaoRow[]>(initialOrganizacoes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [organizacaoToDelete, setOrganizacaoToDelete] = useState<{ id: number; nome: string } | null>(null);
  const { toast } = useToast();

  const fetchOrganizacoes = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Supabase.", variant: "destructive" });
      setIsLoading(false);
      setOrganizacoes([]);
      return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('Entidades')
      .select(`
        id_entidade,
        nome,
        cnpj,
        telefone,
        TiposEntidade ( nome_tipo )
      `)
      .order('nome', { ascending: true });

    if (searchTerm) {
      query = query.or(`nome.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar organizações:", error);
      toast({ title: "Erro ao Buscar Dados", description: error.message, variant: "destructive" });
      setOrganizacoes([]);
    } else {
      const formattedData: OrganizacaoRow[] = data.map((org: OrganizacaoSupabase) => ({
        id: org.id_entidade,
        nome: org.nome,
        tipoOrganizacao: org.TiposEntidade?.nome_tipo || 'N/A',
        cnpj: org.cnpj,
        telefone: org.telefone,
      }));
      setOrganizacoes(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchOrganizacoes();
  }, []); // Fetch on mount

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchOrganizacoes(); // Re-fetch with current searchTerm
  };

  const handleDeleteClick = (organizacao: OrganizacaoRow) => {
    setOrganizacaoToDelete({ id: organizacao.id, nome: organizacao.nome });
    setIsAlertOpen(true);
  };

  const confirmDeleteOrganizacao = async () => {
    if (!organizacaoToDelete || !supabase) return;
    
    const { error } = await supabase
      .from('Entidades')
      .delete()
      .eq('id_entidade', organizacaoToDelete.id);

    if (error) {
      console.error('Falha ao excluir organização:', error.message);
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir organização: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Organização Excluída!", description: `A organização ${organizacaoToDelete.nome} foi excluída.` });
      fetchOrganizacoes(); // Refresh the list
    }
    setIsAlertOpen(false);
    setOrganizacaoToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Building className="mr-3 h-8 w-8" /> Listagem de Organizações
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova organizações do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/organizacoes/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Organização
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Organizações</CardTitle>
          <CardDescription>Filtre organizações por nome ou CNPJ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Organizações Cadastradas</CardTitle>
          <CardDescription>
            Total de {organizacoes.length} organizações no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome da Organização</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : organizacoes.length > 0 ? (
                  organizacoes.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{org.id}</TableCell>
                      <TableCell className="font-semibold">{org.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.tipoOrganizacao}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.cnpj}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.telefone || "N/A"}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes da organização ${org.nome}`}>
                           <Link href={`/admin/organizacoes/${org.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar organização ${org.nome}`}>
                          <Link href={`/admin/organizacoes/${org.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(org)}
                          aria-label={`Excluir organização ${org.nome}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhuma organização cadastrada no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {organizacaoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Organização</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a organização <strong>{organizacaoToDelete.nome}</strong> (ID: {organizacaoToDelete.id})? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setOrganizacaoToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteOrganizacao} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    