import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LogOut, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [claimsRes, lostRes, foundRes] = await Promise.all([
      supabase
        .from("claims")
        .select(`
          *,
          claimant:profiles!claimant_id(name, email),
          lost_item:lost_items(name, description, location),
          found_item:found_items(name, description, location)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("lost_items")
        .select("*, user:profiles!user_id(name, email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("found_items")
        .select("*, user:profiles!user_id(name, email)")
        .order("created_at", { ascending: false }),
    ]);

    setClaims(claimsRes.data || []);
    setLostItems(lostRes.data || []);
    setFoundItems(foundRes.data || []);
  };

  const handleClaimAction = async (claimId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("claims")
      .update({ status })
      .eq("id", claimId);

    if (error) {
      toast.error("Failed to update claim");
    } else {
      toast.success(`Claim ${status} successfully`);
      loadData();
    }
  };

  const handleDeleteItem = async (id: string, table: "lost_items" | "found_items") => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete item");
    } else {
      toast.success("Item deleted successfully");
      loadData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logged out successfully");
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">FindIt Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Admin</Badge>
            <span className="text-sm text-muted-foreground">{profile?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList>
            <TabsTrigger value="claims">Pending Claims ({claims.filter(c => c.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="lost">Lost Items ({lostItems.length})</TabsTrigger>
            <TabsTrigger value="found">Found Items ({foundItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="claims">
            <div className="space-y-4">
              {claims.filter(c => c.status === "pending").map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {claim.lost_item?.name || claim.found_item?.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Claimed by: {claim.claimant?.name} ({claim.claimant?.email})
                        </p>
                      </div>
                      <Badge>{claim.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{claim.message || "No message provided"}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleClaimAction(claim.id, "approved")}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClaimAction(claim.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {claims.filter(c => c.status === "pending").length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No pending claims
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lost">
            <div className="space-y-4">
              {lostItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          By: {item.user?.name} | {item.location}
                        </p>
                      </div>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{item.description}</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteItem(item.id, "lost_items")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="found">
            <div className="space-y-4">
              {foundItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          By: {item.user?.name} | {item.location}
                        </p>
                      </div>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{item.description}</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteItem(item.id, "found_items")}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
