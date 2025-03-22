import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { RatingDialog } from "@/components/rating-dialog";
import { UserRatings } from "@/components/user-ratings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import type { Match } from "@db/schema";
import { MessageCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MatchWithUsers = Match & {
  user1: { id: number; username: string; fullName: string; averageRating: number | null; totalRatings: number };
  user2: { id: number; username: string; fullName: string; averageRating: number | null; totalRatings: number };
  request: { id: number; course: string };
};

export default function Matches() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: matches = [] } = useQuery<MatchWithUsers[]>({
    queryKey: ["/api/matches"],
  });

  if (!user) return null;

  const handleAcceptMatch = async (requestId: number) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/accept`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const match = await response.json();

      // Refresh both requests and matches data
      await queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/matches"] });

      if (match.status === "confirmed") {
        toast({
          title: "Match Confirmed",
          description: "You can now start chatting with your study partner!",
        });
        setLocation(`/chat/${match.id}`);
      } else {
        toast({
          title: "Match Requested",
          description: "Waiting for your partner to accept the match.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // Filter matches based on status
  const confirmedMatches = matches.filter(match => match.status === "confirmed");
  const pendingMatches = matches.filter(match => match.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {pendingMatches.length > 0 && (
          <>
            <h1 className="text-4xl font-bold text-primary mb-8">Pending Matches</h1>
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {pendingMatches.map((match) => {
                  const isUser1 = match.user1.id === user.id;
                  const partner = isUser1 ? match.user2 : match.user1;
                  const waitingForMe = match.initiatedBy !== user.id;

                  return (
                    <Card key={match.id}>
                      <CardHeader>
                        <CardTitle>Pending Match</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-medium">Study Partner</h3>
                          <p className="text-sm text-muted-foreground">
                            {partner.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Course: {match.request.course}
                          </p>
                        </div>

                        {waitingForMe ? (
                          <Button
                            className="w-full"
                            onClick={() => handleAcceptMatch(match.request.id)}
                          >
                            Accept Match
                          </Button>
                        ) : (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2" />
                            Waiting for partner to accept
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <h1 className="text-4xl font-bold text-primary mb-8">Active Study Sessions</h1>
        {confirmedMatches.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No active study sessions yet. Try requesting a study partner or accepting requests!
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedMatches.map((match) => {
                const isUser1 = match.user1.id === user.id;
                const partner = isUser1 ? match.user2 : match.user1;

                return (
                  <Card key={match.id}>
                    <CardHeader>
                      <CardTitle>Study Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-medium">Study Partner</h3>
                        <p className="text-sm text-muted-foreground">
                          {partner.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Course: {match.request.course}
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/chat/${match.id}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>

                      <div>
                        <h3 className="font-medium mb-2">Partner Rating</h3>
                        <UserRatings
                          userId={partner.id}
                          averageRating={partner.averageRating}
                          totalRatings={partner.totalRatings}
                        />
                        <RatingDialog
                          match={match}
                          partnerName={partner.fullName}
                          partnerId={partner.id}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}