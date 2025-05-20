
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileEdit, Save, XCircle, AlertTriangle, Link2, User, Building, Car, ShieldCheck, FileText } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast";

const documentTypes = [
  { value: "contrato", label: "Contrato" },
  { value: "laudo", label: "Laudo" },
  { value: "apolice", label: "Apólice" },
  { value: "proposta", label: "Proposta Comercial" },
  { value: "termo", label: "Termo (Confidencialidade, etc.)" },
  { value: "documento_pessoal", label: "Documento Pessoal (RG, CNH, etc.)" },
  { value: "comprovante", label: "Comprovante (Residência, Pagamento, etc.)" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

const placeholderPessoasFisicas = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99" },
];

const placeholderOrganizacoes = [
  { id: "org_001", nome: "Cooperativa Alfa", cnpj: "11.222.333/0001-44" },
  { id: "org_002", nome: "Associação Beta", cnpj: "22.333.444/0001-55" },
];

const placeholderVeiculos = [
  { id: "vei_001", description: "Fiat Uno - ABC-1234" },
  { id: "vei_002", description: "VW Gol - DEF-5678" },
];

const placeholderSeguros = [
  { id: "seg_001", description: "Apólice APOLICE-2024-001 (Fiat Uno - ABC-1234)"},
  { id: "seg_002", description: "Apólice APOLICE-2024-002 (VW Gol - DEF-5678)"},
];

type TipoAssociacao = "nenhum" | "pessoa_fisica" | "organizacao" | "veiculo" | "seguro";

interface DocumentoData {
  id: string;
  titulo: string;
  tipoDocumento: string;
  observacoes?: string;
  // Association fields - only one should be non-null
  id_pessoa_fisica_associada?: string | null;
  id_entidade_associada?: string | null;
  id_veiculo_associada?: string | null;
  id_seguro_associada?: string | null;
  // Placeholder for other fields like nome_arquivo, data_upload etc.
  nome_arquivo_original?: string;
  data_upload?: string;
}

// Placeholder function to fetch document data
async function getDocumentoById(docId: string): Promise<DocumentoData | null> {
  console.log(`Fetching documento data for ID: ${docId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  // Supabase: Fetch from public.Arquivos where id = docId
  if (docId === "doc_001") {
    return {
      id: "doc_001",
      titulo: "Contrato Cliente Alfa Atualizado",
      tipoDocumento: "contrato",
      id_pessoa_fisica_associada: "pf_001",
      nome_arquivo_original: "contrato_alfa_v2.pdf",
      data_upload: "2025-07-05",
      observacoes: "Versão final do contrato."
    };
  }
   if (docId === "doc_002") {
    return {
      id: "doc_002",
      titulo: "Laudo Veículo XYZ Detalhado",
      tipoDocumento: "laudo",
      id_veiculo_associada: "vei_001",
      nome_arquivo_original: "laudo_vei_001_det.pdf",
      data_upload: "2025-07-10",
    };
  }
  // Add more cases as needed or a default for testing
  return null;
}


export default function EditarDocumentoPage() {
  const router = useRouter();
  const params = useParams();
  const documentoId = params.id as string;
  // const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [docFound, setDocFound] = useState<boolean | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [originalUploadDate, setOriginalUploadDate] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipoDocumento: '',
    observacoes: '',
    tipoAssociacao: 'nenhum' as TipoAssociacao,
    idAssociado: '',
  });

  useEffect(() => {
    if (documentoId) {
      setIsLoading(true);
      getDocumentoById(documentoId)
        .then(data => {
          if (data) {
            setFormData({
              titulo: data.titulo,
              tipoDocumento: data.tipoDocumento,
              observacoes: data.observacoes || '',
              tipoAssociacao: 
                data.id_pessoa_fisica_associada ? 'pessoa_fisica' :
                data.id_entidade_associada ? 'organizacao' :
                data.id_veiculo_associada ? 'veiculo' :
                data.id_seguro_associada ? 'seguro' : 'nenhum',
              idAssociado: 
                data.id_pessoa_fisica_associada ||
                data.id_entidade_associada ||
                data.id_veiculo_associada ||
                data.id_seguro_associada || '',
            });
            setOriginalFileName(data.nome_arquivo_original || 'Nome não disponível');
            setOriginalUploadDate(data.data_upload ? new Date(data.data_upload).toLocaleDateString('pt-BR') : 'Data não disponível');
            setDocFound(true);
          } else {
            setDocFound(false);
            // toast({ title: "Erro", description: "Documento não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch documento data:", err);
          setDocFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados do documento.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [documentoId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
     if (name === 'tipoAssociacao') {
      setFormData(prev => ({ ...prev, tipoAssociacao: value as TipoAssociacao, idAssociado: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formData.titulo || !formData.tipoDocumento) {
      // toast({ title: "Campos Obrigatórios", description: "Título e Tipo são obrigatórios.", variant: "destructive" });
      console.error("Validação: Título e Tipo são obrigatórios.");
      setIsLoading(false);
      return;
    }
     if (formData.tipoAssociacao !== 'nenhum' && !formData.idAssociado) {
      // toast({ title: "Campo Obrigatório", description: "Selecione a entidade a ser associada.", variant: "destructive" });
      console.error("Validação: Selecione a entidade a ser associada se um tipo de associação foi escolhido.");
      setIsLoading(false);
      return;
    }

    const updatePayload = {
      titulo: formData.titulo,
      tipo_documento: formData.tipoDocumento, // ensure this matches DB column name
      observacoes: formData.observacoes,
      id_pessoa_fisica_associada: formData.tipoAssociacao === 'pessoa_fisica' ? formData.idAssociado : null,
      id_entidade_associada: formData.tipoAssociacao === 'organizacao' ? formData.idAssociado : null,
      id_veiculo_associada: formData.tipoAssociacao === 'veiculo' ? formData.idAssociado : null,
      id_seguro_associada: formData.tipoAssociacao === 'seguro' ? formData.idAssociado : null,
      // Supabase: This request would be a PATCH/PUT to public.Arquivos WHERE id = documentoId
    };
    console.log('Form data to be submitted for update (Documento):', updatePayload);

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated document metadata update finished');
    // toast({ title: "Documento Atualizado! (Simulado)", description: "Os metadados do documento foram salvos." });
    setIsLoading(false);
    router.push('/admin/documentos'); 
  };

  if (isLoading && docFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados do documento...</div>;
  }

  if (docFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Documento não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O documento com o ID "{documentoId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/documentos">Voltar para Lista de Documentos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <FileEdit className="mr-3 h-8 w-8" /> Editar Documento
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/documentos">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
         {originalFileName && (
          <p className="text-sm text-muted-foreground mt-1">
            Editando metadados para: <strong>{originalFileName}</strong> (Upload em: {originalUploadDate})
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Atualize o título, tipo e observações do documento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Documento <span className="text-destructive">*</span></Label>
                <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo do Documento <span className="text-destructive">*</span></Label>
                <Select name="tipoDocumento" value={formData.tipoDocumento} onValueChange={(value) => handleSelectChange('tipoDocumento', value)} required>
                  <SelectTrigger id="tipoDocumento"><FileText className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(docType => <SelectItem key={docType.value} value={docType.value}>{docType.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleInputChange} placeholder="Adicione observações relevantes..." />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Link2 className="mr-2 h-5 w-5" /> Associar Documento a</CardTitle>
            <CardDescription>Altere ou defina a entidade à qual este documento está vinculado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipoAssociacao">Tipo de Entidade</Label>
              <Select name="tipoAssociacao" value={formData.tipoAssociacao} onValueChange={(value) => handleSelectChange('tipoAssociacao', value as TipoAssociacao)}>
                <SelectTrigger id="tipoAssociacao"><SelectValue placeholder="Selecione um tipo para associar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                  <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                  <SelectItem value="veiculo"><Car className="mr-2 h-4 w-4 inline-block" /> Veículo</SelectItem>
                  <SelectItem value="seguro"><ShieldCheck className="mr-2 h-4 w-4 inline-block" /> Seguro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipoAssociacao !== 'nenhum' && (
              <div className="space-y-2">
                <Label htmlFor="idAssociado">Selecionar {
                  formData.tipoAssociacao === 'pessoa_fisica' ? 'Pessoa Física' :
                  formData.tipoAssociacao === 'organizacao' ? 'Organização' :
                  formData.tipoAssociacao === 'veiculo' ? 'Veículo' :
                  formData.tipoAssociacao === 'seguro' ? 'Seguro' : 'Entidade'
                } <span className="text-destructive">*</span></Label>
                 {/* Supabase: Options for these selects should be loaded dynamically from their respective tables. */}
                <Select name="idAssociado" value={formData.idAssociado} onValueChange={(value) => handleSelectChange('idAssociado', value)} required={formData.tipoAssociacao !== 'nenhum'}>
                  <SelectTrigger id="idAssociado"><SelectValue placeholder="Selecione a entidade específica" /></SelectTrigger>
                  <SelectContent>
                    {formData.tipoAssociacao === 'pessoa_fisica' && placeholderPessoasFisicas.map(pf => <SelectItem key={pf.id} value={pf.id}>{pf.nomeCompleto} ({pf.cpf})</SelectItem>)}
                    {formData.tipoAssociacao === 'organizacao' && placeholderOrganizacoes.map(org => <SelectItem key={org.id} value={org.id}>{org.nome} ({org.cnpj})</SelectItem>)}
                    {formData.tipoAssociacao === 'veiculo' && placeholderVeiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.description}</SelectItem>)}
                    {formData.tipoAssociacao === 'seguro' && placeholderSeguros.map(s => <SelectItem key={s.id} value={s.id}>{s.description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
        
        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/documentos')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || docFound === false}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

// Supabase Integration Notes:
// - On page load (useEffect with documentoId):
//   - Fetch document metadata from public.Arquivos where id = documentoId.
//   - This fetch should include id_pessoa_fisica_associada, id_entidade_associada, id_veiculo_associada, id_seguro_associada.
//   - Pre-fill formData.titulo, formData.tipoDocumento, formData.observacoes.
//   - Determine formData.tipoAssociacao based on which of the _associada fields is non-null.
//   - Set formData.idAssociado to the value of that non-null _associada field.
//   - Fetch options for PessoasFisicas, Organizacoes, Veiculos, Seguros dynamically for the association selects.
// - On submit (handleSubmit):
//   - Send a PUT/PATCH request to public.Arquivos for the current documentoId.
//   - Update: titulo, tipo_documento, observacoes.
//   - Association IDs: Based on formData.tipoAssociacao and formData.idAssociado, set the corresponding _associada field and NULLIFY the others.
//     Example: if tipoAssociacao is 'pessoa_fisica', set id_pessoa_fisica_associada = formData.idAssociado, and set
//              id_entidade_associada = NULL, id_veiculo_associada = NULL, id_seguro_associada = NULL.
// - The actual file in Supabase Storage is NOT re-uploaded or changed on this screen. Only metadata and associations.

    