import path from "path";
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type {
  StoryPriority,
  StoryState,
  TaskPriority,
  TaskState,
  UserRole,
  User,
} from "./types";
import { createRepositories, getRepositories } from "./repositories";
import { generateToken } from "./jwt";
import { JWT_SECRET, GOOGLE_CLIENT_ID } from "./config";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const PRIORITIES: StoryPriority[] = ["low", "medium", "high"];
const STATES: StoryState[] = ["todo", "doing", "done"];
const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const TASK_STATES: TaskState[] = ["todo", "doing", "done"];
const USER_ROLES: UserRole[] = ["admin", "devops", "developer", "guest"];

app.use(cors());
app.use(express.json());

// Google client do weryfikacji tokenów
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
console.log("[DEBUG] Backend GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);

// Rozszerzenie Request o authUser
declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Brak tokena" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      blocked: boolean;
    };
    const { users } = getRepositories();
    const user = await users.getUserById(payload.userId);
    if (!user || user.blocked) {
      res.status(403).json({ error: "Konto zablokowane lub nieprawidłowe" });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Nieprawidłowy token" });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(403).json({ error: "Brak uprawnień" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ===== AUTH =====

app.post(
  "/auth/google",
  asyncHandler(async (req, res) => {
    const credential =
      typeof req.body?.credential === "string" ? req.body.credential : "";
    if (!credential) {
      res.status(400).json({ error: "Brak credential" });
      return;
    }

    const decodeJwtPayload = (token: string) => {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          return JSON.parse(Buffer.from(parts[1], "base64url").toString());
        }
      } catch {
        /* ignore */
      }
      return null;
    };

    const possibleAudiences = [
      GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_ID,
      process.env.CLIENT_ID,
    ].filter((v): v is string => !!v);
    const uniqueAudiences = [...new Set(possibleAudiences)];

    if (uniqueAudiences.length === 0) {
      console.error(
        "[AUTH ERROR] GOOGLE_CLIENT_ID i CLIENT_ID są puste! Sprawdź .env i zrestartuj serwer.",
      );
      res.status(500).json({
        error: "Server configuration error: missing Google Client ID",
      });
      return;
    }

    console.log("[DEBUG] Trying audiences:", uniqueAudiences);

    let lastError: Error | null = null;
    let payload: any = null;

    for (const aud of uniqueAudiences) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: aud,
        });
        payload = ticket.getPayload();
        if (payload) {
          console.log("[DEBUG] Verified successfully with audience:", aud);
          break;
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    if (!payload) {
      const decoded = decodeJwtPayload(credential);
      console.error("[DEBUG] Token verification failed.");
      console.error("[DEBUG] Decoded token aud:", decoded?.aud);
      console.error("[DEBUG] Expected audiences:", uniqueAudiences);
      console.error("[DEBUG] Last error:", lastError?.message);
      res.status(400).json({
        error: `Błąd weryfikacji Google. Oczekiwano aud: ${uniqueAudiences.join(" lub ")}, otrzymano: ${decoded?.aud || "unknown"}. Zrestartuj backend jeśli zmieniałeś .env.`,
      });
      return;
    }

    if (!payload.email) {
      res.status(400).json({ error: "Nieprawidłowy token Google (brak email)" });
      return;
    }

    const { users } = getRepositories();
    const result = await users.findOrCreateUser({
      email: payload.email,
      firstName: payload.given_name || payload.name || "",
      lastName: payload.family_name || "",
    });

    const token = generateToken(result.user);
    res.json({ token, user: result.user });
  }),
);

