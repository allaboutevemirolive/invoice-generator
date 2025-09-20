import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-xl text-muted-foreground mb-8">Click to navigate to the first page.</p>
        <Link to="/first-page">
          <Button size="lg">
            First Page
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;