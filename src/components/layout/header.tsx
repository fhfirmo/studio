
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems: { href: string; label: string }[] = [
  { href: '/admin/clientes', label: 'Pessoas Físicas' }, // Updated label
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/organizacoes', label: 'Organizações' },
  { href: '/admin/relatorios', label: 'Relatórios' },
];

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Show nav items only if not on the homepage "/", login, or admin-auth pages
  const showNavItems = pathname !== '/' && pathname !== '/login' && pathname !== '/admin-auth';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
            <div className="bg-primary p-1 rounded-md">
              <div className="h-8 md:h-10 w-20 bg-muted animate-pulse rounded"></div>
            </div>
          </Link>
          {showNavItems && (
            <>
              <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div>
              <nav className="hidden md:flex space-x-6 items-center">
                {navItems.map((item) => (
                  <li key={item.href} className="list-none">
                    <span
                      className="text-sm font-medium text-transparent bg-muted rounded animate-pulse h-5 w-20 inline-block"
                    >
                      {/* Placeholder for text to keep layout */}
                    </span>
                  </li>
                ))}
              </nav>
            </>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
          <div className="bg-primary p-1 rounded-md">
            <InbmBrandLogo className="h-8 md:h-10 w-auto" />
          </div>
        </Link>

        {isMobile && showNavItems && navItems.length > 0 ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex flex-col h-full">
                <div className="p-4 flex justify-between items-center border-b border-sidebar-border">
                   <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
                     <div className="bg-sidebar-primary p-1 rounded-md">
                       <InbmBrandLogo className="h-8 w-auto" />
                     </div>
                   </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Fechar menu">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex-grow p-4">
                  <ul className="space-y-4">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className="text-lg font-medium text-sidebar-foreground hover:text-sidebar-accent transition-colors block py-2 rounded-md hover:bg-sidebar-accent/10 px-2"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="p-4 border-t border-sidebar-border mt-auto">
                  <p className="text-xs text-sidebar-foreground/70 text-center">INBM &copy; {new Date().getFullYear()}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          !isMobile && showNavItems && navItems.length > 0 && (
            <nav>
              <ul className="flex space-x-6 items-center">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )
        )}
      </div>
    </header>
  );
}
