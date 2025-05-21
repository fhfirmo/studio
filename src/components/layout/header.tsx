
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, UserCircle } from 'lucide-react';
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

// Specific navigation item for the user management and configurations section
const adminAreaNavItems: { href: string; label: string }[] = [
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

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
  const [authLoading, setAuthLoading] = useState(true); // To track initial auth state check

  useEffect(() => {
    setIsMounted(true);

    if (!supabase) {
      console.warn("Supabase client not initialized in Header.");
      setAuthLoading(false);
      return;
    }

    // Function to fetch profile
    const fetchUserProfile = async (user: User) => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error.message);
        setUserProfile(null);
        // If profile is critical, you might sign out the user here
        // await supabase.auth.signOut();
      } else {
        setUserProfile(profile as UserProfile);
        console.log('Perfil do usuário carregado:', profile);
      }
    };
    
    // Initial session check
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
      setAuthLoading(false);
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthLoading(true); // Set loading true when auth state might change
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          console.log('Auth event:', event, 'Usuário:', session.user.email);
          await fetchUserProfile(session.user);
        } else {
          console.log('Auth event:', event, 'Sessão não encontrada ou usuário deslogado.');
          setUserProfile(null);
        }
        setAuthLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Run only once on mount for initial check and listener setup

  // Effect for handling redirection based on auth state
  useEffect(() => {
    if (authLoading) {
      return; // Don't do anything while initial auth status is being determined
    }

    const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
    const isAdminRoute = pathname.startsWith('/admin/');

    if (!currentUser && isAdminRoute && !isLoginPage) {
      console.log('Redirecionando para login: Usuário não autenticado em rota administrativa.');
      router.push('/login');
    }
    // Optional: Redirect if logged in and on a login page
    // else if (currentUser && isLoginPage) {
    //   console.log('Redirecionando para dashboard: Usuário autenticado em página de login.');
    //   router.push('/admin/dashboard');
    // }

  }, [authLoading, currentUser, pathname, router]);


  let itemsToDisplay: { href: string; label: string }[] = [];
  const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
  const isHomePage = pathname === '/';
  const isNonAdminPublicPage = pathname === '/contato' || pathname === '/servicos' || pathname === '/quem-somos' || pathname.startsWith('/cliente/');


  if (currentUser && !isLoginPage && !isHomePage && !isNonAdminPublicPage) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = adminAreaNavItems;
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }
  
  const showLogoutButton = !!currentUser && (pathname.startsWith('/admin/') || pathname.startsWith('/cliente/')) && !isLoginPage;
  const showNavigationArea = itemsToDisplay.length > 0 || showLogoutButton || userProfile;

  const handleLogout = async () => {
    console.log('Attempting logout...');
    if (!supabase) {
      console.error("Supabase client not initialized for logout.");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao deslogar:', error.message);
    } else {
      console.log('Logout bem-sucedido.');
      // States will be cleared by onAuthStateChange
      router.push('/login'); // Explicit redirect after sign out
    }
  };

  if (!isMounted || authLoading) { // Show skeleton while mounting or initial auth check is loading
    return (
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
            <div className="bg-primary p-1 rounded-md">
              <InbmBrandLogo className="h-8 md:h-10 w-auto" />
            </div>
          </Link>
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
                {currentUser && (
                  <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-8 w-8 text-sidebar-primary" />
                      <div>
                        <p className="text-sm font-medium">{userProfile?.full_name || currentUser.email}</p>
                        {userProfile?.role && <p className="text-xs text-sidebar-foreground/70">{userProfile.role}</p>}
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
              {currentUser && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{userProfile?.full_name || currentUser.email}</span>
                    {userProfile?.role && <span className="text-muted-foreground text-xs ml-1">({userProfile.role})</span>}
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
