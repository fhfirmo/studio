
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
import type { User as SupabaseUser } from '@supabase/supabase-js'; // Renamed to avoid conflict
import { useToast } from "@/hooks/use-toast";

const mainAdminNavItems: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/clientes', label: 'Pessoas Físicas' },
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/organizacoes', label: 'Organizações' },
  { href: '/admin/relatorios', label: 'Relatórios' },
];

const adminAreaSpecialNavItems: { href: string; label: string }[] = [
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

interface UserProfile {
  id: string;
  full_name?: string | null;
  role?: string | null;
}

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    console.log("Header: Component mounted. Supabase client:", supabase ? "Initialized" : "NOT Initialized");

    if (!supabase) {
      console.warn("Header: Supabase client not initialized. Auth listener not set up.");
      setAuthLoading(false);
      return;
    }

    const fetchUserProfile = async (user: SupabaseUser) => {
      console.log("Header: Attempting to fetch profile for user ID:", user.id);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Header: Erro ao buscar perfil do usuário:', error.message);
          setUserProfile(null);
          // Optionally toast error if it's unexpected, but often this is normal if profile setup is pending
          // toast({ title: "Erro de Perfil", description: "Não foi possível carregar os dados do perfil.", variant: "destructive"});
        } else if (profile) {
          setUserProfile(profile as UserProfile);
          console.log('Header: Perfil do usuário carregado:', profile);
        } else {
          console.warn('Header: Perfil não encontrado para o usuário ID:', user.id);
          setUserProfile(null);
        }
      } catch (e: any) {
        console.error('Header: Exceção ao buscar perfil:', e.message);
        setUserProfile(null);
      }
    };

    const handleAuthStateChange = async (event: string, session: import('@supabase/supabase-js').Session | null) => {
      console.log("Header: Evento onAuthStateChange recebido:", event, "Session user:", session?.user?.email);
      setAuthLoading(true);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        console.log('Header: Usuário atualizado via listener:', session.user.email);
        await fetchUserProfile(session.user);
      } else {
        console.log('Header: Usuário deslogado via listener ou sessão expirada.');
        setUserProfile(null);
      }
      setAuthLoading(false); // Set loading false after all async operations in the handler are done
    };
    
    const checkInitialSession = async () => {
      console.log("Header: Verificando sessão inicial...");
      setAuthLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Header: Erro ao obter sessão inicial:", sessionError.message);
        // No need to call handleAuthStateChange, just set states directly
        setCurrentUser(null);
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }
      // Manually trigger the logic similar to onAuthStateChange for the initial session
      await handleAuthStateChange(session ? 'INITIAL_SESSION' : 'NO_INITIAL_SESSION', session);
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Header: Removendo listener de autenticação.");
      authListener?.subscription.unsubscribe();
    };
  }, []); // Removed router from dependencies as it caused re-runs; router is stable.

  useEffect(() => {
    if (authLoading) {
      console.log("Header (Redirect Effect): Auth loading, aguardando...");
      return;
    }
    console.log("Header (Redirect Effect): Auth carregado. CurrentUser:", currentUser ? currentUser.email : "null", "UserProfile Role:", userProfile?.role, "Pathname:", pathname);

    const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
    const isAdminRoute = pathname.startsWith('/admin/');
    const isHomePage = pathname === '/';

    if (currentUser && userProfile) { // User is logged in AND profile is loaded
      if (isLoginPage) {
        console.log(`Header (Redirect Effect): Usuário autenticado (${userProfile.role}) em página de login. Redirecionando...`);
        if (userProfile.role === 'admin' || userProfile.role === 'supervisor' || userProfile.role === 'operator') {
          router.push('/admin/dashboard');
        } else if (userProfile.role === 'client') {
          // TODO: Create /cliente/dashboard or similar client-specific landing page
          toast({ title: "Acesso Cliente", description: "Área do cliente em desenvolvimento. Redirecionando para Home."});
          router.push('/'); 
        } else {
          // Default redirect for users with profiles but no specific role match
          toast({ title: "Perfil Desconhecido", description: "Redirecionando para a página inicial."});
          router.push('/');
        }
        return;
      }
      // Add specific role-based access control for admin routes if needed here
      // Example: if (isAdminRoute && !(userProfile.role === 'admin' || userProfile.role === 'supervisor' || userProfile.role === 'operator')) {
      //   console.log(`Header (Redirect Effect): Usuário ${userProfile.role} não autorizado para ${pathname}. Redirecionando...`);
      //   toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta área.", variant: "destructive"});
      //   router.push('/'); // Or a specific 'unauthorized' page
      //   return;
      // }

    } else if (!currentUser && isAdminRoute && !isLoginPage) { // User is NOT logged in but trying to access a protected admin route
      console.log('Header (Redirect Effect): Usuário não autenticado em rota administrativa. Redirecionando para /login.');
      router.push('/login');
      return;
    }
    console.log("Header (Redirect Effect): Nenhuma condição de redirecionamento atendida.");

  }, [authLoading, currentUser, userProfile, pathname, router, toast]);


  let itemsToDisplay: { href: string; label: string }[] = [];
  const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
  const isHomePage = pathname === '/';
  const isNonAdminPublicPage = pathname === '/contato' || pathname === '/servicos' || pathname === '/quem-somos' || pathname.startsWith('/cliente/'); // Assuming /cliente/[id] is public

  if (currentUser && !isLoginPage && !isHomePage && !isNonAdminPublicPage) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = adminAreaSpecialNavItems;
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }

  const showLogoutButton = !!currentUser && !isLoginPage; // Show logout if user is logged in and not on a login page
  const showUserInfo = !!currentUser && !isLoginPage;
  const showNavigationArea = itemsToDisplay.length > 0 || showLogoutButton || showUserInfo;

  const handleLogout = async () => {
    console.log('Header: Tentando deslogar...');
    if (!supabase) {
      console.error("Header: Cliente Supabase não inicializado para logout.");
      toast({ title: "Erro", description: "Falha ao tentar deslogar.", variant: "destructive"});
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Header: Erro ao deslogar:', error.message);
      toast({ title: "Erro ao Sair", description: error.message, variant: "destructive"});
    } else {
      console.log('Header: Logout bem-sucedido.');
      toast({ title: "Logout Efetuado", description: "Você foi desconectado."});
      // onAuthStateChange will handle clearing currentUser and userProfile and redirecting
      router.push('/'); // Explicitly redirect to homepage after logout
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

        {authLoading && !isMobile && !isLoginPage && !isHomePage && !isNonAdminPublicPage && (
            <div className="hidden md:flex text-sm text-muted-foreground">Verificando autenticação...</div>
        )}

        {!authLoading && isMobile && showNavigationArea ? (
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
                {showUserInfo && (
                  <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-8 w-8 text-sidebar-primary" />
                      <div>
                        <p className="text-sm font-medium">{userProfile?.full_name || currentUser?.email}</p>
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
          !authLoading && !isMobile && showNavigationArea && (
            <nav className="flex items-center space-x-4">
              {showUserInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{userProfile?.full_name || currentUser?.email}</span>
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
        {!authLoading && !isMobile && !showNavigationArea && (
          <div></div> 
        )}
      </div>
    </header>
  );
}
