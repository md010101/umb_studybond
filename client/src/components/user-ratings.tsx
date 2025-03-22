import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Rating } from "@db/schema";

interface UserRatingsProps {
  userId: number;
  averageRating?: number | null;
  totalRatings?: number;
}

export function UserRatings({ userId, averageRating, totalRatings }: UserRatingsProps) {
  const { data: ratings = [] } = useQuery<(Rating & { fromUser: { fullName: string } })[]>({
    queryKey: [`/api/users/${userId}/ratings`],
  });

  return (
    <div className="space-y-4">
      {/* Average Rating Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {averageRating ? (
              <div className="flex items-center justify-center gap-2">
                <span>{averageRating}</span>
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-sm text-muted-foreground">
                  ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>
            ) : (
              "No ratings yet"
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Individual Ratings */}
      {ratings.map((rating) => (
        <Card key={rating.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{rating.fromUser.fullName}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= rating.rating
                        ? "fill-primary text-primary"
                        : "fill-none text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
            {rating.comment && (
              <p className="text-sm text-muted-foreground">{rating.comment}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
