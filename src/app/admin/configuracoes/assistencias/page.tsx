
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, CheckSquare, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface Assistencia {
  id: number; // Corresponds to id_assistencia
  nome_assistencia: string;
  descricao_assistencia: string | null;
  tipo_assistencia: string; // Added this field
}

export default function GerenciarAssistenciasPage() {
  const { toast } = useToast();
  const [assistencias, setAssistencias] = useState<Assistencia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentAssistencia, setCurrentAssistencia] = useState<Assistencia | null>(null);
  const [formData, setFormData] = useState({ nome_assistencia: '', descricao_assistencia: '', tipo_assistencia: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [assistenciaToDelete, setAssistenciaToDelete] = useState<Assistencia | null>(null);

  const fetchAssistencias = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setIsFetching(false); setAssistencias([]); return;
    }
    setIsFetching(true); // Show loading for fetches
    if (isLoading && assistencias.length === 0) setIsLoading(true); // Ensure initial loading spinner is for the whole page

    console.log("Fetching Assistencias, search:", searchTerm);
    
    let query = supabase
      .from('Assistencias')
      .select('id_assistencia, nome_assistencia, descricao_assistencia, tipo_assistencia')
      .order('nome_assistencia', { ascending: true });

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      query = query.or(`nome_assistencia.ilike.${searchPattern},descricao_assistencia.ilike.${searchPattern},tipo_assistencia.ilike.${searchPattern}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar assistências:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar as assistências.", variant: "destructive" });
      setAssistencias([]);
    } else {
      setAssistencias((data || []).map(item => ({
        id: item.id_assistencia,
        nome_assistencia: item.nome_assistencia,
        descricao_assistencia: item.descricao_assistencia,
        tipo_assistencia: item.tipo_assistencia,
      })));
    }
    setIsLoading(false); // Overall page loading done after first fetch
    setIsFetching(false); // Current fetch operation done
  };

  useEffect(() => {
    fetchAssistencias();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchAssistencias(); 
  };
  
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentAssistencia(null);
    setFormData({ nome_assistencia: '', descricao_assistencia: '', tipo_assistencia: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Assistencia) => {
    setModalMode('edit');
    setCurrentAssistencia(item);
    setFormData({ 
      nome_assistencia: item.nome_assistencia, 
      descricao_assistencia: item.descricao_assistencia || '',
      tipo_assistencia: item.tipo_assistencia || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAssistencia(null);
    setFormData({ nome_assistencia: '', descricao_assistencia: '', tipo_assistencia: '' });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveAssistencia = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!formData.nome_assistencia.trim() || !formData.tipo_assistencia.trim()) {
      toast({ title: "Erro de Validação", description: "Nome da Assistência e Tipo de Assistência são obrigatórios.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let error = null;
    const payload = { 
      nome_assistencia: formData.nome_assistencia.trim(),
      descricao_assistencia: formData.descricao_assistencia.trim() || null,
      tipo_assistencia: formData.tipo_assistencia.trim(),
    };
    
    try {
      if (modalMode === 'create') {
        console.log("Attempting to INSERT Assistencia:", payload);
        const { error: insertError } = await supabase.from('Assistencias').insert([payload]).select().single();
        error = insertError;
        if (!error) toast({ title: "Sucesso!", description: "Nova assistência cadastrada." });
      } else if (modalMode === 'edit' && currentAssistencia) {
        console.log("Attempting to UPDATE Assistencia ID:", currentAssistencia.id, "with data:", payload);
        const { error: updateError } = await supabase.from('Assistencias').update(payload).eq('id_assistencia', currentAssistencia.id).select().single();
        error = updateError;
        if (!error) toast({ title: "Sucesso!", description: "Assistência atualizada." });
      }

      if (error) {
        console.error(`Erro ao salvar assistência (${modalMode}):`, JSON.stringify(error, null, 2)); 
        toast({ 
            title: `Erro ao Salvar (${modalMode})`, 
            description: error.message || "Falha na operação. Verifique se o nome é único e se há permissões (RLS).", 
            variant: "destructive",
            duration: 7000
        });
      } else {
        fetchAssistencias(); 
        handleCloseModal();
      }
    } catch (catchError: any) {
        console.error(`Exceção ao salvar assistência (${modalMode}):`, catchError);
        toast({ title: "Erro Inesperado", description: catchError.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (item: Assistencia) => {
    setAssistenciaToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteAssistencia = async () => {
    if (!assistenciaToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log("Attempting to DELETE Assistencia ID:", assistenciaToDelete.id);
    const { error } = await supabase.from('Assistencias').delete().eq('id_assistencia', assistenciaToDelete.id);

    if (error) {
      console.error('Falha ao excluir assistência:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir. Verifique se esta assistência está em uso.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Assistência "${assistenciaToDelete.nome_assistencia}" excluída.` });
      fetchAssistencias(); 
    }
    setIsLoading(false);
    setIsDeleteAlertOpen(false);
    setAssistenciaToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <CheckSquare className="mr-3 h-8 w-8" /> Gerenciamento de Assistências de Seguro
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova os tipos de assistência de seguro.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isLoading && isFetching}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Assistência
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Assistências</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Pesquisar por nome, tipo ou descrição..."
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
          <CardTitle>Assistências de Seguro Cadastradas</CardTitle>
          <CardDescription>Total de {assistencias.length} assistências no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading && assistencias.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Carregando assistências...</p>
            ) : !isLoading && assistencias.length === 0 && !searchTerm ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma assistência cadastrada.</p>
            ) : !isLoading && assistencias.length === 0 && searchTerm ? (
                 <p className="text-center text-muted-foreground py-4">Nenhuma assistência encontrada com o termo "{searchTerm}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Nome da Assistência</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="text-right w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assistencias.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_assistencia}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.tipo_assistencia}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{item.descricao_assistencia || "N/A"}</TableCell>
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
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Assistência' : 'Editar Assistência'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados da nova assistência.' : `Editando a assistência: ${currentAssistencia?.nome_assistencia || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssistencia} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_assistencia_modal">Nome da Assistência <span className="text-destructive">*</span></Label>
              <Input id="nome_assistencia_modal" name="nome_assistencia" value={formData.nome_assistencia} onChange={handleFormChange} required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo_assistencia_modal">Tipo de Assistência <span className="text-destructive">*</span></Label>
              <Input id="tipo_assistencia_modal" name="tipo_assistencia" value={formData.tipo_assistencia} onChange={handleFormChange} required disabled={isLoading} placeholder="Ex: Guincho, Chaveiro, Residencial"/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao_assistencia_modal">Descrição da Assistência</Label>
              <Textarea id="descricao_assistencia_modal" name="descricao_assistencia" value={formData.descricao_assistencia} onChange={handleFormChange} rows={3} disabled={isLoading} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : (modalMode === 'create' ? 'Salvar Assistência' : 'Salvar Alterações')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assistenciaToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsDeleteAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a assistência <strong>{assistenciaToDelete.nome_assistencia}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAssistencia} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
// Supabase Integration Notes:
// - Table: public."Assistencias"
// - Columns: id_assistencia (SERIAL PK), nome_assistencia (VARCHAR UNIQUE NOT NULL), tipo_assistencia (VARCHAR NOT NULL), descricao_assistencia (TEXT)
// - RLS: Admin/Supervisor can manage (ALL), Authenticated can read (SELECT).
// - Search should include 'tipo_assistencia'.
// - Form modal needs to include input for 'tipo_assistencia' (obrigatório).

    