app.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const firstName =
      typeof req.body?.firstName === "string" ? req.body.firstName.trim() : "";
    const lastName =
      typeof req.body?.lastName === "string" ? req.body.lastName.trim() : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "Nieprawidłowy adres email" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Hasło musi mieć co najmniej 6 znaków" });
      return;
    }
    if (!firstName) {
      res.status(400).json({ error: "Imię jest wymagane" });
      return;
    }
    if (!lastName) {
      res.status(400).json({ error: "Nazwisko jest wymagane" });
      return;
    }

    const { users } = getRepositories();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.createUserWithPassword({
      email,
      firstName,
      lastName,
      passwordHash,
    });

    if (!result.isNew) {
      res.status(409).json({ error: "Użytkownik z tym emailem już istnieje" });
      return;
    }

    const token = generateToken(result.user);
    res.status(201).json({ token, user: result.user });
  }),
);

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "Email i hasło są wymagane" });
      return;
    }

    const { users } = getRepositories();
    const user = await users.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
      return;
    }

    const valid = await users.verifyPassword(email, password);
    if (!valid) {
      res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
      return;
    }

    const token = generateToken(user);
    res.json({ token, user });
  }),
);

app.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.authUser);
});

app.post("/auth/logout", requireAuth, (_req, res) => {
  res.status(204).send();
});

// ===== PROJECTS =====

app.get(
  "/projects",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { projects } = getRepositories();
    res.json({ projects: await projects.listProjects() });
  }),
);

app.post(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { projects, users, notifications } = getRepositories();
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    if (!name.trim()) {
      res.status(400).json({ error: "Brak nazwy" });
      return;
    }
    const project = await projects.createProject(name.trim());
    const adminIds = await users.getAdminIds();
    for (const adminId of adminIds) {
      await notifications.createNotification({
        title: `Utworzono nowy projekt: ${project.name}`,
        priority: "high",
        recipientId: adminId,
      });
    }
    res.status(201).json(project);
  }),
);

app.patch(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { projects } = getRepositories();
    const id = Number(req.params.id);
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    if (!name.trim()) {
      res.status(400).json({ error: "Brak nazwy" });
      return;
    }
    const updated = await projects.updateProject(id, name.trim());
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono projektu" });
      return;
    }
    res.json(updated);
  }),
);

app.delete(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { projects } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const ok = await projects.deleteProject(id);
    if (!ok) {
      res.status(404).json({ error: "Nie znaleziono projektu" });
      return;
    }
    res.status(204).send();
  }),
);

// ===== USERS =====

app.get(
  "/users",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { users } = getRepositories();
    res.json({ users: await users.listUsers() });
  }),
);

app.patch(
  "/users/:id/role",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { users } = getRepositories();
    const id = Number(req.params.id);
    const role = req.body?.role as UserRole;
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    if (!USER_ROLES.includes(role)) {
      res.status(400).json({ error: "Nieprawidłowa rola" });
      return;
    }
    const updated = await users.updateUserRole(id, role);
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono użytkownika" });
      return;
    }
    res.json(updated);
  }),
);

app.patch(
  "/users/:id/block",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { users } = getRepositories();
    const id = Number(req.params.id);
    const blocked = req.body?.blocked === true;
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const updated = await users.setUserBlocked(id, blocked);
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono użytkownika" });
      return;
    }
    res.json(updated);
  }),
);

app.patch(
  "/users/me/active-project",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { projects, users } = getRepositories();
    const raw = req.body?.projectId;
    const projectId = raw === null || raw === undefined ? null : Number(raw);
    if (raw !== null && raw !== undefined && !Number.isFinite(projectId)) {
      res.status(400).json({ error: "projectId musi być liczbą lub null" });
      return;
    }
    if (projectId !== null) {
      const allProjects = await projects.listProjects();
      if (!allProjects.some((p) => p.id === projectId)) {
        res.status(400).json({ error: "Nieprawidłowy projekt" });
        return;
      }
    }
    const updated = await users.updateUserActiveProject(
      req.authUser!.id,
      projectId,
    );
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono użytkownika" });
      return;
    }
    res.json(updated);
  }),
);

// ===== NOTIFICATIONS =====

app.get(
  "/notifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { notifications } = getRepositories();
    res.json({
      notifications: await notifications.listNotificationForUser(
        req.authUser!.id,
      ),
    });
  }),
);

