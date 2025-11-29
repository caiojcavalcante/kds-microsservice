"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const street = formData.get("street") as string;
  const number = formData.get("number") as string;
  const complement = formData.get("complement") as string;
  const neighborhood = formData.get("neighborhood") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip_code = formData.get("zip_code") as string;

  // If this is the first address, make it default
  const { count } = await supabase.from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  const is_default = count === 0;

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zip_code,
    is_default
  });

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

export async function updateAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const street = formData.get("street") as string;
  const number = formData.get("number") as string;
  const complement = formData.get("complement") as string;
  const neighborhood = formData.get("neighborhood") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip_code = formData.get("zip_code") as string;

  const { error } = await supabase.from("addresses").update({
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zip_code
  }).eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Unset current default
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);

  // Set new default
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}
