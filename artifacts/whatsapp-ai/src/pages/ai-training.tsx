import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAiConfig,
  useUpdateAiConfig,
  useListFaqs,
  useCreateFaq,
  useUpdateFaq,
  useDeleteFaq,
  getGetAiConfigQueryKey,
  getListFaqsQueryKey,
} from "@workspace/api-client-react";
import { BrainCircuit, Plus, Pencil, Trash2, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "professional", label: "Professional", desc: "Formal and precise" },
  { value: "sales-focused", label: "Sales-focused", desc: "Convert and upsell" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
];

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

function FaqForm({ onSuccess, defaultValues, faqId }: { onSuccess: () => void; defaultValues?: { question: string; answer: string }; faqId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const form = useForm({ resolver: zodResolver(faqSchema), defaultValues: defaultValues ?? { question: "", answer: "" } });

  function onSubmit(values: { question: string; answer: string }) {
    const action = faqId
      ? update.mutateAsync({ id: faqId, data: values })
      : create.mutateAsync({ data: values });
    action.then(() => {
      queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() });
      toast({ title: faqId ? "FAQ updated" : "FAQ added" });
      onSuccess();
    }).catch(() => toast({ title: "Error", variant: "destructive" }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="question" render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl><Input placeholder="What are your delivery charges?" {...field} data-testid="input-faq-question" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="answer" render={({ field }) => (
          <FormItem>
            <FormLabel>Answer</FormLabel>
            <FormControl><Textarea rows={4} placeholder="We offer free delivery on orders over $50..." {...field} data-testid="textarea-faq-answer" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={create.isPending || update.isPending} data-testid="button-save-faq">
          {faqId ? "Update FAQ" : "Add FAQ"}
        </Button>
      </form>
    </Form>
  );
}

export default function AiTraining() {
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<{ id: number; question: string; answer: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useGetAiConfig();
  const { data: faqs, isLoading: faqsLoading } = useListFaqs();
  const updateConfig = useUpdateAiConfig();
  const deleteFaq = useDeleteFaq();

  function setTone(tone: string) {
    updateConfig.mutate(
      { data: { tone } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAiConfigQueryKey() }); toast({ title: "Tone updated" }); },
        onError: () => toast({ title: "Error", variant: "destructive" }),
      }
    );
  }

  function setEnabled(enabled: boolean) {
    updateConfig.mutate(
      { data: { enabled } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAiConfigQueryKey() }); toast({ title: `AI ${enabled ? "enabled" : "disabled"}` }); },
      }
    );
  }

  function setConfidence(val: number[]) {
    updateConfig.mutate(
      { data: { confidenceThreshold: val[0] } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAiConfigQueryKey() }) }
    );
  }

  function saveInstructions(instructions: string) {
    updateConfig.mutate(
      { data: { customInstructions: instructions } },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetAiConfigQueryKey() }); toast({ title: "Instructions saved" }); } }
    );
  }

  function handleDeleteFaq(id: number) {
    if (!confirm("Delete this FAQ?")) return;
    deleteFaq.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey() }); toast({ title: "FAQ deleted" }); },
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Training</h1>
        <p className="text-muted-foreground">Configure how your AI assistant responds to customers.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Toggle + Tone */}
          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> AI Assistant</CardTitle>
                <CardDescription>Enable or disable the AI for all conversations.</CardDescription>
              </div>
              {configLoading ? <Skeleton className="h-6 w-12" /> : (
                <Switch
                  checked={config?.enabled ?? true}
                  onCheckedChange={setEnabled}
                  data-testid="switch-ai-enabled"
                />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Response Tone</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "text-left p-3 rounded-lg border transition-all",
                        config?.tone === t.value
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-background/50 hover:bg-secondary/30 text-muted-foreground"
                      )}
                      data-testid={`tone-${t.value}`}
                    >
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Confidence Threshold: <span className="text-primary">{config ? Math.round(config.confidenceThreshold * 100) : 75}%</span>
                </Label>
                <Slider
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={[config?.confidenceThreshold ?? 0.75]}
                  onValueCommit={setConfidence}
                  className="mt-2"
                  data-testid="slider-confidence"
                />
                <p className="text-xs text-muted-foreground mt-1">AI escalates to human when confidence drops below this threshold.</p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Custom Instructions</CardTitle>
              <CardDescription>Tell the AI how to behave for your specific business.</CardDescription>
            </CardHeader>
            <CardContent>
              {configLoading ? <Skeleton className="h-28 w-full" /> : (
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    defaultValue={config?.customInstructions ?? ""}
                    placeholder="e.g. Always greet customers by name. Escalate refund requests to human agent..."
                    id="custom-instructions"
                    data-testid="textarea-custom-instructions"
                  />
                  <Button
                    onClick={() => {
                      const val = (document.getElementById("custom-instructions") as HTMLTextAreaElement)?.value;
                      saveInstructions(val);
                    }}
                    data-testid="button-save-instructions"
                  >
                    Save Instructions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> FAQs</CardTitle>
                <CardDescription>Pre-defined answers the AI will use for common questions.</CardDescription>
              </div>
              <Dialog open={faqDialogOpen} onOpenChange={(v) => { setFaqDialogOpen(v); if (!v) setEditFaq(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditFaq(null)} data-testid="button-add-faq">
                    <Plus className="h-4 w-4 mr-1" /> Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>{editFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
                  <FaqForm
                    faqId={editFaq?.id}
                    defaultValues={editFaq ? { question: editFaq.question, answer: editFaq.answer } : undefined}
                    onSuccess={() => setFaqDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {faqsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : !faqs?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No FAQs yet. Add your first FAQ to train the AI.</div>
              ) : (
                <div className="space-y-2">
                  {faqs.map(faq => (
                    <div key={faq.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 bg-background/30" data-testid={`faq-${faq.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-faq-${faq.id}`}
                          onClick={() => { setEditFaq({ id: faq.id, question: faq.question, answer: faq.answer }); setFaqDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-faq-${faq.id}`}
                          onClick={() => handleDeleteFaq(faq.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prompt Preview */}
        <div>
          <Card className="glass-panel sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Prompt Preview</CardTitle>
              <CardDescription className="text-xs">How the AI is currently configured.</CardDescription>
            </CardHeader>
            <CardContent>
              {configLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="rounded-lg bg-background/50 border border-border p-4 text-xs text-muted-foreground font-mono leading-relaxed space-y-2">
                  <p className="text-primary font-semibold">[System Prompt]</p>
                  <p>{config?.promptPreview ?? "You are a helpful AI assistant for a business on WhatsApp."}</p>
                  <p className="text-primary font-semibold mt-3">[Tone]</p>
                  <p className="capitalize">{config?.tone ?? "friendly"}</p>
                  <p className="text-primary font-semibold mt-3">[Confidence]</p>
                  <p>{config ? Math.round(config.confidenceThreshold * 100) : 75}% threshold</p>
                  {config?.customInstructions && (
                    <>
                      <p className="text-primary font-semibold mt-3">[Custom Rules]</p>
                      <p className="line-clamp-4">{config.customInstructions}</p>
                    </>
                  )}
                  <p className="text-primary font-semibold mt-3">[FAQs loaded]</p>
                  <p>{faqs?.length ?? 0} Q&A pairs</p>
                </div>
              )}
              <Badge className="mt-3 bg-primary/10 text-primary border-primary/20 w-full justify-center" variant="outline" data-testid="badge-ai-status">
                <BrainCircuit className="h-3 w-3 mr-1" /> {config?.enabled ? "AI Active" : "AI Disabled"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
