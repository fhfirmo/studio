
"use client";

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Though not explicitly asked for document content, it's common for descriptions
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Save, XCircle, FileText } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback messages
// import { Progress } from "@/components/ui/progress"; // Uncomment for progress bar

const documentTypes = [
  { value: "contrato", label: "Contrato" },
  { value: "laudo", label: "Laudo" },
  { value: "apolice", label: "Apólice" },
  { value: "proposta", label: "Proposta Comercial" },
  { value: "termo", label: "Termo (Confidencialidade, etc.)" },
  { value: "outro", label: "Outro" },
];

export default function NovoDocumentoPage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [uploadProgress, setUploadProgress] = useState(0); // For progress bar

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    // observacoes: '', // Optional: if you want a description field
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // Reset title to file name if not already set, or suggest it
      if (!formData.titulo) {
        setFormData(prev => ({ ...prev, titulo: event.target.files![0].name }));
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !formData.titulo || !formData.tipo) {
      // toast({ title: "Campos Obrigatórios", description: "Por favor, selecione um arquivo, forneça um título e escolha um tipo.", variant: "destructive" });
      console.error("Validação: Arquivo, Título e Tipo são obrigatórios.");
      return;
    }
    setIsLoading(true);
    // setUploadProgress(0);

    console.log('Form data to be submitted:', {
      file: selectedFile,
      title: formData.titulo,
      type: formData.tipo,
      // observacoes: formData.observacoes,
    });

    // Placeholder for Supabase Storage upload and Database metadata insertion
    // try {
    //   // 1. Upload file to Supabase Storage
    //   // const filePath = `public/${selectedFile.name}`; // Define a path strategy
    //   // const { data: uploadData, error: uploadError } = await supabase.storage
    //   //   .from('documentos_bucket') // Replace with your bucket name
    //   //   .upload(filePath, selectedFile, {
    //   //     cacheControl: '3600',
    //   //     upsert: false, // Set to true to overwrite if file exists
    //   //     onUploadProgress: (progress) => {
    //   //       const percentage = Math.round((progress.loaded / progress.total) * 100);
    //   //       setUploadProgress(percentage);
    //   //     },
    //   //   });
    //   // if (uploadError) throw uploadError;

    //   // 2. If upload successful, save metadata to 'documentos_metadata' table
    //   // const documentMetadata = {
    //   //   titulo: formData.titulo,
    //   //   tipo: formData.tipo,
    //   //   storage_path: uploadData.path, // Path returned from storage upload
    //   //   tamanho_bytes: selectedFile.size,
    //   //   mime_type: selectedFile.type,
    //   //   data_upload: new Date().toISOString(),
    //   //   // observacoes: formData.observacoes,
    //   // };
    //   // const { data: dbData, error: dbError } = await supabase
    //   //   .from('documentos_metadata') // Replace with your metadata table name
    //   //   .insert([documentMetadata])
    //   //   .select();
    //   // if (dbError) throw dbError;

    //   // console.log('Document uploaded and metadata saved successfully:', dbData);
    //   // toast({ title: "Documento Enviado!", description: "O documento foi salvo com sucesso." });
    //   // router.push('/admin/documentos');
    // } catch (error: any) {
    //   // console.error('Failed to upload document:', error.message);
    //   // toast({ title: "Erro ao Enviar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Simulated document upload finished');
    // toast({ title: "Documento Enviado! (Simulado)", description: "O documento foi salvo com sucesso." });
    setIsLoading(false);
    router.push('/admin/documentos'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UploadCloud className="mr-3 h-8 w-8" /> Upload de Novo Documento
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/documentos">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista de Documentos
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Selecione um arquivo e forneça os detalhes para adicioná-lo ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Detalhes do arquivo a ser enviado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Documento <span className="text-destructive">*</span></Label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ex: Contrato de Serviço XPTO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo do Documento <span className="text-destructive">*</span></Label>
                <Select name="tipo" value={formData.tipo} onValueChange={(value) => handleSelectChange('tipo', value)} required>
                  <SelectTrigger id="tipo" aria-label="Selecionar tipo do documento">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(docType => (
                      <SelectItem key={docType.value} value={docType.value}>{docType.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional: File description field */}
            {/* <div className="space-y-2">
              <Label htmlFor="observacoes">Descrição/Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                placeholder="Descreva brevemente o documento ou adicione observações..."
                rows={3}
              />
            </div> */}
            
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Arquivo <span className="text-destructive">*</span></Label>
              {/* Basic file input. For drag-and-drop, a more complex component would be needed. */}
              <Input
                id="fileUpload"
                name="fileUpload"
                type="file"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary/10 file:text-primary
                  hover:file:bg-primary/20"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Placeholder for Upload Progress */}
            {isLoading && (
              <div className="space-y-2">
                <Label>Progresso do Upload</Label>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary transition-all duration-300 ease-linear" 
                    // style={{ width: `${uploadProgress}%`}} // Uncomment if using Progress component or similar logic
                    // For now, a simple loading animation
                    style={{ width: `50%`}} // Replace with actual progress
                   ></div>
                </div>
                {/* <Progress value={uploadProgress} className="w-full" /> */}
                <p className="text-sm text-primary text-center">Enviando arquivo...</p>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/documentos')} disabled={isLoading}>
              <XCircle className="mr-2 h-5 w-5" /> Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              <UploadCloud className="mr-2 h-5 w-5" /> {isLoading ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      {/* 
        Supabase Integration Notes:
        - On submit:
          1. Upload selectedFile to Supabase Storage (e.g., to a 'documentos_bucket').
             - Monitor upload progress for the progress bar.
          2. On successful upload, get the file path/URL from Supabase Storage.
          3. Save document metadata (formData.titulo, formData.tipo, storage_path, file_size, mime_type, upload_date)
             to a Supabase database table (e.g., 'documentos_metadata').
        - Handle errors for both Storage upload and database insertion.
        - Consider implementing drag-and-drop functionality for a better UX.
      */}
    </div>
  );
}

    