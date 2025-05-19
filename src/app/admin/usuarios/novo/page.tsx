
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
// import { useToast } from "@/hooks/use-toast"; // Uncomment if toasts are needed

const userProfiles = [
  { value: "administrador", label: "Administrador" },
  { value: "operador", label: "Operador" },
  { value: "cliente", label: "Cliente" },
];

export default function NovoUsuarioPage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
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

    // Client-side validation placeholder
    if (!formData.nomeCompleto || !formData.email || !formData.senha || !formData.confirmarSenha || !formData.perfil || !formData.cpf) {
      console.error("Validação: Todos os campos marcados com * são obrigatórios.");
      // toast({ title: "Campos Obrigatórios", description: "Por favor, preencha todos os campos marcados com *.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      console.error("Validação: As senhas não coincidem.");
      // toast({ title: "Erro de Senha", description: "As senhas não coincidem.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Placeholder for password strength validation (e.g., minimum length)
    if (formData.senha.length < 8) {
        console.error("Validação: A senha deve ter no mínimo 8 caracteres.");
        // toast({ title: "Senha Curta", description: "A senha deve ter no mínimo 8 caracteres.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    console.log('Form data to be submitted:', formData);

    // Placeholder for Supabase API call
    // 1. Create user with Supabase Auth (email, password)
    // try {
    //   const { data: authData, error: authError } = await supabase.auth.signUp({
    //     email: formData.email,
    //     password: formData.senha,
    //   });
    //   if (authError) throw authError;
    //   
    //   // 2. If auth successful, save other user info (nomeCompleto, perfil, cpf, instituicao) to a 'profiles' table or similar,
    //   //    associating it with the authData.user.id
    //   const { data: profileData, error: profileError } = await supabase
    //     .from('profiles') // Replace 'profiles' with your actual table name
    //     .insert([{ 
    //        user_id: authData.user.id, 
    //        nome_completo: formData.nomeCompleto, 
    //        email: formData.email, // Often good to store email in profiles table too
    //        cpf: formData.cpf,
    //        instituicao: formData.instituicao,
    //        perfil: formData.perfil 
    //     }])
    //     .select();
    //   if (profileError) throw profileError;
    //
    //   console.log('User created successfully:', authData, profileData);
    //   // toast({ title: "Usuário Cadastrado!", description: "O novo usuário foi adicionado com sucesso." });
    //   // router.push('/admin/usuarios');
    // } catch (error: any) {
    //   console.error('Failed to create user:', error.message);
    //   // toast({ title: "Erro ao Cadastrar Usuário", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated user creation finished');
    // toast({ title: "Usuário Cadastrado! (Simulado)", description: "O novo usuário foi adicionado com sucesso." });
    setIsLoading(false);
    router.push('/admin/usuarios'); 
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
                  placeholder="000.000.000-00" // Placeholder for CPF mask
                  required
                />
                {/* Comment: Consider using a library like 'react-input-mask' for CPF formatting */}
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
                {/* Comment: Add password strength indicator here */}
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

    