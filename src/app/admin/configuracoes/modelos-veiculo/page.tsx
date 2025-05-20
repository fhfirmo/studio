
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
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
  DialogTrigger,
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Settings, CarIcon } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

interface ModeloVeiculo {
  id: string;
  marca: string;
  modelo: string;
  versao: string;
}

const initialModelosVeiculo: ModeloVeiculo[] = [
  { id: "mod_001", marca: "Fiat", modelo: "Uno Mille", versao: "Fire 1.0" },
  { id: "mod_002", marca: "Volkswagen", modelo: "Gol G5", versao: "1.6 Power" },
  { id: "mod_003", marca: "Chevrolet", modelo: "Onix Plus", versao: "LTZ 1.0 Turbo" },
  { id: "mod_004", marca: "Toyota", modelo: "Hilux SW4", versao: "SRX Diamond 2.8 Diesel" },
  { id: "mod_005", marca: "Honda", modelo: "Civic", versao: "EXL 2.0 CVT" },
];

export default function GerenciarModelosVeiculoPage() {
  // const { toast } = useToast();
  const [modelosVeiculo, setModelosVeiculo] = useState<ModeloVeiculo[]>(initialModelosVeiculo);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModelos, setFilteredModelos] = useState<ModeloVeiculo[]>(initialModelosVeiculo);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentModeloVeiculo, setCurrentModeloVeiculo] = useState<ModeloVeiculo | null>(null);
  const [formData, setFormData] = useState({ marca: '', modelo: '', versao: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [modeloVeiculoToDelete, setModeloVeiculoToDelete] = useState<ModeloVeiculo | null>(null);

  useEffect(() => {
    // Supabase: Fetch initial data for ModelosVeiculo
    // async function fetchModelos() {
    //   // const { data, error } = await supabase.from('ModelosVeiculo').select('*').order('marca').order('modelo').order('versao');
    //   // if (error) { /* toast error */ } else { setModelosVeiculo(data || []); setFilteredModelos(data || []); }
    // }
    // fetchModelos();
    setFilteredModelos(
      modelosVeiculo.filter(item =>
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.versao.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, modelosVeiculo]);

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
    setFormData({ marca: item.marca, modelo: item.modelo, versao: item.versao });
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
    if (!formData.marca.trim() || !formData.modelo.trim() || !formData.versao.trim()) {
      // toast({ title: "Erro de Validação", description: "Marca, Modelo e Versão são obrigatórios.", variant: "destructive" });
      console.error("Validação: Marca, Modelo e Versão são obrigatórios.");
      return;
    }

    if (modalMode === 'create') {
      // Supabase: Insert new ModeloVeiculo
      // const { data, error } = await supabase.from('ModelosVeiculo').insert([{ ...formData }]).select();
      // if (error) { /* handle error */ } else { setModelosVeiculo(prev => [...prev, data[0]].sort(...)); /* toast success */ }
      const newId = `mod_new_${Date.now()}`;
      setModelosVeiculo(prev => [...prev, { id: newId, ...formData }].sort((a,b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo) || a.versao.localeCompare(b.versao)));
      console.log("Simulando criação de Modelo de Veículo:", { ...formData });
    } else if (modalMode === 'edit' && currentModeloVeiculo) {
      // Supabase: Update existing ModeloVeiculo
      // const { data, error } = await supabase.from('ModelosVeiculo').update({ ...formData }).eq('id', currentModeloVeiculo.id).select();
      // if (error) { /* handle error */ } else { setModelosVeiculo(prev => prev.map(m => m.id === currentModeloVeiculo.id ? data[0] : m).sort(...)); /* toast success */ }
      setModelosVeiculo(prev => prev.map(m => m.id === currentModeloVeiculo.id ? { ...m, ...formData } : m).sort((a,b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo) || a.versao.localeCompare(b.versao)));
      console.log("Simulando atualização de Modelo de Veículo:", { id: currentModeloVeiculo.id, ...formData });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (item: ModeloVeiculo) => {
    setModeloVeiculoToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteModeloVeiculo = async () => {
    if (!modeloVeiculoToDelete) return;
    // Supabase: Delete ModeloVeiculo
    // const { error } = await supabase.from('ModelosVeiculo').delete().eq('id', modeloVeiculoToDelete.id);
    // if (error) { /* handle error, consider FK constraints */ } else { setModelosVeiculo(prev => prev.filter(m => m.id !== modeloVeiculoToDelete.id)); /* toast success */ }
    setModelosVeiculo(prev => prev.filter(m => m.id !== modeloVeiculoToDelete!.id));
    console.log("Simulando exclusão de Modelo de Veículo:", modeloVeiculoToDelete);
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
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Modelo
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Modelos de Veículo</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Pesquisar por marca, modelo ou versão..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Modelos de Veículo Cadastrados</CardTitle>
          <CardDescription>Total de {filteredModelos.length} modelos no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModelos.length > 0 ? (
                  filteredModelos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.marca}</TableCell>
                      <TableCell>{item.modelo}</TableCell>
                      <TableCell>{item.versao}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(item)}>
                          <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item)}>
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum modelo de veículo encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Novo Modelo de Veículo' : 'Editar Modelo de Veículo'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados do novo modelo.' : `Editando o modelo: ${currentModeloVeiculo?.marca || ''} ${currentModeloVeiculo?.modelo || ''} ${currentModeloVeiculo?.versao || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveModeloVeiculo} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
              <Input id="marca" name="marca" value={formData.marca} onChange={handleFormChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label>
              <Input id="modelo" name="modelo" value={formData.modelo} onChange={handleFormChange} required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="versao">Versão <span className="text-destructive">*</span></Label>
              <Input id="versao" name="versao" value={formData.versao} onChange={handleFormChange} required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button></DialogClose>
              <Button type="submit">{modalMode === 'create' ? 'Salvar Modelo' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {modeloVeiculoToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o modelo de veículo <strong>{modeloVeiculoToDelete.marca} {modeloVeiculoToDelete.modelo} {modeloVeiculoToDelete.versao}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteModeloVeiculo} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Listagem: Fetch from public."ModelosVeiculo".
        - Cadastro: POST to public."ModelosVeiculo".
        - Edição: PUT/PATCH to public."ModelosVeiculo".
        - Exclusão: DELETE from public."ModelosVeiculo".
        - RLS or backend logic should handle constraints if ModelosVeiculo is linked to public."Veiculos".
      */}
    </div>
  );
}

    