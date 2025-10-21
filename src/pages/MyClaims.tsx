import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileCheck } from "lucide-react";

const MyClaims = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("claims")
      .select(`
        *,
        lost_item:lost_items(name, description, location),
        found_item:found_items(name, description, location)
      `)
      .eq("claimant_id", session.user.id)
      .order("created_at", { ascending: false });

    setClaims(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-accent text-accent-foreground";
      case "rejected":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-accent/10 rounded-lg">
            <FileCheck className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">My Claims</h2>
            <p className="text-muted-foreground">Track the status of your claim requests</p>
          </div>
        </div>

        <div className="space-y-4">
          {claims.map((claim) => {
            const item = claim.lost_item || claim.found_item;
            const itemType = claim.lost_item ? "Lost" : "Found";

            return (
              <Card key={claim.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {itemType} item • {item?.location}
                      </p>
                    </div>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{item?.description}</p>
                    {claim.message && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-1">Your Message:</p>
                        <p className="text-sm">{claim.message}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Submitted: {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {claims.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven't submitted any claims yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyClaims;
