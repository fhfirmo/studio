
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { InbmAdminLogo } from '@/components/icons/inbm-admin-logo'; // Using the admin panel specific logo
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Import Supabase client
// import { useToast } from "@/hooks/use-toast"; // Uncomment if you want to use toasts for feedback

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize router
  // const { toast } = useToast(); // Uncomment if you want to use toasts for feedback

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    console.log('Login attempt with:', { email, password });

    // Supabase Auth: signInWithPassword
    // Ensure your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabase) {
      console.error("Supabase client not initialized. Check environment variables.");
      // toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    /*
    // Actual Supabase login logic:
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        // toast({ title: "Erro no Login", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      console.log('Usuário logado:', data.user);
      // toast({ title: "Login bem-sucedido!", description: "Redirecionando..."});
      // On successful login, Supabase automatically manages the session.
      // The onAuthStateChange listener (if set up globally) will handle user state.
      // You might redirect based on user role or to a protected page.
      router.push('/admin/dashboard'); 
    } catch (error: any) {
      console.error('Login failed unexpectedly:', error.message);
      // toast({ title: "Erro no Login", description: "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
    */

    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated login finished');
    setIsLoading(false);
    router.push('/admin/dashboard'); // Redirect to dashboard
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
            Acesso ao Painel Administrativo
          </CardTitle>
          <CardDescription>
            Utilize suas credenciais para entrar no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
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
            <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <Link href="/recuperar-senha" passHref>
            <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto">
              Esqueceu sua senha?
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/cadastro" passHref>
              <span className="font-medium text-primary hover:underline cursor-pointer">
                Cadastre-se
              </span>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
