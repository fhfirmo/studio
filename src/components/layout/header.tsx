
"use client";

import Link from 'next/link';
import { useState, useEffect, type SetStateAction } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, UserCircle, Settings, Users as UsersIcon, Building2, Car, ShieldCheck, FileText as FileTextIcon, TrendingUp, Activity } from 'lucide-react'; // Added specific icons
import { InbmBrandLogo } from '@/components/icons/inbm-brand-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const mainAdminNavItems: { href: string; label: string, icon: React.ElementType }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/admin/clientes', label: 'Pessoas Físicas', icon: UsersIcon },
  { href: '/admin/organizacoes', label: 'Organizações', icon: Building2 },
  { href: '/admin/veiculos', label: 'Veículos', icon: Car },
  { href: '/admin/seguros', label: 'Seguros', icon: ShieldCheck },
  { href: '/admin/documentos', label: 'Documentos', icon: FileTextIcon },
  { href: '/admin/relatorios', label: 'Relatórios', icon: TrendingUp },
];

const userManagementNavItems = [
  { href: '/admin/usuarios', label: 'Usuários', icon: UsersIcon },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
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
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Initialize as true
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
      console.log(`Header (handleAuthStateChange): Evento recebido: ${event}. Session user: ${session?.user?.email || 'null'}`);
      setAuthLoading(true); // Set loading true at the start of handling state change
      const user = session?.user ?? null;
      setCurrentUser(user);
      const profile = await fetchUserProfile(user);
      setUserProfile(profile);
      setAuthLoading(false); 
      console.log(`Header (handleAuthStateChange): Auth loading set to false. CurrentUser: ${user?.email || 'null'}. Profile: ${JSON.stringify(profile)}`);
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
      console.log(`Header (checkInitialSession): Sessão inicial: ${session?.user?.email || 'null'}`);
      // Call the common handler
      await handleAuthStateChange(session ? 'INITIAL_SESSION_SUCCESS' : 'INITIAL_SESSION_NO_SESSION', session);
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log("Header: Removendo listener de autenticação.");
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array, runs once on mount


  useEffect(() => {
    // This effect handles redirection based on the auth state
    if (authLoading) {
      console.log("Header (Redirect Effect): Auth loading, aguardando...");
      return; 
    }
    console.log(`Header (Redirect Effect): Auth carregado. CurrentUser: ${currentUser ? currentUser.email : "null"}, UserProfile Role: ${userProfile?.role}, Pathname: ${pathname}`);

    const isLoginPage = pathname === '/login' || pathname === '/admin-auth';
    const isAdminRoute = pathname.startsWith('/admin/');
    const allowedAdminPortalRoles = ['admin', 'supervisor']; // Roles that can proceed from /admin-auth
    const allowedGeneralAdminRoles = ['admin', 'supervisor', 'operator']; // Roles that can access /admin/*

    if (currentUser && userProfile) { // User is logged in and profile is loaded
      if (isLoginPage) {
        console.log(`Header (Redirect Effect): Usuário autenticado (${currentUser.email}, role: ${userProfile.role}) em página de login: ${pathname}. Redirecionando...`);
        if (pathname === '/admin-auth') {
          if (allowedAdminPortalRoles.includes(userProfile.role)) {
            console.log(`Header (Redirect Effect): Role '${userProfile.role}' permitido para /admin-auth. Redirecionando para /admin/usuarios`);
            router.push('/admin/usuarios');
          } else {
            console.log(`Header (Redirect Effect): Role '${userProfile.role}' NÃO permitido para /admin-auth. Deslogando e notificando.`);
            toast({ title: "Acesso Negado", description: "Você não tem permissão para usar este portal de login administrativo.", variant: "destructive" });
            supabase.auth.signOut().then(() => router.push('/admin-auth')); // Sign out and stay/return to admin-auth
          }
        } else if (pathname === '/login') {
          if (allowedGeneralAdminRoles.includes(userProfile.role)) {
            console.log(`Header (Redirect Effect): Role '${userProfile.role}' em /login. Redirecionando para /admin/dashboard`);
            router.push('/admin/dashboard');
          } else if (userProfile.role === 'client') {
            console.log("Header (Redirect Effect): Role 'client' em /login. Redirecionando para /");
            toast({ title: "Área do Cliente", description: "Área do cliente em desenvolvimento.", duration: 4000 });
            router.push('/');
          } else {
            console.log(`Header (Redirect Effect): Role '${userProfile.role}' desconhecido em /login. Redirecionando para /`);
            toast({ title: "Perfil Desconhecido", description: "Seu perfil não permite acesso direto. Contacte o suporte.", variant: "destructive" });
            router.push('/');
          }
        }
        return; // Critical: stop further execution of this effect after a redirect
      } else if (isAdminRoute) { // User is on an admin route but not a login page
        if (!allowedGeneralAdminRoles.includes(userProfile.role)) {
          console.log(`Header (Redirect Effect): Role '${userProfile.role}' tentando acessar rota admin ${pathname}. Acesso negado. Redirecionando para /.`);
          toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta área.", variant: "destructive" });
          router.push('/');
          return;
        }
      }
    } else if (!currentUser) { // User is not logged in
      if (isAdminRoute && !isLoginPage) {
        console.log(`Header (Redirect Effect): Usuário não autenticado em rota administrativa ${pathname}. Redirecionando para /login.`);
        router.push('/login');
        return;
      }
    }
    console.log("Header (Redirect Effect): Nenhuma condição de redirecionamento principal atendida.");
  }, [authLoading, currentUser, userProfile, pathname, router, toast]);


  let itemsToDisplay: { href: string; label: string, icon: React.ElementType }[] = [];
  const isLoginOrPublicPage = pathname === '/' || pathname === '/login' || pathname === '/admin-auth' || pathname === '/quem-somos' || pathname === '/servicos' || pathname === '/contato';
  
  if (!isLoginOrPublicPage && currentUser) {
    if (pathname.startsWith('/admin/usuarios') || pathname.startsWith('/admin/configuracoes')) {
      itemsToDisplay = userManagementNavItems;
    } else if (pathname.startsWith('/admin/')) {
      itemsToDisplay = mainAdminNavItems;
    }
  }

  const showLogoutButton = !!currentUser && !isLoginOrPublicPage;
  const showUserInfo = !!currentUser && !isLoginOrPublicPage;
  const showNavigationArea = itemsToDisplay.length > 0 || showLogoutButton || showUserInfo;

  const handleLogout = () => {
    console.log('Header: Botão Logout clicado. Exibindo modal de confirmação.');
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('Header: Confirmando logout...');
    if (!supabase) {
      console.error("Header (confirmLogout): Cliente Supabase não inicializado.");
      toast({ title: "Erro", description: "Falha ao tentar deslogar.", variant: "destructive"});
      setShowLogoutConfirm(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    setShowLogoutConfirm(false); // Close modal regardless of outcome before potential navigation
    if (error) {
      console.error('Header (confirmLogout): Erro ao deslogar:', error.message);
      toast({ title: "Erro ao Sair", description: error.message, variant: "destructive"});
    } else {
      console.log('Header (confirmLogout): Logout bem-sucedido. States (currentUser, userProfile) serão limpos por onAuthStateChange. Redirecionando para /');
      toast({ title: "Logout Efetuado", description: "Você foi desconectado."});
      // setCurrentUser(null); // Let onAuthStateChange handle this
      // setUserProfile(null);
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
           <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
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

          {authLoading && !isMobile && !isLoginOrPublicPage && (
              <div className="hidden md:flex text-sm text-muted-foreground">Verificando autenticação...</div>
          )}

          {!authLoading && isMobile && showNavigationArea ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-sidebar-background p-0 text-sidebar-foreground">
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
                          {userProfile?.role && <p className="text-xs text-sidebar-foreground/70 capitalize">{userProfile.role}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                  <nav className="flex-grow p-4">
                    <ul className="space-y-1">
                      {itemsToDisplay.map((item) => (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className={`flex items-center gap-3 text-base font-medium rounded-md px-3 py-2.5 transition-colors
                                ${pathname === item.href 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent'
                                }`}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}
                      {showLogoutButton && (
                        <li>
                          <SheetClose asChild>
                              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start items-center gap-3 text-base font-medium text-sidebar-foreground hover:text-sidebar-accent hover:bg-sidebar-accent/10 px-3 py-2.5">
                                  <LogOut className="h-5 w-5" /> Logout
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
              <nav className="flex items-center space-x-6">
                {itemsToDisplay.length > 0 && (
                  <ul className="flex space-x-1 items-center">
                    {itemsToDisplay.map((item) => (
                      <li key={item.href}>
                        <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" asChild>
                            <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {showUserInfo && (
                  <div className="flex items-center gap-2 text-sm border-l border-border pl-6">
                    <UserCircle className="h-6 w-6 text-primary" />
                    <div>
                      <span className="font-medium">{userProfile?.full_name || currentUser?.email}</span>
                      {userProfile?.role && <span className="text-muted-foreground text-xs ml-1 capitalize">({userProfile.role})</span>}
                    </div>
                  </div>
                )}
                {showLogoutButton && (
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                )}
              </nav>
            )
          )}
          {!isMobile && !showNavigationArea && !authLoading && (
            <div></div> // Empty div to maintain layout if no nav items/user info to show on desktop
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