app.get(
  "/notifications/unread-count",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { notifications } = getRepositories();
    res.json({
      count: await notifications.countNotReadNotifications(req.authUser!.id),
    });
  }),
);

app.get(
  "/notifications/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { notifications } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const notification = await notifications.getNotificationById(id);
    if (!notification || notification.recipientId !== req.authUser!.id) {
      res.status(404).json({ error: "Nie znaleziono powiadomienia" });
      return;
    }
    res.json(notification);
  }),
);

app.patch(
  "/notifications/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { notifications } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const notification = await notifications.getNotificationById(id);
    if (!notification || notification.recipientId !== req.authUser!.id) {
      res.status(404).json({ error: "Nie znaleziono powiadomienia" });
      return;
    }
    const updated = await notifications.markNotificationAsRead(id);
    res.json(updated);
  }),
);

// ===== STORIES =====

app.get(
  "/stories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { stories } = getRepositories();
    const projectId = Number(req.query.projectId);
    if (!Number.isFinite(projectId)) {
      res.status(400).json({ error: "Wymagany query projectId" });
      return;
    }
    res.json({ stories: await stories.listStoriesForProject(projectId) });
  }),
);

app.get(
  "/stories/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { stories } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const story = await stories.getStoryById(id);
    if (!story) {
      res.status(404).json({ error: "Nie znaleziono historyjki" });
      return;
    }
    res.json(story);
  }),
);

app.post(
  "/stories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { stories } = getRepositories();
    const me = req.authUser!;
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const description =
      typeof req.body?.description === "string" ? req.body.description : "";
    const priority = req.body?.priority as StoryPriority;
    const projectId = Number(req.body?.projectId);
    const state = (req.body?.state as StoryState) ?? "todo";
    const ownerId =
      req.body?.ownerId !== undefined && req.body?.ownerId !== null
        ? Number(req.body.ownerId)
        : me.id;

    if (!name.trim()) {
      res.status(400).json({ error: "Brak nazwy" });
      return;
    }
    if (!PRIORITIES.includes(priority)) {
      res.status(400).json({ error: "Nieprawidłowy priorytet" });
      return;
    }
    if (!Number.isFinite(projectId)) {
      res.status(400).json({ error: "Nieprawidłowy projectId" });
      return;
    }
    if (!STATES.includes(state)) {
      res.status(400).json({ error: "Nieprawidłowy stan" });
      return;
    }
    if (!Number.isFinite(ownerId)) {
      res.status(400).json({ error: "Nieprawidłowy ownerId" });
      return;
    }

    const created = await stories.createStory({
      name,
      description,
      priority,
      projectId,
      state,
      ownerId,
    });
    if (!created) {
      res.status(400).json({ error: "Nieprawidłowy projekt" });
      return;
    }
    res.status(201).json(created);
  }),
);

app.patch(
  "/stories/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { stories } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const patch: Parameters<typeof stories.updateStory>[1] = {};
    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== "string") {
        res.status(400).json({ error: "name musi być stringiem" });
        return;
      }
      patch.name = req.body.name;
    }
    if (req.body?.description !== undefined) {
      if (typeof req.body.description !== "string") {
        res.status(400).json({ error: "description musi być stringiem" });
        return;
      }
      patch.description = req.body.description;
    }
    if (req.body?.priority !== undefined) {
      if (!PRIORITIES.includes(req.body.priority)) {
        res.status(400).json({ error: "Nieprawidłowy priorytet" });
        return;
      }
      patch.priority = req.body.priority;
    }
    if (req.body?.state !== undefined) {
      if (!STATES.includes(req.body.state)) {
        res.status(400).json({ error: "Nieprawidłowy stan" });
        return;
      }
      patch.state = req.body.state;
    }
    if (req.body?.ownerId !== undefined) {
      const oid = Number(req.body.ownerId);
      if (!Number.isFinite(oid)) {
        res.status(400).json({ error: "Nieprawidłowy ownerId" });
        return;
      }
      patch.ownerId = oid;
    }

    const updated = await stories.updateStory(id, patch);
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono historyjki" });
      return;
    }
    res.json(updated);
  }),
);

