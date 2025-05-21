
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, UserCircle } from 'lucide-react'; // Added UserCircle
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

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

interface UserProfile {
  id: string;
  full_name?: string;
  role?: string;
  // Add other profile fields as needed
}

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setIsMounted(true);

    if (!supabase) {
      console.warn("Supabase client not initialized in Header.");
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          console.log('Usuário logado:', session.user);
          // Buscar informações do perfil do usuário na tabela 'profiles'
          // IMPORTANT: Ensure you have a 'profiles' table with RLS policies set up.
          // The 'id' column in 'profiles' should be a FK to 'auth.users.id'.
          const { data: profile, error } = await supabase
            .from('profiles') // Assuming your table is named 'profiles'
            .select('id, full_name, role') // Select the columns you need
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            setUserProfile(null);
            // Potentially sign out the user if profile is essential and not found
            // await supabase.auth.signOut();
          } else {
            setUserProfile(profile as UserProfile);
            console.log('Perfil do usuário carregado:', profile);
            // Role-based redirection example (customize as needed)
            // if (profile?.role !== 'admin_principal' && pathname.startsWith('/admin/usuarios')) {
            //   router.push('/admin/dashboard'); // Redirect non-super-admins from user management
            // }
          }
        } else {
          console.log('Usuário deslogado ou sessão não encontrada.');
          setUserProfile(null);
          // If user is not logged in and tries to access a protected admin route, redirect to login
          if (pathname.startsWith('/admin/') && pathname !== '/admin-auth' && pathname !== '/login') {
             console.log('Redirecionando para login (sessão não encontrada em rota admin).');
             router.push('/login');
          }
        }
      }
    );

    // Check initial session
    // (async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //   setCurrentUser(session?.user ?? null);
    //   if (session?.user && !userProfile) { // Fetch profile if session exists but profile not yet loaded
    //      const { data: profile, error } = await supabase
    //         .from('profiles')
    //         .select('id, full_name, role')
    //         .eq('id', session.user.id)
    //         .single();
    //      if (error) console.error('Erro ao buscar perfil inicial:', error.message);
    //      else setUserProfile(profile as UserProfile);
    //   }
    // })();


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]); // Added router to dependency array

  let itemsToDisplay: { href: string; label: string }[] = [];
  const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
  const isHomePage = pathname === '/';
  const isNonAdminPublicPage = pathname === '/contato' || pathname === '/servicos' || pathname === '/quem-somos' || pathname.startsWith('/cliente/');


  // Determine navigation items based on route and auth status
  if (currentUser && !isLoginPage && !isHomePage && !isNonAdminPublicPage) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = [userManagementNavItem, configuracoesNavItem];
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }
  
  const showLogoutButton = !!currentUser && pathname.startsWith('/admin/') && !isLoginPage;

  const handleLogout = async () => {
    console.log('Attempting logout...');
    if (!supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao deslogar:', error.message);
      // toast({ title: "Erro ao Sair", description: error.message, variant: "destructive" });
    } else {
      console.log('Logout bem-sucedido.');
      setUserProfile(null); // Clear user profile state
      setCurrentUser(null); // Clear current user state
      // The onAuthStateChange listener should handle redirection.
      // Or, you can redirect manually here if needed after a short delay to ensure state updates.
      router.push('/login');
    }
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
           {/* Skeleton for nav items during SSR/initial mount */}
          <div className="hidden md:flex space-x-4 items-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="list-none h-5 w-20 bg-muted rounded animate-pulse"></div>
            ))}
             <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-8 bg-muted rounded-md animate-pulse md:hidden"></div>
        </div>
      </header>
    );
  }
  
  const showNavigationArea = itemsToDisplay.length > 0 || showLogoutButton || userProfile;

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
          <div className="bg-primary p-1 rounded-md">
            <InbmBrandLogo className="h-8 md:h-10 w-auto" />
          </div>
        </Link>

        {isMobile && showNavigationArea ? (
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
                {currentUser && userProfile && (
                  <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-8 w-8 text-sidebar-primary" />
                      <div>
                        <p className="text-sm font-medium">{userProfile.full_name || currentUser.email}</p>
                        <p className="text-xs text-sidebar-foreground/70">{userProfile.role || 'Usuário'}</p>
                      </div>
                    </div>
                  </div>
                )}
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
          !isMobile && showNavigationArea && (
            <nav className="flex items-center space-x-4">
              {currentUser && userProfile && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{userProfile.full_name || currentUser.email}</span>
                    {userProfile.role && <span className="text-muted-foreground text-xs ml-1">({userProfile.role})</span>}
                  </div>
                </div>
              )}
              {itemsToDisplay.length > 0 && (
                <ul className="flex space-x-4 items-center">
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
              )}
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
