import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-grow py-10 px-4 text-center">
      <div className="mb-10 bg-primary p-6 sm:p-8 md:p-10 inline-block rounded-lg shadow-xl">
        <InbmBrandLogo className="h-20 sm:h-24 md:h-28 w-auto" />
      </div>
      
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-10 sm:mb-12 md:mb-16">
        INBM Painel Administrativo
      </h1>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <Button asChild size="lg" className="min-w-[220px] sm:min-w-[250px] py-3 px-6">
          <Link href="/admin-auth">
            Área Administrativa
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="min-w-[220px] sm:min-w-[250px] py-3 px-6">
          <Link href="/login">
            Login
          </Link>
        </Button>
      </div>
    </div>
  );
}
