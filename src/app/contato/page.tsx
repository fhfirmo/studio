"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder for form submission logic
    console.log('Form data submitted:', formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Mensagem Enviada!",
      description: "Obrigado por entrar em contato. Responderemos em breve.",
      variant: "default", 
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Entre em Contato</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Estamos aqui para ajudar. Envie-nos uma mensagem ou utilize um dos nossos canais de comunicação.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
            <CardDescription>Preencha o formulário abaixo e retornaremos o mais breve possível.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                  placeholder="Seu nome" 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  placeholder="seu@email.com" 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  required 
                  placeholder="Assunto da mensagem" 
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea 
                  id="message" 
                  name="message" 
                  value={formData.message}
                  onChange={handleChange}
                  required 
                  rows={5} 
                  placeholder="Digite sua mensagem aqui..." 
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Endereço</h3>
                  <p className="text-muted-foreground">Av. Exemplo, 123 - Sala 45</p>
                  <p className="text-muted-foreground">Cidade Exemplo, Estado - CEP 00000-000</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <a href="mailto:contato@inbm.com.br" className="text-muted-foreground hover:text-primary">contato@inbm.com.br</a>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-6 w-6 text-primary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Telefone</h3>
                  <a href="tel:+5511999999999" className="text-muted-foreground hover:text-primary">(11) 99999-9999</a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Placeholder for a map if needed */}
          <Card className="shadow-md overflow-hidden">
             <CardHeader>
              <CardTitle className="text-xl">Nossa Localização</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center">
                 <p className="text-muted-foreground">Mapa interativo aqui (e.g., Google Maps)</p>
                 {/* Example: <iframe src="google_maps_embed_url" width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy"></iframe> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
