import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../lib/api";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { Button, Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Input, Textarea } from "@/ui";

type ContactInput = {name: string; email: string; message: string};
type ContactResponse = {id: number};
type ContactErrors = {error: string; fields: Partial<Record<keyof ContactInput, string>>};

export function Contact() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ContactInput>({defaultValues: { name:"", email:"", message:"" }});
  const busy = form.formState.isSubmitting;
  useEffect(() => {
    if (user) {
      if (!form.getFieldState("name").isDirty) form.setValue("name",user.name);
      if (!form.getFieldState("email").isDirty) form.setValue("email",user.email);
    }
  }, [user, form]);

  async function submit(data: ContactInput) {
    setError(null);
    try {
      await api<ContactResponse>("/api/contact",{method:"POST",body:JSON.stringify(data)});
      setSuccess(true);
      toast.success("Message received.");
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        try {
          const body = JSON.parse(e.body) as ContactErrors;
          for (const field of ["name", "email", "message"] as const) if (body.fields?.[field]) form.setError(field,{message:body.fields[field]}, {shouldFocus:true});
          setError("Please check the highlighted fields.");
          return;
        } catch { /* Unparseable error still shows a recoverable form message. */ }
      }
      setError(e instanceof ApiError && e.status === 429 ? "Too many messages. Please wait a few minutes before trying again." : "Could not send your message. Your text is still here; please try again.");
    }
  }
  return <div className="public-page"><PublicHeader /><main className="site-container contact-main" id="main-content">
    <div className="contact-introduction"><h1>Get in touch.</h1><p>Questions about your account or getting started? Send us a message.</p></div>
    {success ? <section className="contact-success" role="status"><h2>Message received.</h2><p>Thanks for getting in touch.</p><Button variant="outline" onClick={()=>{setSuccess(false);form.reset({name:user?.name || "",email:user?.email || "",message:""});}}>Send another message</Button></section> : <Form {...form}><form className="clearline-form" onSubmit={form.handleSubmit(submit)} noValidate aria-busy={busy}>
      <FormField control={form.control} name="name" rules={{validate:v => v.trim().length > 0 || "Enter your name.",maxLength:{value:100,message:"Use no more than 100 characters."}}} render={({field})=><FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} required autoComplete="name" maxLength={100} disabled={busy} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="email" rules={{required:"Enter your email address.",pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:"Enter a valid email address."},maxLength:{value:254,message:"Use no more than 254 characters."}}} render={({field})=><FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} required type="email" autoComplete="email" maxLength={254} disabled={busy} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="message" rules={{validate:v => v.trim().length > 0 || "Enter your message.",maxLength:{value:5000,message:"Use no more than 5,000 characters."}}} render={({field})=><FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} required maxLength={5000} rows={6} disabled={busy} /></FormControl><FormMessage /></FormItem>} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><Button className="contact-send" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button><p className="supporting">Your message is saved securely. No email is sent automatically.</p></div>
    </form></Form>}
  </main><PublicFooter /></div>;
}
