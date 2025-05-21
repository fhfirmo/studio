
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
import { useToast } from "@/hooks/use-toast";

const userProfiles = [
  { value: "administrador", label: "Administrador" },
  { value: "operador", label: "Operador" },
  { value: "cliente", label: "Cliente" },
];

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { toast } = useToast();
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
    console.log("NovoUsuarioPage: handleSubmit initiated. isLoading: true. FormData:", formData);

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
      });
      console.log("NovoUsuarioPage: supabase.auth.signUp completed. Error:", authError, "AuthData:", authData);


      if (authError) {
        console.error('NovoUsuarioPage: Erro no cadastro (Supabase Auth):', authError.message);
        toast({ title: "Erro no Cadastro (Auth)", description: authError.message, variant: "destructive" });
        return; 
      }

      console.log('NovoUsuarioPage: Usuário criado/autenticado no Supabase Auth:', authData);

      if (authData.user) {
        console.log('NovoUsuarioPage: Usuário ID:', authData.user.id, ". Tentando salvar perfil na tabela 'profiles'.");
        const profilePayload = {
            id: authData.user.id, 
            // email: formData.email, // Removed as it's in auth.users and causing schema error
            full_name: formData.nomeCompleto, 
            cpf: formData.cpf,
            instituicao: formData.instituicao || null, 
            role: formData.perfil,                 
          };
        console.log("NovoUsuarioPage: Payload para tabela 'profiles':", profilePayload);

        console.log("NovoUsuarioPage: Attempting supabase.from('profiles').insert()");
        const { error: profileError } = await supabase
          .from('profiles') 
          .insert(profilePayload);
        console.log("NovoUsuarioPage: supabase.from('profiles').insert() completed. Error:", profileError);

        if (profileError) {
          console.error('NovoUsuarioPage: Erro ao salvar perfil do usuário no DB:', profileError.message, "Detalhes:", profileError);
          toast({ title: "Erro ao Salvar Perfil", description: `Usuário autenticado, mas falha ao salvar perfil: ${profileError.message}. Verifique o console.`, variant: "destructive" });
          return; 
        }
        console.log('NovoUsuarioPage: Perfil do usuário salvo com sucesso na tabela "profiles". Redirecionando...');
        toast({ title: "Usuário Cadastrado!", description: "Novo usuário adicionado com sucesso." });
        router.push('/admin/usuarios');
      } else if (authData.session === null && !authData.user) {
        console.warn('NovoUsuarioPage: Cadastro no Auth requer confirmação por e-mail. O usuário foi criado, mas a sessão não foi iniciada. Redirecionando para login.');
        toast({ title: "Cadastro Enviado", description: "Verifique seu e-mail para confirmar o cadastro e ativar sua conta.", duration: 5000 });
        router.push('/login'); 
      } else {
        console.warn('NovoUsuarioPage: auth.signUp sucesso, mas authData.user está nulo e sessão não é nula. Resposta:', authData, "Redirecionando...");
        toast({ title: "Cadastro Concluído", description: "Verifique o status do usuário." });
        router.push('/admin/usuarios');
      }

    } catch (error: any) {
      console.error('NovoUsuarioPage: Falha inesperada ao cadastrar usuário:', error.message, error);
      toast({ title: "Erro ao Cadastrar Usuário", description: "Ocorreu um erro inesperado. Verifique o console.", variant: "destructive" });
    } finally {
      console.log("NovoUsuarioPage: handleSubmit finally block. Current path:", router.asPath);
      // Only set isLoading to false if we are still on this page (i.e., an error occurred before navigation).
      if (router.asPath === '/admin/usuarios/novo') {
         console.log("NovoUsuarioPage: Still on /admin/usuarios/novo, setting isLoading to false.");
         setIsLoading(false);
      } else {
         console.log("NovoUsuarioPage: Navigated away from /admin/usuarios/novo, not changing isLoading in finally block.");
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
    </div>
  );
}
