import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/docuforge";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  dailyQuota: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityDoc {
  _id?: ObjectId;
  userId?: string;
  userEmail?: string;
  documentName: string;
  toolId: string;
  toolName: string;
  originalSize: number;
  resultSize: number;
  bandwidthSaved: number;
  processingTimeMs: number;
  status: "completed" | "failed";
  downloadUrl?: string;
  createdAt: Date;
}

export interface SavedWorkflowDoc {
  _id?: ObjectId;
  userId?: string;
  userEmail?: string;
  name: string;
  description: string;
  steps: any[];
  stepsCount: number;
  runsCount: number;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

let isInitialized = false;

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  // If no database name was in the connection string path, default to 'docuforge'
  const db = c.db("docuforge");

  if (!isInitialized) {
    try {
      // Ensure indexes
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("activities").createIndex({ createdAt: -1 });
      await db.collection("activities").createIndex({ userId: 1, createdAt: -1 });
      await db.collection("saved_workflows").createIndex({ userId: 1 });
      isInitialized = true;
    } catch (err) {
      console.warn("MongoDB index initialization warning:", err);
    }
  }

  return db;
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function getActivitiesCollection(): Promise<Collection<ActivityDoc>> {
  const db = await getDb();
  return db.collection<ActivityDoc>("activities");
}

export async function getWorkflowsCollection(): Promise<Collection<SavedWorkflowDoc>> {
  const db = await getDb();
  return db.collection<SavedWorkflowDoc>("saved_workflows");
}
