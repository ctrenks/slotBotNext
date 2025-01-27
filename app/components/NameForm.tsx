"use client";
import { updateName } from "@/app/actions/user";

export function NameForm() {
  return (
    <form
      action={async (formData) => {
        await updateName(formData);
      }}
    >
      <input type="text" name="name" placeholder="Enter your name" required />
      <button type="submit">Update Name</button>
    </form>
  );
}
