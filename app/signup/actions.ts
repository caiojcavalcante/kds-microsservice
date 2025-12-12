"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const cpf = formData.get("cpf") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: "https://ferroefogo.midasspark.cloud/auth/callback",
      data: {
        full_name: fullName,
        phone,
        cpf,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If auto-confirm is on, we can update the profile immediately with extra data
  // But since we have a trigger, let's hope the trigger handles it or we update it here.
  // The trigger I wrote only handles full_name.
  // Let's try to update the profile with phone and cpf manually if the user was created.
  if (data.user) {
    await supabase.from("profiles").update({
      phone,
      cpf
    }).eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/cardapio");
}
