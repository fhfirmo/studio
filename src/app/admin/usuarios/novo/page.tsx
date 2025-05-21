
"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, XCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast"; // Uncommented

const userProfiles = [
  { value: "administrador", label: "Administrador" },
  { value: "operador", label: "Operador" },
  { value: "cliente", label: "Cliente" },
  // In a real app, these might come from a Supabase table: public.PerfisAcesso
];

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { toast } = useToast(); // Uncommented
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
    instituicao: '',
    senha: '',
    confirmarSenha: '',
    perfil: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    console.log("NovoUsuarioPage: Attempting to submit form data:", formData);

    // Client-side validation
    if (!formData.nomeCompleto || !formData.email || !formData.senha || !formData.confirmarSenha || !formData.perfil || !formData.cpf) {
      console.error("NovoUsuarioPage: Validation Error - Todos os campos marcados com * são obrigatórios.");
      toast({ title: "Campos Obrigatórios", description: "Por favor, preencha todos os campos marcados com *.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      console.error("NovoUsuarioPage: Validation Error - As senhas não coincidem.");
      toast({ title: "Erro de Senha", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.senha.length < 8) {
        console.error("NovoUsuarioPage: Validation Error - A senha deve ter no mínimo 8 caracteres.");
        toast({ title: "Senha Curta", description: "A senha deve ter no mínimo 8 caracteres.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!supabase) {
      console.error("NovoUsuarioPage: Supabase client not initialized. Check environment variables.");
      toast({ title: "Erro de Configuração", description: "Não foi possível conectar ao serviço de autenticação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      console.log("NovoUsuarioPage: Attempting supabase.auth.signUp for email:", formData.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        // options: { data: { full_name: formData.nomeCompleto, role: formData.perfil } } // You can pass metadata here
      });

      if (authError) {
        console.error('NovoUsuarioPage: Erro no cadastro (Supabase Auth):', authError.message);
        toast({ title: "Erro no Cadastro (Auth)", description: authError.message, variant: "destructive" });
        setIsLoading(false); // Stop loading on auth error
        return; 
      }

      console.log('NovoUsuarioPage: Usuário criado no Supabase Auth:', authData);

      if (authData.user) {
        console.log('NovoUsuarioPage: Usuário ID:', authData.user.id, "Tentando salvar perfil...");
        // 2. If auth successful, save other user info to 'profiles' table
        // Assumes 'profiles' table columns: id (FK to auth.users), email, full_name, cpf, instituicao, role
        const profilePayload = {
            id: authData.user.id, // Link to the auth user
            email: formData.email,
            full_name: formData.nomeCompleto, // Ensure this matches your DB column name
            cpf: formData.cpf,
            instituicao: formData.instituicao || null, // Ensure nullable fields are handled
            role: formData.perfil,                 // Ensure this matches your DB column name
          };
        console.log("NovoUsuarioPage: Payload para tabela 'profiles':", profilePayload);

        const { error: profileError } = await supabase
          .from('profiles') // Ensure this is your exact table name
          .insert(profilePayload);

        if (profileError) {
          console.error('NovoUsuarioPage: Erro ao salvar perfil do usuário no DB:', profileError.message, "Detalhes:", profileError);
          // IMPORTANT: In a production app, you might want to delete the authData.user
          // if profile creation fails to avoid orphaned auth users. This requires admin privileges for supabase.auth.admin.deleteUser().
          toast({ title: "Erro ao Salvar Perfil", description: `Usuário autenticado, mas falha ao salvar perfil: ${profileError.message}. Verifique o console para detalhes.`, variant: "destructive" });
          setIsLoading(false); // Stop loading on profile error
          return; 
        }
        console.log('NovoUsuarioPage: Perfil do usuário salvo com sucesso na tabela "profiles".');
        toast({ title: "Usuário Cadastrado!", description: "Novo usuário adicionado. Verifique o e-mail para confirmação (se habilitado)." });
        router.push('/admin/usuarios');
      } else if (authData.session === null && !authData.user) {
        // This case can happen if "Confirm email" is enabled in Supabase Auth settings.
        // The user is created, but session is null until email confirmation.
        console.warn('NovoUsuarioPage: Cadastro no Auth requer confirmação por e-mail. O usuário foi criado, mas a sessão não foi iniciada.');
        toast({ title: "Cadastro Enviado", description: "Verifique seu e-mail para confirmar o cadastro e ativar sua conta.", duration: 5000 });
        // You might not want to redirect immediately to /admin/usuarios if email confirmation is pending.
        // Redirecting to login or a specific message page might be better.
        router.push('/login'); // Or a page like '/confirm-email-message'
      } else {
        // Fallback for unexpected authData structure
        console.warn('NovoUsuarioPage: auth.signUp sucesso, mas authData.user está nulo e sessão não é nula. Resposta:', authData);
        toast({ title: "Cadastro Concluído", description: "Verifique o status do usuário.", variant: "default" });
        router.push('/admin/usuarios');
      }

    } catch (error: any) {
      console.error('NovoUsuarioPage: Falha inesperada ao cadastrar usuário:', error.message);
      toast({ title: "Erro ao Cadastrar Usuário", description: "Ocorreu um erro inesperado. Verifique o console.", variant: "destructive" });
    } finally {
      // Only set isLoading to false here if no navigation occurred,
      // or if an error specifically requires the form to remain active.
      // If a redirect is happening, isLoading will be implicitly handled by unmount.
      // For safety, let's ensure it's set if we haven't navigated.
      if (router.asPath === '/admin/usuarios/novo') { // Check if still on the same page
         setIsLoading(false);
      }
    }
  };

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

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Dados pessoais, credenciais e perfil de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label>
                <Input
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00" 
                  required
                  // TODO: Consider adding a CPF mask library for better UX
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instituicao">Instituição</Label>
                <Input
                  id="instituicao"
                  name="instituicao"
                  value={formData.instituicao}
                  onChange={handleChange}
                  placeholder="Nome da instituição (opcional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="senha">Senha <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
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
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha <span className="text-destructive">*</span></Label>
                 <div className="relative">
                  <Input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Repita a senha"
                    required
                  />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    onClick={toggleShowConfirmPassword}
                    aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil/Nível de Acesso <span className="text-destructive">*</span></Label>
              <Select name="perfil" value={formData.perfil} onValueChange={(value) => handleSelectChange('perfil', value)} required>
                <SelectTrigger id="perfil">
                  <SelectValue placeholder="Selecione o perfil do usuário" />
                </SelectTrigger>
                <SelectContent>
                  {userProfiles.map(profile => (
                    <SelectItem key={profile.value} value={profile.value}>{profile.label}</SelectItem>
                  ))}
                  {/* Supabase: Options could be loaded from public.PerfisAcesso */}
                </SelectContent>
              </Select>
            </div>
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
      {/*
        Supabase Integration:
        - On submit:
          1. Call supabase.auth.signUp({ email, password }) to create the user in Supabase Auth.
          2. If signUp is successful and authData.user exists:
             - Get the authData.user.id.
             - Insert a new row into your public."profiles" table (or equivalent user metadata table).
             - This row should include:
               - id (which is authData.user.id)
               - email (formData.email)
               - full_name (formData.nomeCompleto) // Ensure this matches your DB column name
               - cpf (formData.cpf)
               - instituicao (formData.instituicao)
               - role (formData.perfil) // Ensure this matches your DB column name
          3. Handle errors from both signUp and the profile table insert.
          4. If email confirmation is enabled in Supabase Auth, the user is created but session might be null.
             The profile row should still be created.
        - Ensure RLS policies on "profiles" table allow inserts for new users (e.g., policy check: auth.uid() = id).
      */}
    </div>
  );
}

    