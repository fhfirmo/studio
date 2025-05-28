
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Eye, Trash2, Download, Upload, AlertTriangle, Edit3, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

interface DocumentoSupabase {
  id_arquivo: string;
  nome_arquivo: string;
  tipo_documento: string | null;
  data_upload: string;
  tamanho_bytes: number;
  caminho_armazenamento: string;
  PessoasFisicas?: { nome_completo: string } | null;
  Entidades?: { nome: string } | null;
  Veiculos?: { placa_atual: string, marca?: string | null, modelo?: string | null } | null; // Updated to fetch marca and modelo directly
  Seguros?: { numero_apolice: string } | null;
}

interface DocumentoRow {
  id: string;
  titulo: string;
  tipo: string | null;
  dataUpload: string;
  tamanho: string;
  associadoA_nome: string | null;
  associadoA_tipo: 'Pessoa Física' | 'Organização' | 'Veículo' | 'Seguro' | 'Nenhum';
  storagePath: string;
}

export default function GerenciamentoDocumentosPage() {
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<{ id: string; titulo: string; storagePath: string } | null>(null);
  const { toast } = useToast();

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy HH:mm") : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchDocumentos = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setDocumentos([]); return;
    }
    setIsLoading(true);
    console.log(`GerenciamentoDocumentosPage: Iniciando busca com termo: "${searchTerm}"`);
    
    let query = supabase
      .from('Arquivos')
      .select(`
        id_arquivo,
        nome_arquivo,
        tipo_documento,
        data_upload,
        tamanho_bytes,
        caminho_armazenamento,
        PessoasFisicas ( nome_completo ),
        Entidades ( nome ),
        Veiculos ( placa_atual, marca, modelo ), /* Corrected: Fetch marca and modelo directly from Veiculos */
        Seguros ( numero_apolice )
      `)
      .order('data_upload', { ascending: false });

    if (searchTerm) {
      query = query.or(
        `nome_arquivo.ilike.%${searchTerm}%,` +
        `tipo_documento.ilike.%${searchTerm}%`
      );
      console.log("GerenciamentoDocumentosPage: Filtro OR aplicado para nome_arquivo e tipo_documento.");
    }

    const { data, error } = await query;

    if (error) {
      const errorMessage = error.message || `Erro desconhecido ao buscar documentos. Código: ${error.code || 'N/A'}. Detalhes no console.`;
      console.error("Erro ao buscar documentos - Detalhes Completos:", JSON.stringify(error, null, 2));
      console.error("Erro ao buscar documentos (objeto original):", error);
      toast({ title: "Erro ao Buscar Dados", description: errorMessage, variant: "destructive", duration: 10000 });
      setDocumentos([]);
    } else {
      console.log("GerenciamentoDocumentosPage: Dados recebidos do Supabase:", data);
      const formattedData: DocumentoRow[] = (data || []).map((doc: DocumentoSupabase) => {
        let associadoA_nome: string | null = null;
        let associadoA_tipo: DocumentoRow['associadoA_tipo'] = 'Nenhum';

        if (doc.PessoasFisicas) {
          associadoA_nome = doc.PessoasFisicas.nome_completo;
          associadoA_tipo = 'Pessoa Física';
        } else if (doc.Entidades) {
          associadoA_nome = doc.Entidades.nome;
          associadoA_tipo = 'Organização';
        } else if (doc.Veiculos) {
          associadoA_nome = `${doc.Veiculos.placa_atual || 'N/P'} (${doc.Veiculos.marca || ''} ${doc.Veiculos.modelo || ''})`.trim();
          associadoA_tipo = 'Veículo';
        } else if (doc.Seguros) {
          associadoA_nome = doc.Seguros.numero_apolice;
          associadoA_tipo = 'Seguro';
        }

        return {
          id: doc.id_arquivo,
          titulo: doc.nome_arquivo,
          tipo: doc.tipo_documento,
          dataUpload: formatDateForDisplay(doc.data_upload),
          tamanho: formatBytes(doc.tamanho_bytes || 0),
          associadoA_nome,
          associadoA_tipo,
          storagePath: doc.caminho_armazenamento,
        };
      });
      console.log("GerenciamentoDocumentosPage: Dados formatados:", formattedData);
      setDocumentos(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchDocumentos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchDocumentos(); 
  };

  const handleDeleteClick = (documento: DocumentoRow) => {
    setDocumentoToDelete({ id: documento.id, titulo: documento.titulo, storagePath: documento.storagePath });
    setIsAlertOpen(true);
  };

  const confirmDeleteDocumento = async () => {
    if (!documentoToDelete || !supabase) return;
    
    setIsLoading(true);
    try {
      console.log(`Attempting to delete from Storage: bucket 'documentos_bucket', path '${documentoToDelete.storagePath}'`);
      const { error: storageError } = await supabase.storage
        .from('documentos_bucket') 
        .remove([documentoToDelete.storagePath]);

      if (storageError) {
        console.error('Falha ao excluir arquivo do Storage:', JSON.stringify(storageError, null, 2));
        toast({ title: "Aviso: Erro no Storage", description: `Falha ao remover do armazenamento: ${storageError.message || 'Erro desconhecido'}. Tentando excluir registro do BD.`, variant: "destructive", duration: 7000 });
      } else {
        console.log("Arquivo excluído do Storage com sucesso:", documentoToDelete.storagePath);
      }

      console.log(`Attempting to delete from DB: table 'Arquivos', id '${documentoToDelete.id}'`);
      const { error: dbError } = await supabase
        .from('Arquivos')
        .delete()
        .eq('id_arquivo', documentoToDelete.id);

      if (dbError) {
        throw dbError; 
      }

      toast({ title: "Documento Excluído!", description: `O documento ${documentoToDelete.titulo} foi excluído com sucesso.` });
      fetchDocumentos(); 
    
    } catch (error: any) {
        const message = error.message || "Ocorreu um erro ao excluir o documento.";
        console.error('Falha ao excluir documento (geral):', JSON.stringify(error, null, 2), error);
        toast({ title: "Erro ao Excluir", description: message, variant: "destructive" });
    } finally {
        setIsLoading(false);
        setIsAlertOpen(false);
        setDocumentoToDelete(null);
    }
  };

  const handleDownload = async (documento: DocumentoRow) => {
    if (!supabase) return;
    console.log(`Attempting download: bucket 'documentos_bucket', path '${documento.storagePath}'`);
    try {
        const { data, error } = await supabase.storage
        .from('documentos_bucket') 
        .download(documento.storagePath);

        if (error) throw error;

        if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.titulo; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Download Iniciado", description: `Baixando ${documento.titulo}...` });
        }
    } catch (error: any) {
        console.error("Erro no download:", JSON.stringify(error, null, 2));
        toast({ title: "Erro no Download", description: error.message || "Não foi possível baixar o arquivo.", variant: "destructive" });
    }
  };

  const handleView = async (documento: DocumentoRow) => {
     if (!supabase) return;
     console.log(`Attempting view: bucket 'documentos_bucket', path '${documento.storagePath}'`);
     try {
        const { data } = supabase.storage
        .from('documentos_bucket') 
        .getPublicUrl(documento.storagePath);

        if (data?.publicUrl) {
            console.log("Public URL for view:", data.publicUrl);
            window.open(data.publicUrl, '_blank');
        } else {
            toast({ title: "Visualização Indisponível", description: "Preview não disponível para este arquivo ou URL pública não configurada. Tente o download.", variant: "default" });
        }
     } catch (error: any) {
        console.error("Erro ao obter URL pública:", JSON.stringify(error, null, 2));
        toast({ title: "Erro ao Visualizar", description: error.message || "Não foi possível obter o link para visualização.", variant: "destructive" });
     }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <FileText className="mr-3 h-8 w-8" /> Listagem de Documentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, gerencie e faça upload de documentos do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/documentos/novo"> 
              <Upload className="mr-2 h-5 w-5" /> Upload de Novo Documento
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Documentos</CardTitle>
          <CardDescription>Filtre documentos por título ou tipo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Título ou Tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Documentos Cadastrados</CardTitle>
          <CardDescription>
            Total de {documentos.length} documentos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Doc.</TableHead>
                  <TableHead className="hidden lg:table-cell">Upload</TableHead>
                  <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden md:table-cell">Associado a</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Associação</TableHead>
                  <TableHead className="text-right min-w-[280px] sm:min-w-[320px]">Ações</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24"><Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />Carregando...</TableCell></TableRow>
                ) : documentos.length > 0 ? (
                  documentos.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{documento.id.substring(0,8)}...</TableCell>
                      <TableCell className="font-semibold">{documento.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.tipo || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.dataUpload}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.tamanho}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.associadoA_nome || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            documento.associadoA_tipo === 'Nenhum' ? 'bg-muted text-muted-foreground' : 
                            documento.associadoA_tipo === 'Pessoa Física' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            documento.associadoA_tipo === 'Organização' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                            documento.associadoA_tipo === 'Veículo' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            documento.associadoA_tipo === 'Seguro' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                           {documento.associadoA_tipo}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(documento)} aria-label={`Visualizar documento ${documento.titulo}`}>
                          <Eye className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Visualizar</span>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar documento ${documento.titulo}`}>
                          <Link href={`/admin/documentos/${documento.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(documento)} aria-label={`Download do documento ${documento.titulo}`}>
                          <Download className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(documento)}
                          aria-label={`Excluir documento ${documento.titulo}`}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? `Nenhum documento encontrado para "${searchTerm}".` : "Nenhum documento cadastrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {documentoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={(open) => {if(!isLoading) setIsAlertOpen(open)}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Documento</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o documento <strong>{documentoToDelete.titulo}</strong> (ID: {documentoToDelete.id.substring(0,8)}...)? Esta ação é irreversível e o arquivo será removido do armazenamento e do banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setDocumentoToDelete(null); }} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDocumento} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
