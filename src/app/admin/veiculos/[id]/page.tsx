
"use client"; 

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label as InfoItemLabel } from "@/components/ui/label"; 
import { Car, Edit3, Trash2, AlertTriangle, Info, Gauge, Palette, Fingerprint, FileText, CalendarDays, Users, Shield, DollarSign } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface VehicleDetails {
  id: string;
  placa_atual: string;
  placa_anterior: string | null;
  chassi: string;
  tipo_especie: string | null;
  combustivel: string | null;
  marca: string;
  modelo: string;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  cor: string | null;
  codigo_renavam: string;
  estado_crlv: string | null;
  numero_serie_crlv: string | null;
  data_expedicao_crlv: string | null;
  data_validade_crlv: string | null;
  proprietario_nome: string | null;
  proprietario_tipo: 'Pessoa Física' | 'Organização' | 'N/A';
  proprietario_link: string | null;
  data_aquisicao: string | null;
  codigo_fipe: string | null;
  valor_fipe: number | null;
  data_consulta_fipe: string | null;
  mes_referencia_fipe: string | null;
  observacao: string | null;
  motoristas_vinculados: {
    id_veiculo_motorista: string;
    nome_motorista: string;
    cpf_motorista: string;
    numero_cnh: string;
    categoria_cnh_veiculo: string;
    validade_cnh: string;
  }[];
}

