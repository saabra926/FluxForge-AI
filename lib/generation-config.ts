// ============================================================
// Client + server validation for generation stack selection
// ============================================================
import type { DatabaseType, GenerationCategory, GenerationConfig, ProjectType } from "@/types";

const SQL_DBS: DatabaseType[] = ["PostgreSQL", "MySQL", "SQLite"];
const NOSQL_DBS: DatabaseType[] = ["MongoDB"];

export function needsBackendStackFields(
  category?: GenerationCategory,
  projectType?: ProjectType
): boolean {
  return (
    category === "Backend" ||
    category === "Full Stack" ||
    projectType === "Full Stack" ||
    projectType === "Backend API"
  );
}

/** Returns an error message or null when the config is ready to generate. */
export function validateGenerationConfig(config: GenerationConfig): string | null {
  if (!config.category) return "Select a category.";
  if (!config.includeHtml) return 'Enable "HTML output" — HTML is required for every generation.';
  if (!config.framework) return "Select a framework.";
  if (!config.language) return "Select a language.";
  if (!config.projectType) return "Select a project type.";
  if (config.a11y === undefined || config.a11y === null) return "Select an accessibility level.";
  if (!config.styling?.length) return "Select a styling option.";
  if (config.styling.includes("Auto")) return "Choose a specific styling option (Auto is not allowed).";

  if (needsBackendStackFields(config.category, config.projectType)) {
    if (!config.backendFramework) return "Select a backend framework.";
    if (!config.database || config.database === "None") return "Select a database (or adjust project type if no database is needed).";
    if (!config.dataStoreKind) return "Select SQL or NoSQL to match your database choice.";
    if (!config.apiStyle) return "Select REST or GraphQL for the API.";

    if (config.dataStoreKind === "SQL" && !SQL_DBS.includes(config.database)) {
      return "For SQL storage, choose PostgreSQL, MySQL, or SQLite.";
    }
    if (config.dataStoreKind === "NoSQL" && !NOSQL_DBS.includes(config.database)) {
      return "For NoSQL storage, choose MongoDB.";
    }
  }

  return null;
}
