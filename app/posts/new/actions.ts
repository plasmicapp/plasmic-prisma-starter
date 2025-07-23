"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function createPost(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("You must be logged in to create a post");
  }

  await prisma.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      authorId: session.user.id,
    },
  });

  redirect("/posts");
} 