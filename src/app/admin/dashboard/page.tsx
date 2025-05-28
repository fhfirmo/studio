
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, Car, ShieldCheck, FileText, AlertTriangle, BarChart3, PieChart, Activity, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast"; // Added for error feedback

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!supabase) {
        toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      console.log("Dashboard: Fetching dashboard data from Supabase...");

      try {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const thirtyDaysFromNowISO = thirtyDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD

        const [
          organizacoesRes,
          pessoasFisicasRes,
          veiculosRes,
          apolicesAtivasRes,
          documentosRes,
          cnhsVencendoRes,
          segurosVencendoRes,
        ] = await Promise.all([
          supabase.from('Entidades').select('*', { count: 'exact', head: true }),
          supabase.from('PessoasFisicas').select('*', { count: 'exact', head: true }),
          supabase.from('Veiculos').select('*', { count: 'exact', head: true }),
          supabase.from('Seguros').select('*', { count: 'exact', head: true }).gte('vigencia_fim', todayISO),
          supabase.from('Arquivos').select('*', { count: 'exact', head: true }),
          supabase.from('CNHs').select('*', { count: 'exact', head: true }).gte('data_validade', todayISO).lte('data_validade', thirtyDaysFromNowISO),
          supabase.from('Seguros').select('*', { count: 'exact', head: true }).gte('vigencia_fim', todayISO).lte('vigencia_fim', thirtyDaysFromNowISO),
        ]);
        
        // Log individual responses for debugging
        console.log("Organizacoes count response:", organizacoesRes);
        console.log("Pessoas Fisicas count response:", pessoasFisicasRes);
        // ... and so on for other responses

        setStats({
          totalOrganizacoes: organizacoesRes.count ?? 0,
          totalPessoasFisicas: pessoasFisicasRes.count ?? 0,
          totalVeiculos: veiculosRes.count ?? 0,
          totalApolicesAtivas: apolicesAtivasRes.count ?? 0,
          totalDocumentos: documentosRes.count ?? 0,
          cnhsProximasVencimento: cnhsVencendoRes.count ?? 0,
          segurosProximosVencimento: segurosVencendoRes.count ?? 0,
        });

        // Check for errors in individual calls (Supabase count query returns error in the error property)
        const errors = [
            organizacoesRes.error, pessoasFisicasRes.error, veiculosRes.error, 
            apolicesAtivasRes.error, documentosRes.error, cnhsVencendoRes.error, segurosVencendoRes.error
        ].filter(Boolean);

        if (errors.length > 0) {
            errors.forEach(err => console.error("Dashboard data fetch error:", err));
            toast({ title: "Erro ao Carregar Alguns Dados", description: "Algumas estatísticas do dashboard podem não ter sido carregadas. Verifique o console.", variant: "default" });
        }

      } catch (error: any) {
        console.error("Dashboard: General error fetching dashboard data:", error);
        toast({ title: "Erro ao Carregar Dashboard", description: error.message || "Não foi possível carregar os dados do painel.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]); // Added toast to dependency array

  const StatCard = ({ title, value, icon: Icon, description, isLoadingCard }: { title: string; value: string | number; icon: React.ElementType; description: string; isLoadingCard?: boolean }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoadingCard ? (
          <div className="h-9 w-16 bg-muted animate-pulse rounded-md flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary/50 animate-spin" />
          </div>
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
         {/* Placeholder for a new summary card if needed */}
        <Card className="shadow-lg bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Breve</CardTitle>
             <BarChart3 className="h-5 w-5 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground/70">-</div>
            <p className="text-xs text-muted-foreground pt-1">Novas métricas e atalhos</p>
          </CardContent>
        </Card>
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
        - All data for the summary cards is now fetched using Supabase client.
          - Total counts: Uses `select('*', { count: 'exact', head: true })`.
          - Apólices Ativas: Filters `Seguros` where `vigencia_fim >= now()`.
          - CNHs/Seguros Próximos do Vencimento: Filters `CNHs.data_validade` or `Seguros.vigencia_fim` within a date range (now() to now() + 30 days).
        - Data for charts will require aggregation queries (e.g., COUNT with GROUP BY) and are currently placeholders.
          - Tipos de Organização: `Entidades` JOIN `TiposEntidade`, GROUP BY `TiposEntidade.nome_tipo`.
          - Veículos por Combustível: `Veiculos`, GROUP BY `combustivel`.
          - Seguros por Seguradora: `Seguros` JOIN `Seguradoras`, GROUP BY `Seguradoras.nome_seguradora`.
        - Use a charting library like Recharts (already installed), Chart.js, or ApexCharts for data visualization when ready.
      */}
    </div>
  );
}

    