app.delete(
  "/stories/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { stories } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const ok = await stories.deleteStory(id);
    if (!ok) {
      res.status(404).json({ error: "Nie znaleziono historyjki" });
      return;
    }
    res.status(204).send();
  }),
);

// ===== TASKS =====

app.get(
  "/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tasks } = getRepositories();
    const storyId = Number(req.query.storyId);
    if (!Number.isFinite(storyId)) {
      res.status(400).json({ error: "Wymagany query storyId" });
      return;
    }
    res.json({ tasks: await tasks.listTasksForStory(storyId) });
  }),
);

app.get(
  "/tasks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tasks } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const task = await tasks.getTaskById(id);
    if (!task) {
      res.status(404).json({ error: "Nie znaleziono zadania" });
      return;
    }
    res.json(task);
  }),
);

app.post(
  "/tasks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tasks, stories, notifications } = getRepositories();
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const description =
      typeof req.body?.description === "string" ? req.body.description : "";
    const priority = req.body?.priority as TaskPriority;
    const storyId = Number(req.body?.storyId);
    const estimatedTime = Number(req.body?.estimatedTime);
    const actualTime =
      req.body?.actualTime === null || req.body?.actualTime === undefined
        ? null
        : Number(req.body.actualTime);
    const state = (req.body?.state as TaskState) ?? "todo";
    const assignedUserId =
      req.body?.assignedUserId === null
        ? null
        : req.body?.assignedUserId !== undefined
          ? Number(req.body.assignedUserId)
          : null;

    if (!name.trim()) {
      res.status(400).json({ error: "Brak nazwy" });
      return;
    }
    if (!TASK_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: "Nieprawidłowy priorytet" });
      return;
    }
    if (!Number.isFinite(storyId)) {
      res.status(400).json({ error: "Nieprawidłowy storyId" });
      return;
    }
    if (!Number.isFinite(estimatedTime) || estimatedTime <= 0) {
      res.status(400).json({ error: "Nieprawidłowy przewidywany czas" });
      return;
    }
    if (
      actualTime !== null &&
      (!Number.isFinite(actualTime) || actualTime < 0)
    ) {
      res.status(400).json({ error: "Nieprawidłowy zrealizowany czas" });
      return;
    }
    if (!TASK_STATES.includes(state)) {
      res.status(400).json({ error: "Nieprawidłowy stan" });
      return;
    }
    if (assignedUserId !== null && !Number.isFinite(assignedUserId)) {
      res.status(400).json({ error: "Nieprawidłowy assignedUserId" });
      return;
    }

    const story = await stories.getStoryById(storyId);
    if (!story) {
      res.status(400).json({ error: "Nieprawidłowa historyjka" });
      return;
    }

    const created = await tasks.createTask({
      name,
      description,
      priority,
      storyId,
      estimatedTime,
      actualTime,
      state,
      assignedUserId,
    });
    if (!created) {
      res.status(400).json({ error: "Nieprawidłowa historyjka" });
      return;
    }

    await notifications.createNotification({
      title: `Nowe zadanie w historyjce "${story.name}": ${created.name}`,
      priority: "medium",
      recipientId: story.ownerId,
    });

    if (created.assignedUserId !== null) {
      await notifications.createNotification({
        title: `Przypisano Cię do zadania "${created.name}" w historyjce "${story.name}"`,
        priority: "high",
        recipientId: created.assignedUserId,
      });
    }

    res.status(201).json(created);
  }),
);

