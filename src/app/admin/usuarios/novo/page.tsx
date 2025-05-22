
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Ensure these values match your public.profiles.role CHECK constraint
const userProfiles = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operador" },
  { value: "client", label: "Cliente" },
];

const formSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  cpf: z.string().min(11, { message: "CPF deve ter de 11 a 14 caracteres." }).max(14, { message: "CPF deve ter de 11 a 14 caracteres."}),
  institution: z.string().optional(),
  senha: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
  confirmarSenha: z.string().min(8, { message: "A confirmação de senha deve ter no mínimo 8 caracteres." }),
  perfil: z.string({ required_error: "Selecione um perfil." }).min(1, {message: "Selecione um perfil."})
}).refine(data => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

type UserFormValues = z.infer<typeof formSchema>;

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  let navigatedAway = false;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      email: '',
      cpf: '',
      institution: '',
      senha: '',
      confirmarSenha: '',
      perfil: '',
    },
  });

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true);
    navigatedAway = false;
    console.log("NovoUsuarioPage: onSubmit initiated. isLoading: true. FormData:", data);

    if (!supabase) {
      console.error("NovoUsuarioPage: Supabase client not initialized.");
      toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      console.log("NovoUsuarioPage: Attempting supabase.auth.signUp for email:", data.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        // options: { data: { full_name: data.nomeCompleto, role: data.perfil } } // metadata can be added here but profile table is more robust
      });
      console.log("NovoUsuarioPage: supabase.auth.signUp completed. Error:", authError, "AuthData User:", authData?.user);

      if (authError) {
        console.error('NovoUsuarioPage: Erro no cadastro (Supabase Auth):', authError.message);
        toast({ title: "Erro no Cadastro (Auth)", description: authError.message, variant: "destructive" });
        return;
      }

      if (authData.user) {
        console.log("NovoUsuarioPage: Usuário criado no Auth. ID:", authData.user.id);
        console.log("NovoUsuarioPage: Current logged-in admin UID (for RLS context check, if needed):", (await supabase.auth.getUser()).data.user?.id);
        console.log("NovoUsuarioPage: Tentando salvar perfil para o novo usuário ID:", authData.user.id);

        const profilePayload = {
            id: authData.user.id, // ID from the NEWLY created auth user
            full_name: data.nomeCompleto,
            cpf: data.cpf,
            institution: data.institution || null, // Matches DB column name
            role: data.perfil, // e.g., 'admin', 'operator', 'client'
        };
        console.log("NovoUsuarioPage: Payload para tabela 'profiles':", profilePayload);

        console.log("NovoUsuarioPage: Attempting supabase.from('profiles').insert()");
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profilePayload);
        console.log("NovoUsuarioPage: supabase.from('profiles').insert() completed. Error:", profileError);

        if (profileError) {
          console.error('NovoUsuarioPage: Erro ao salvar perfil do usuário no DB:', profileError.message, "Detalhes:", profileError);
          toast({ title: "Erro ao Salvar Perfil", description: `Usuário autenticado, mas falha ao salvar perfil: ${profileError.message}. Verifique o console. IMPORTANTE: Verifique as RLS policies da tabela 'profiles' para INSERT. Um admin (auth.uid()) precisa ter permissão para inserir um perfil para um novo ID (payload.id).`, variant: "destructive", duration: 10000 });
          return; 
        }
        console.log('NovoUsuarioPage: Perfil do usuário salvo com sucesso na tabela "profiles".');
        toast({ title: "Usuário Cadastrado!", description: "Novo usuário adicionado com sucesso. Se a confirmação de e-mail estiver ativa, peça para o usuário verificar seu e-mail." });
        navigatedAway = true;
        router.push('/admin/usuarios');

      } else if (!authData.user && !authData.session && authData.user === null) { 
        // This case usually means email confirmation is required by Supabase Auth settings
        // The user is created in auth.users but is in an unconfirmed state.
        // You might still want to create a profile entry, or handle it after confirmation.
        // For simplicity, we'll assume profile creation is attempted. If an ID is available (even if user is null due to unconfirmed state, some Supabase versions might provide it in response to signUp)
        // However, usually authData.user will be populated if signUp itself didn't error out.
        // The most common scenario for `authData.user` being null but no error from `signUp` is email confirmation.
        console.warn('NovoUsuarioPage: Cadastro no Auth requer confirmação por e-mail ou signUp não retornou um usuário. O usuário foi criado no Auth, mas a sessão não foi iniciada.');
        toast({ title: "Cadastro Enviado", description: "Verifique o e-mail do novo usuário para confirmar o cadastro, se a confirmação estiver habilitada.", duration: 7000 });
        navigatedAway = true;
        router.push('/admin/usuarios'); 
      } else {
        console.warn('NovoUsuarioPage: auth.signUp sucesso, mas authData.user está nulo e/ou sessão inesperada. Resposta:', authData);
        toast({ title: "Cadastro Concluído com Observação", description: "Verifique o status do usuário na lista e o console para detalhes. Pode ser necessária confirmação de e-mail." });
      }

    } catch (error: any) {
      console.error('NovoUsuarioPage: Falha inesperada ao cadastrar usuário:', error.message, error);
      toast({ title: "Erro ao Cadastrar Usuário", description: "Ocorreu um erro inesperado. Verifique o console.", variant: "destructive" });
    } finally {
      console.log("NovoUsuarioPage: onSubmit finally block. Navigated away:", navigatedAway);
      if (!navigatedAway) {
        console.log("NovoUsuarioPage: Still on page, setting isLoading to false.");
        setIsLoading(false);
      }
    }
  }

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserPlus className="mr-3 h-8 w-8" /> Cadastrar Novo Usuário
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/usuarios">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar um novo usuário ao sistema.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
              <CardDescription>Dados pessoais, credenciais e perfil de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nomeCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do usuário" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instituição</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da instituição (opcional)" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" {...field} disabled={isLoading} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                            onClick={toggleShowPassword}
                            aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmarSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" {...field} disabled={isLoading} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                            onClick={toggleShowConfirmPassword}
                            aria-label={showConfirmPassword ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"}
                            disabled={isLoading}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil/Nível de Acesso <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil do usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userProfiles.map(profile => (
                          <SelectItem key={profile.value} value={profile.value}>{profile.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/usuarios')} disabled={isLoading}>
                <XCircle className="mr-2 h-5 w-5" /> Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Usuário'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

/*
Supabase Integration Notes:
- Ensure RLS policy on `public.profiles` allows an admin to insert a profile for a new user.
  Example RLS policy for INSERT on `profiles` for an admin:
  CREATE POLICY "Admins can insert new user profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );
  (Adjust 'admin' if your admin role is named differently in your `profiles` table).
- Ensure the `profiles` table schema matches the `profilePayload` (id, full_name, cpf, institution, role).
- The `id` in `profiles` MUST be a foreign key to `auth.users.id`.
*/

