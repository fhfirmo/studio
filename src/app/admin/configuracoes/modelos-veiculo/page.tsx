
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, CarIcon } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface ModeloVeiculo {
  id: number; // Corresponds to id_modelo
  marca: string;
  modelo: string;
  versao: string | null;
}

export default function GerenciarModelosVeiculoPage() {
  const { toast } = useToast();
  const [modelosVeiculo, setModelosVeiculo] = useState<ModeloVeiculo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentModeloVeiculo, setCurrentModeloVeiculo] = useState<ModeloVeiculo | null>(null);
  const [formData, setFormData] = useState({ marca: '', modelo: '', versao: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [modeloVeiculoToDelete, setModeloVeiculoToDelete] = useState<ModeloVeiculo | null>(null);

  const fetchModelosVeiculo = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsFetching(false); setIsLoading(false); setModelosVeiculo([]); return;
    }
    if (isFetching) setIsLoading(true);

    console.log("Fetching ModelosVeiculo, search:", searchTerm);
    
    let query = supabase
      .from('ModelosVeiculo')
      .select('id_modelo, marca, modelo, versao')
      .order('marca', { ascending: true })
      .order('modelo', { ascending: true })
      .order('versao', { ascending: true, nullsFirst: false });

    if (searchTerm) {
      query = query.or(`marca.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%,versao.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar modelos de veículo:", JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Buscar Dados", description: error.message || "Não foi possível carregar os modelos.", variant: "destructive" });
      setModelosVeiculo([]);
    } else {
      setModelosVeiculo((data || []).map(item => ({
        id: item.id_modelo,
        marca: item.marca,
        modelo: item.modelo,
        versao: item.versao || null,
      })));
    }
    setIsLoading(false);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchModelosVeiculo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setIsFetching(true); // Indicate fetching for new search
    fetchModelosVeiculo(); 
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentModeloVeiculo(null);
    setFormData({ marca: '', modelo: '', versao: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ModeloVeiculo) => {
    setModalMode('edit');
    setCurrentModeloVeiculo(item);
    setFormData({ marca: item.marca, modelo: item.modelo, versao: item.versao || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentModeloVeiculo(null);
    setFormData({ marca: '', modelo: '', versao: '' });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveModeloVeiculo = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!formData.marca.trim() || !formData.modelo.trim()) { // Versão pode ser opcional dependendo da sua regra de negócio
      toast({ title: "Erro de Validação", description: "Marca e Modelo são obrigatórios.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    let error = null;
    const payload = {
      marca: formData.marca.trim(),
      modelo: formData.modelo.trim(),
      versao: formData.versao.trim() || null, // Envia null se vazio
    };
    
    try {
      if (modalMode === 'create') {
        console.log("Attempting to INSERT ModeloVeiculo:", payload);
        const { error: insertError } = await supabase
          .from('ModelosVeiculo')
          .insert([payload])
          .select()
          .single();
        error = insertError;
        if (!error) {
          toast({ title: "Sucesso!", description: "Novo modelo de veículo cadastrado." });
        }
      } else if (modalMode === 'edit' && currentModeloVeiculo) {
        console.log("Attempting to UPDATE ModeloVeiculo ID:", currentModeloVeiculo.id, "with data:", payload);
        const { error: updateError } = await supabase
          .from('ModelosVeiculo')
          .update(payload)
          .eq('id_modelo', currentModeloVeiculo.id)
          .select()
          .single();
        error = updateError;
        if (!error) {
          toast({ title: "Sucesso!", description: "Modelo de veículo atualizado." });
        }
      }

      if (error) {
        console.error(`Erro ao salvar modelo (${modalMode}):`, JSON.stringify(error, null, 2)); 
        toast({ 
            title: `Erro ao Salvar (${modalMode})`, 
            description: error.message || "Falha na operação. Verifique se os dados são válidos (ex: combinação única de marca, modelo, versão).", 
            variant: "destructive",
            duration: 7000
        });
      } else {
        setIsFetching(true);
        fetchModelosVeiculo(); 
        handleCloseModal();
      }
    } catch (catchError: any) {
        console.error(`Exceção ao salvar modelo (${modalMode}):`, catchError);
        toast({ title: "Erro Inesperado", description: catchError.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (item: ModeloVeiculo) => {
    setModeloVeiculoToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteModeloVeiculo = async () => {
    if (!modeloVeiculoToDelete || !supabase) return;
    
    setIsLoading(true);
    console.log("Attempting to DELETE ModeloVeiculo ID:", modeloVeiculoToDelete.id);
    const { error } = await supabase
      .from('ModelosVeiculo')
      .delete()
      .eq('id_modelo', modeloVeiculoToDelete.id);

    if (error) {
      console.error('Falha ao excluir modelo de veículo:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: error.message || "Falha ao excluir. Verifique se este modelo está em uso.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Modelo "${modeloVeiculoToDelete.marca} ${modeloVeiculoToDelete.modelo}" excluído.` });
      setIsFetching(true);
      fetchModelosVeiculo(); 
    }
    setIsLoading(false);
    setIsDeleteAlertOpen(false);
    setModeloVeiculoToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <CarIcon className="mr-3 h-8 w-8" /> Gerenciamento de Modelos de Veículo
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova as marcas, modelos e versões de veículos.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} disabled={isLoading && isFetching}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Modelo
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Modelos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Pesquisar por marca, modelo ou versão..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-grow"
              disabled={isLoading && isFetching}
            />
            <Button type="submit" disabled={isLoading && isFetching}>
              <Search className="mr-2 h-4 w-4" /> {isLoading && isFetching ? "Buscando..." : "Buscar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Modelos Cadastrados</CardTitle>
          <CardDescription>Total de {modelosVeiculo.length} modelos no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isFetching ? (
              <p className="text-center text-muted-foreground py-4">Carregando modelos...</p>
            ) : !isLoading && modelosVeiculo.length === 0 && !searchTerm ? (
              <p className="text-center text-muted-foreground py-4">Nenhum modelo cadastrado.</p>
            ) : !isLoading && modelosVeiculo.length === 0 && searchTerm ? (
                 <p className="text-center text-muted-foreground py-4">Nenhum modelo encontrado com o termo "{searchTerm}".</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead className="text-right w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelosVeiculo.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.marca}</TableCell>
                      <TableCell>{item.modelo}</TableCell>
                      <TableCell>{item.versao || 'N/A'}</TableCell>
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
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Novo Modelo' : 'Editar Modelo'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados do novo modelo.' : `Editando: ${currentModeloVeiculo?.marca || ''} ${currentModeloVeiculo?.modelo || ''} ${currentModeloVeiculo?.versao || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveModeloVeiculo} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
              <Input id="marca" name="marca" value={formData.marca} onChange={handleFormChange} required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label>
              <Input id="modelo" name="modelo" value={formData.modelo} onChange={handleFormChange} required disabled={isLoading} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="versao">Versão</Label>
              <Input id="versao" name="versao" value={formData.versao} onChange={handleFormChange} disabled={isLoading} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal} disabled={isLoading}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : (modalMode === 'create' ? 'Salvar Modelo' : 'Salvar Alterações')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {modeloVeiculoToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => { if (!isLoading) setIsDeleteAlertOpen(open); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o modelo <strong>{modeloVeiculoToDelete.marca} {modeloVeiculoToDelete.modelo} ({modeloVeiculoToDelete.versao || 'N/A'})</strong>? Esta ação é irreversível e pode afetar veículos associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteModeloVeiculo} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Listagem: Fetch from public."ModelosVeiculo".
        - Cadastro: POST to public."ModelosVeiculo". Fields: marca, modelo, versao.
        - Edição: PUT/PATCH to public."ModelosVeiculo" by id_modelo.
        - Exclusão: DELETE from public."ModelosVeiculo" by id_modelo.
        - RLS: Ensure 'admin' or 'supervisor' (based on get_user_role()) can perform these operations.
          - SELECT can be open to 'authenticated'.
        - Consider unique constraint (marca, modelo, versao) in Supabase.
      */}
    </div>
  );
}

