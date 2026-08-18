import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import type { ProjectDetail } from "@/lib/types";

export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const supabase = createSupabaseAdminClient();
  const repo = new ProjectRepository(supabase);
  return repo.getProjectDetail(projectId);
}
