
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Settings, CheckSquare } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

interface Assistencia {
  id: string;
  nome_assistencia: string;
  descricao_assistencia: string;
}

const initialAssistencias: Assistencia[] = [
  { id: "ass_001", nome_assistencia: "Assistência 24h - Guincho", descricao_assistencia: "Serviço de guincho disponível 24 horas por dia." },
  { id: "ass_002", nome_assistencia: "Chaveiro", descricao_assistencia: "Serviço de chaveiro para perda de chaves ou trancamento." },
  { id: "ass_003", nome_assistencia: "Carro Reserva", descricao_assistencia: "Disponibilização de carro reserva em caso de sinistro." },
  { id: "ass_004", nome_assistencia: "Assistência Residencial Básica", descricao_assistencia: "Serviços emergenciais para residência (encanador, eletricista)." },
];

export default function GerenciarAssistenciasPage() {
  // const { toast } = useToast();
  const [assistencias, setAssistencias] = useState<Assistencia[]>(initialAssistencias);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssistencias, setFilteredAssistencias] = useState<Assistencia[]>(initialAssistencias);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentAssistencia, setCurrentAssistencia] = useState<Assistencia | null>(null);
  const [formData, setFormData] = useState({ nome_assistencia: '', descricao_assistencia: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [assistenciaToDelete, setAssistenciaToDelete] = useState<Assistencia | null>(null);

  useEffect(() => {
    // Supabase: Fetch initial data for Assistencias
    // async function fetchAssistencias() {
    //   // const { data, error } = await supabase.from('Assistencias').select('*').order('nome_assistencia');
    //   // if (error) { /* toast error */ } else { setAssistencias(data || []); setFilteredAssistencias(data || []); }
    // }
    // fetchAssistencias();
    setFilteredAssistencias(
      assistencias.filter(item =>
        item.nome_assistencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao_assistencia.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, assistencias]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setCurrentAssistencia(null);
    setFormData({ nome_assistencia: '', descricao_assistencia: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Assistencia) => {
    setModalMode('edit');
    setCurrentAssistencia(item);
    setFormData({ nome_assistencia: item.nome_assistencia, descricao_assistencia: item.descricao_assistencia });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAssistencia(null);
    setFormData({ nome_assistencia: '', descricao_assistencia: '' });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSaveAssistencia = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.nome_assistencia.trim()) {
      // toast({ title: "Erro de Validação", description: "Nome da Assistência é obrigatório.", variant: "destructive" });
      console.error("Validação: Nome da Assistência é obrigatório.");
      return;
    }

    if (modalMode === 'create') {
      // Supabase: Insert new Assistencia
      // const { data, error } = await supabase.from('Assistencias').insert([{ ...formData }]).select();
      // if (error) { /* handle error */ } else { setAssistencias(prev => [...prev, data[0]].sort(...)); /* toast success */ }
      const newId = `ass_new_${Date.now()}`;
      setAssistencias(prev => [...prev, { id: newId, ...formData }].sort((a,b) => a.nome_assistencia.localeCompare(b.nome_assistencia)));
      console.log("Simulando criação de Assistência:", { ...formData });
    } else if (modalMode === 'edit' && currentAssistencia) {
      // Supabase: Update existing Assistencia
      // const { data, error } = await supabase.from('Assistencias').update({ ...formData }).eq('id', currentAssistencia.id).select();
      // if (error) { /* handle error */ } else { setAssistencias(prev => prev.map(a => a.id === currentAssistencia.id ? data[0] : a).sort(...)); /* toast success */ }
      setAssistencias(prev => prev.map(a => a.id === currentAssistencia.id ? { ...a, ...formData } : a).sort((a,b) => a.nome_assistencia.localeCompare(b.nome_assistencia)));
      console.log("Simulando atualização de Assistência:", { id: currentAssistencia.id, ...formData });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (item: Assistencia) => {
    setAssistenciaToDelete(item);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteAssistencia = async () => {
    if (!assistenciaToDelete) return;
    // Supabase: Delete Assistencia
    // const { error } = await supabase.from('Assistencias').delete().eq('id', assistenciaToDelete.id);
    // if (error) { /* handle error, consider FK constraints with SeguroAssistencias table */ } else { setAssistencias(prev => prev.filter(a => a.id !== assistenciaToDelete.id)); /* toast success */ }
    setAssistencias(prev => prev.filter(a => a.id !== assistenciaToDelete!.id));
    console.log("Simulando exclusão de Assistência:", assistenciaToDelete);
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
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Assistência
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Assistências</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Pesquisar por nome ou descrição da assistência..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Assistências de Seguro Cadastradas</CardTitle>
          <CardDescription>Total de {filteredAssistencias.length} assistências no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome da Assistência</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssistencias.length > 0 ? (
                  filteredAssistencias.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{item.id}</TableCell>
                      <TableCell>{item.nome_assistencia}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{item.descricao_assistencia}</TableCell>
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
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhuma assistência encontrada.</TableCell>
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
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Nova Assistência' : 'Editar Assistência'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha os dados da nova assistência.' : `Editando a assistência: ${currentAssistencia?.nome_assistencia}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAssistencia} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_assistencia">Nome da Assistência <span className="text-destructive">*</span></Label>
              <Input id="nome_assistencia" name="nome_assistencia" value={formData.nome_assistencia} onChange={handleFormChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao_assistencia">Descrição da Assistência</Label>
              <Textarea id="descricao_assistencia" name="descricao_assistencia" value={formData.descricao_assistencia} onChange={handleFormChange} rows={3} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button></DialogClose>
              <Button type="submit">{modalMode === 'create' ? 'Salvar Assistência' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assistenciaToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center"><AlertTriangle className="h-6 w-6 text-destructive mr-2" /><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a assistência <strong>{assistenciaToDelete.nome_assistencia}</strong>? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAssistencia} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Supabase Integration Notes:
        - Listagem: Fetch from public."Assistencias".
        - Cadastro: POST to public."Assistencias".
        - Edição: PUT/PATCH to public."Assistencias".
        - Exclusão: DELETE from public."Assistencias".
        - RLS or backend logic should handle constraints if Assistencias is linked to public."SeguroAssistencias".
      */}
    </div>
  );
}
