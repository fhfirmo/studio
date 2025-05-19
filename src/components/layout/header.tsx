
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { InbmLogo } from '@/components/icons/inbm-logo'; // This is the existing header logo (square design)
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems: { href: string; label: string }[] = [
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
];

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile(); // Custom hook to detect mobile state

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return ( // Render a placeholder or simplified header during SSR/hydration mismatch potential
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="INBM Home">
            <InbmLogo className="h-8 w-auto" />
          </Link>
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div>
          <nav className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <li key={item.href} className="list-none">
                <Link
                  href={item.href}
                  className="text-sm font-medium text-transparent bg-muted rounded animate-pulse h-5 w-20 inline-block"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="INBM Home">
          <InbmLogo className="h-8 md:h-10 w-auto text-primary" />
        </Link>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 flex justify-between items-center border-b">
                   <Link href="/" aria-label="INBM Home">
                     <InbmLogo className="h-8 w-auto text-primary" />
                   </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Fechar menu">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>
                {navItems.length > 0 && (
                  <nav className="flex-grow p-4">
                    <ul className="space-y-4">
                      {navItems.map((item) => (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className="text-lg font-medium text-foreground hover:text-primary transition-colors block py-2 rounded-md hover:bg-accent/50 px-2"
                            >
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
                <div className="p-4 border-t mt-auto">
                  <p className="text-xs text-muted-foreground text-center">INBM &copy; {new Date().getFullYear()}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          navItems.length > 0 && (
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
