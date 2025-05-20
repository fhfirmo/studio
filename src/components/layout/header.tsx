
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

// Main navigation items for general admin sections
const mainAdminNavItems: { href: string; label: string }[] = [
  { href: '/admin/clientes', label: 'Pessoas Físicas' },
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/organizacoes', label: 'Organizações' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

// Specific navigation item for the user management section
const userManagementNavItem: { href: string; label: string } = {
  href: '/admin/usuarios', label: 'Usuários'
};

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine which navigation items to display
  let itemsToDisplay: { href: string; label: string }[] = [];
  const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
  const isHomePage = pathname === '/';

  if (!isLoginPage && !isHomePage) {
    if (pathname.startsWith('/admin/usuarios')) {
      itemsToDisplay = [userManagementNavItem];
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }
  // For non-admin pages like '/', '/login', '/admin-auth', '/contato', etc., itemsToDisplay remains empty by default.


  const showNavigation = itemsToDisplay.length > 0;

  if (!isMounted) {
    // Simplified skeleton for header
    return (
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
            <div className="bg-primary p-1 rounded-md">
              <div className="h-8 md:h-10 w-20 bg-muted animate-pulse rounded"></div>
            </div>
          </Link>
          {/* Skeleton for nav area if it's an admin page that should have nav */}
          {(pathname.startsWith('/admin/') && pathname !== '/admin-auth') && (
            <>
              <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div>
              <nav className="hidden md:flex space-x-6 items-center">
                {[...Array(3)].map((_, i) => ( // Show a few skeleton nav items
                  <li key={i} className="list-none">
                    <span className="text-sm font-medium text-transparent bg-muted rounded animate-pulse h-5 w-20 inline-block">
                      {/* Placeholder */}
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

        {isMobile && showNavigation ? (
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
                    {itemsToDisplay.map((item) => (
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
          !isMobile && showNavigation && (
            <nav>
              <ul className="flex space-x-6 items-center">
                {itemsToDisplay.map((item) => (
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
