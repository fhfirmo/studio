
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCog, Save, XCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const userProfiles = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operador" },
  { value: "client", label: "Cliente" },
];

const formSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "E-mail inválido." }), // Will be read-only
  cpf: z.string().min(11, { message: "CPF deve ter 11 a 14 caracteres." }).max(14, { message: "CPF deve ter 11 a 14 caracteres."}),
  institution: z.string().optional(),
  perfil: z.string({ required_error: "Selecione um perfil."}).min(1, { message: "Selecione um perfil."}),
  changePassword: z.boolean().optional(),
  novaSenha: z.string().optional(),
  confirmarNovaSenha: z.string().optional(),
}).refine(data => {
  if (data.changePassword) {
    return data.novaSenha && data.novaSenha.length >= 8;
  }
  return true;
}, {
  message: "Nova senha deve ter no mínimo 8 caracteres.",
  path: ["novaSenha"],
}).refine(data => {
  if (data.changePassword) {
    return data.novaSenha === data.confirmarNovaSenha;
  }
  return true;
}, {
  message: "As senhas não coincidem.",
  path: ["confirmarNovaSenha"],
});

type UserFormValues = z.infer<typeof formSchema>;

interface ProfileData {
    id: string;
    full_name: string | null;
    email?: string | null; // email might come from auth user
    cpf: string | null;
    institution: string | null;
    role: string | null;
}


