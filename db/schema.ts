import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  major: text("major"),
  courses: text("courses").array().default([]),
  availability: jsonb("availability").default({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  }),
  createdAt: timestamp("created_at").defaultNow(),
  averageRating: integer("average_rating"),
  totalRatings: integer("total_ratings").default(0),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'study_request', 'match_accepted', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  relatedRequestId: integer("related_request_id").references(() => studyRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  request: one(studyRequests, {
    fields: [notifications.relatedRequestId],
    references: [studyRequests.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  matchesAsUser1: many(matches, { relationName: "user1Matches" }),
  matchesAsUser2: many(matches, { relationName: "user2Matches" }),
  ratings: many(ratings),
  messages: many(messages),
}));

export const studyRequests = pgTable("study_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  course: text("course").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, matched, closed
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyRequestsRelations = relations(studyRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [studyRequests.userId],
    references: [users.id],
  }),
  matches: many(matches),
}));

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => studyRequests.id),
  userId1: integer("user_id_1").references(() => users.id),
  userId2: integer("user_id_2").references(() => users.id),
  status: text("status").default("pending"), // pending, confirmed
  initiatedBy: integer("initiated_by").references(() => users.id), // which user initiated this match
  createdAt: timestamp("created_at").defaultNow(),
});

export const matchesRelations = relations(matches, ({ one }) => ({
  request: one(studyRequests, {
    fields: [matches.requestId],
    references: [studyRequests.id],
  }),
  user1: one(users, {
    fields: [matches.userId1],
    references: [users.id],
    relationName: "user1Matches",
  }),
  user2: one(users, {
    fields: [matches.userId2],
    references: [users.id],
    relationName: "user2Matches",
  }),
  initiator: one(users, {
    fields: [matches.initiatedBy],
    references: [users.id],
  }),
}));

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratingsRelations = relations(ratings, ({ one }) => ({
  match: one(matches, {
    fields: [ratings.matchId],
    references: [matches.id],
  }),
  fromUser: one(users, {
    fields: [ratings.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [ratings.toUserId],
    references: [users.id],
  }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  senderId: integer("sender_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Schema validation
export const insertUserSchema = createInsertSchema(users).extend({
  username: z.string().email().refine((email) => email.endsWith("@umb.edu"), {
    message: "Must be a valid UMass Boston email address",
  }),
  courses: z.array(z.string()).default([]),
  availability: z.object({
    monday: z.array(z.string()).default([]),
    tuesday: z.array(z.string()).default([]),
    wednesday: z.array(z.string()).default([]),
    thursday: z.array(z.string()).default([]),
    friday: z.array(z.string()).default([]),
  }).default({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  }),
});

export const insertRatingSchema = createInsertSchema(ratings).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const selectUserSchema = createSelectSchema(users);
export const insertStudyRequestSchema = createInsertSchema(studyRequests);
export const selectStudyRequestSchema = createSelectSchema(studyRequests);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type StudyRequest = typeof studyRequests.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Rating = typeof ratings.$inferSelect;