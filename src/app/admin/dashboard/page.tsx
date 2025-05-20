
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, Car, ShieldCheck, FileText, AlertTriangle, BarChart3, PieChart, Activity } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment if you use toasts

interface DashboardStats {
  totalOrganizacoes: number;
  totalPessoasFisicas: number;
  totalVeiculos: number;
  totalApolicesAtivas: number;
  totalDocumentos: number;
  cnhsProximasVencimento: number;
  segurosProximosVencimento: number;
}

const initialStats: DashboardStats = {
  totalOrganizacoes: 0,
  totalPessoasFisicas: 0,
  totalVeiculos: 0,
  totalApolicesAtivas: 0,
  totalDocumentos: 0,
  cnhsProximasVencimento: 0,
  segurosProximosVencimento: 0,
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  // const { toast } = useToast();

  useEffect(() => {
    // Placeholder for fetching dashboard data from Supabase
    // This would involve multiple queries:
    // 1. SELECT count(*) FROM public."Entidades";
    // 2. SELECT count(*) FROM public."PessoasFisicas";
    // 3. SELECT count(*) FROM public."Veiculos";
    // 4. SELECT count(*) FROM public."Seguros" WHERE data_vigencia_fim >= now();
    // 5. SELECT count(*) FROM public."Arquivos";
    // 6. SELECT count(*) FROM public."CNHs" WHERE data_validade BETWEEN now() AND now() + interval '30 days'; (or configurable interval)
    // 7. SELECT count(*) FROM public."Seguros" WHERE data_vigencia_fim BETWEEN now() AND now() + interval '30 days'; (or configurable interval)
    
    // For charts:
    // - Tipos de Organização: SELECT TiposEntidade.nome_tipo, count(Entidades.id_entidade) FROM public."Entidades" JOIN public."TiposEntidade" ON Entidades.id_tipo_entidade = TiposEntidade.id_tipo_entidade GROUP BY TiposEntidade.nome_tipo;
    // - Veículos por Combustível: SELECT combustivel, count(*) FROM public."Veiculos" GROUP BY combustivel;
    // - Seguros por Seguradora: SELECT Seguradoras.nome_seguradora, count(Seguros.id_seguro) FROM public."Seguros" JOIN public."Seguradoras" ON Seguros.id_seguradora = Seguradoras.id_seguradora GROUP BY Seguradoras.nome_seguradora;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      console.log("Fetching dashboard data (placeholder)...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Simulate fetched data
      setStats({
        totalOrganizacoes: 15,
        totalPessoasFisicas: 123,
        totalVeiculos: 78,
        totalApolicesAtivas: 65,
        totalDocumentos: 250,
        cnhsProximasVencimento: 7,
        segurosProximosVencimento: 12,
      });
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, description, isLoadingCard }: { title: string; value: string | number; icon: React.ElementType; description: string; isLoadingCard?: boolean }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoadingCard ? (
          <div className="h-9 w-16 bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className="text-3xl font-bold text-primary">{value}</div>
        )}
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );

  const ChartPlaceholderCard = ({ title, chartType }: { title: string; chartType: 'Pizza' | 'Barra' }) => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center">
          {chartType === 'Pizza' ? <PieChart className="mr-2 h-5 w-5 text-primary" /> : <BarChart3 className="mr-2 h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-64 bg-muted/30 rounded-b-md">
        <p className="text-muted-foreground">Gráfico de {chartType.toLowerCase()} será exibido aqui.</p>
        {/* Placeholder for actual chart component, e.g., <RechartsComponent data={...} /> */}
      </CardContent>
    </Card>
  );


  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Activity className="mr-3 h-8 w-8" /> Painel de Controle
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos dados e atividades do sistema.
        </p>
      </header>

      {/* Cards de Resumo */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 md:mb-12">
        <StatCard title="Total de Organizações" value={stats.totalOrganizacoes} icon={Building2} description="Organizações cadastradas" isLoadingCard={isLoading} />
        <StatCard title="Total de Pessoas Físicas" value={stats.totalPessoasFisicas} icon={Users} description="Clientes e contatos" isLoadingCard={isLoading} />
        <StatCard title="Total de Veículos" value={stats.totalVeiculos} icon={Car} description="Veículos registrados" isLoadingCard={isLoading} />
        <StatCard title="Apólices de Seguro Ativas" value={stats.totalApolicesAtivas} icon={ShieldCheck} description="Seguros com vigência ativa" isLoadingCard={isLoading} />
        <StatCard title="Total de Documentos" value={stats.totalDocumentos} icon={FileText} description="Documentos armazenados" isLoadingCard={isLoading} />
        <StatCard title="CNHs Próximas do Vencimento" value={stats.cnhsProximasVencimento} icon={AlertTriangle} description="Nos próximos 30 dias" isLoadingCard={isLoading} />
        <StatCard title="Seguros Próximos do Vencimento" value={stats.segurosProximosVencimento} icon={AlertTriangle} description="Nos próximos 30 dias" isLoadingCard={isLoading} />
      </section>

      {/* Área de Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
        <div className="lg:col-span-1">
          <ChartPlaceholderCard title="Tipos de Organização" chartType="Pizza" />
        </div>
        <div className="lg:col-span-1">
          <ChartPlaceholderCard title="Veículos por Combustível" chartType="Barra" />
        </div>
        <div className="lg:col-span-1">
          <ChartPlaceholderCard title="Seguros por Seguradora" chartType="Pizza" />
        </div>
      </section>
      
      {/* 
        Supabase Integration Comments:
        - All data for the summary cards needs to be fetched via Supabase API calls.
          - Total counts: Use `select('id', { count: 'exact' })` on respective tables.
          - Apólices Ativas: Filter `Seguros` where `data_vigencia_fim >= now()`.
          - CNHs/Seguros Próximos do Vencimento: Filter `CNHs.data_validade` or `Seguros.data_vigencia_fim` within a date range (e.g., now() to now() + 30 days).
        - Data for charts will require aggregation queries (e.g., COUNT with GROUP BY).
          - Tipos de Organização: `Entidades` JOIN `TiposEntidade`, GROUP BY `TiposEntidade.nome_tipo`.
          - Veículos por Combustível: `Veiculos`, GROUP BY `combustivel`.
          - Seguros por Seguradora: `Seguros` JOIN `Seguradoras`, GROUP BY `Seguradoras.nome_seguradora`.
        - Use a charting library like Recharts, Chart.js, or ApexCharts for data visualization.
      */}
    </div>
  );
}
