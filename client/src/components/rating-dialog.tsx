import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@db/schema";

interface RatingDialogProps {
  match: Match;
  partnerName: string;
  partnerId: number;
  trigger?: React.ReactNode;
}

export function RatingDialog({ match, partnerName, partnerId, trigger }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/matches/${match.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, toUserId: partnerId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${partnerId}/ratings`] });
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Rate Study Partner</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Study Session</DialogTitle>
          <DialogDescription>
            How was your study session with {partnerName}?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="p-1 hover:scale-110 transition-transform"
                onClick={() => setRating(value)}
              >
                <Star
                  className={`w-8 h-8 ${
                    value <= rating
                      ? "fill-primary text-primary"
                      : "fill-none text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Leave a comment about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            onClick={() => submitRating.mutate()}
            disabled={rating === 0 || submitRating.isPending}
          >
            {submitRating.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit Rating"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
