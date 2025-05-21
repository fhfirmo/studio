
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { InbmAdminLogo } from '@/components/icons/inbm-admin-logo';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// import { useToast } from "@/hooks/use-toast"; 

export default function AdminAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    console.log('AdminAuthPage: Admin login attempt with:', { email });

    if (!supabase) {
      console.error("AdminAuthPage: Supabase client not initialized. Check environment variables.");
      // toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Actual Supabase admin login logic:
    // This function attempts to sign in. Redirection and role verification
    // should be handled by the onAuthStateChange listener in a global component (e.g., Header).
    console.log('AdminAuthPage: Attempting supabase.auth.signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('AdminAuthPage: Erro no login administrativo:', error.message);
      // toast({ title: "Erro no Login Administrativo", description: error.message, variant: "destructive" });
      setIsLoading(false); // Stop loading on error
      return;
    }
    
    if (data.user) {
      console.log('AdminAuthPage: Usuário autenticado via Supabase:', data.user.email);
      // toast({ title: "Login bem-sucedido!", description: "Aguarde o redirecionamento..."});
      // NO LONGER REDIRECTING FROM HERE. Rely on onAuthStateChange in Header.
      // router.push('/admin/usuarios'); 
    } else if (data.session) {
        console.log('AdminAuthPage: Sessão obtida, usuário:', data.session.user.email);
        // Also rely on onAuthStateChange
    } else {
      console.warn('AdminAuthPage: signInWithPassword sucesso, mas sem data.user ou data.session. Resposta:', data);
      // toast({ title: "Login Concluído", description: "Verificando sessão..."});
    }
    // We keep isLoading true here intentionally if login seems successful,
    // to allow the onAuthStateChange listener in Header to take over.
    // If there was an error, isLoading is set to false above.
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" aria-label="Voltar para Home">
          <InbmAdminLogo className="h-12 w-auto" />
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
            Acesso à Área Administrativa INBM
          </CardTitle>
          <CardDescription>
            Acesso exclusivo para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Administrativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="Seu e-mail administrativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Administrativa</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha administrativa"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-base pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full text-base py-3" variant="secondary" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Entrar na Área Administrativa'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <Link href="/recuperar-senha" passHref>
            <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto">
              Problemas para acessar?
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
