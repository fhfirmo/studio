
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Eye, Trash2, Download, Upload, AlertTriangle, Edit3, Link2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

interface Documento {
  id: string;
  titulo: string;
  tipo: string; // This is 'tipo_documento' from Arquivos table
  dataUpload: string;
  tamanho: string;
  associadoA_nome: string | null; // Name of the associated entity
  associadoA_tipo: 'Pessoa Física' | 'Organização' | 'Veículo' | 'Seguro' | 'Nenhum'; // Type of association
}

// Updated placeholder data
const initialDocumentos: Documento[] = [
  { id: "doc_001", titulo: "Contrato João", tipo: "Contrato", dataUpload: "2024-01-01", tamanho: "500 KB", associadoA_nome: "João da Silva Sauro", associadoA_tipo: "Pessoa Física" },
  { id: "doc_002", titulo: "Apólice ABC-1234", tipo: "Apólice", dataUpload: "2024-01-05", tamanho: "1.2 MB", associadoA_nome: "ABC-1234 (Onix)", associadoA_tipo: "Veículo" },
  { id: "doc_003", titulo: "CNPJ Cooperativa", tipo: "CNPJ", dataUpload: "2024-01-10", tamanho: "300 KB", associadoA_nome: "Cooperativa Alfa", associadoA_tipo: "Organização" },
  { id: "doc_004", titulo: "Proposta Seguro X", tipo: "Proposta", dataUpload: "2024-01-15", tamanho: "800 KB", associadoA_nome: "Apólice 98765", associadoA_tipo: "Seguro" },
  { id: "doc_005", titulo: "Manual do Sistema", tipo: "Manual", dataUpload: "2024-01-20", tamanho: "2.5 MB", associadoA_nome: null, associadoA_tipo: "Nenhum" },
];


