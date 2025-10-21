import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search as SearchIcon, Package, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Search = () => {
  const navigate = useNavigate();
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const [lostRes, foundRes] = await Promise.all([
      supabase
        .from("lost_items")
        .select("*, user:profiles!user_id(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("found_items")
        .select("*, user:profiles!user_id(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    setLostItems(lostRes.data || []);
    setFoundItems(foundRes.data || []);
  };

  const handleClaim = async (item: any, type: "lost" | "found") => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please sign in to claim items");
      navigate("/auth");
      return;
    }

    const claimData = {
      claimant_id: session.user.id,
      message: claimMessage,
      ...(type === "lost" ? { lost_item_id: item.id } : { found_item_id: item.id }),
    };

    const { error } = await supabase.from("claims").insert(claimData);

    if (error) {
      toast.error("Failed to submit claim");
    } else {
      toast.success("Claim submitted successfully! Wait for admin approval.");
      setClaimMessage("");
      setSelectedItem(null);
    }
  };

  const filteredLost = lostItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFound = foundItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Search Items</h2>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="lost" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lost">
              <Package className="h-4 w-4 mr-2" />
              Lost Items ({filteredLost.length})
            </TabsTrigger>
            <TabsTrigger value="found">
              <PackageCheck className="h-4 w-4 mr-2" />
              Found Items ({filteredFound.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLost.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="destructive">{item.category}</Badge>
                      <Badge variant="outline">{item.location}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Lost on: {new Date(item.date_lost).toLocaleDateString()}
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full" onClick={() => setSelectedItem(item)}>
                          I Found This
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Claim Lost Item</DialogTitle>
                          <DialogDescription>
                            Provide details to help verify you have this item
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="claim-message">Message</Label>
                            <Textarea
                              id="claim-message"
                              placeholder="Describe where you found it and any identifying details..."
                              value={claimMessage}
                              onChange={(e) => setClaimMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <Button
                            onClick={() => handleClaim(item, "lost")}
                            className="w-full"
                          >
                            Submit Claim
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
              {filteredLost.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No lost items found
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="found">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFound.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-secondary text-secondary-foreground">{item.category}</Badge>
                      <Badge variant="outline">{item.location}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Found on: {new Date(item.date_found).toLocaleDateString()}
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full bg-secondary hover:bg-secondary/90" onClick={() => setSelectedItem(item)}>
                          This is Mine
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Claim Found Item</DialogTitle>
                          <DialogDescription>
                            Provide details to verify this is your item
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="claim-message">Message</Label>
                            <Textarea
                              id="claim-message"
                              placeholder="Describe your item to prove ownership (distinctive features, when/where you lost it)..."
                              value={claimMessage}
                              onChange={(e) => setClaimMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <Button
                            onClick={() => handleClaim(item, "found")}
                            className="w-full"
                          >
                            Submit Claim
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
              {filteredFound.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No found items available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Search;