async function getVehicleDetailsFromDB(vehicleId: string): Promise<VehicleDetails | null> {
  if (!supabase || !vehicleId) return null;
  const numericId = parseInt(vehicleId, 10);
  if (isNaN(numericId)) return null;

  const { data, error } = await supabase
    .from('Veiculos')
    .select(`
      *,
      PessoasFisicas!Veiculos_id_proprietario_pessoa_fisica_fkey (id_pessoa_fisica, nome_completo),
      Entidades!Veiculos_id_proprietario_entidade_fkey (id_entidade, nome),
      VeiculoMotoristas (
        id_veiculo_motorista,
        categoria_cnh,
        PessoasFisicas!inner (id_pessoa_fisica, nome_completo, cpf),
        CNHs!inner (numero_registro, data_validade)
      )
    `)
    .eq('id_veiculo', numericId)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhes do veículo:", JSON.stringify(error, null, 2));
    return null;
  }
  if (!data) return null;

  let proprietario_nome: string | null = null;
  let proprietario_tipo: VehicleDetails['proprietario_tipo'] = 'N/A';
  let proprietario_link: string | null = null;

  if (data.PessoasFisicas) {
    proprietario_nome = data.PessoasFisicas.nome_completo;
    proprietario_tipo = 'Pessoa Física';
    proprietario_link = `/cliente/${data.id_proprietario_pessoa_fisica}`;
  } else if (data.Entidades) {
    proprietario_nome = data.Entidades.nome;
    proprietario_tipo = 'Organização';
    proprietario_link = `/admin/organizacoes/${data.id_proprietario_entidade}`;
  }

  return {
    id: data.id_veiculo.toString(),
    placa_atual: data.placa_atual,
    placa_anterior: data.placa_anterior,
    chassi: data.chassi,
    tipo_especie: data.tipo_especie,
    combustivel: data.combustivel,
    marca: data.marca,
    modelo: data.modelo,
    ano_fabricacao: data.ano_fabricacao,
    ano_modelo: data.ano_modelo,
    cor: data.cor,
    codigo_renavam: data.codigo_renavam,
    estado_crlv: data.estado_crlv,
    numero_serie_crlv: data.numero_serie_crlv,
    data_expedicao_crlv: data.data_expedicao_crlv,
    data_validade_crlv: data.data_validade_crlv,
    proprietario_nome,
    proprietario_tipo,
    proprietario_link,
    data_aquisicao: data.data_aquisicao,
    codigo_fipe: data.codigo_fipe,
    valor_fipe: data.valor_fipe,
    data_consulta_fipe: data.data_consulta_fipe,
    mes_referencia_fipe: data.mes_referencia_fipe,
    observacao: data.observacao,
    motoristas_vinculados: (data.VeiculoMotoristas || []).map((vm: any) => ({
        id_veiculo_motorista: vm.id_veiculo_motorista.toString(),
        nome_motorista: vm.PessoasFisicas.nome_completo,
        cpf_motorista: vm.PessoasFisicas.cpf,
        numero_cnh: vm.CNHs.numero_registro,
        categoria_cnh_veiculo: vm.categoria_cnh,
        validade_cnh: vm.CNHs.data_validade
    }))
  };
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      setIsLoading(true);
      getVehicleDetailsFromDB(vehicleId)
        .then(data => {
          setVehicle(data);
          if (!data) {
            toast({ title: "Erro", description: "Veículo não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Falha ao carregar detalhes do veículo:", err);
          toast({ title: "Erro de Carregamento", description: "Não foi possível carregar os dados.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [vehicleId, toast]);

  const formatDate = (dateString: string | null | undefined, outputFormat = "dd/MM/yyyy") => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, outputFormat) : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDeleteVehicle = async () => {
    if (!vehicle || !supabase) return;
    setIsLoading(true);
    try {
      const { error: motoristasError } = await supabase
        .from('VeiculoMotoristas')
        .delete()
        .eq('id_veiculo', parseInt(vehicle.id));
      if (motoristasError) throw motoristasError;

      const { error: veiculoError } = await supabase
        .from('Veiculos')
        .delete()
        .eq('id_veiculo', parseInt(vehicle.id));
      if (veiculoError) throw veiculoError;
      
      toast({title: "Veículo Excluído", description: `Veículo ${vehicle.placa_atual} excluído.`});
      router.push('/admin/veiculos');
    } catch (error: any) {
      toast({title: "Erro ao Excluir", description: error.message, variant: "destructive"});
      setIsLoading(false); 
    }
  };

  if (isLoading) return <div className="container mx-auto px-4 py-12 text-center">Carregando...</div>;
  if (!vehicle) return <div className="container mx-auto px-4 py-12 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Veículo não encontrado</h1><Button asChild className="mt-6"><Link href="/admin/veiculos">Voltar</Link></Button></div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Car className="mr-3 h-8 w-8" /> Detalhes: {vehicle.marca} {vehicle.modelo} - {vehicle.placa_atual}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              <InfoItem label="Placa Atual" value={vehicle.placa_atual} />
              <InfoItem label="Chassi" value={vehicle.chassi} />
              <InfoItem label="Marca" value={vehicle.marca} />
              <InfoItem label="Modelo" value={vehicle.modelo} />
              <InfoItem label="Ano Fabricação" value={vehicle.ano_fabricacao?.toString()} />
              <InfoItem label="Ano Modelo" value={vehicle.ano_modelo?.toString()} />
              <InfoItem label="Cor" value={vehicle.cor} />
              <InfoItem label="Tipo/Espécie" value={vehicle.tipo_especie} />
              <InfoItem label="Combustível" value={vehicle.combustivel} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> Dados do CRLV</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              <InfoItem label="Código Renavam" value={vehicle.codigo_renavam} />
              <InfoItem label="Nº Série CRLV" value={vehicle.numero_serie_crlv} />
              <InfoItem label="Data Expedição CRLV" value={formatDate(vehicle.data_expedicao_crlv)} icon={CalendarDays}/>
              <InfoItem label="Data Validade CRLV" value={formatDate(vehicle.data_validade_crlv)} icon={CalendarDays}/>
              <InfoItem label="Estado CRLV" value={vehicle.estado_crlv} />
              <InfoItem label="Placa Anterior" value={vehicle.placa_anterior} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><User className="mr-2 h-5 w-5 text-primary" /> Proprietário</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome" value={vehicle.proprietario_link ? <Link href={vehicle.proprietario_link} className="text-primary hover:underline">{vehicle.proprietario_nome}</Link> : vehicle.proprietario_nome} />
              <InfoItem label="Tipo" value={vehicle.proprietario_tipo} />
              <InfoItem label="Data Aquisição" value={formatDate(vehicle.data_aquisicao)} icon={CalendarDays}/>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><DollarSign className="mr-2 h-5 w-5 text-primary" /> Dados de Mercado (FIPE)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                <InfoItem label="Código FIPE" value={vehicle.codigo_fipe} />
                <InfoItem label="Valor Tabela FIPE" value={formatCurrency(vehicle.valor_fipe)} />
                <InfoItem label="Mês Referência FIPE" value={vehicle.mes_referencia_fipe} />
                <InfoItem label="Data Consulta FIPE" value={formatDate(vehicle.data_consulta_fipe)} icon={CalendarDays}/>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary"/> Motoristas Vinculados</CardTitle></CardHeader>
            <CardContent>
              {vehicle.motoristas_vinculados && vehicle.motoristas_vinculados.length > 0 ? (
                <div className="overflow-x-auto max-h-80 border rounded-md">
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome Motorista</TableHead><TableHead className="hidden sm:table-cell">CPF</TableHead><TableHead>Nº CNH</TableHead><TableHead>Cat. Veículo</TableHead><TableHead className="hidden md:table-cell">Validade CNH</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {vehicle.motoristas_vinculados.map(m => (
                        <TableRow key={m.id_veiculo_motorista}>
                          <TableCell className="font-medium">{m.nome_motorista}</TableCell>
                          <TableCell className="hidden sm:table-cell">{m.cpf_motorista}</TableCell>
                          <TableCell>{m.numero_cnh}</TableCell>
                          <TableCell>{m.categoria_cnh_veiculo}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(m.validade_cnh)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum motorista vinculado a este veículo.</p>)}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> Observação</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{vehicle.observacao || "Nenhuma observação."}</p></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Ações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild><Link href={`/admin/veiculos/${vehicle.id}/editar`}><Edit3 className="mr-2 h-4 w-4" /> Editar Veículo</Link></Button>
              <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogTrigger asChild><Button className="w-full" variant="destructive" disabled={isLoading}><Trash2 className="mr-2 h-4 w-4" /> Excluir Veículo</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir o veículo {vehicle.placa_atual}? Motoristas vinculados também serão desvinculados.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteVehicle} disabled={isLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">{isLoading ? "Excluindo..." : "Confirmar"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter><Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto"><Link href="/admin/veiculos">&larr; Voltar</Link></Button></CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '' && value !== "N/A")) return null;
  
  const displayValue = (typeof value === 'string' && value.trim() === '')
    ? <span className="italic text-muted-foreground">sem informação</span>
    : value;

  return (
    <div className={cn("mb-3", className)}>
      <InfoItemLabel className="text-sm font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-primary/80" />}
        {label}
      </InfoItemLabel>
      <div className="text-foreground mt-0.5">{typeof displayValue === 'string' ? <p>{displayValue}</p> : displayValue}</div>
    </div>
  );
};
/* Supabase Integration Notes:
- Fetch Veiculo by ID.
- JOIN PessoasFisicas (proprietario) or Entidades (proprietario).
- JOIN VeiculoMotoristas, then PessoasFisicas (motorista) and CNHs for each motorista.
- Delete Veiculo: Ensure VeiculoMotoristas are handled (CASCADE or explicit delete).
*/

    
