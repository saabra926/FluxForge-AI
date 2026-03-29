// ============================================================
// models/Generation.ts — MongoDB schema for code generations
// ============================================================
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGeneration extends Document {
  prompt: string;
  code: string;
  files: Array<{ path: string; content: string; language: string }>;
  config: {
    category?: string;
    framework: string;
    styling: string[];
    language: string;
    projectType: string;
    a11y: string;
    mode: string;
    backendFramework?: string;
    database?: string;
    includeAuth?: boolean;
    includeTests?: boolean;
  };
  lines: number;
  chars: number;
  qualityScore: number;
  qualityIssues: string[];
  imageUsed: boolean;
  refinementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    prompt: { type: String, required: true, maxlength: 5000 },
    // required: false here because the route-level guard (saveToMongo) already
    // prevents saving empty code. Keeping it non-required avoids a Mongoose
    // validation error if an edge-case empty string slips through.
    code: { type: String, required: false, default: "" },
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, required: true },
        language: { type: String, default: "html" },
      },
    ],
    config: {
      category: { type: String },
      framework: { type: String, default: "HTML+CSS" },
      styling: [{ type: String }],
      language: { type: String, default: "TypeScript" },
      projectType: { type: String, default: "Component" },
      a11y: { type: String, default: "WCAG AA" },
      mode: { type: String, default: "accurate" },
      backendFramework: { type: String },
      database: { type: String },
      includeAuth: { type: Boolean, default: false },
      includeTests: { type: Boolean, default: false },
    },
    lines: { type: Number, default: 0 },
    chars: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    qualityIssues: [{ type: String }],
    imageUsed: { type: Boolean, default: false },
    refinementCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GenerationSchema.index({ createdAt: -1 });
GenerationSchema.index({ "config.framework": 1 });
GenerationSchema.index({ qualityScore: -1 });

const Generation: Model<IGeneration> =
  mongoose.models.Generation ||
  mongoose.model<IGeneration>("Generation", GenerationSchema);

export default Generation;
