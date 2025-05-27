
"use client"; // This file is no longer needed and should be deleted.

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ModelosVeiculoPageRemoved() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 text-center">
      <h1 className="text-2xl font-bold text-destructive mb-4">
        Página Removida
      </h1>
      <p className="text-muted-foreground mb-6">
        A gestão de "Modelos de Veículo" foi removida. Marca, modelo e versão são agora
        campos diretos no cadastro de veículos.
      </p>
      <Button asChild>
        <Link href="/admin/configuracoes">Voltar para Configurações</Link>
      </Button>
    </div>
  );
}

    