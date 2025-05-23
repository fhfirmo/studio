
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Building2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface TipoEntidadeSupabase {
  id_tipo_entidade: number;
  nome_tipo: string;
}

interface TipoEntidade extends TipoEntidadeSupabase {}

export default function GerenciarTiposEntidadePage() {
  const { toast } = useToast();
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true); // Separate state for initial fetch

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTipoEntidade, setCurrentTipoEntidade] = useState<TipoEntidade | null>(null);
  const [formData, setFormData] = useState({ nome_tipo: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [tipoEntidadeToDelete, setTipoEntidadeToDelete] = useState<TipoEntidade | null>(null);

  const fetchTiposEntidade = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsFetching(false);
      setIsLoading(false);
      setTiposEntidade([]);
      return;
    }
    setIsLoading(true); // For search/refresh loading
    if (isFetching) setIsLoading(true); // For initial load spinner

    console.log("GerenciarTiposEntidadePage: Fetching TiposEntidade, search:", searchTerm);
    
    let query = supabase
      .from('TiposEntidade')
      .select('id_tipo_entidade, nome_tipo')
      .order('nome_tipo', { ascending: true });

    if (searchTerm) {
      query = query.ilike('nome_tipo', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GerenciarTiposEntidadePage: Erro ao buscar tipos de entidade:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar os tipos de entidade.", variant: "destructive" });
      setTiposEntidade([]);
    } else {
      setTiposEntidade(data as TipoEntidade[] || []);
      console.log("GerenciarTiposEntidadePage: TiposEntidade fetched:", data);
    }
    setIsLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchTiposEntidade();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchTiposEntidade(); 
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };


  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentTipoEntidade(null);
    setFormData({ nome_tipo: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tipo: TipoEntidade) => {
    setModalMode('edit');
    setCurrentTipoEntidade(tipo);
    setFormData({ nome_tipo: tipo.nome_tipo });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTipoEntidade(null);
    setFormData({ nome_tipo: '' });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveEntityType = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!formData.nome_tipo.trim()) {
      toast({ title: "Erro de Validação", description: "O nome do tipo não pode ser vazio.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let error = null;
    let operationData = null;

    try {
      if (modalMode === 'create') {
        console.log("GerenciarTiposEntidadePage: Attempting to INSERT TipoEntidade:", formData);
        const { data: newData, error: insertError } = await supabase
          .from('TiposEntidade')
          .insert([{ nome_tipo: formData.nome_tipo.trim() }])
          .select()
          .single();
        error = insertError;
        operationData = newData;
        if (!error && newData) {
          toast({ title: "Sucesso!", description: "Novo tipo de entidade cadastrado." });
        }
      } else if (modalMode === 'edit' && currentTipoEntidade) {
        console.log("GerenciarTiposEntidadePage: Attempting to UPDATE TipoEntidade ID:", currentTipoEntidade.id_tipo_entidade, "with data:", formData);
        const { data: updatedData, error: updateError } = await supabase
          .from('TiposEntidade')
          .update({ nome_tipo: formData.nome_tipo.trim() })
          .eq('id_tipo_entidade', currentTipoEntidade.id_tipo_entidade)
          .select()
          .single();
        error = updateError;
        operationData = updatedData;
        if (!error && updatedData) {
          toast({ title: "Sucesso!", description: "Tipo de entidade atualizado." });
        }
      }

      if (error) {
        console.error(`GerenciarTiposEntidadePage: Erro ao salvar tipo de entidade (${modalMode}):`, JSON.stringify(error, null, 2), error); // Log the full error object
        toast({ 
            title: `Erro ao Salvar (${modalMode})`, 
            description: error.message || "Falha na operação. Verifique permissões (RLS) e se os dados são válidos (ex: nome único).", 
            variant: "destructive",
            duration: 7000
        });
      } else {
        fetchTiposEntidade(); 
        handleCloseModal();
      }
    } catch (catchError: any) {
        console.error(`GerenciarTiposEntidadePage: Exceção ao salvar tipo de entidade (${modalMode}):`, catchError);
        toast({ title: "Erro Inesperado", description: catchError.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (tipo: TipoEntidade) => {
    setTipoEntidadeToDelete(tipo);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteEntityType = async () => {
    if (!tipoEntidadeToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log("GerenciarTiposEntidadePage: Attempting to DELETE TipoEntidade ID:", tipoEntidadeToDelete.id_tipo_entidade);
    const { error } = await supabase
      .from('TiposEntidade')
      .delete()
      .eq('id_tipo_entidade', tipoEntidadeToDelete.id_tipo_entidade);

    if (error) {
      console.error('GerenciarTiposEntidadePage: Falha ao excluir tipo de entidade:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir. Verifique se este tipo está em uso.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Tipo de entidade "${tipoEntidadeToDelete.nome_tipo}" excluído.` });
      fetchTiposEntidade(); 
    }
    setIsLoading(false);
    setIsDeleteAlertOpen(false);
    setTipoEntidadeToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Building2 className="mr-3 h-8 w-8" /> Gerenciamento de Tipos de Entidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova os tipos de organização disponíveis no sistema.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isLoading}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Tipo
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Tipos de Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Pesquisar por nome do tipo..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading && !isFetching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tipos de Entidade Cadastrados</CardTitle>
          <CardDescription>
            Total de {tiposEntidade.length} tipos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isFetching ? (
              <p className="text-center text-muted-foreground py-4">Carregando tipos de entidade...</p>
            ) : !isLoading && tiposEntidade.length === 0 && !searchTerm ? (
              <p className="text-center text-muted-foreground py-4">Nenhum tipo de entidade cadastrado.</p>
            ) : !isLoading && tiposEntidade.length === 0 && searchTerm ? (
                 <p className="text-center text-muted-foreground py-4">Nenhum tipo de entidade encontrado com o termo "{searchTerm}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Nome do Tipo</TableHead>
                    <TableHead className="text-right w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposEntidade.map((tipo) => (
                    <TableRow key={tipo.id_tipo_entidade}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{tipo.id_tipo_entidade}</TableCell>
                      <TableCell>{tipo.nome_tipo}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(tipo)} disabled={isLoading}>
                          <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(tipo)} disabled={isLoading}>
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Novo Tipo de Entidade' : 'Editar Tipo de Entidade'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha o nome para o novo tipo de entidade.' : `Editando o tipo: ${currentTipoEntidade?.nome_tipo || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEntityType} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_tipo" className="text-right col-span-1">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome_tipo"
                name="nome_tipo"
                value={formData.nome_tipo}
                onChange={handleFormChange}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : (modalMode === 'create' ? 'Salvar Tipo' : 'Salvar Alterações')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {tipoEntidadeToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o tipo de entidade <strong>{tipoEntidadeToDelete.nome_tipo}</strong>? Esta ação é irreversível e pode afetar as Organizações associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEntityType} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* 
        Supabase Integration RLS Notes for public."TiposEntidade":
        - SELECT: Users with 'admin', 'supervisor', 'operator' roles should be able to read all.
                  Clients might also need read access if this info is displayed to them (e.g., in filters or organization details).
        - INSERT, UPDATE, DELETE: Typically restricted to 'admin' and 'supervisor'.
        - Ensure your RLS policy 'TiposEntidade: Allow admin/supervisor to manage.' is active and correct.
        - The public.get_user_role() function must return 'admin' or 'supervisor' for the logged-in user performing these actions.
        - Check for UNIQUE constraint on `nome_tipo`.
      */}
    </div>
  );
}
