
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
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const mainAdminNavItems: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/clientes', label: 'Pessoas Físicas' },
  { href: '/admin/organizacoes', label: 'Organizações' },
  { href: '/admin/veiculos', label: 'Veículos' },
  { href: '/admin/seguros', label: 'Seguros' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/relatorios', label: 'Relatórios' },
];

const userManagementNavItem = { href: '/admin/usuarios', label: 'Usuários' };
const configurationsNavItem = { href: '/admin/configuracoes', label: 'Configurações' };


interface UserProfile {
  id: string;
  full_name?: string | null;
  role?: string | null;
}

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile(); // isMobile will be false on server and true/false on client after hydration
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log("Header: Component mounted. Supabase client:", supabase ? "Initialized" : "NOT Initialized");

    if (!supabase) {
      console.warn("Header: Supabase client not initialized. Auth listener not set up.");
      setAuthLoading(false);
      return;
    }

    const fetchUserProfile = async (user: SupabaseUser | null): Promise<UserProfile | null> => {
      if (!user) {
        console.log("Header (fetchUserProfile): No user, returning null.");
        return null;
      }
      console.log("Header (fetchUserProfile): Attempting to fetch profile for user ID:", user.id);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Header (fetchUserProfile): Erro ao buscar perfil do usuário:', error.message);
          return null;
        }
        if (profile) {
          console.log('Header (fetchUserProfile): Perfil do usuário carregado:', profile);
          return profile as UserProfile;
        }
        console.warn('Header (fetchUserProfile): Perfil não encontrado para o usuário ID:', user.id);
        return null;
      } catch (e: any) {
        console.error('Header (fetchUserProfile): Exceção ao buscar perfil:', e.message);
        return null;
      }
    };
    
    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log("Header (handleAuthStateChange): Evento recebido:", event, "Session user:", session?.user?.email);
      setAuthLoading(true);
      const user = session?.user ?? null;
      setCurrentUser(user);
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
      setAuthLoading(false); 
      console.log("Header (handleAuthStateChange): Auth loading set to false. CurrentUser:", user?.email, "Profile:", profile);
    };
    
    const checkInitialSession = async () => {
      console.log("Header: Verificando sessão inicial...");
      setAuthLoading(true);
      if (!supabase) {
        console.warn("Header (checkInitialSession): Supabase client not available.");
        setAuthLoading(false);
        return;
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Header (checkInitialSession): Erro ao obter sessão inicial:", sessionError.message);
      }
      console.log("Header (checkInitialSession): Sessão inicial:", session?.user?.email);
      await handleAuthStateChange(session ? 'INITIAL_SESSION_CHECK_SUCCESS' : 'INITIAL_SESSION_CHECK_NO_SESSION', session);
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Header: Removendo listener de autenticação.");
      authListener?.subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (authLoading) {
      console.log("Header (Redirect Effect): Auth loading, aguardando...");
      return; 
    }
    console.log("Header (Redirect Effect): Auth carregado. CurrentUser:", currentUser ? currentUser.email : "null", "UserProfile Role:", userProfile?.role, "Pathname:", pathname);

    const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
    const isAdminRoute = pathname.startsWith('/admin/');
    const isPublicPage = pathname === '/' || pathname === '/quem-somos' || pathname === '/servicos' || pathname === '/contato';
    const allowedAdminRoles = ['admin', 'supervisor', 'operator'];

    if (!currentUser && isAdminRoute && !isLoginPage) {
      console.log('Header (Redirect Effect): Redirecionando para /login - Usuário não autenticado em rota administrativa:', pathname);
      router.push('/login');
      return;
    }
    
    if (currentUser && isLoginPage) {
      console.log('Header (Redirect Effect): Usuário autenticado em página de login. Pathname:', pathname);
      if (pathname.startsWith('/admin-auth') && userProfile && allowedAdminRoles.includes(userProfile.role || '')) {
         console.log('Header (Redirect Effect): Redirecionando de /admin-auth para /admin/usuarios');
         router.push('/admin/usuarios');
      } else if (userProfile && userProfile.role === 'client') {
        console.log('Header (Redirect Effect): Cliente redirecionando da página de login para /');
        router.push('/');
      } else if (userProfile && allowedAdminRoles.includes(userProfile.role || '')) {
        console.log('Header (Redirect Effect): Admin/Supervisor/Operator redirecionando da página de login para /admin/dashboard');
        router.push('/admin/dashboard');
      } else {
        console.log('Header (Redirect Effect): Usuário logado na página de login sem role definido ou não admin/client, redirecionando para /');
        router.push('/');
      }
      return;
    }

    if (currentUser && userProfile && isAdminRoute && !isLoginPage) {
      if (!allowedAdminRoles.includes(userProfile.role || '')) {
        console.log(`Header (Redirect Effect): Usuário com role '${userProfile.role}' tentando acessar rota admin ${pathname}. Redirecionando para /.`);
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        router.push('/');
        return;
      }
    }
    
    console.log("Header (Redirect Effect): Nenhuma condição de redirecionamento principal atendida.");

  }, [authLoading, currentUser, userProfile, pathname, router, toast]);


  let itemsToDisplay: { href: string; label: string }[] = [];
  const isPublicLogin = pathname === '/login' || pathname === '/admin-auth';
  const isHomepage = pathname === '/';
  const isPublicContentPage = pathname === '/quem-somos' || pathname === '/servicos' || pathname === '/contato';

  const showNavForAdmin = currentUser && !isPublicLogin && !isHomepage && !isPublicContentPage && (userProfile?.role === 'admin' || userProfile?.role === 'supervisor' || userProfile?.role === 'operator');

  if (showNavForAdmin) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = [userManagementNavItem, configurationsNavItem];
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }

  const showLogoutButton = !!currentUser && !isPublicLogin && !isHomepage && !isPublicContentPage;
  const showUserInfo = !!currentUser && !isPublicLogin && !isHomepage && !isPublicContentPage;
  const showNavigationArea = itemsToDisplay.length > 0 || showLogoutButton || showUserInfo;

  const handleLogout = () => {
    console.log('Header: Botão Logout clicado. Exibindo modal de confirmação.');
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('Header: Confirmando logout...');
    setShowLogoutConfirm(false);
    if (!supabase) {
      console.error("Header (confirmLogout): Cliente Supabase não inicializado.");
      toast({ title: "Erro", description: "Falha ao tentar deslogar.", variant: "destructive"});
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Header (confirmLogout): Erro ao deslogar:', error.message);
      toast({ title: "Erro ao Sair", description: error.message, variant: "destructive"});
    } else {
      console.log('Header (confirmLogout): Logout bem-sucedido. Redirecionando para /');
      toast({ title: "Logout Efetuado", description: "Você foi desconectado."});
      setCurrentUser(null); // Explicitly clear states
      setUserProfile(null);
      router.push('/'); 
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
          {/* Simplified skeleton to avoid conditional rendering differences */}
          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div> 
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="https://firmoconsultoria.com.br/inbm/" aria-label="INBM Site" target="_blank" rel="noopener noreferrer">
             <div className="bg-primary p-1 rounded-md">
                <InbmBrandLogo className="h-8 md:h-10 w-auto" />
            </div>
          </Link>

          {authLoading && !isMobile && !isPublicLogin && !isHomepage && !isPublicContentPage && (
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

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Olá, {userProfile?.full_name || currentUser?.email || "usuário"}, tem certeza que deseja sair da aplicação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
