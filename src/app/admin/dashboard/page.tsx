
// src/app/admin/dashboard/page.tsx
// This page will display dynamic data fetched from Supabase in a real application.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChartBig, ListChecks, Settings } from "lucide-react";

// Placeholder data - In a real app, this would come from Supabase
const dashboardData = {
  totalClients: 0,
  newRegistrationsMonthly: 0,
  lastRegistrations: [
    { id: 1, name: "Cliente Alfa", date: "2024-07-28" },
    { id: 2, name: "Cliente Beta", date: "2024-07-27" },
    { id: 3, name: "Cliente Gama", date: "2024-07-26" },
    { id: 4, name: "Cliente Delta", date: "2024-07-25" },
    { id: 5, name: "Cliente Epsilon", date: "2024-07-24" },
  ],
};

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Painel Administrativo INBM
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral e insights do seu negócio.
        </p>
      </header>

      {/* Data Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 md:mb-12">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {dashboardData.totalClients}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Clientes ativos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Novos Registros (Mês Atual)
            </CardTitle>
            <BarChartBig className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {dashboardData.newRegistrationsMonthly}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Registros desde o início do mês
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Engajamento (Exemplo)
            </CardTitle>
            <Settings className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              75%
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Métrica de exemplo
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Last Registrations Section */}
      <section className="mb-8 md:mb-12">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ListChecks className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-semibold text-foreground">Últimos Cadastros</CardTitle>
            </div>
            <CardDescription>
              Visualização rápida dos clientes mais recentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.lastRegistrations.length > 0 ? (
              <ul className="divide-y divide-border">
                {dashboardData.lastRegistrations.map((client) => (
                  <li key={client.id} className="py-3 flex justify-between items-center">
                    <span className="text-foreground">{client.name}</span>
                    <span className="text-sm text-muted-foreground">{new Date(client.date).toLocaleDateString('pt-BR')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum cadastro recente para exibir.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Personalize Panel Section */}
      <section>
        <Card className="shadow-md bg-muted/30">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl font-semibold text-accent">Personalizar Painel</CardTitle>
            </div>
             <CardDescription>
              Ajuste as informações exibidas conforme sua necessidade. (Funcionalidade futura)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-border rounded-md">
              <p className="text-muted-foreground">
                Em breve: Opções de personalização do painel aqui.
              </p>
              <Button variant="outline" className="mt-4">
                Configurar Widgets (Exemplo)
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
