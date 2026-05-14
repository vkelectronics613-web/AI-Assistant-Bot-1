import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetWhatsappStatus, 
  useGetWhatsappQr, 
  useDisconnectWhatsapp, 
  useReconnectWhatsapp,
  getGetWhatsappStatusQueryKey,
  getGetWhatsappQrQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SiWhatsapp } from "react-icons/si";
import { Smartphone, RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react";

export default function Connect() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);
  
  const { data: status, isLoading: statusLoading } = useGetWhatsappStatus({ 
    query: { refetchInterval: isPolling ? 3000 : false, queryKey: getGetWhatsappStatusQueryKey() } 
  });
  
  const { data: qrData, isLoading: qrLoading, refetch: refetchQr } = useGetWhatsappQr({ 
    query: { 
      enabled: !!status && !status.connected && status.qrRequired,
      refetchInterval: isPolling && status?.qrRequired ? 15000 : false,
      queryKey: getGetWhatsappQrQueryKey(),
    } 
  });

  const disconnectMutation = useDisconnectWhatsapp();
  const reconnectMutation = useReconnectWhatsapp();

  useEffect(() => {
    if (status?.connected) {
      setIsPolling(false);
    } else {
      setIsPolling(true);
    }
  }, [status?.connected]);

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "WhatsApp Disconnected", description: "Successfully logged out of the session." });
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
        setIsPolling(true);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
      }
    });
  };

  const handleReconnect = () => {
    reconnectMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Reconnecting", description: "Attempting to restore session..." });
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
        setIsPolling(true);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to reconnect.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Connection</h1>
        <p className="text-muted-foreground">Link your WhatsApp Business account to enable the AI assistant.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <Card className="md:col-span-3 glass-panel overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/30">
            <CardTitle className="flex items-center gap-2">
              <SiWhatsapp className={status?.connected ? "text-primary" : "text-muted-foreground"} />
              Device Status
            </CardTitle>
            <CardDescription>Scan the QR code with your WhatsApp app to connect.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[350px]">
            {statusLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-64 w-64 rounded-xl" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : status?.connected ? (
              <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 relative">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">Successfully Connected</h3>
                  <p className="text-muted-foreground">Your AI assistant is ready to handle messages on <br/><span className="font-medium text-foreground">{status.phone || 'your number'}</span></p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1 text-sm gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  Session Active
                </Badge>
              </div>
            ) : status?.qrRequired ? (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="bg-white p-4 rounded-xl shadow-lg border border-white/10 w-64 h-64 flex items-center justify-center">
                  {qrLoading ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <span className="text-sm">Generating QR...</span>
                    </div>
                  ) : qrData?.qr ? (
                    <img src={qrData.qr} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Could not load QR code</p>
                      <Button variant="ghost" size="sm" onClick={() => refetchQr()} className="mt-2">Try Again</Button>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium">Open WhatsApp on your phone</p>
                  <p className="text-sm text-muted-foreground">Menu &gt; Linked Devices &gt; Link a Device</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-24 w-24 bg-secondary rounded-full flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Starting Session...</h3>
                  <p className="text-muted-foreground">Please wait while we initialize the connection.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-secondary/20 border-t border-border/50 flex justify-between p-4">
            {status?.connected ? (
              <Button variant="destructive" onClick={handleDisconnect} disabled={disconnectMutation.isPending} className="w-full sm:w-auto">
                {disconnectMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                Disconnect
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReconnect} disabled={reconnectMutation.isPending || statusLoading} className="w-full sm:w-auto">
                {reconnectMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Restart Connection
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 glass-panel h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">1</div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Open WhatsApp</p>
                <p className="text-xs text-muted-foreground">Open WhatsApp on your mobile phone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">2</div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Menu Settings</p>
                <p className="text-xs text-muted-foreground">Tap Menu (⋮) or Settings (⚙️) and select Linked Devices.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">3</div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Scan QR Code</p>
                <p className="text-xs text-muted-foreground">Point your phone to this screen to capture the code.</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" /> 
                Keep phone connected
              </h4>
              <p className="text-xs text-muted-foreground">
                Your phone doesn't need to stay online to use Nexus AI, but it must connect to WhatsApp at least once every 14 days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
