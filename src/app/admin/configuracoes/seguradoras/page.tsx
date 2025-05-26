
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Library, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface Seguradora {
  id: number; // Corresponds to id_seguradora
  nome_seguradora: string;
}

export default function GerenciarSeguradorasPage() {
  const { toast } = useToast();
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]); // Initialize with empty array
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For initial load and major operations
  const [isFetching, setIsFetching] = useState(true); // For search/refresh operations

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentSeguradora, setCurrentSeguradora] = useState<Seguradora | null>(null);
  const [formData, setFormData] = useState({ nome_seguradora: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [seguradoraToDelete, setSeguradoraToDelete] = useState<Seguradora | null>(null);

  const fetchSeguradoras = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setIsFetching(false); setSeguradoras([]); return;
    }
    if (!isFetching) setIsFetching(true); // Show loading for subsequent fetches
    if (isLoading && seguradoras.length === 0) setIsLoading(true); // Ensure initial loading spinner

    console.log("Fetching Seguradoras, search:", searchTerm);
    
    let query = supabase
      .from('Seguradoras')
      .select('id_seguradora, nome_seguradora')
      .order('nome_seguradora', { ascending: true });

    if (searchTerm) {
      query = query.ilike('nome_seguradora', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar seguradoras:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar as seguradoras.", variant: "destructive" });
      setSeguradoras([]);
    } else {
      setSeguradoras((data || []).map(item => ({
        id: item.id_seguradora,
        nome_seguradora: item.nome_seguradora,
      })));
    }
    setIsLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchSeguradoras();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch on mount

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchSeguradoras(); 
  };
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentSeguradora(null);
    setFormData({ nome_seguradora: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Seguradora) => {
    setModalMode('edit');
    setCurrentSeguradora(item);
    setFormData({ nome_seguradora: item.nome_seguradora });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSeguradora(null);
    setFormData({ nome_seguradora: '' });
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveSeguradora = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!formData.nome_seguradora.trim()) {
      toast({ title: "Erro de Validação", description: "Nome da Seguradora é obrigatório.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let error = null;
    const payload = { nome_seguradora: formData.nome_seguradora.trim() };
    
    try {
      if (modalMode === 'create') {
        console.log("Attempting to INSERT Seguradora:", payload);
        const { error: insertError } = await supabase.from('Seguradoras').insert([payload]).select().single();
        error = insertError;
        if (!error) toast({ title: "Sucesso!", description: "Nova seguradora cadastrada." });
      } else if (modalMode === 'edit' && currentSeguradora) {
        console.log("Attempting to UPDATE Seguradora ID:", currentSeguradora.id, "with data:", payload);
        const { error: updateError } = await supabase.from('Seguradoras').update(payload).eq('id_seguradora', currentSeguradora.id).select().single();
        error = updateError;
        if (!error) toast({ title: "Sucesso!", description: "Seguradora atualizada." });
      }

      if (error) {
        console.error(`Erro ao salvar seguradora (${modalMode}):`, JSON.stringify(error, null, 2)); 
        toast({ 
            title: `Erro ao Salvar (${modalMode})`, 
            description: error.message || "Falha na operação. Verifique se o nome é único e se há permissões (RLS).", 
            variant: "destructive",
            duration: 7000
        });
      } else {
        fetchSeguradoras(); 
        handleCloseModal();
      }
    } catch (catchError: any) {
        console.error(`Exceção ao salvar seguradora (${modalMode}):`, catchError);
        toast({ title: "Erro Inesperado", description: catchError.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (item: Seguradora) => {
    setSeguradoraToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteSeguradora = async () => {
    if (!seguradoraToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log("Attempting to DELETE Seguradora ID:", seguradoraToDelete.id);
    const { error } = await supabase.from('Seguradoras').delete().eq('id_seguradora', seguradoraToDelete.id);

    if (error) {
      console.error('Falha ao excluir seguradora:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir. Verifique se esta seguradora está em uso.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Seguradora "${seguradoraToDelete.nome_seguradora}" excluída.` });
      fetchSeguradoras(); 
    }
    setIsLoading(false);
    setIsDeleteAlertOpen(false);
    setSeguradoraToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Library className="mr-3 h-8 w-8" /> Gerenciamento de Seguradoras
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova as seguradoras cadastradas no sistema.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isLoading && isFetching}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Seguradora
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Seguradoras</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Pesquisar por nome da seguradora..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-grow"
              disabled={isLoading && isFetching}
            />
            <Button type="submit" disabled={isLoading && isFetching}>
              <Search className="mr-2 h-4 w-4" /> {isFetching && isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seguradoras Cadastradas</CardTitle>
          <CardDescription>Total de {seguradoras.length} seguradoras no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading && seguradoras.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Carregando seguradoras...</p>
            ) : !isLoading && seguradoras.length === 0 && !searchTerm ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma seguradora cadastrada.</p>
            ) : !isLoading && seguradoras.length === 0 && searchTerm ? (
                 <p className="text-center text-muted-foreground py-4">Nenhuma seguradora encontrada com o termo "{searchTerm}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Nome da Seguradora</TableHead>
                    <TableHead className="text-right w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seguradoras.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_seguradora}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(item)} disabled={isLoading}>
                          <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item)} disabled={isLoading}>
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

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!isLoading) setIsModalOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Seguradora' : 'Editar Seguradora'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha o nome da nova seguradora.' : `Editando a seguradora: ${currentSeguradora?.nome_seguradora || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSeguradora} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_seguradora">Nome da Seguradora <span className="text-destructive">*</span></Label>
              <Input id="nome_seguradora" name="nome_seguradora" value={formData.nome_seguradora} onChange={handleFormChange} required disabled={isLoading} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : (modalMode === 'create' ? 'Salvar Seguradora' : 'Salvar Alterações')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {seguradoraToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsDeleteAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a seguradora <strong>{seguradoraToDelete.nome_seguradora}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSeguradora} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Table: public."Seguradoras"
        - Columns: id_seguradora (SERIAL PK), nome_seguradora (VARCHAR UNIQUE NOT NULL)
        - RLS: Admin/Supervisor can manage (ALL), Authenticated can read (SELECT).
      */}
    </div>
  );
}

    