
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
import { PlusCircle, Edit3, Trash2, Search, AlertTriangle, Settings } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment if using toasts

interface TipoEntidade {
  id: string; // Assuming IDs are strings like 'tipo_001' or numbers
  nome_tipo: string;
}

const initialTiposEntidade: TipoEntidade[] = [
  { id: "tipo_001", nome_tipo: "Instituição" },
  { id: "tipo_002", nome_tipo: "Federação" },
  { id: "tipo_003", nome_tipo: "Cooperativa Principal" },
  { id: "tipo_004", nome_tipo: "Associação Principal" },
  { id: "tipo_005", nome_tipo: "Empresa Privada" },
  { id: "tipo_006", nome_tipo: "Outro" },
];

export default function GerenciarTiposEntidadePage() {
  // const { toast } = useToast(); // Uncomment if using toasts
  const [tiposEntidade, setTiposEntidade] = useState<TipoEntidade[]>(initialTiposEntidade);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTipos, setFilteredTipos] = useState<TipoEntidade[]>(initialTiposEntidade);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTipoEntidade, setCurrentTipoEntidade] = useState<TipoEntidade | null>(null);
  const [formData, setFormData] = useState({ nome_tipo: '' });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [tipoEntidadeToDelete, setTipoEntidadeToDelete] = useState<TipoEntidade | null>(null);

  useEffect(() => {
    // Supabase: Fetch initial data for TiposEntidade
    // async function fetchTipos() {
    //   // const { data, error } = await supabase.from('TiposEntidade').select('*').order('nome_tipo');
    //   // if (error) {
    //   //   toast({ title: "Erro ao carregar tipos", description: error.message, variant: "destructive" });
    //   // } else {
    //   //   setTiposEntidade(data || []);
    //   //   setFilteredTipos(data || []);
    //   // }
    // }
    // fetchTipos();
    setFilteredTipos(
      tiposEntidade.filter(tipo =>
        tipo.nome_tipo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, tiposEntidade]);

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
    if (!formData.nome_tipo.trim()) {
      // toast({ title: "Erro de Validação", description: "O nome do tipo não pode ser vazio.", variant: "destructive" });
      console.error("Validação: Nome do tipo é obrigatório.");
      return;
    }

    if (modalMode === 'create') {
      // Supabase: Insert new TipoEntidade
      // const { data, error } = await supabase.from('TiposEntidade').insert([{ nome_tipo: formData.nome_tipo }]).select();
      // if (error) { /* handle error, toast */ }
      // else {
      //   setTiposEntidade(prev => [...prev, data[0]].sort((a, b) => a.nome_tipo.localeCompare(b.nome_tipo)));
      //   toast({ title: "Sucesso!", description: "Novo tipo de entidade cadastrado." });
      // }
      const newId = `tipo_new_${Date.now()}`; // Placeholder ID
      setTiposEntidade(prev => [...prev, { id: newId, nome_tipo: formData.nome_tipo }].sort((a,b) => a.nome_tipo.localeCompare(b.nome_tipo)));
      console.log("Simulando criação:", { nome_tipo: formData.nome_tipo });

    } else if (modalMode === 'edit' && currentTipoEntidade) {
      // Supabase: Update existing TipoEntidade
      // const { data, error } = await supabase.from('TiposEntidade').update({ nome_tipo: formData.nome_tipo }).eq('id', currentTipoEntidade.id).select();
      // if (error) { /* handle error, toast */ }
      // else {
      //   setTiposEntidade(prev => prev.map(t => t.id === currentTipoEntidade.id ? data[0] : t).sort((a,b) => a.nome_tipo.localeCompare(b.nome_tipo)));
      //   toast({ title: "Sucesso!", description: "Tipo de entidade atualizado." });
      // }
      setTiposEntidade(prev => prev.map(t => t.id === currentTipoEntidade.id ? { ...t, nome_tipo: formData.nome_tipo } : t).sort((a,b) => a.nome_tipo.localeCompare(b.nome_tipo)));
      console.log("Simulando atualização:", { id: currentTipoEntidade.id, nome_tipo: formData.nome_tipo });
    }
    handleCloseModal();
  };

  const handleDeleteClick = (tipo: TipoEntidade) => {
    setTipoEntidadeToDelete(tipo);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteEntityType = async () => {
    if (!tipoEntidadeToDelete) return;
    // Supabase: Delete TipoEntidade
    // const { error } = await supabase.from('TiposEntidade').delete().eq('id', tipoEntidadeToDelete.id);
    // if (error) { /* handle error, toast. Consider FK constraints */ }
    // else {
    //   setTiposEntidade(prev => prev.filter(t => t.id !== tipoEntidadeToDelete.id));
    //   toast({ title: "Sucesso!", description: `Tipo de entidade "${tipoEntidadeToDelete.nome_tipo}" excluído.` });
    // }
    setTiposEntidade(prev => prev.filter(t => t.id !== tipoEntidadeToDelete!.id));
    console.log("Simulando exclusão:", tipoEntidadeToDelete);
    setIsDeleteAlertOpen(false);
    setTipoEntidadeToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Settings className="mr-3 h-8 w-8" /> Gerenciamento de Tipos de Entidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova os tipos de organização disponíveis no sistema.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Tipo
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Tipos de Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Pesquisar por nome do tipo..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tipos de Entidade Cadastrados</CardTitle>
          <CardDescription>
            Total de {filteredTipos.length} tipos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome do Tipo</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTipos.length > 0 ? (
                  filteredTipos.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{tipo.id}</TableCell>
                      <TableCell>{tipo.nome_tipo}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(tipo)}>
                          <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(tipo)}>
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      Nenhum tipo de entidade encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Cadastrar Novo Tipo de Entidade' : 'Editar Tipo de Entidade'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Preencha o nome para o novo tipo de entidade.' : `Editando o tipo: ${currentTipoEntidade?.nome_tipo}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEntityType} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome_tipo" className="text-right">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome_tipo"
                name="nome_tipo"
                value={formData.nome_tipo}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
              </DialogClose>
              <Button type="submit">{modalMode === 'create' ? 'Salvar Tipo' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      {tipoEntidadeToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o tipo de entidade <strong>{tipoEntidadeToDelete.nome_tipo}</strong>? Esta ação é irreversível e pode afetar as Organizações associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEntityType} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 
        Supabase Integration Notes:
        - Listagem: Fetch from public."TiposEntidade", implement server-side search if possible or filter client-side.
        - Cadastro: POST to public."TiposEntidade" with nome_tipo.
        - Edição: 
          - Fetch the specific TipoEntidade by ID to pre-fill the form.
          - PUT/PATCH to public."TiposEntidade" with the updated nome_tipo.
        - Exclusão: DELETE from public."TiposEntidade" by ID.
          - RLS or backend logic should handle constraints if TiposEntidade is linked to public."Entidades" (e.g., prevent deletion if in use, or cascade deletion if appropriate).
        - After each successful operation, re-fetch or update the local state to refresh the list.
      */}
    </div>
  );
}

