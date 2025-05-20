
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Settings, ShieldHalf } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

interface Cobertura {
  id: string;
  nome_cobertura: string;
  descricao_cobertura: string;
}

const initialCoberturas: Cobertura[] = [
  { id: "cob_001", nome_cobertura: "Colisão, Incêndio e Roubo", descricao_cobertura: "Cobertura compreensiva para o veículo segurado." },
  { id: "cob_002", nome_cobertura: "Danos a Terceiros (RCF-V)", descricao_cobertura: "Cobertura para danos materiais e corporais causados a terceiros." },
  { id: "cob_003", nome_cobertura: "Cobertura para Vidros", descricao_cobertura: "Reparo ou troca de vidros, faróis, lanternas e retrovisores." },
  { id: "cob_004", nome_cobertura: "Carro Reserva", descricao_cobertura: "Disponibilização de carro reserva por X dias." },
];

export default function GerenciarCoberturasPage() {
  // const { toast } = useToast();
  const [coberturas, setCoberturas] = useState<Cobertura[]>(initialCoberturas);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCoberturas, setFilteredCoberturas] = useState<Cobertura[]>(initialCoberturas);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentCobertura, setCurrentCobertura] = useState<Cobertura | null>(null);
  const [formData, setFormData] = useState({ nome_cobertura: '', descricao_cobertura: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [coberturaToDelete, setCoberturaToDelete] = useState<Cobertura | null>(null);

  useEffect(() => {
    // Supabase: Fetch initial data for Coberturas
    // async function fetchCoberturas() {
    //   // const { data, error } = await supabase.from('Coberturas').select('*').order('nome_cobertura');
    //   // if (error) { /* toast error */ } else { setCoberturas(data || []); setFilteredCoberturas(data || []); }
    // }
    // fetchCoberturas();
    setFilteredCoberturas(
      coberturas.filter(item =>
        item.nome_cobertura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao_cobertura.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, coberturas]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setFormData({ nome_cobertura: item.nome_cobertura, descricao_cobertura: item.descricao_cobertura });
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
    if (!formData.nome_cobertura.trim()) {
      // toast({ title: "Erro de Validação", description: "Nome da Cobertura é obrigatório.", variant: "destructive" });
      console.error("Validação: Nome da Cobertura é obrigatório.");
      return;
    }

    if (modalMode === 'create') {
      // Supabase: Insert new Cobertura
      // const { data, error } = await supabase.from('Coberturas').insert([{ ...formData }]).select();
      // if (error) { /* handle error */ } else { setCoberturas(prev => [...prev, data[0]].sort(...)); /* toast success */ }
      const newId = `cob_new_${Date.now()}`;
      setCoberturas(prev => [...prev, { id: newId, ...formData }].sort((a,b) => a.nome_cobertura.localeCompare(b.nome_cobertura)));
      console.log("Simulando criação de Cobertura:", { ...formData });
    } else if (modalMode === 'edit' && currentCobertura) {
      // Supabase: Update existing Cobertura
      // const { data, error } = await supabase.from('Coberturas').update({ ...formData }).eq('id', currentCobertura.id).select();
      // if (error) { /* handle error */ } else { setCoberturas(prev => prev.map(c => c.id === currentCobertura.id ? data[0] : c).sort(...)); /* toast success */ }
      setCoberturas(prev => prev.map(c => c.id === currentCobertura.id ? { ...c, ...formData } : c).sort((a,b) => a.nome_cobertura.localeCompare(b.nome_cobertura)));
      console.log("Simulando atualização de Cobertura:", { id: currentCobertura.id, ...formData });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (item: Cobertura) => {
    setCoberturaToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteCobertura = async () => {
    if (!coberturaToDelete) return;
    // Supabase: Delete Cobertura
    // const { error } = await supabase.from('Coberturas').delete().eq('id', coberturaToDelete.id);
    // if (error) { /* handle error, consider FK constraints with SeguroCoberturas table */ } else { setCoberturas(prev => prev.filter(c => c.id !== coberturaToDelete.id)); /* toast success */ }
    setCoberturas(prev => prev.filter(c => c.id !== coberturaToDelete!.id));
    console.log("Simulando exclusão de Cobertura:", coberturaToDelete);
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
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Cobertura
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Coberturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Pesquisar por nome ou descrição da cobertura..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Coberturas de Seguro Cadastradas</CardTitle>
          <CardDescription>Total de {filteredCoberturas.length} coberturas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {filteredCoberturas.length > 0 ? (
                  filteredCoberturas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_cobertura}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{item.descricao_cobertura}</TableCell>
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
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhuma cobertura encontrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Cobertura' : 'Editar Cobertura'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados da nova cobertura.' : `Editando a cobertura: ${currentCobertura?.nome_cobertura || ''}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCobertura} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_cobertura">Nome da Cobertura <span className="text-destructive">*</span></Label>
              <Input id="nome_cobertura" name="nome_cobertura" value={formData.nome_cobertura} onChange={handleFormChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao_cobertura">Descrição da Cobertura</Label>
              <Textarea id="descricao_cobertura" name="descricao_cobertura" value={formData.descricao_cobertura} onChange={handleFormChange} rows={3} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button></DialogClose>
              <Button type="submit">{modalMode === 'create' ? 'Salvar Cobertura' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {coberturaToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a cobertura <strong>{coberturaToDelete.nome_cobertura}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCobertura} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Listagem: Fetch from public."Coberturas".
        - Cadastro: POST to public."Coberturas".
        - Edição: PUT/PATCH to public."Coberturas".
        - Exclusão: DELETE from public."Coberturas".
        - RLS or backend logic should handle constraints if Coberturas is linked to public."SeguroCoberturas".
      */}
    </div>
  );
}

    