export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [userFound, setUserFound] = useState<boolean | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');


  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      email: '',
      cpf: '',
      institution: '',
      perfil: '',
      changePassword: false,
      novaSenha: '',
      confirmarNovaSenha: '',
    },
  });

  const watchChangePassword = form.watch("changePassword");

  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        setIsLoading(true);
        setUserFound(null);

        if (!supabase) {
          toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
          setIsLoading(false);
          setUserFound(false);
          return;
        }
        
        try {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, cpf, institution, role')
            .eq('id', userId)
            .single<ProfileData>();

          if (profileError || !profileData) {
            console.error("EditarUsuarioPage: Erro ao buscar perfil do usuário no DB:", profileError?.message);
            toast({ title: "Erro ao Carregar Usuário", description: `Não foi possível carregar os dados do perfil: ${profileError?.message || 'Perfil não encontrado.'}`, variant: "destructive" });
            setUserFound(false);
            setIsLoading(false);
            return;
          }
          
          // Fetch auth user data (primarily for email, which should not change)
          // Note: This is an admin operation and usually requires an Edge Function with service_role key
          // For simplicity here, we assume we might have the email from a previous step or a less secure fetch
          // In a real app, get the user's email securely if needed, or pass it from the list page.
          // For this example, we'll try to get the auth user, but focus on profile data.
          let authUserEmail = '';
          const { data: { user: authUser }, error: authUserError } = await supabase.auth.admin.getUserById(userId);

          if (authUserError && authUserError.message !== 'User not found') {
            console.warn("EditarUsuarioPage: Erro ao buscar usuário do Auth (admin API):", authUserError.message);
            // Not critical if profileData was fetched, but good to know.
          }
          authUserEmail = authUser?.email || 'E-mail não disponível';
          setInitialEmail(authUserEmail);


          form.reset({
            nomeCompleto: profileData.full_name || '',
            email: authUserEmail, // Display email, but it won't be part of the update payload typically
            cpf: profileData.cpf || '',
            institution: profileData.institution || '',
            perfil: profileData.role || '',
            changePassword: false,
            novaSenha: '',
            confirmarNovaSenha: '',
          });
          setUserFound(true);

        } catch (error: any) {
          console.error("EditarUsuarioPage: Falha inesperada ao carregar dados do usuário:", error.message);
          toast({ title: "Erro Crítico", description: "Ocorreu um erro inesperado ao carregar os dados.", variant: "destructive" });
          setUserFound(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserData();
    }
  }, [userId, form, toast]);

  async function onSubmit(data: UserFormValues) {
    if (!userId || !supabase) {
      toast({ title: "Erro", description: "Não é possível salvar. ID do usuário ou Supabase não está disponível.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    let profileUpdateError = null;
    let passwordUpdateError = null;

    try {
      // 1. Update profile data in 'profiles' table
      const profileUpdatePayload = {
        full_name: data.nomeCompleto,
        cpf: data.cpf,
        institution: data.institution || null,
        role: data.perfil,
      };
      console.log("EditarUsuarioPage: Atualizando perfil com payload:", profileUpdatePayload);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdatePayload)
        .eq('id', userId);

      if (updateError) {
        profileUpdateError = updateError;
        throw updateError; // Throw to be caught by the outer catch
      }
      console.log("EditarUsuarioPage: Perfil atualizado com sucesso.");

      // 2. Update password in Supabase Auth if requested
      if (data.changePassword && data.novaSenha) {
        console.log("EditarUsuarioPage: Tentando atualizar senha...");
        // CRITICAL SECURITY NOTE:
        // supabase.auth.updateUser({ password: data.novaSenha }) updates the *CURRENTLY LOGGED-IN USER'S* password.
        // To allow an admin to change *another* user's password, this operation MUST be performed
        // by a Supabase Edge Function using the service_role key and supabase.auth.admin.updateUserById(userId, { password: newPassword }).
        // The following line is a placeholder and WILL NOT WORK correctly for changing another user's password from the client-side as admin.
        toast({ title: "Aviso de Senha", description: "Funcionalidade de alteração de senha para outro usuário requer implementação via Edge Function.", variant: "default", duration: 7000});
        // const { error: passwordError } = await supabase.auth.updateUser({ password: data.novaSenha });
        // For demonstration, we'll assume it would work IF it was the current user OR an Edge function
        // if (passwordError) {
        //   passwordUpdateError = passwordError;
        //   throw passwordError;
        // }
        console.log("EditarUsuarioPage: Solicitação de alteração de senha enviada (simulado/requer Edge Function).");
      }

      toast({ title: "Usuário Atualizado!", description: "Os dados do usuário foram salvos com sucesso." });
      router.push('/admin/usuarios');

    } catch (error: any) {
      console.error("EditarUsuarioPage: Erro ao salvar alterações:", error.message, "Detalhes:", error);
      if (profileUpdateError) {
        toast({ title: "Erro ao Atualizar Perfil", description: `Falha ao salvar perfil: ${profileUpdateError.message}. Verifique o console.`, variant: "destructive" });
      } else if (passwordUpdateError) {
         toast({ title: "Erro ao Atualizar Senha", description: `Falha ao atualizar senha: ${passwordUpdateError.message}. Verifique o console.`, variant: "destructive" });
      } else {
        toast({ title: "Erro ao Salvar", description: `Ocorreu um erro: ${error.message}. Verifique o console.`, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmNewPassword = () => setShowConfirmNewPassword(!showConfirmNewPassword);

  if (isLoading && userFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados do usuário...</div>;
  }

  if (userFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Usuário não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O usuário com o ID "{userId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/usuarios">Voltar para Lista de Usuários</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Editar Usuário: {form.getValues("nomeCompleto") || initialEmail}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/usuarios">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifique os dados do usuário abaixo.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
              <CardDescription>Dados pessoais e perfil de acesso.</CardDescription>
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
                      <FormLabel>E-mail (Identificador)</FormLabel>
                      <FormControl>
                        <Input 
                            type="email" 
                            {...field} 
                            readOnly 
                            className="bg-muted/50 cursor-not-allowed"
                            title="O e-mail é usado como identificador e não pode ser alterado diretamente."
                            disabled={isLoading}
                        />
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
                      <FormLabel>CPF</FormLabel>
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
            
              <FormField
                  control={form.control}
                  name="perfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil/Nível de Acesso <span className="text-destructive">*</span></FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
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

              <div className="space-y-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="changePassword"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer leading-none">
                                Alterar Senha?
                            </FormLabel>
                        </FormItem>
                    )}
                />

                {watchChangePassword && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2 border-l-2 border-primary/20">
                        <FormField
                          control={form.control}
                          name="novaSenha"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nova Senha <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                      type={showNewPassword ? "text" : "password"} 
                                      placeholder="Mínimo 8 caracteres" 
                                      {...field} 
                                      disabled={isLoading}
                                  />
                                  <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                    onClick={toggleShowNewPassword}
                                    aria-label={showNewPassword ? "Esconder nova senha" : "Mostrar nova senha"}
                                    disabled={isLoading}
                                  >
                                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmarNovaSenha"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Nova Senha <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                      type={showConfirmNewPassword ? "text" : "password"} 
                                      placeholder="Repita a nova senha" 
                                      {...field} 
                                      disabled={isLoading}
                                  />
                                  <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                    onClick={toggleShowConfirmNewPassword}
                                    aria-label={showConfirmNewPassword ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"}
                                    disabled={isLoading}
                                  >
                                    {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/usuarios')} disabled={isLoading}>
                <XCircle className="mr-2 h-5 w-5" /> Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !userFound}>
                <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

    