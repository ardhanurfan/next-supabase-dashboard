"use client";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import React, { useTransition } from "react";
import { deleteMemberById } from "../actions";
import { toast } from "@/components/ui/use-toast";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";

function DeleteMember({ user_id }: { user_id: string }) {
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const result = await deleteMemberById(user_id);
      const { error } = JSON.parse(result);

      if (error?.message) {
        toast({
          description: "Fail to delete user",
          variant: "destructive",
        });
      } else {
        toast({
          description: "Successfully to delete user",
        });
      }
    });
  };

  return (
    <form action={onSubmit}>
      <Button className="w-full flex gap-2 items-center" variant="outline">
        <TrashIcon />
        Delete{" "}
        <AiOutlineLoading3Quarters
          className={cn("animate-spin", { hidden: !isPending })}
        />
      </Button>
    </form>
  );
}

export default DeleteMember;
