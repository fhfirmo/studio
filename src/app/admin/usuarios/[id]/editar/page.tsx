
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCog, Save, XCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; 

const userProfiles = [
  { value: "admin", label: "Administrador" },      // Changed value
  { value: "operator", label: "Operador" },    // Changed value
  { value: "client", label: "Cliente" },        // Changed value
  { value: "supervisor", label: "Supervisor" }, // Added supervisor option
];

// Placeholder function to fetch user data
async function getUserById(userId: string) {
  console.log(`Fetching user data for ID: ${userId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 500));
  if (userId === "usr_001") {
    return {
      id: "usr_001",
      nomeCompleto: "Administrador Principal",
      email: "admin@inbm.com.br",
      cpf: "111.111.111-11",
      institution: "INBM Matriz", // Changed from instituicao
      perfil: "admin", // Changed from administrador
    };
  }
   if (userId === "usr_002") {
    return {
      id: "usr_002",
      nomeCompleto: "Consultor Firmo",
      email: "consultor.firmo@inbm.com.br",
      cpf: "222.222.222-22",
      institution: "INBM Filial Sul", // Changed from instituicao
      perfil: "operator", // Changed from operador
    };
  }
  return null;
}


export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  // const { toast } = useToast(); 

  const [isLoading, setIsLoading] = useState(false);
  const [userFound, setUserFound] = useState<boolean | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '', 
    cpf: '',
    institution: '', // Changed from instituicao
    perfil: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      getUserById(userId)
        .then(userData => {
          if (userData) {
            setFormData({
              nomeCompleto: userData.nomeCompleto,
              email: userData.email,
              cpf: userData.cpf,
              institution: userData.institution || '', // Changed from instituicao
              perfil: userData.perfil,
              novaSenha: '',
              confirmarNovaSenha: '',
            });
            setUserFound(true);
          } else {
            setUserFound(false);
            // toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch user data:", err);
          setUserFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados do usuário.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setChangePassword(checked);
    if (!checked) {
      setFormData(prev => ({ ...prev, novaSenha: '', confirmarNovaSenha: '' }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formData.nomeCompleto) { 
      console.error("Validação: Nome completo é obrigatório.");
      // toast({ title: "Campo Obrigatório", description: "Nome completo é obrigatório.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (changePassword) {
      if (!formData.novaSenha || !formData.confirmarNovaSenha) {
        console.error("Validação: Nova senha e confirmação são obrigatórias se 'Alterar Senha' estiver marcado.");
        // toast({ title: "Campos de Senha Obrigatórios", description: "Preencha os campos de nova senha e confirmação.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (formData.novaSenha !== formData.confirmarNovaSenha) {
        console.error("Validação: As novas senhas não coincidem.");
        // toast({ title: "Erro de Senha", description: "As novas senhas não coincidem.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (formData.novaSenha.length < 8) {
        console.error("Validação: A nova senha deve ter no mínimo 8 caracteres.");
        // toast({ title: "Nova Senha Curta", description: "A nova senha deve ter no mínimo 8 caracteres.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    const updatePayload: any = {
      full_name: formData.nomeCompleto, // Supabase expects full_name
      cpf: formData.cpf,
      institution: formData.institution, // Changed from instituicao
      role: formData.perfil,
    };

    console.log('Form data to be submitted for update (profiles table):', updatePayload);
    if (changePassword) {
      console.log('New password to be set (separately via Supabase Auth):', formData.novaSenha);
    }

    // Supabase Integration Placeholder:
    // 1. Update user profile in 'profiles' table:
    //    await supabase.from('profiles').update(updatePayload).eq('id', userId);
    // 2. If changePassword is true and formData.novaSenha is set, update password via Supabase Auth:
    //    (This often requires an Edge Function for admin-initiated password changes)
    //    await supabase.auth.updateUser({ password: formData.novaSenha }); // This works for the currently logged-in user

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated user update finished');
    // toast({ title: "Usuário Atualizado! (Simulado)", description: "Os dados do usuário foram salvos com sucesso." });
    setIsLoading(false);
    router.push('/admin/usuarios');
  };

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
            <UserCog className="mr-3 h-8 w-8" /> Editar Usuário: {formData.nomeCompleto}
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

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Dados pessoais e perfil de acesso.</CardDescription>
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
                <Label htmlFor="email">E-mail (Identificador)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly 
                  className="bg-muted/50 cursor-not-allowed"
                  title="O e-mail é usado como identificador e não pode ser alterado diretamente."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição</Label>
                <Input
                  id="institution"
                  name="institution" // Changed from instituicao
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Nome da instituição (opcional)"
                />
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

            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="changePassword"
                        checked={changePassword}
                        onCheckedChange={(checkedState) => handleCheckboxChange(checkedState as boolean)}
                    />
                    <Label htmlFor="changePassword" className="font-medium cursor-pointer">
                        Alterar Senha?
                    </Label>
                </div>

                {changePassword && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2 border-l-2 border-primary/20">
                        <div className="space-y-2">
                            <Label htmlFor="novaSenha">Nova Senha <span className="text-destructive">*</span></Label>
                             <div className="relative">
                                <Input
                                    id="novaSenha"
                                    name="novaSenha"
                                    type={showNewPassword ? "text" : "password"}
                                    value={formData.novaSenha}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                    onClick={toggleShowNewPassword}
                                    aria-label={showNewPassword ? "Esconder nova senha" : "Mostrar nova senha"}
                                >
                                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmarNovaSenha">Confirmar Nova Senha <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <Input
                                    id="confirmarNovaSenha"
                                    name="confirmarNovaSenha"
                                    type={showConfirmNewPassword ? "text" : "password"}
                                    value={formData.confirmarNovaSenha}
                                    onChange={handleChange}
                                    placeholder="Repita a nova senha"
                                />
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                    onClick={toggleShowConfirmNewPassword}
                                    aria-label={showConfirmNewPassword ? "Esconder confirmação de senha" : "Mostrar confirmação de senha"}
                                >
                                    {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/usuarios')} disabled={isLoading}>
              <XCircle className="mr-2 h-5 w-5" /> Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || userFound === false}>
              <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    