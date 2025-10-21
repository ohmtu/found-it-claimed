import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Package, PackageCheck, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Search className="h-16 w-16 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FindIt
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground mb-8">
            Lost & Found Management System
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            A community platform to help reunite lost items with their owners.
            Report, search, and claim items with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/search")}>
              Browse Items
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Report Lost Items</h3>
            <p className="text-muted-foreground">
              Lost something? Create a detailed report to help others identify your item.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageCheck className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Report Found Items</h3>
            <p className="text-muted-foreground">
              Found something? Help return it to its rightful owner by reporting it.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Claims</h3>
            <p className="text-muted-foreground">
              Admin-moderated claim system ensures items go to verified owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
