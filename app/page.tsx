import { createClient } from "@/utils/supabase/server";
import { HomeContent } from "@/components/home-content";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return <HomeContent profile={profile} />;
}
