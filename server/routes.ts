import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { studyRequests, matches, messages, users, ratings, notifications } from "@db/schema";
import { eq, and, or, not, arrayContains } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Create a study request
  app.post("/api/requests", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const request = await db.transaction(async (tx) => {
      // Create the study request
      const [newRequest] = await tx
        .insert(studyRequests)
        .values({
          ...req.body,
          userId: req.user.id,
        })
        .returning();

      // Find users who are taking the same course
      const matchingUsers = await tx
        .select()
        .from(users)
        .where(
          and(
            arrayContains(users.courses, [req.body.course]),
            not(eq(users.id, req.user.id))
          )
        );

      // Create notifications for matching users
      if (matchingUsers.length > 0) {
        await tx.insert(notifications).values(
          matchingUsers.map((user) => ({
            userId: user.id,
            type: "study_request",
            title: "New Study Partner Request",
            message: `A student is looking for a study partner in ${req.body.course}`,
            relatedRequestId: newRequest.id,
          }))
        );
      }

      return newRequest;
    });

    res.json(request);
  });

  // Get all study requests
  app.get("/api/requests", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const requests = await db.query.studyRequests.findMany({
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
      where: (requests, { eq, and, not }) =>
        and(
          eq(requests.status, "pending"),
          not(eq(requests.userId, req.user!.id)) // Don't show user's own requests
        ),
    });
    res.json(requests);
  });

  // Get user's notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userNotifications = await db.query.notifications.findMany({
      where: (notifications, { eq }) => eq(notifications.userId, req.user!.id),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      with: {
        request: true,
      },
    });

    res.json(userNotifications);
  });

  // Mark notification as read
  app.post("/api/notifications/:id/read", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const notificationId = parseInt(req.params.id, 10);
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, req.user.id)
        )
      )
      .returning();

    res.json(notification);
  });

  // Accept a study request (create a match)
  app.post("/api/requests/:id/accept", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const requestId = parseInt(req.params.id, 10);

    try {
      const [request] = await db
        .select()
        .from(studyRequests)
        .where(eq(studyRequests.id, requestId))
        .limit(1);

      if (!request) {
        return res.status(404).send("Request not found");
      }

      if (request.status !== "pending") {
        return res.status(400).send("This request is no longer available");
      }

      // Prevent users from accepting their own requests
      if (request.userId === req.user.id) {
        return res.status(400).send("Cannot accept your own request");
      }

      // Create match and notify users
      const result = await db.transaction(async (tx) => {
        // Create confirmed match immediately
        const [newMatch] = await tx
          .insert(matches)
          .values({
            requestId,
            userId1: request.userId,    // Original requester
            userId2: req.user.id,       // Current user accepting
            status: "confirmed",        // Immediately confirm the match
            initiatedBy: req.user.id,
          })
          .returning();

        // Update request status
        await tx
          .update(studyRequests)
          .set({ status: "matched" })
          .where(eq(studyRequests.id, requestId));

        // Notify both users
        await tx.insert(notifications).values([
          {
            userId: request.userId,
            type: "match_confirmed",
            title: "Study Match Confirmed",
            message: "You've been matched with a study partner!",
            relatedRequestId: requestId,
          },
          {
            userId: req.user.id,
            type: "match_confirmed",
            title: "Study Match Confirmed",
            message: "You've been matched with a study partner!",
            relatedRequestId: requestId,
          },
        ]);

        return newMatch;
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error accepting request:", error);
      res.status(400).send(error.message || "Failed to accept request");
    }
  });

  // Submit a rating for a study partner
  app.post("/api/matches/:id/rate", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const matchId = parseInt(req.params.id, 10);
    const { rating, comment, toUserId } = req.body;

    // Verify the match exists and user is part of it
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      return res.status(404).send("Match not found");
    }

    if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
      return res.status(403).send("Not authorized");
    }

    if (toUserId !== match.userId1 && toUserId !== match.userId2) {
      return res.status(400).send("Invalid recipient");
    }

    // Check if user has already rated this match
    const [existingRating] = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.matchId, matchId),
          eq(ratings.fromUserId, req.user.id)
        )
      )
      .limit(1);

    if (existingRating) {
      return res.status(400).send("You have already rated this study session");
    }

    // Create the rating
    const [newRating] = await db
      .insert(ratings)
      .values({
        matchId,
        fromUserId: req.user.id,
        toUserId,
        rating,
        comment,
      })
      .returning();

    // Update user's average rating
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.toUserId, toUserId));

    const averageRating = Math.round(
      userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
    );

    await db
      .update(users)
      .set({
        averageRating,
        totalRatings: userRatings.length,
      })
      .where(eq(users.id, toUserId));

    res.json(newRating);
  });

  // Get ratings for a user
  app.get("/api/users/:id/ratings", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userId = parseInt(req.params.id, 10);
    const ratings = await db.query.ratings.findMany({
      where: (ratings, { eq }) => eq(ratings.toUserId, userId),
      with: {
        match: true,
        fromUser: true,
      },
      orderBy: (ratings, { desc }) => [desc(ratings.createdAt)],
    });

    res.json(ratings);
  });

  // Get user's matches
  app.get("/api/matches", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userMatches = await db.query.matches.findMany({
      where: (matches, { eq, or }) =>
        or(
          eq(matches.userId1, req.user!.id),
          eq(matches.userId2, req.user!.id)
        ),
      with: {
        user1: true,
        user2: true,
        request: true,
      },
      orderBy: (matches, { desc }) => [desc(matches.createdAt)],
    });

    res.json(userMatches);
  });


  // Get messages for a match
  app.get("/api/matches/:id/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const matchId = parseInt(req.params.id, 10);
    const messages = await db.query.messages.findMany({
      where: (messages, { eq }) => eq(messages.matchId, matchId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      with: {
        sender: true,
      },
    });

    res.json(messages);
  });

  // Send a message in a match
  app.post("/api/matches/:id/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const matchId = parseInt(req.params.id, 10);
    const [match] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.status, "confirmed") // Only allow messages in confirmed matches
        )
      )
      .limit(1);

    if (!match) {
      return res.status(404).send("Match not found or not confirmed");
    }

    // Verify user is part of the match
    if (match.userId1 !== req.user.id && match.userId2 !== req.user.id) {
      return res.status(403).send("Not authorized");
    }

    const [message] = await db
      .insert(messages)
      .values({
        content: req.body.content,
        senderId: req.user.id,
        matchId,
      })
      .returning();

    res.json(message);
  });

  const httpServer = createServer(app);
  return httpServer;
}