// Supabase Integration Notes:
// - Fetch from public."Arquivos" table.
// - JOINs needed for associated entities to display "Associado a" column:
//   - public."PessoasFisicas" ON Arquivos.id_pessoa_fisica_associada = PessoasFisicas.id_pessoa_fisica
//   - public."Entidades" ON Arquivos.id_entidade_associada = Entidades.id_entidade
//   - public."Veiculos" ON Arquivos.id_veiculo = Veiculos.id_veiculo (now needs 'marca' and 'modelo' directly from Veiculos)
//   - public."Seguros" ON Arquivos.id_seguro = Seguros.id_seguro
// - Search: Backend search should be implemented on 'nome_arquivo', 'tipo_documento'. Searching on related entity names requires more complex queries or a dedicated search view/function.
// - View/Download: Use Supabase Storage methods to get public URLs or download files. Storage bucket name is 'documentos_bucket'.
// - Delete: Must delete from Supabase Storage AND from the 'Arquivos' database table.
// - RLS: Ensure user has appropriate SELECT permissions on Arquivos and related tables, and DELETE permissions on Arquivos and Storage.

```

The `select` query within `fetchDocumentos` has been changed:
From: `Veiculos ( placa_atual, ModelosVeiculo ( nome_modelo ) ),`
To: `Veiculos ( placa_atual, marca, modelo ),`

And the corresponding data mapping for `associadoA_nome` when the document is linked to a vehicle has been updated to:
`associadoA_nome = `${doc.Veiculos.placa_atual || 'N/P'} (${doc.Veiculos.marca || ''} ${doc.Veiculos.modelo || ''})`.trim();`

The `DocumentoSupabase` interface's `Veiculos` property type has also been updated to reflect that `marca` and `modelo` are now direct string properties.
This aligns the query with your current `Veiculos` table structure, which has `marca` and `modelo` as direct columns.You're right, the "Gerenciamento de Coberturas" page (`/admin/configuracoes/coberturas`) is still using placeholder data. I'll integrate it with Supabase now.

Here's how I'll update `src/app/admin/configuracoes/coberturas/page.tsx`:
1.  **State Management**:
    *   `coberturas` state initialized as `[]`.
    *   `isLoading` and `isFetching` states.
2.  **Data Fetching (`fetchCoberturas`)**:
    *   Queries `public."Coberturas"` table, selecting `id_cobertura`, `nome_cobertura`, `descricao_cobertura`.
    *   Applies search filter on `nome_cobertura` or `descricao_cobertura`.
3.  **CRUD Operations**:
    *   `handleSaveCobertura`: `INSERT` or `UPDATE` `public."Coberturas"`.
    *   `confirmDeleteCobertura`: `DELETE` from `public."Coberturas"`.
4.  **UI**:
    *   Table displays actual data.
    *   Modal form fields: "Nome da Cobertura" (required) and "Descrição da Cobertura" (textarea, optional).

Here's the updated file:

```xml
<changes>
  <description>Integrate Supabase CRUD for Coberturas de Seguro page, replacing placeholder data.</description>
  <change>
    <file>/src/app/admin/configuracoes/coberturas/page.tsx</file>
    <content><![CDATA[
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
