import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { Settings as SettingsIcon, BrainCircuit, Clock, MessageSquare, Globe, DollarSign } from "lucide-react";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (AED)" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal (SAR)" },
  { code: "EGP", symbol: "E£", label: "Egyptian Pound (EGP)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (INR)" },
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee (PKR)" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (NGN)" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real (BRL)" },
  { code: "MXN", symbol: "$", label: "Mexican Peso (MXN)" },
  { code: "ZAR", symbol: "R", label: "South African Rand (ZAR)" },
  { code: "TRY", symbol: "₺", label: "Turkish Lira (TRY)" },
  { code: "IDR", symbol: "Rp", label: "Indonesian Rupiah (IDR)" },
  { code: "PHP", symbol: "₱", label: "Philippine Peso (PHP)" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit (MYR)" },
  { code: "THB", symbol: "฿", label: "Thai Baht (THB)" },
  { code: "VND", symbol: "₫", label: "Vietnamese Dong (VND)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (JPY)" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan (CNY)" },
  { code: "KRW", symbol: "₩", label: "South Korean Won (KRW)" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (AUD)" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc (CHF)" },
  { code: "RUB", symbol: "₽", label: "Russian Ruble (RUB)" },
  { code: "PLN", symbol: "zł", label: "Polish Złoty (PLN)" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona (SEK)" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone (NOK)" },
  { code: "DKK", symbol: "kr", label: "Danish Krone (DKK)" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna (CZK)" },
];

const settingsSchema = z.object({
  globalAiEnabled: z.boolean(),
  autoHandoverSensitivity: z.string(),
  responseDelaySeconds: z.coerce.number().min(0).max(60),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  autoGreetingMessage: z.string().optional(),
  autoAwayMessage: z.string().optional(),
  language: z.string(),
  currency: z.string(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      globalAiEnabled: true,
      autoHandoverSensitivity: "medium",
      responseDelaySeconds: 2,
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      autoGreetingMessage: "",
      autoAwayMessage: "",
      language: "en",
      currency: "USD",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        globalAiEnabled: settings.globalAiEnabled,
        autoHandoverSensitivity: settings.autoHandoverSensitivity,
        responseDelaySeconds: settings.responseDelaySeconds,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        autoGreetingMessage: settings.autoGreetingMessage ?? "",
        autoAwayMessage: settings.autoAwayMessage ?? "",
        language: settings.language,
        currency: settings.currency ?? "USD",
      });
    }
  }, [settings, form]);

  function onSubmit(values: SettingsValues) {
    updateSettings.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Settings saved" });
        },
        onError: () => toast({ title: "Error saving settings", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure global platform behavior and preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* AI Settings */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="h-5 w-5 text-primary" /> AI Automation</CardTitle>
              <CardDescription>Control AI behavior globally across all conversations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="globalAiEnabled" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="text-sm font-medium">Global AI Enable</FormLabel>
                    <FormDescription className="text-xs text-muted-foreground mt-0.5">Turn AI on or off for all conversations at once.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-global-ai" />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="autoHandoverSensitivity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Handover Sensitivity</FormLabel>
                  <FormDescription className="text-xs text-muted-foreground">How quickly AI escalates to a human agent.</FormDescription>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sensitivity">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low — Only escalate on strong signals</SelectItem>
                      <SelectItem value="medium">Medium — Balanced escalation</SelectItem>
                      <SelectItem value="high">High — Escalate quickly on any frustration</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="responseDelaySeconds" render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Delay: <span className="text-primary">{field.value}s</span></FormLabel>
                  <FormDescription className="text-xs text-muted-foreground">Simulated human-like pause before AI replies.</FormDescription>
                  <FormControl>
                    <Slider
                      min={0}
                      max={30}
                      step={1}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                      data-testid="slider-delay"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-5 w-5 text-primary" /> Working Hours</CardTitle>
              <CardDescription>Set when the AI is active. Outside these hours, auto-away message is sent.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="workingHoursStart" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl><Input type="time" {...field} data-testid="input-hours-start" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="workingHoursEnd" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl><Input type="time" {...field} data-testid="input-hours-end" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Auto Messages */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-5 w-5 text-primary" /> Auto Messages</CardTitle>
              <CardDescription>Automatic messages sent for specific triggers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="autoGreetingMessage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Greeting Message</FormLabel>
                  <FormDescription className="text-xs">Sent when a new customer starts a conversation.</FormDescription>
                  <FormControl>
                    <Textarea rows={3} placeholder="Hello! Welcome to our store..." {...field} data-testid="textarea-greeting" />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="autoAwayMessage" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Away Message</FormLabel>
                  <FormDescription className="text-xs">Sent outside working hours.</FormDescription>
                  <FormControl>
                    <Textarea rows={3} placeholder="We're currently away..." {...field} data-testid="textarea-away" />
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Language & Currency */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5 text-primary" /> Language & Currency</CardTitle>
              <CardDescription>Set the language for AI replies and the currency for product prices.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="language" render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="tr">Turkish</SelectItem>
                      <SelectItem value="id">Indonesian</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="font-mono text-primary mr-2">{c.symbol}</span>{c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={updateSettings.isPending} data-testid="button-save-settings">
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
