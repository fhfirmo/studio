"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, ShieldHalf, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface Cobertura {
  id: number; // Corresponds to id_cobertura
  nome_cobertura: string;
  descricao_cobertura: string | null;
}

export default function GerenciarCoberturasPage() {
  const { toast } = useToast();
  const [coberturas, setCoberturas] = useState<Cobertura[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentCobertura, setCurrentCobertura] = useState<Cobertura | null>(null);
  const [formData, setFormData] = useState({ nome_cobertura: '', descricao_cobertura: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [coberturaToDelete, setCoberturaToDelete] = useState<Cobertura | null>(null);

  const fetchCoberturas = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setIsFetching(false); setCoberturas([]); return;
    }
    if (!isFetching && !isLoading) setIsFetching(true);
    if (isLoading && coberturas.length === 0) setIsLoading(true);

    console.log("Fetching Coberturas, search:", searchTerm);
    
    let query = supabase
      .from('Coberturas')
      .select('id_cobertura, nome_cobertura, descricao_cobertura')
      .order('nome_cobertura', { ascending: true });

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      query = query.or(`nome_cobertura.ilike.${searchPattern},descricao_cobertura.ilike.${searchPattern}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar coberturas:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar as coberturas.", variant: "destructive" });
      setCoberturas([]);
    } else {
      setCoberturas((data || []).map(item => ({
        id: item.id_cobertura,
        nome_cobertura: item.nome_cobertura,
        descricao_cobertura: item.descricao_cobertura,
      })));
    }
    setIsLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchCoberturas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchCoberturas(); 
  };
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentCobertura(null);
    setFormData({ nome_cobertura: '', descricao_cobertura: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Cobertura) => {
    setModalMode('edit');
    setCurrentCobertura(item);
    setFormData({ nome_cobertura: item.nome_cobertura, descricao_cobertura: item.descricao_cobertura || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCobertura(null);
    setFormData({ nome_cobertura: '', descricao_cobertura: '' });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveCobertura = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!formData.nome_cobertura.trim()) {
      toast({ title: "Erro de Validação", description: "Nome da Cobertura é obrigatório.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let error = null;
    const payload = { 
      nome_cobertura: formData.nome_cobertura.trim(),
      descricao_cobertura: formData.descricao_cobertura.trim() || null
    };
    
    try {
      if (modalMode === 'create') {
        console.log("Attempting to INSERT Cobertura:", payload);
        const { error: insertError } = await supabase.from('Coberturas').insert([payload]).select().single();
        error = insertError;
        if (!error) toast({ title: "Sucesso!", description: "Nova cobertura cadastrada." });
      } else if (modalMode === 'edit' && currentCobertura) {
        console.log("Attempting to UPDATE Cobertura ID:", currentCobertura.id, "with data:", payload);
        const { error: updateError } = await supabase.from('Coberturas').update(payload).eq('id_cobertura', currentCobertura.id).select().single();
        error = updateError;
        if (!error) toast({ title: "Sucesso!", description: "Cobertura atualizada." });
      }

      if (error) {
        console.error(`Erro ao salvar cobertura (${modalMode}):`, JSON.stringify(error, null, 2)); 
        toast({ 
            title: `Erro ao Salvar (${modalMode})`, 
            description: error.message || "Falha na operação. Verifique se o nome é único e se há permissões (RLS).", 
            variant: "destructive",
            duration: 7000
        });
      } else {
        fetchCoberturas(); 
        handleCloseModal();
      }
    } catch (catchError: any) {
        console.error(`Exceção ao salvar cobertura (${modalMode}):`, catchError);
        toast({ title: "Erro Inesperado", description: catchError.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (item: Cobertura) => {
    setCoberturaToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteCobertura = async () => {
    if (!coberturaToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log("Attempting to DELETE Cobertura ID:", coberturaToDelete.id);
    const { error } = await supabase.from('Coberturas').delete().eq('id_cobertura', coberturaToDelete.id);

    if (error) {
      console.error('Falha ao excluir cobertura:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir. Verifique se esta cobertura está em uso.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Cobertura "${coberturaToDelete.nome_cobertura}" excluída.` });
      fetchCoberturas(); 
    }
    setIsLoading(false);
    setIsDeleteAlertOpen(false);
    setCoberturaToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <ShieldHalf className="mr-3 h-8 w-8" /> Gerenciamento de Coberturas de Seguro
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova os tipos de cobertura de seguro.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isLoading && isFetching}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Cobertura
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Coberturas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Pesquisar por nome ou descrição da cobertura..."
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
          <CardTitle>Coberturas de Seguro Cadastradas</CardTitle>
          <CardDescription>Total de {coberturas.length} coberturas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading && coberturas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Carregando coberturas...</p>
            ) : !isLoading && coberturas.length === 0 && !searchTerm ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma cobertura cadastrada.</p>
            ) : !isLoading && coberturas.length === 0 && searchTerm ? (
                 <p className="text-center text-muted-foreground py-4">Nenhuma cobertura encontrada com o termo "{searchTerm}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Nome da Cobertura</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="text-right w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coberturas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_cobertura}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{item.descricao_cobertura || "N/A"}</TableCell>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Cobertura' : 'Editar Cobertura'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados da nova cobertura.' : `Editando a cobertura: ${currentCobertura?.nome_cobertura || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCobertura} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_cobertura_modal">Nome da Cobertura <span className="text-destructive">*</span></Label>
              <Input id="nome_cobertura_modal" name="nome_cobertura" value={formData.nome_cobertura} onChange={handleFormChange} required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao_cobertura_modal">Descrição da Cobertura</Label>
              <Textarea id="descricao_cobertura_modal" name="descricao_cobertura" value={formData.descricao_cobertura} onChange={handleFormChange} rows={3} disabled={isLoading} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : (modalMode === 'create' ? 'Salvar Cobertura' : 'Salvar Alterações')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {coberturaToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsDeleteAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a cobertura <strong>{coberturaToDelete.nome_cobertura}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCobertura} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Table: public."Coberturas"
        - Columns: id_cobertura (SERIAL PK), nome_cobertura (VARCHAR UNIQUE NOT NULL), descricao_cobertura (TEXT)
        - RLS: Admin/Supervisor can manage (ALL), Authenticated can read (SELECT).
      */}
    </div>
  );
}