app.patch(
  "/tasks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tasks, stories, notifications } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const taskBefore = await tasks.getTaskById(id);
    if (!taskBefore) {
      res.status(404).json({ error: "Nie znaleziono zadania" });
      return;
    }

    const patch: Parameters<typeof tasks.updateTask>[1] = {};
    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== "string") {
        res.status(400).json({ error: "name musi być stringiem" });
        return;
      }
      patch.name = req.body.name;
    }
    if (req.body?.description !== undefined) {
      if (typeof req.body.description !== "string") {
        res.status(400).json({ error: "description musi być stringiem" });
        return;
      }
      patch.description = req.body.description;
    }
    if (req.body?.priority !== undefined) {
      if (!TASK_PRIORITIES.includes(req.body.priority)) {
        res.status(400).json({ error: "Nieprawidłowy priorytet" });
        return;
      }
      patch.priority = req.body.priority;
    }
    if (req.body?.estimatedTime !== undefined) {
      const et = Number(req.body.estimatedTime);
      if (!Number.isFinite(et) || et <= 0) {
        res.status(400).json({ error: "Nieprawidłowy przewidywany czas" });
        return;
      }
      patch.estimatedTime = et;
    }
    if (req.body?.actualTime !== undefined) {
      if (req.body.actualTime === null) {
        patch.actualTime = null;
      } else {
        const at = Number(req.body.actualTime);
        if (!Number.isFinite(at) || at < 0) {
          res.status(400).json({ error: "Nieprawidłowy zrealizowany czas" });
          return;
        }
        patch.actualTime = at;
      }
    }
    if (req.body?.state !== undefined) {
      if (!TASK_STATES.includes(req.body.state)) {
        res.status(400).json({ error: "Nieprawidłowy stan" });
        return;
      }
      patch.state = req.body.state;
    }
    if (req.body?.assignedUserId !== undefined) {
      if (req.body.assignedUserId === null) {
        patch.assignedUserId = null;
      } else {
        const auid = Number(req.body.assignedUserId);
        if (!Number.isFinite(auid)) {
          res.status(400).json({ error: "Nieprawidłowy assignedUserId" });
          return;
        }
        patch.assignedUserId = auid;
      }
    }

    const updated = await tasks.updateTask(id, patch);
    if (!updated) {
      res.status(404).json({ error: "Nie znaleziono zadania" });
      return;
    }

    const story = await stories.getStoryById(updated.storyId);

    if (
      patch.state !== undefined &&
      patch.state !== taskBefore.state &&
      story
    ) {
      let priority: TaskPriority = "low";
      if (patch.state === "done") priority = "medium";
      if (patch.state === "doing") priority = "low";
      await notifications.createNotification({
        title: `Zmiana statusu zadania "${updated.name}" na "${patch.state}" w historyjce "${story.name}"`,
        priority,
        recipientId: story.ownerId,
      });
    }

    if (
      patch.assignedUserId !== undefined &&
      patch.assignedUserId !== taskBefore.assignedUserId &&
      patch.assignedUserId !== null &&
      story
    ) {
      await notifications.createNotification({
        title: `Przypisano Cię do zadania "${updated.name}" w historyjce "${story.name}"`,
        priority: "high",
        recipientId: patch.assignedUserId,
      });
    }

    res.json(updated);
  }),
);

app.delete(
  "/tasks/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tasks, stories, notifications } = getRepositories();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Nieprawidłowe id" });
      return;
    }
    const task = await tasks.getTaskById(id);
    const ok = await tasks.deleteTask(id);
    if (!ok) {
      res.status(404).json({ error: "Nie znaleziono zadania" });
      return;
    }

    if (task) {
      const story = await stories.getStoryById(task.storyId);
      if (story) {
        await notifications.createNotification({
          title: `Usunięto zadanie "${task.name}" z historyjki "${story.name}"`,
          priority: "medium",
          recipientId: story.ownerId,
        });
      }
    }

    res.status(204).send();
  }),
);

async function start() {
  await createRepositories();
  app.listen(PORT, () => {
    console.log(`API: http://localhost:${PORT}`);
  });
}

start();
