
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { InbmAdminLogo } from '@/components/icons/inbm-admin-logo';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Import Supabase client
// import { useToast } from "@/hooks/use-toast"; // Uncomment if toasts are needed

export default function AdminAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize router
  // const { toast } = useToast(); // Uncomment if you want to use toasts for feedback

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    console.log('Admin login attempt with:', { email, password });

    // Supabase Auth: signInWithPassword for Admin
    // Ensure your .env.local file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabase) {
      console.error("Supabase client not initialized. Check environment variables.");
      // toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    /*
    // Actual Supabase admin login logic:
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Erro no login administrativo:', error.message);
        // toast({ title: "Erro no Login Administrativo", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // IMPORTANT: After successful sign-in, you MUST verify if the user has admin privileges.
      // This could be done by checking a custom claim, a role in a 'profiles' table, etc.
      // Example:
      // const { data: userProfile, error: profileError } = await supabase
      //   .from('profiles') // Assuming a 'profiles' table with a 'role' column
      //   .select('role')
      //   .eq('user_id', data.user.id)
      //   .single();
      //
      // if (profileError || !userProfile || userProfile.role !== 'admin_principal') { // Or your admin role name
      //   await supabase.auth.signOut(); // Sign out if not an admin
      //   console.error('Acesso negado. Requer privilégios de administrador.');
      //   // toast({ title: "Acesso Negado", description: "Você não possui privilégios de administrador.", variant: "destructive" });
      //   setIsLoading(false);
      //   return;
      // }

      console.log('Login administrativo bem-sucedido:', data.user);
      // toast({ title: "Login bem-sucedido!", description: "Redirecionando para a área administrativa..."});
      router.push('/admin/usuarios'); 
    } catch (error: any) {
      console.error('Admin login failed unexpectedly:', error.message);
      // toast({ title: "Erro no Login Administrativo", description: "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
    */

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated admin login finished');
    setIsLoading(false);
    router.push('/admin/usuarios'); // Redirect to user management page
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
