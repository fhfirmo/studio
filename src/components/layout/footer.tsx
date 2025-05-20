export function Footer() {
  return (
    <footer className="bg-muted/50 text-muted-foreground py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} INBM - Instituto Nacional Brasil em Movimento. Todos os direitos reservados.
        </p>
        <p className="text-xs mt-2">
          Desenvolvido com paixão e tecnologia de ponta.
        </p>
      </div>
    </footer>
  );
}
