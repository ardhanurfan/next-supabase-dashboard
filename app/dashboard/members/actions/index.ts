"use server";

import { readUserSession } from "@/lib/actions";
import { createSupabaseAdmin, createSupbaseServerClient } from "@/lib/supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function createMember(data: {
  name: string;
  role: "user" | "admin";
  status: "active" | "resigned";
  email: string;
  password: string;
  confirm: string;
}) {
  // Prevent user create user
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role === "user") {
    return JSON.stringify({
      error: { message: "You are not allowed to do this!" },
    });
  }

  const supabase = await createSupabaseAdmin();

  // Create account
  const createResult = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { role: data.role },
  });

  if (createResult.error?.message) {
    return JSON.stringify(createResult);
  } else {
    // Create member
    const memberResult = await supabase.from("member").insert({
      name: data.name,
      email: data.email,
      id: createResult.data.user?.id,
    });

    if (memberResult.error?.message) {
      return JSON.stringify(memberResult);
    } else {
      // Create permission
      const permissionResult = await supabase.from("permission").insert({
        role: data.role,
        member_id: createResult.data.user?.id,
        status: data.status,
      });

      revalidatePath("/dashboard/members");
      return JSON.stringify(permissionResult);
    }
  }
}
export async function updateMemberBasicById(
  id: string,
  data: { name: string }
) {
  const supabase = await createSupbaseServerClient();
  const result = await supabase.from("member").update(data).eq("id", id);

  revalidatePath("/dashboard/members");
  return JSON.stringify(result);
}

export async function updateMemberAdvanceById(
  user_id: string,
  permission_id: string,
  data: {
    role: "user" | "admin";
    status: "active" | "resigned";
  }
) {
  // Prevent update advance data of user
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role === "user") {
    return JSON.stringify({
      error: { message: "You are not allowed to do this!" },
    });
  }

  const supabaseAdmin = await createSupabaseAdmin();

  // Update account
  const updateResult = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    user_metadata: { role: data.role },
  });

  if (updateResult.error?.message) {
    return JSON.stringify(updateResult);
  } else {
    const supabase = await createSupbaseServerClient();
    const result = await supabase
      .from("permission")
      .update(data)
      .eq("id", permission_id);

    revalidatePath("/dashboard/members");
    return JSON.stringify(result);
  }
}

export async function updateMemberAccountById(
  user_id: string,
  data: {
    email: string;
    password?: string | undefined;
    confirm?: string | undefined;
  }
) {
  // Prevent update advance data of user
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role === "user") {
    return JSON.stringify({
      error: { message: "You are not allowed to do this!" },
    });
  }

  const supabaseAdmin = await createSupabaseAdmin();

  // Update account
  let updatedObject: {
    email: string;
    password?: string | undefined;
  } = { email: data.email };

  if (data.password) {
    updatedObject = {
      ...updatedObject,
      password: data.password,
    };
  }

  const updateResult = await supabaseAdmin.auth.admin.updateUserById(
    user_id,
    updatedObject
  );
  if (updateResult.error?.message) {
    return JSON.stringify(updateResult);
  } else {
    const supabase = await createSupbaseServerClient();
    const result = await supabase
      .from("member")
      .update({ email: data.email })
      .eq("id", user_id);

    revalidatePath("/dashboard/members");
    return JSON.stringify(result);
  }
}

export async function deleteMemberById(id: string) {
  // Prevent user delete user
  const { data: userSession } = await readUserSession();
  if (userSession.session?.user.user_metadata.role === "user") {
    return JSON.stringify({
      error: { message: "You are not allowed to do this!" },
    });
  }

  // delete account
  const supabaseAdmin = await createSupabaseAdmin();
  const deleteResult = await supabaseAdmin.auth.admin.deleteUser(id);

  if (deleteResult.error?.message) {
    return JSON.stringify(deleteResult);
  } else {
    const supabase = await createSupbaseServerClient();
    const result = await supabase.from("member").delete().eq("id", id);

    revalidatePath("/dashboard/members");
    return JSON.stringify(result);
  }
}

export async function readMembers() {
  noStore();
  const supabase = await createSupbaseServerClient();

  return await supabase.from("permission").select("*, member(*)");
}