export default function GerenciamentoDocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>(initialDocumentos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<{ id: string; titulo: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, documentos would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchDocumentos() {
  //     // const { data, error } = await supabase.from('Arquivos')
  //     // .select(`
  //     //   id, titulo, tipo_documento, data_upload, tamanho_bytes,
  //     //   PessoasFisicas ( nome_completo ),
  //     //   Entidades ( nome_fantasia ),
  //     //   Veiculos ( placa, ModelosVeiculo ( nome_modelo ) ),
  //     //   Seguros ( numero_apolice )
  //     // `); 
  //     // if (error) { /* handle error */ }
  //     // else { 
  //     //   const formattedData = data.map(doc => {
  //     //     let associadoA_nome = null;
  //     //     let associadoA_tipo = 'Nenhum';
  //     //     if (doc.PessoasFisicas) {
  //     //       associadoA_nome = doc.PessoasFisicas.nome_completo;
  //     //       associadoA_tipo = 'Pessoa Física';
  //     //     } else if (doc.Entidades) {
  //     //       associadoA_nome = doc.Entidades.nome_fantasia;
  //     //       associadoA_tipo = 'Organização';
  //     //     } else if (doc.Veiculos) {
  //     //       associadoA_nome = `${doc.Veiculos.placa} (${doc.Veiculos.ModelosVeiculo?.nome_modelo || 'Modelo Desc.'})`;
  //     //       associadoA_tipo = 'Veículo';
  //     //     } else if (doc.Seguros) {
  //     //       associadoA_nome = doc.Seguros.numero_apolice;
  //     //       associadoA_tipo = 'Seguro';
  //     //     }
  //     //     return {
  //     //       id: doc.id,
  //     //       titulo: doc.titulo,
  //     //       tipo: doc.tipo_documento, // map from db
  //     //       dataUpload: doc.data_upload,
  //     //       tamanho: doc.tamanho_bytes ? (doc.tamanho_bytes / 1024).toFixed(2) + ' KB' : 'N/A',
  //     //       associadoA_nome,
  //     //       associadoA_tipo,
  //     //     };
  //     //   });
  //     //   setDocumentos(formattedData || []); 
  //     // }
  //   }
  //   fetchDocumentos();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for documento: ${searchTerm} (placeholder - Supabase query needed for 'Arquivos' table)`);
    // const filteredDocumentos = initialDocumentos.filter(doc => 
    //   doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   (doc.associadoA_nome && doc.associadoA_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    // );
    // setDocumentos(filteredDocumentos);
    // if (filteredDocumentos.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontrados documentos para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (documento: Documento) => {
    setDocumentoToDelete({ id: documento.id, titulo: documento.titulo });
    setIsAlertOpen(true);
  };

  const confirmDeleteDocumento = async () => {
    if (!documentoToDelete) return;
    
    console.log(`Attempting to delete documento ID: ${documentoToDelete.id}, Titulo: ${documentoToDelete.titulo}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    setDocumentos(prevDocumentos => prevDocumentos.filter(d => d.id !== documentoToDelete!.id));
    console.log(`Documento ${documentoToDelete.titulo} (ID: ${documentoToDelete.id}) deleted (simulated).`);
    // toast({ title: "Documento Excluído! (Simulado)", description: `O documento ${documentoToDelete.titulo} foi excluído.` });
    setIsAlertOpen(false);
    setDocumentoToDelete(null);
  };

  const handleDownload = (documento: Documento) => {
    console.log(`Downloading documento: ${documento.titulo} (ID: ${documento.id})`);
    // toast({ title: "Download Iniciado (Simulado)", description: `O download de ${documento.titulo} começaria agora.`});
  }

  const handleView = (documento: Documento) => {
    console.log(`Viewing documento: ${documento.titulo} (ID: ${documento.id})`);
    // toast({ title: "Visualizando Documento (Simulado)", description: `Abrindo ${documento.titulo} em nova aba...`});
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch(e) {
      return "Data Inválida";
    }
  }

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
          <CardDescription>Filtre documentos por título, tipo ou entidade associada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Digite para pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Buscar
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
                  <TableHead className="text-right w-[320px]">Ações</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.length > 0 ? (
                  documentos.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{documento.id}</TableCell>
                      <TableCell className="font-semibold">{documento.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.tipo}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(documento.dataUpload)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.tamanho}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.associadoA_nome || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            documento.associadoA_tipo === 'Nenhum' ? 'bg-muted text-muted-foreground' : 
                            documento.associadoA_tipo === 'Pessoa Física' ? 'bg-blue-100 text-blue-700' :
                            documento.associadoA_tipo === 'Organização' ? 'bg-purple-100 text-purple-700' :
                            documento.associadoA_tipo === 'Veículo' ? 'bg-green-100 text-green-700' :
                            documento.associadoA_tipo === 'Seguro' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
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
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground"> {/* Updated colSpan */}
                      Nenhum documento cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {documentoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Documento</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o documento <strong>{documentoToDelete.titulo}</strong> (ID: {documentoToDelete.id})? Esta ação é irreversível e o arquivo será removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setDocumentoToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDocumento} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Document list will be fetched from 'public.Arquivos'.
        - To populate 'Associado a' and 'Tipo de Associação':
          - The query to 'public.Arquivos' will need to conditionally JOIN with:
            - 'public.PessoasFisicas' on 'Arquivos.id_pessoa_fisica_associada' = 'PessoasFisicas.id' (to get nome_completo).
            - 'public.Entidades' on 'Arquivos.id_entidade_associada' = 'Entidades.id' (to get nome_fantasia).
            - 'public.Veiculos' on 'Arquivos.id_veiculo' = 'Veiculos.id' (to get placa and potentially model via another join to ModelosVeiculo).
            - 'public.Seguros' on 'Arquivos.id_seguro' = 'Seguros.id' (to get numero_apolice).
          - The frontend logic will then determine which association is active and display the corresponding name and type.
        - Search functionality will query the metadata in 'public.Arquivos' and potentially the names in the associated tables.
        - "Upload de Novo Documento" button links to '/admin/documentos/novo'.
        - "Visualizar" button: Will obtain a public or signed URL from Supabase Storage.
        - "Editar" button links to '/admin/documentos/[id]/editar'.
        - "Download" button: Will obtain a download URL from Supabase Storage.
        - "Excluir" button will trigger API calls to delete the file from Storage and its metadata from 'Arquivos'.
      */}
    </div>
  );
}

    
