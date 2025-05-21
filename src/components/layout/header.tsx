
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase'; // Import Supabase client

// Main navigation items for general admin sections
const mainAdminNavItems: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/clientes', label: 'Pessoas Físicas' },
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/organizacoes', label: 'Organizações' },
  { href: '/admin/relatorios', label: 'Relatórios' },
];

// Specific navigation item for the user management section
const userManagementNavItem: { href: string; label: string } = {
  href: '/admin/usuarios', label: 'Usuários'
};

// Specific navigation item for the system configuration section
const configuracoesNavItem: { href: string; label: string } = {
  href: '/admin/configuracoes', label: 'Configurações'
};

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter(); // For redirection after logout
  // const [currentUser, setCurrentUser] = useState<User | null>(null); // Placeholder for Supabase user state

  useEffect(() => {
    setIsMounted(true);

    // Supabase Auth: onAuthStateChange listener
    // This listener updates the UI or redirects based on authentication state.
    // It should ideally be in a higher-level component or context provider for global access.
    // For this example, we'll put a conceptual listener here.
    if (supabase) {
      /*
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, session);
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Usuário logado:', session.user);
          // setCurrentUser(session.user);
          // Fetch user profile from your 'profiles' table if needed
          // Example: if (pathname === '/login' || pathname === '/admin-auth') router.push('/admin/dashboard');
        } else if (event === 'SIGNED_OUT') {
          console.log('Usuário deslogado');
          // setCurrentUser(null);
          // Redirect to login page if not already on a public page
          // Example: if (!['/login', '/admin-auth', '/'].includes(pathname)) router.push('/login');
        }
        // Handle other events like PASSWORD_RECOVERY, USER_UPDATED, etc.
      });

      // Call unsubscribe on component unmount
      return () => {
        authListener?.subscription.unsubscribe();
      };
      */
    }
  }, [pathname, router]);

  // Determine which navigation items to display
  let itemsToDisplay: { href: string; label: string }[] = [];
  const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
  const isHomePage = pathname === '/';
  const isNonAdminPage = isLoginPage || isHomePage || pathname === '/contato' || pathname === '/servicos' || pathname === '/quem-somos' || pathname.startsWith('/cliente/');


  if (!isNonAdminPage) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = [userManagementNavItem, configuracoesNavItem];
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }
  
  // Add Logout button if user is on an admin page
  const showLogoutButton = pathname.startsWith('/admin/') && !isLoginPage;


  const handleLogout = async () => {
    console.log('Attempting logout...');
    if (!supabase) {
      console.error("Supabase client not initialized.");
      // toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      return;
    }
    /*
    // Actual Supabase logout logic:
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao deslogar:', error.message);
        // toast({ title: "Erro ao Sair", description: error.message, variant: "destructive" });
      } else {
        console.log('Logout bem-sucedido.');
        // toast({ title: "Logout Efetuado", description: "Você foi desconectado com sucesso." });
        // The onAuthStateChange listener should handle redirection to the login page.
        // Or, you can redirect manually here:
        router.push('/login');
      }
    } catch (error: any) {
      console.error('Logout failed unexpectedly:', error.message);
      // toast({ title: "Erro ao Sair", description: "Ocorreu um erro inesperado.", variant: "destructive" });
    }
    */
    // Simulate logout for now
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/login');
  };


  if (!isMounted) {
    return (
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
            <div className="bg-primary p-1 rounded-md">
              <InbmBrandLogo className="h-8 md:h-10 w-auto" />
            </div>
          </Link>
          {(pathname.startsWith('/admin/') && !isLoginPage) && (
            <>
              <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div> {/* Mobile menu skeleton */}
              <nav className="hidden md:flex space-x-4 items-center"> {/* Desktop nav skeleton */}
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="list-none h-5 w-20 bg-muted rounded animate-pulse"></div>
                ))}
                 <div className="h-8 w-20 bg-muted rounded animate-pulse"></div> {/* Logout button skeleton */}
              </nav>
            </>
          )}
        </div>
      </header>
    );
  }
  
  const showNavigation = itemsToDisplay.length > 0 || showLogoutButton;


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
                    {showLogoutButton && (
                       <li>
                        <SheetClose asChild>
                            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-lg font-medium text-sidebar-foreground hover:text-sidebar-accent hover:bg-sidebar-accent/10 px-2 py-2">
                                <LogOut className="mr-2 h-5 w-5" /> Logout
                            </Button>
                        </SheetClose>
                       </li>
                    )}
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
            <nav className="flex items-center space-x-6">
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
              {showLogoutButton && (
                <Button onClick={handleLogout} variant="outline" size="sm">
                   <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              )}
            </nav>
          )
        )}
      </div>
    </header>
  );
}
