import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navigation } from "@/components/navigation";
import type { StudyRequest } from "@db/schema";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery<StudyRequest[]>({
    queryKey: ["/api/requests"],
  });

  const filteredRequests = requests.filter((request) => 
    request.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">Study Requests</h1>
            <p className="text-muted-foreground">Find study partners for your courses</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button asChild>
              <Link href="/request">Request Partner</Link>
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className={`cursor-pointer hover:shadow-md transition-shadow ${
                  request.status === 'matched' ? 'bg-primary/5 border-primary/20' : ''
                }`}>
                  <CardHeader>
                    <CardTitle>{request.course}</CardTitle>
                    <CardDescription>
                      {request.status === 'matched' ? (
                        <span className="text-primary font-medium">
                          Study Session in Progress
                        </span>
                      ) : (
                        'Looking for study partner'
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.description}
                    </p>
                    <div className="mt-4">
                      {request.status === 'matched' ? (
                        <Button variant="secondary" className="w-full" asChild>
                          <Link href="/matches">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            View Active Sessions
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => {
                            fetch(`/api/requests/${request.id}/accept`, {
                              method: 'POST',
                              credentials: 'include'
                            }).then(async (response) => {
                              if (!response.ok) {
                                throw new Error(await response.text());
                              }
                              queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
                              toast({
                                title: "Success",
                                description: "You've been matched! Check your matches to start chatting.",
                              });
                            }).catch((error) => {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: error.message,
                              });
                            });
                          }}
                        >
                          Accept Request
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}