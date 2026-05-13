import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGetBusinessProfile, useUpdateBusinessProfile, getGetBusinessProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Building2 } from "lucide-react";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  workingHours: z.string().optional(),
  contactNumber: z.string().optional(),
  deliveryAvailable: z.boolean().default(false),
  paymentMethods: z.string().optional(),
  returnPolicy: z.string().optional(),
  languages: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Business() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useGetBusinessProfile();
  const updateMutation = useUpdateBusinessProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      category: "",
      description: "",
      address: "",
      workingHours: "Mon-Fri: 9AM-6PM",
      contactNumber: "",
      deliveryAvailable: false,
      paymentMethods: "Cash, Card",
      returnPolicy: "14 days return",
      languages: "English",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        businessName: profile.businessName || "",
        category: profile.category || "",
        description: profile.description || "",
        address: profile.address || "",
        workingHours: profile.workingHours || "",
        contactNumber: profile.contactNumber || "",
        deliveryAvailable: profile.deliveryAvailable || false,
        paymentMethods: profile.paymentMethods || "",
        returnPolicy: profile.returnPolicy || "",
        languages: profile.languages || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Business details saved successfully." });
        queryClient.invalidateQueries({ queryKey: getGetBusinessProfileQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">Configure the core details the AI will use to answer customer questions.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>This information helps the AI understand who you are.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Store" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Retail, Service, Food..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What do you sell or do? Be descriptive so the AI can explain it well." 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Logistics & Policies</CardTitle>
              <CardDescription>Crucial information for answering common customer inquiries.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="workingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="Mon-Fri: 9AM-6PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Commerce St, City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accepted Payment Methods</FormLabel>
                    <FormControl>
                      <Input placeholder="Cash, Card, PayPal, Stripe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="returnPolicy"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Return Policy</FormLabel>
                    <FormControl>
                      <Textarea placeholder="14 days with original receipt..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 md:col-span-2 bg-secondary/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Delivery Services</FormLabel>
                      <FormDescription>
                        Do you offer shipping or local delivery?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
