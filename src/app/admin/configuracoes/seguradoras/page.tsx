
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Settings, Library } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

interface Seguradora {
  id: string;
  nome_seguradora: string;
}

const initialSeguradoras: Seguradora[] = [
  { id: "seg_001", nome_seguradora: "Porto Seguro" },
  { id: "seg_002", nome_seguradora: "Azul Seguros" },
  { id: "seg_003", nome_seguradora: "Tokio Marine Seguradora" },
  { id: "seg_004", nome_seguradora: "Bradesco Seguros" },
  { id: "seg_005", nome_seguradora: "Allianz Seguros" },
];

export default function GerenciarSeguradorasPage() {
  // const { toast } = useToast();
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>(initialSeguradoras);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSeguradoras, setFilteredSeguradoras] = useState<Seguradora[]>(initialSeguradoras);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentSeguradora, setCurrentSeguradora] = useState<Seguradora | null>(null);
  const [formData, setFormData] = useState({ nome_seguradora: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [seguradoraToDelete, setSeguradoraToDelete] = useState<Seguradora | null>(null);

  useEffect(() => {
    // Supabase: Fetch initial data for Seguradoras
    // async function fetchSeguradoras() {
    //   // const { data, error } = await supabase.from('Seguradoras').select('*').order('nome_seguradora');
    //   // if (error) { /* toast error */ } else { setSeguradoras(data || []); setFilteredSeguradoras(data || []); }
    // }
    // fetchSeguradoras();
    setFilteredSeguradoras(
      seguradoras.filter(item =>
        item.nome_seguradora.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, seguradoras]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveSeguradora = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.nome_seguradora.trim()) {
      // toast({ title: "Erro de Validação", description: "Nome da Seguradora é obrigatório.", variant: "destructive" });
      console.error("Validação: Nome da Seguradora é obrigatório.");
      return;
    }

    if (modalMode === 'create') {
      // Supabase: Insert new Seguradora
      // const { data, error } = await supabase.from('Seguradoras').insert([{ ...formData }]).select();
      // if (error) { /* handle error */ } else { setSeguradoras(prev => [...prev, data[0]].sort(...)); /* toast success */ }
      const newId = `seg_new_${Date.now()}`;
      setSeguradoras(prev => [...prev, { id: newId, ...formData }].sort((a,b) => a.nome_seguradora.localeCompare(b.nome_seguradora)));
      console.log("Simulando criação de Seguradora:", { ...formData });
    } else if (modalMode === 'edit' && currentSeguradora) {
      // Supabase: Update existing Seguradora
      // const { data, error } = await supabase.from('Seguradoras').update({ ...formData }).eq('id', currentSeguradora.id).select();
      // if (error) { /* handle error */ } else { setSeguradoras(prev => prev.map(s => s.id === currentSeguradora.id ? data[0] : s).sort(...)); /* toast success */ }
      setSeguradoras(prev => prev.map(s => s.id === currentSeguradora.id ? { ...s, ...formData } : s).sort((a,b) => a.nome_seguradora.localeCompare(b.nome_seguradora)));
      console.log("Simulando atualização de Seguradora:", { id: currentSeguradora.id, ...formData });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (item: Seguradora) => {
    setSeguradoraToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteSeguradora = async () => {
    if (!seguradoraToDelete) return;
    // Supabase: Delete Seguradora
    // const { error } = await supabase.from('Seguradoras').delete().eq('id', seguradoraToDelete.id);
    // if (error) { /* handle error, consider FK constraints */ } else { setSeguradoras(prev => prev.filter(s => s.id !== seguradoraToDelete.id)); /* toast success */ }
    setSeguradoras(prev => prev.filter(s => s.id !== seguradoraToDelete!.id));
    console.log("Simulando exclusão de Seguradora:", seguradoraToDelete);
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
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Seguradora
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Seguradoras</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Pesquisar por nome da seguradora..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seguradoras Cadastradas</CardTitle>
          <CardDescription>Total de {filteredSeguradoras.length} seguradoras no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome da Seguradora</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeguradoras.length > 0 ? (
                  filteredSeguradoras.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_seguradora}</TableCell>
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
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Nenhuma seguradora encontrada.</TableCell>
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
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Seguradora' : 'Editar Seguradora'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha o nome da nova seguradora.' : `Editando a seguradora: ${currentSeguradora?.nome_seguradora}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSeguradora} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_seguradora">Nome da Seguradora <span className="text-destructive">*</span></Label>
              <Input id="nome_seguradora" name="nome_seguradora" value={formData.nome_seguradora} onChange={handleFormChange} required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button></DialogClose>
              <Button type="submit">{modalMode === 'create' ? 'Salvar Seguradora' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {seguradoraToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a seguradora <strong>{seguradoraToDelete.nome_seguradora}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSeguradora} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Listagem: Fetch from public."Seguradoras".
        - Cadastro: POST to public."Seguradoras".
        - Edição: PUT/PATCH to public."Seguradoras".
        - Exclusão: DELETE from public."Seguradoras".
        - RLS or backend logic should handle constraints if Seguradoras is linked to public."Seguros".
      */}
    </div>
  );
}
