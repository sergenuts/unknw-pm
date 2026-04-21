import { supabase } from "@/lib/supabase";
import { MemberLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function MemberLoginPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabase.from("team_members").select("name").eq("id", id).single();
  return <MemberLoginForm memberId={id} memberName={data?.name || null} />;
}
