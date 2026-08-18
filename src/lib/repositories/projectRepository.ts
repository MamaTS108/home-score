import type { SupabaseClient } from "@supabase/supabase-js";
import { computeBudgetSummary } from "@/lib/budget/budgetEngine";
import { computeHomeScore } from "@/lib/homeScore";
import type {
  AiMessage,
  DesignGeneration,
  ProductBudget,
  ProjectBrief,
  ProjectDetail,
  RenovationPlan,
  RenovationProject,
  RoomAnalysis,
  RoomType,
} from "@/lib/types";

/**
 * All Supabase reads/writes for a renovation project live here so API routes
 * and Server Components stay thin and the persistence shape can evolve
 * without touching call sites.
 */
export class ProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createProject(params: {
    userId: string | null;
    name: string;
    originalImageUrl: string;
  }): Promise<RenovationProject> {
    const { data, error } = await this.supabase
      .from("renovation_projects")
      .insert({
        user_id: params.userId,
        name: params.name,
        original_image_url: params.originalImageUrl,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return mapProject(data);
  }

  async updateBrief(projectId: string, brief: ProjectBrief): Promise<void> {
    const { error } = await this.supabase
      .from("renovation_projects")
      .update({
        description: brief.description,
        style: brief.style,
        budget: brief.budgetMax,
        currency: brief.currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) throw error;
  }

  async updateStatus(projectId: string, status: RenovationProject["status"]): Promise<void> {
    const { error } = await this.supabase
      .from("renovation_projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    if (error) throw error;
  }

  async updateRoomType(projectId: string, roomType: RoomType): Promise<void> {
    const { error } = await this.supabase
      .from("renovation_projects")
      .update({ room_type: roomType })
      .eq("id", projectId);
    if (error) throw error;
  }

  async saveAnalysis(analysis: RoomAnalysis): Promise<void> {
    const { error } = await this.supabase.from("room_analyses").insert({
      project_id: analysis.projectId,
      analysis_json: analysis,
    });
    if (error) throw error;
  }

  async savePlan(plan: RenovationPlan): Promise<void> {
    const { data: planRow, error: planError } = await this.supabase
      .from("renovation_plans")
      .insert({
        project_id: plan.projectId,
        summary: plan.summary,
        required_material_categories: plan.requiredMaterialCategories,
        version: plan.version,
      })
      .select()
      .single();
    if (planError) throw planError;

    const taskRows = plan.tasks.map((task) => ({
      plan_id: planRow.id,
      project_id: plan.projectId,
      name: task.name,
      description: task.description,
      quantity: task.quantityEstimated,
      unit: task.unit,
      difficulty: task.difficulty,
      diy_possible: task.diyPossible,
      requires_professional: task.requiresProfessional,
      sort_order: task.order,
    }));

    if (taskRows.length > 0) {
      const { error: tasksError } = await this.supabase.from("renovation_tasks").insert(taskRows);
      if (tasksError) throw tasksError;
    }
  }

  async saveProductBudget(projectId: string, productBudget: ProductBudget): Promise<void> {
    await this.supabase.from("project_products").delete().eq("project_id", projectId);

    if (productBudget.lines.length > 0) {
      const { error: linesError } = await this.supabase.from("project_products").insert(
        productBudget.lines.map((line) => ({
          project_id: projectId,
          product_id: line.productId,
          quantity: line.quantity,
          estimated_total: line.estimatedTotal,
        }))
      );
      if (linesError) throw linesError;
    }

    const { error: budgetError } = await this.supabase.from("budget_estimates").insert({
      project_id: projectId,
      materials_total: productBudget.materials,
      accessories_total: productBudget.accessories,
      estimated_total: productBudget.estimatedProductsTotal,
      currency: productBudget.currency,
    });
    if (budgetError) throw budgetError;
  }

  async saveDesign(design: DesignGeneration): Promise<void> {
    const { error } = await this.supabase.from("design_generations").insert({
      project_id: design.projectId,
      prompt: design.prompt,
      image_url: design.imageUrl,
      source_image_url: design.sourceImageUrl,
      version: design.version,
      disclaimer: design.disclaimer,
    });
    if (error) throw error;
  }

  async saveMessage(message: Omit<AiMessage, "id" | "createdAt">): Promise<AiMessage> {
    const { data, error } = await this.supabase
      .from("ai_messages")
      .insert({ project_id: message.projectId, role: message.role, content: message.content })
      .select()
      .single();
    if (error) throw error;
    return mapMessage(data);
  }

  async listProjects(userId: string): Promise<RenovationProject[]> {
    const { data, error } = await this.supabase
      .from("renovation_projects")
      .select()
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProject);
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
    const { data: projectRow, error: projectError } = await this.supabase
      .from("renovation_projects")
      .select()
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!projectRow) return null;

    const project = mapProject(projectRow);

    const [{ data: analysisRows }, { data: planRows }, { data: designRows }, { data: budgetRows }, { data: messageRows }] =
      await Promise.all([
        this.supabase
          .from("room_analyses")
          .select()
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1),
        this.supabase
          .from("renovation_plans")
          .select("*, renovation_tasks(*)")
          .eq("project_id", projectId)
          .order("version", { ascending: false })
          .limit(1),
        this.supabase
          .from("design_generations")
          .select()
          .eq("project_id", projectId)
          .order("version", { ascending: true }),
        this.supabase
          .from("budget_estimates")
          .select()
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1),
        this.supabase
          .from("ai_messages")
          .select()
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
      ]);

    const analysis: RoomAnalysis | null = analysisRows?.[0]?.analysis_json ?? null;

    let plan: RenovationPlan | null = null;
    if (planRows?.[0]) {
      const row = planRows[0];
      plan = {
        id: row.id,
        projectId,
        summary: row.summary,
        requiredMaterialCategories: row.required_material_categories ?? [],
        version: row.version,
        createdAt: row.created_at,
        tasks: (row.renovation_tasks ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map(
            (t: {
              id: string;
              name: string;
              description: string;
              difficulty: RenovationPlan["tasks"][number]["difficulty"];
              diy_possible: boolean;
              quantity: number | null;
              unit: string | null;
              requires_professional: boolean;
              sort_order: number;
            }) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              difficulty: t.difficulty,
              diyPossible: t.diy_possible,
              quantityEstimated: t.quantity,
              unit: t.unit,
              requiresProfessional: t.requires_professional,
              order: t.sort_order,
            })
          ),
      };
    }

    // Product lines: re-join products table for display metadata.
    let productBudget: ProductBudget | null = null;
    if (budgetRows?.[0]) {
      const { data: lineRows } = await this.supabase
        .from("project_products")
        .select("*, products(*)")
        .eq("project_id", projectId);

      productBudget = {
        materials: Number(budgetRows[0].materials_total),
        accessories: Number(budgetRows[0].accessories_total),
        estimatedProductsTotal: Number(budgetRows[0].estimated_total),
        currency: budgetRows[0].currency,
        lines: (lineRows ?? []).map((l) => ({
          id: l.id,
          productId: l.product_id,
          name: l.products?.name ?? l.product_id,
          category: l.products?.category ?? "",
          quantity: Number(l.quantity),
          unit: l.products?.unit ?? "unit",
          estimatedUnitPrice: l.products?.estimated_unit_price ?? 0,
          estimatedTotal: Number(l.estimated_total),
          currency: l.products?.currency ?? "EUR",
          provider: l.products?.provider ?? "mock",
        })),
      };
    }

    const budgetSummary = productBudget ? computeBudgetSummary(productBudget, project.budgetMax) : null;
    const homeScore = analysis && plan ? computeHomeScore(analysis, plan, budgetSummary) : null;

    return {
      project,
      analysis,
      plan,
      productBudget,
      budgetSummary,
      designs: (designRows ?? []).map(mapDesign),
      homeScore,
      messages: (messageRows ?? []).map(mapMessage),
    };
  }
}

function mapProject(row: {
  id: string;
  user_id: string | null;
  name: string;
  room_type: RoomType | null;
  description: string;
  style: RenovationProject["style"];
  budget: number | null;
  currency: RenovationProject["currency"];
  status: RenovationProject["status"];
  original_image_url: string;
  created_at: string;
  updated_at: string;
}): RenovationProject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    roomType: row.room_type,
    description: row.description,
    style: row.style,
    budgetMax: row.budget !== null ? Number(row.budget) : null,
    currency: row.currency,
    status: row.status,
    originalImageUrl: row.original_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDesign(row: {
  id: string;
  project_id: string;
  prompt: string;
  image_url: string;
  source_image_url: string;
  version: number;
  created_at: string;
  disclaimer: string;
}): DesignGeneration {
  return {
    id: row.id,
    projectId: row.project_id,
    prompt: row.prompt,
    imageUrl: row.image_url,
    sourceImageUrl: row.source_image_url,
    version: row.version,
    createdAt: row.created_at,
    disclaimer: row.disclaimer,
  };
}

function mapMessage(row: {
  id: string;
  project_id: string;
  role: AiMessage["role"];
  content: string;
  created_at: string;
}): AiMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}
